"""Engine model for CAT 3516E (793D Mining Truck application).

CAT 3516E specifications:
- Configuration: V16 quad-turbo, 78.7L
- Bore × Stroke: 170 × 190 mm
- Rated power: 1,801 kW (2,415 hp) at 1,650 rpm
- Peak torque: 11,220 N·m (8,275 lb-ft) at 1,200 rpm
- Speed range: 700-1,800 rpm
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EngineParams:
    """Engine parameters."""

    # Speed limits
    rpm_idle: float = 700.0     # Low idle [rpm]
    rpm_min: float = 700.0      # Minimum operating speed [rpm]
    rpm_max: float = 1800.0     # Maximum speed [rpm]

    # Power/torque ratings
    P_rated: float = 1_801_000.0   # Rated power [W] at rpm_rated
    rpm_rated: float = 1650.0      # Speed at rated power [rpm]
    T_peak: float = 11_220.0       # Peak torque [N·m] at rpm_peak_torque
    rpm_peak_torque: float = 1200.0  # Speed at peak torque [rpm]

    # Inertia
    J_engine: float = 25.0  # Engine rotational inertia [kg·m²]

    # Torque curve data points [rpm, torque_Nm]
    torque_curve: list = field(default_factory=lambda: [
        (700, 9_500),
        (1000, 10_800),
        (1200, 11_220),
        (1400, 10_900),
        (1650, 10_420),
        (1800, 9_800),
    ])


class Engine:
    """CAT 3516E engine model with torque curve interpolation."""

    def __init__(self, params: EngineParams = None):
        self.params = params or EngineParams()
        self._build_torque_curve()

    def _build_torque_curve(self):
        """Build interpolation arrays from torque curve data."""
        curve = self.params.torque_curve
        self._rpm_points = np.array([p[0] for p in curve])
        self._torque_points = np.array([p[1] for p in curve])

    @property
    def J(self) -> float:
        """Engine inertia [kg·m²]."""
        return self.params.J_engine

    def rpm_to_rads(self, rpm: float) -> float:
        """Convert RPM to rad/s."""
        return rpm * np.pi / 30.0

    def rads_to_rpm(self, omega: float) -> float:
        """Convert rad/s to RPM."""
        return omega * 30.0 / np.pi

    def get_max_torque(self, rpm: float) -> float:
        """Get maximum available torque at given engine speed.

        Uses linear interpolation of torque curve data.
        Returns 0 outside valid speed range.

        Args:
            rpm: Engine speed [rpm]

        Returns:
            Maximum torque [N·m]
        """
        if rpm < self.params.rpm_min or rpm > self.params.rpm_max:
            return 0.0
        return float(np.interp(rpm, self._rpm_points, self._torque_points))

    def get_max_torque_rads(self, omega: float) -> float:
        """Get maximum available torque at given engine speed.

        Args:
            omega: Engine angular velocity [rad/s]

        Returns:
            Maximum torque [N·m]
        """
        return self.get_max_torque(self.rads_to_rpm(omega))

    def get_power(self, rpm: float, torque: float) -> float:
        """Calculate engine power output.

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]

        Returns:
            Power [W]
        """
        omega = self.rpm_to_rads(rpm)
        return torque * omega

    def get_power_rads(self, omega: float, torque: float) -> float:
        """Calculate engine power output.

        Args:
            omega: Engine angular velocity [rad/s]
            torque: Engine torque [N·m]

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

    def get_fuel_rate(self, rpm: float, torque: float, bsfc: float = 200e-9) -> float:
        """Estimate fuel consumption rate (simplified model).

        Uses constant brake-specific fuel consumption (BSFC).

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]
            bsfc: Brake-specific fuel consumption [kg/J] (default 200 g/kWh)

        Returns:
            Fuel rate [kg/s]
        """
        power = self.get_power(rpm, torque)
        return power * bsfc if power > 0 else 0.0


# Default CAT 3516E engine instance
CAT_3516E = Engine(EngineParams())
