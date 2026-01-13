"""Engine model for CAT 3516E (793D Mining Truck application).

CAT 3516E specifications:
- Configuration: V16 quad-turbo, 78.7L
- Bore × Stroke: 170 × 190 mm
- Rated power: 1,801 kW (2,415 hp) at 1,650 rpm
- Peak torque: 11,220 N·m (8,275 lb-ft) at 1,200 rpm
- Speed range: 700-1,800 rpm

Fuel consumption model:
- BSFC map varies with speed and load (typically 190-250 g/kWh for diesel)
- Best efficiency at medium speed, 60-80% load
- Higher BSFC at low loads (fixed losses dominate)
- Higher BSFC at high speeds (friction losses)

References:
- Caterpillar 3516E performance data
- Diesel engine BSFC characteristics literature
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional
from scipy.interpolate import RegularGridInterpolator


@dataclass
class BSFCMapParams:
    """Parameters for BSFC (Brake Specific Fuel Consumption) map.

    BSFC model: bsfc = bsfc_opt * (1 + penalty_factors)

    Penalty factors account for:
    - Low load: efficiency drops at low torque/power
    - Speed deviation: efficiency drops away from optimal speed
    - High load: slight increase near WOT due to enrichment

    Typical diesel BSFC range: 190-250 g/kWh
    Best: ~195 g/kWh at 60-80% load, medium speed
    Worst: ~280 g/kWh at very low load or extreme speeds

    Unit conversion: g/kWh to kg/J
    195 g/kWh = 195 / 3.6e9 kg/J = 54.2e-9 kg/J
    """
    bsfc_optimal: float = 54.2e-9   # Optimal BSFC [kg/J] (~195 g/kWh)
    rpm_optimal: float = 1300.0     # Speed at optimal BSFC [rpm]
    load_optimal: float = 0.70      # Load fraction at optimal BSFC

    # Penalty coefficients (tuned for ~195-280 g/kWh range)
    k_low_load: float = 0.35        # Low load penalty coefficient
    k_speed: float = 5e-7           # Speed deviation penalty [1/rpm²]
    k_high_load: float = 0.05       # High load penalty coefficient

    # Use full 2D map instead of analytical model
    use_map: bool = False
    rpm_points: tuple = ()          # RPM breakpoints for map
    load_points: tuple = ()         # Load fraction breakpoints
    bsfc_map: tuple = ()            # 2D BSFC values [kg/J]


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

    # BSFC map parameters
    use_bsfc_map: bool = True
    bsfc_params: BSFCMapParams = field(default_factory=BSFCMapParams)


class Engine:
    """CAT 3516E engine model with torque curve and BSFC map.

    Features:
    - Torque curve interpolation for max torque envelope
    - Variable BSFC based on speed and load
    - Backward compatible with constant BSFC
    """

    def __init__(self, params: EngineParams = None):
        self.params = params or EngineParams()
        self._build_torque_curve()
        self._build_bsfc_interpolator()

    def _build_torque_curve(self):
        """Build interpolation arrays from torque curve data."""
        curve = self.params.torque_curve
        self._rpm_points = np.array([p[0] for p in curve])
        self._torque_points = np.array([p[1] for p in curve])

    def _build_bsfc_interpolator(self):
        """Build BSFC map interpolator if using full map."""
        self._bsfc_interpolator = None
        bp = self.params.bsfc_params
        if bp.use_map and bp.rpm_points and bp.load_points and bp.bsfc_map:
            self._bsfc_interpolator = RegularGridInterpolator(
                (bp.rpm_points, bp.load_points), np.array(bp.bsfc_map),
                method='linear', bounds_error=False, fill_value=None
            )

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

    def get_load_fraction(self, rpm: float, torque: float) -> float:
        """Get engine load as fraction of maximum torque.

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]

        Returns:
            Load fraction [0-1]
        """
        T_max = self.get_max_torque(rpm)
        if T_max <= 0:
            return 0.0
        return min(1.0, max(0.0, torque / T_max))

    def get_bsfc(self, rpm: float, torque: float) -> float:
        """Get BSFC at given operating point.

        Uses analytical model or interpolated map depending on settings.
        BSFC varies with speed and load:
        - Optimal ~195 g/kWh at medium speed, 70-80% load
        - Higher at low loads (fixed losses dominate)
        - Higher at extreme speeds

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]

        Returns:
            BSFC [kg/J] (multiply by 3.6e9 to get g/kWh)
        """
        if not self.params.use_bsfc_map:
            return self.params.bsfc_params.bsfc_optimal

        bp = self.params.bsfc_params
        load = self.get_load_fraction(rpm, torque)

        # Method 1: Interpolated map
        if self._bsfc_interpolator is not None:
            bsfc = self._bsfc_interpolator([[rpm, load]])[0]
            if bsfc is not None and not np.isnan(bsfc):
                return float(bsfc)

        # Method 2: Analytical model
        # bsfc = bsfc_opt * (1 + penalties)

        # Low load penalty: increases rapidly below optimal load
        if load < bp.load_optimal:
            # Quadratic increase as load decreases
            load_ratio = load / bp.load_optimal if bp.load_optimal > 0 else 0
            low_load_penalty = bp.k_low_load * (1 - load_ratio) ** 2
        else:
            low_load_penalty = 0.0

        # High load penalty: slight increase near WOT
        if load > bp.load_optimal:
            high_load_penalty = bp.k_high_load * (load - bp.load_optimal) ** 2
        else:
            high_load_penalty = 0.0

        # Speed penalty: increases away from optimal speed
        speed_penalty = bp.k_speed * (rpm - bp.rpm_optimal) ** 2

        # Total BSFC
        total_penalty = low_load_penalty + high_load_penalty + speed_penalty
        bsfc = bp.bsfc_optimal * (1.0 + total_penalty)

        # Clamp to reasonable range (180-300 g/kWh = 50e-9 to 83e-9 kg/J)
        return float(np.clip(bsfc, 50e-9, 83e-9))

    def get_fuel_rate(self, rpm: float, torque: float, bsfc: float = None) -> float:
        """Calculate fuel consumption rate.

        Uses variable BSFC model if enabled, otherwise uses provided constant.

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]
            bsfc: Override BSFC [kg/J]. If None, uses BSFC map.

        Returns:
            Fuel rate [kg/s]
        """
        power = self.get_power(rpm, torque)
        if power <= 0:
            return 0.0

        if bsfc is None:
            bsfc = self.get_bsfc(rpm, torque)

        return power * bsfc

    def get_efficiency(self, rpm: float, torque: float) -> float:
        """Get engine thermal efficiency at operating point.

        Efficiency = 1 / (BSFC * LHV)
        Where LHV (Lower Heating Value) of diesel ≈ 43 MJ/kg

        Args:
            rpm: Engine speed [rpm]
            torque: Engine torque [N·m]

        Returns:
            Thermal efficiency [0-1]
        """
        LHV_diesel = 43e6  # J/kg
        bsfc = self.get_bsfc(rpm, torque)
        return 1.0 / (bsfc * LHV_diesel)


# Default CAT 3516E engine instance
CAT_3516E = Engine(EngineParams())
