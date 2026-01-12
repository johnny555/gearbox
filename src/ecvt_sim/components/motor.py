"""Electric motor/generator model for MG1 and MG2.

Motor characteristics:
- Constant torque region: 0 to base speed
- Constant power region: base speed to max speed

MG1 (Sun gear via 3.5:1): 250 kW cont / 450 kW peak, 3,500 N·m max
MG2 (Ring shaft direct): 500 kW, 5,400 N·m max
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional


@dataclass
class MotorParams:
    """Electric motor parameters."""

    P_max: float = 200_000.0    # Maximum continuous power [W]
    P_boost: float = None       # Boost power [W] (optional)
    T_max: float = 3_000.0      # Maximum torque [N·m]
    rpm_max: float = 6_000.0    # Maximum speed [rpm]
    rpm_base: float = None      # Base speed [rpm] (computed if None)
    J_rotor: float = 2.0        # Rotor inertia [kg·m²]
    eta: float = 0.92           # Efficiency (motoring and generating)

    def __post_init__(self):
        # Compute base speed if not provided
        if self.rpm_base is None:
            # Base speed = P_max / T_max (in rad/s), then convert to rpm
            omega_base = self.P_max / self.T_max
            self.rpm_base = omega_base * 30.0 / np.pi


class Motor:
    """Electric motor/generator model with torque-speed envelope.

    Operates in two regions:
    1. Constant torque (0 to base speed): T = T_max
    2. Constant power (base speed to max speed): T = P_max / ω
    """

    def __init__(self, params: MotorParams = None, name: str = "Motor"):
        self.params = params or MotorParams()
        self.name = name
        self._omega_base = self.params.rpm_base * np.pi / 30.0
        self._omega_max = self.params.rpm_max * np.pi / 30.0

    @property
    def J(self) -> float:
        """Rotor inertia [kg·m²]."""
        return self.params.J_rotor

    @property
    def eta(self) -> float:
        """Motor efficiency."""
        return self.params.eta

    def rpm_to_rads(self, rpm: float) -> float:
        """Convert RPM to rad/s."""
        return rpm * np.pi / 30.0

    def rads_to_rpm(self, omega: float) -> float:
        """Convert rad/s to RPM."""
        return omega * 30.0 / np.pi

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

        omega = self.rpm_to_rads(rpm)
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
        """Get maximum available torque at given speed.

        Args:
            omega: Motor angular velocity [rad/s] (absolute value used)
            use_boost: If True, use boost power in constant power region

        Returns:
            Maximum torque [N·m]
        """
        return self.get_max_torque(self.rads_to_rpm(omega), use_boost)

    def get_torque_limits(self, rpm: float, use_boost: bool = False) -> tuple[float, float]:
        """Get torque limits (motoring and generating).

        Motor can operate in all four quadrants:
        - Positive torque, positive speed: Motoring
        - Negative torque, positive speed: Generating
        - Negative torque, negative speed: Motoring (reverse)
        - Positive torque, negative speed: Generating (reverse)

        Args:
            rpm: Motor speed [rpm]
            use_boost: If True, use boost power

        Returns:
            Tuple of (T_min, T_max) [N·m]
        """
        T_max = self.get_max_torque(rpm, use_boost)
        return (-T_max, T_max)

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

    def clip_torque(self, rpm: float, torque_cmd: float, use_boost: bool = False) -> float:
        """Clip torque command to valid range.

        Args:
            rpm: Motor speed [rpm]
            torque_cmd: Commanded torque [N·m]
            use_boost: If True, use boost power limits

        Returns:
            Clipped torque [N·m]
        """
        T_min, T_max = self.get_torque_limits(rpm, use_boost)
        return float(np.clip(torque_cmd, T_min, T_max))

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


# Pre-configured motor instances for CAT 793D
MG1_PARAMS = MotorParams(
    P_max=250_000.0,      # 250 kW continuous
    P_boost=450_000.0,    # 450 kW peak
    T_max=3_500.0,        # 3,500 N·m max
    rpm_max=6_000.0,      # 6,000 rpm
    J_rotor=2.0,          # 2.0 kg·m²
    eta=0.92,
)

MG2_PARAMS = MotorParams(
    P_max=500_000.0,      # 500 kW continuous
    P_boost=500_000.0,    # 500 kW (no boost)
    T_max=5_400.0,        # 5,400 N·m (direct drive on ring shaft)
    rpm_max=4_000.0,      # 4,000 rpm
    J_rotor=4.0,          # 4.0 kg·m²
    eta=0.92,
)


def create_mg1() -> Motor:
    """Create MG1 motor instance with CAT 793D parameters."""
    return Motor(MG1_PARAMS, name="MG1")


def create_mg2() -> Motor:
    """Create MG2 motor instance with CAT 793D parameters."""
    return Motor(MG2_PARAMS, name="MG2")
