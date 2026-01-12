"""Electric motor/generator component for the composable drivetrain simulator."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint


@dataclass
class MotorParams:
    """Electric motor parameters.

    Attributes:
        P_max: Maximum continuous power [W]
        P_boost: Optional boost power [W] for short duration
        T_max: Maximum torque [N·m]
        rpm_max: Maximum speed [rpm]
        rpm_base: Base speed [rpm] (computed if None)
        J_rotor: Rotor inertia [kg·m²]
        eta: Efficiency (0-1) for both motoring and generating
    """

    P_max: float = 200_000.0
    P_boost: Optional[float] = None
    T_max: float = 3_000.0
    rpm_max: float = 6_000.0
    rpm_base: Optional[float] = None
    J_rotor: float = 2.0
    eta: float = 0.92

    def __post_init__(self):
        if self.rpm_base is None:
            # Base speed = P_max / T_max (in rad/s), convert to rpm
            omega_base = self.P_max / self.T_max
            self.rpm_base = omega_base * 30.0 / np.pi


# Pre-configured motor parameters for CAT 793D
MG1_PARAMS = MotorParams(
    P_max=200_000.0,      # 200 kW
    T_max=3_000.0,        # 3,000 N·m
    rpm_max=6_000.0,
    J_rotor=2.0,
    eta=0.92,
)

MG2_PARAMS = MotorParams(
    P_max=350_000.0,      # 350 kW continuous
    P_boost=500_000.0,    # 500 kW boost
    T_max=2_000.0,        # 2,000 N·m
    rpm_max=4_000.0,
    J_rotor=4.0,
    eta=0.92,
)


class MotorComponent(DrivetrainComponent):
    """Electric motor/generator component.

    Operates in two regions:
    - Constant torque (0 to base speed): T = T_max
    - Constant power (base speed to max speed): T = P_max / ω

    Can operate in all four quadrants (motoring/generating in both directions).

    Ports:
        shaft: Mechanical shaft (bidirectional)
        electrical: Electrical power port (bidirectional)

    Control inputs:
        torque: Commanded motor torque [N·m]
    """

    def __init__(self, params: MotorParams = None, name: str = "motor"):
        """Initialize the motor component.

        Args:
            params: Motor parameters
            name: Component name (e.g., "MG1", "MG2")
        """
        super().__init__(name)
        self.params = params or MotorParams()
        self._omega_base = self.params.rpm_base * np.pi / 30.0
        self._omega_max = self.params.rpm_max * np.pi / 30.0

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "shaft": Port(
                name="shaft",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Motor/generator shaft",
            ),
            "electrical": Port(
                name="electrical",
                port_type=PortType.ELECTRICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Electrical power connection",
            ),
        }

    @property
    def state_names(self) -> List[str]:
        # Motor has no internal states in this model
        return []

    def get_inertia(self, port_name: str) -> float:
        if port_name == "shaft":
            return self.params.J_rotor
        elif port_name == "electrical":
            return 0.0  # Electrical port has no inertia
        raise ValueError(f"Unknown port: {port_name}")

    def get_constraints(self) -> List[KinematicConstraint]:
        # Motor has no internal kinematic constraints
        return []

    def get_max_torque(self, rpm: float, use_boost: bool = False) -> float:
        """Get maximum available torque at given speed.

        Args:
            rpm: Motor speed [rpm] (absolute value used)
            use_boost: If True, use boost power in constant power region

        Returns:
            Maximum torque [N·m]
        """
        rpm = abs(rpm)
        if rpm > self.params.rpm_max:
            return 0.0

        omega = rpm * np.pi / 30.0
        P_max = self.params.P_boost if (use_boost and self.params.P_boost) else self.params.P_max

        if rpm <= self.params.rpm_base:
            # Constant torque region
            return self.params.T_max
        else:
            # Constant power region: T = P / ω
            if omega > 0:
                return min(P_max / omega, self.params.T_max)
            return self.params.T_max

    def get_max_torque_rads(self, omega: float, use_boost: bool = False) -> float:
        """Get maximum torque at given angular velocity.

        Args:
            omega: Motor angular velocity [rad/s]
            use_boost: If True, use boost power

        Returns:
            Maximum torque [N·m]
        """
        rpm = abs(omega) * 30.0 / np.pi
        return self.get_max_torque(rpm, use_boost)

    def get_torque_limits(self, rpm: float, use_boost: bool = False) -> tuple[float, float]:
        """Get torque limits for 4-quadrant operation.

        Args:
            rpm: Motor speed [rpm]
            use_boost: If True, use boost power

        Returns:
            Tuple of (T_min, T_max) [N·m]
        """
        T_max = self.get_max_torque(rpm, use_boost)
        return (-T_max, T_max)

    def clip_torque(self, rpm: float, torque_cmd: float, use_boost: bool = False) -> float:
        """Clip torque command to valid range.

        Args:
            rpm: Motor speed [rpm]
            torque_cmd: Commanded torque [N·m]
            use_boost: If True, use boost limits

        Returns:
            Clipped torque [N·m]
        """
        T_min, T_max = self.get_torque_limits(rpm, use_boost)
        return float(np.clip(torque_cmd, T_min, T_max))

    def get_electrical_power(self, torque: float, omega: float) -> float:
        """Calculate electrical power consumed/generated.

        Sign convention:
        - Positive power: consuming from battery (motoring)
        - Negative power: supplying to battery (generating)

        Args:
            torque: Motor torque [N·m]
            omega: Motor angular velocity [rad/s]

        Returns:
            Electrical power [W]
        """
        P_mech = torque * omega

        if P_mech > 0:
            # Motoring: electrical power = mechanical / efficiency
            return P_mech / self.params.eta
        else:
            # Generating: electrical power = mechanical * efficiency
            return P_mech * self.params.eta

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Compute motor output torque.

        Args:
            port_speeds: {"shaft": omega} in rad/s
            control_inputs: {"torque": T_cmd} in N·m
            internal_states: Not used

        Returns:
            {"shaft": T_actual} - actual torque after clipping
        """
        omega = port_speeds.get("shaft", 0.0)
        rpm = abs(omega) * 30.0 / np.pi
        T_cmd = control_inputs.get("torque", 0.0)
        use_boost = control_inputs.get("boost", False)

        # Clip to valid operating range
        T_actual = self.clip_torque(rpm, T_cmd, use_boost)

        return {"shaft": T_actual}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute state derivatives (none for basic motor model)."""
        return {}

    def is_valid_operating_point(self, rpm: float, torque: float) -> bool:
        """Check if operating point is within motor envelope.

        Args:
            rpm: Motor speed [rpm]
            torque: Motor torque [N·m]

        Returns:
            True if valid operating point
        """
        T_min, T_max = self.get_torque_limits(rpm)
        return T_min <= torque <= T_max


def create_mg1() -> MotorComponent:
    """Create MG1 motor with CAT 793D parameters."""
    return MotorComponent(MG1_PARAMS, name="MG1")


def create_mg2() -> MotorComponent:
    """Create MG2 motor with CAT 793D parameters."""
    return MotorComponent(MG2_PARAMS, name="MG2")
