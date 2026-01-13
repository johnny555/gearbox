"""Engine component wrapper for the composable drivetrain simulator."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint


@dataclass
class EngineParams:
    """Engine parameters.

    Attributes:
        rpm_idle: Low idle speed [rpm]
        rpm_min: Minimum operating speed [rpm]
        rpm_max: Maximum operating speed [rpm]
        P_rated: Rated power [W]
        rpm_rated: Speed at rated power [rpm]
        T_peak: Peak torque [N·m]
        rpm_peak_torque: Speed at peak torque [rpm]
        J_engine: Rotational inertia [kg·m²]
        torque_curve: List of (rpm, torque) data points
        bsfc: Brake-specific fuel consumption [kg/J] (default 200 g/kWh)
    """

    rpm_idle: float = 700.0
    rpm_min: float = 700.0
    rpm_max: float = 1800.0
    P_rated: float = 1_801_000.0
    rpm_rated: float = 1650.0
    T_peak: float = 11_220.0
    rpm_peak_torque: float = 1200.0
    J_engine: float = 25.0
    bsfc: float = 200e-9  # 200 g/kWh in kg/J
    torque_curve: list = field(default_factory=lambda: [
        (700, 9_500),
        (1000, 10_800),
        (1200, 11_220),
        (1400, 10_900),
        (1650, 10_420),
        (1800, 9_800),
    ])


# Pre-configured CAT 3516E parameters (for 793D)
CAT_3516E_PARAMS = EngineParams()

# CAT 3516C parameters (for 789D)
# Specifications:
# - Gross Power: 1,566 kW (2,100 hp) at 1,750 rpm
# - Peak Torque: 10,254 N·m (7,563 lb-ft) at 1,300 rpm
CAT_3516C_PARAMS = EngineParams(
    rpm_idle=700.0,
    rpm_min=700.0,
    rpm_max=1800.0,
    P_rated=1_566_000.0,
    rpm_rated=1750.0,
    T_peak=10_254.0,
    rpm_peak_torque=1300.0,
    J_engine=22.0,
    bsfc=54.2e-9,  # ~195 g/kWh optimal
    torque_curve=[
        (700, 8_300),
        (1000, 9_600),
        (1300, 10_254),
        (1500, 9_400),
        (1750, 8_543),
        (1800, 8_200),
    ],
)


class EngineComponent(DrivetrainComponent):
    """Internal combustion engine component.

    Provides a single mechanical output shaft with torque determined by
    a torque curve and commanded throttle/torque.

    Ports:
        shaft: Mechanical output (crankshaft)

    Control inputs:
        torque: Commanded engine torque [N·m]
    """

    def __init__(self, params: EngineParams = None, name: str = "engine"):
        """Initialize the engine component.

        Args:
            params: Engine parameters (defaults to CAT 3516E)
            name: Component name
        """
        super().__init__(name)
        self.params = params or EngineParams()
        self._build_torque_curve()

    def _build_torque_curve(self) -> None:
        """Build interpolation arrays from torque curve data."""
        curve = self.params.torque_curve
        self._rpm_points = np.array([p[0] for p in curve])
        self._torque_points = np.array([p[1] for p in curve])

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "shaft": Port(
                name="shaft",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.OUTPUT,
                description="Engine crankshaft output",
            )
        }

    @property
    def state_names(self) -> List[str]:
        # Engine has no internal states in this model
        # Could add thermal state or fuel consumption state
        return []

    def get_inertia(self, port_name: str) -> float:
        if port_name == "shaft":
            return self.params.J_engine
        raise ValueError(f"Unknown port: {port_name}")

    def get_constraints(self) -> List[KinematicConstraint]:
        # Engine has no internal kinematic constraints
        return []

    def get_max_torque(self, rpm: float) -> float:
        """Get maximum available torque at given engine speed.

        Args:
            rpm: Engine speed [rpm]

        Returns:
            Maximum torque [N·m]. Returns 0 below idle, interpolates curve in
            normal range, and linearly tapers to 0 above max RPM.
        """
        if rpm < self.params.rpm_min:
            return 0.0
        if rpm <= self.params.rpm_max:
            return float(np.interp(rpm, self._rpm_points, self._torque_points))
        # Above max RPM: linearly taper torque to zero over 200 RPM
        # This provides a smooth transition to prevent ODE solver issues
        T_at_max = float(np.interp(self.params.rpm_max, self._rpm_points, self._torque_points))
        overspeed_margin = 200.0  # RPM
        taper_factor = max(0.0, 1.0 - (rpm - self.params.rpm_max) / overspeed_margin)
        return T_at_max * taper_factor

    def get_max_torque_rads(self, omega: float) -> float:
        """Get maximum torque at given angular velocity.

        Args:
            omega: Engine angular velocity [rad/s]

        Returns:
            Maximum torque [N·m]
        """
        rpm = omega * 30.0 / np.pi
        return self.get_max_torque(rpm)

    def clip_torque(self, rpm: float, torque_cmd: float) -> float:
        """Clip torque command to valid range.

        Args:
            rpm: Engine speed [rpm]
            torque_cmd: Commanded torque [N·m]

        Returns:
            Clipped torque [N·m]
        """
        T_max = self.get_max_torque(rpm)
        return float(np.clip(torque_cmd, 0.0, T_max))

    def get_fuel_rate(self, torque: float, omega: float) -> float:
        """Get fuel consumption rate.

        Args:
            torque: Engine torque [N·m]
            omega: Engine angular velocity [rad/s]

        Returns:
            Fuel rate [kg/s]
        """
        power = torque * omega
        return power * self.params.bsfc if power > 0 else 0.0

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Compute engine output torque.

        Args:
            port_speeds: {"shaft": omega} in rad/s
            control_inputs: {"torque": T_cmd} in N·m
            internal_states: Not used

        Returns:
            {"shaft": T_actual} - actual torque after clipping
        """
        omega = port_speeds.get("shaft", 0.0)
        rpm = omega * 30.0 / np.pi
        T_cmd = control_inputs.get("torque", 0.0)

        # Clip to valid operating range
        T_actual = self.clip_torque(rpm, T_cmd)

        return {"shaft": T_actual}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute state derivatives (none for basic engine model)."""
        return {}

    def get_power(self, torque: float, omega: float) -> float:
        """Calculate engine power output.

        Args:
            torque: Engine torque [N·m]
            omega: Engine angular velocity [rad/s]

        Returns:
            Power [W]
        """
        return torque * omega

    def is_valid_operating_point(self, rpm: float, torque: float) -> bool:
        """Check if operating point is within engine envelope.

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]

        Returns:
            True if valid operating point
        """
        if rpm < self.params.rpm_min or rpm > self.params.rpm_max:
            return False
        if torque < 0:
            return False
        return torque <= self.get_max_torque(rpm)
