"""Electric motor/generator model for MG1 and MG2.

Motor characteristics:
- Constant torque region: 0 to base speed
- Constant power region: base speed to max speed
- Variable efficiency based on speed and torque (efficiency map)

MG1 (Sun gear via 3.5:1): 250 kW cont / 450 kW peak, 3,500 N·m max
MG2 (Ring shaft direct): 500 kW, 5,400 N·m max

Efficiency model based on loss separation:
- Copper losses (I²R): Proportional to torque²
- Iron losses: Proportional to speed² (eddy) + speed (hysteresis)
- Mechanical losses: Proportional to speed (friction, windage)
- Fixed losses: Constant (auxiliary systems)

References:
- Losses in Efficiency Maps of Electric Vehicles, Energies 2021
- Permanent magnet motor efficiency map calculation, ResearchGate
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional, Callable
from scipy.interpolate import RegularGridInterpolator


@dataclass
class MotorLossParams:
    """Parameters for physics-based motor loss model.

    Loss model: P_loss = P_cu + P_iron + P_mech + P_fixed
    - P_cu = k_cu * T² (copper losses, quadratic with torque)
    - P_iron = k_iron_e * ω² + k_iron_h * ω (iron losses)
    - P_mech = k_mech * ω (mechanical friction/windage)
    - P_fixed = constant (fixed losses)

    Efficiency: η = P_mech / (P_mech + P_loss) for motoring
                η = P_elec / (P_elec + P_loss) for generating
    """
    k_cu: float = 0.0015        # Copper loss coefficient [W/(N·m)²]
    k_iron_e: float = 0.5       # Iron loss (eddy current) [W/(rad/s)²]
    k_iron_h: float = 5.0       # Iron loss (hysteresis) [W/(rad/s)]
    k_mech: float = 2.0         # Mechanical loss [W/(rad/s)]
    P_fixed: float = 500.0      # Fixed losses [W]
    eta_inverter: float = 0.98  # Inverter efficiency


@dataclass
class MotorParams:
    """Electric motor parameters."""

    P_max: float = 200_000.0    # Maximum continuous power [W]
    P_boost: float = None       # Boost power [W] (optional)
    T_max: float = 3_000.0      # Maximum torque [N·m]
    rpm_max: float = 6_000.0    # Maximum speed [rpm]
    rpm_base: float = None      # Base speed [rpm] (computed if None)
    J_rotor: float = 2.0        # Rotor inertia [kg·m²]
    eta: float = 0.92           # Default constant efficiency (fallback)

    # Efficiency map options
    use_efficiency_map: bool = True  # Use variable efficiency model
    loss_params: MotorLossParams = field(default_factory=MotorLossParams)

    # Optional: custom efficiency map data for interpolation
    # Format: (rpm_points, torque_points, efficiency_grid)
    efficiency_map_data: Optional[tuple] = None

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

    Efficiency can be:
    - Constant (legacy mode): Single η value for all operating points
    - Variable (efficiency map): Physics-based loss model or interpolated map
    """

    def __init__(self, params: MotorParams = None, name: str = "Motor"):
        self.params = params or MotorParams()
        self.name = name
        self._omega_base = self.params.rpm_base * np.pi / 30.0
        self._omega_max = self.params.rpm_max * np.pi / 30.0

        # Build efficiency map interpolator if custom data provided
        self._efficiency_interpolator = None
        if self.params.efficiency_map_data is not None:
            rpm_pts, torque_pts, eta_grid = self.params.efficiency_map_data
            self._efficiency_interpolator = RegularGridInterpolator(
                (rpm_pts, torque_pts), eta_grid,
                method='linear', bounds_error=False, fill_value=None
            )

    @property
    def J(self) -> float:
        """Rotor inertia [kg·m²]."""
        return self.params.J_rotor

    @property
    def eta(self) -> float:
        """Motor nominal/default efficiency."""
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

    def get_losses(self, torque: float, omega: float) -> float:
        """Calculate motor losses using physics-based loss model.

        Loss model: P_loss = P_cu + P_iron + P_mech + P_fixed
        - P_cu = k_cu * T² (copper losses)
        - P_iron = k_iron_e * ω² + k_iron_h * |ω| (iron losses)
        - P_mech = k_mech * |ω| (mechanical losses)
        - P_fixed = constant

        Args:
            torque: Motor torque [N·m]
            omega: Motor angular velocity [rad/s]

        Returns:
            Total losses [W]
        """
        lp = self.params.loss_params
        omega_abs = abs(omega)
        torque_abs = abs(torque)

        P_cu = lp.k_cu * torque_abs ** 2
        P_iron = lp.k_iron_e * omega_abs ** 2 + lp.k_iron_h * omega_abs
        P_mech = lp.k_mech * omega_abs
        P_fixed = lp.P_fixed

        return P_cu + P_iron + P_mech + P_fixed

    def get_efficiency(self, torque: float, omega: float) -> float:
        """Get motor efficiency at given operating point.

        Uses one of three methods:
        1. Custom efficiency map interpolation (if provided)
        2. Physics-based loss model (if use_efficiency_map=True)
        3. Constant efficiency (fallback)

        Args:
            torque: Motor torque [N·m]
            omega: Motor angular velocity [rad/s]

        Returns:
            Efficiency [0-1]
        """
        # Method 1: Custom efficiency map interpolation
        if self._efficiency_interpolator is not None:
            rpm = self.rads_to_rpm(abs(omega))
            torque_abs = abs(torque)
            eta = self._efficiency_interpolator([[rpm, torque_abs]])[0]
            if eta is not None and not np.isnan(eta):
                return float(np.clip(eta, 0.5, 0.98))

        # Method 2: Physics-based loss model
        if self.params.use_efficiency_map:
            P_mech = abs(torque * omega)
            if P_mech < 100:  # Very low power, efficiency undefined
                return self.params.eta

            P_loss = self.get_losses(torque, omega)

            # Include inverter efficiency
            eta_inv = self.params.loss_params.eta_inverter

            # Efficiency = output / input
            eta = P_mech / (P_mech + P_loss) * eta_inv

            # Clamp to reasonable range
            return float(np.clip(eta, 0.5, 0.98))

        # Method 3: Constant efficiency fallback
        return self.params.eta

    def get_electrical_power(self, torque: float, omega: float) -> float:
        """Calculate electrical power consumed/generated.

        Sign convention:
        - Positive power: consuming from battery (motoring)
        - Negative power: supplying to battery (generating)

        Uses variable efficiency model if enabled, otherwise constant η.

        Args:
            torque: Motor torque [N·m]
            omega: Motor angular velocity [rad/s]

        Returns:
            Electrical power [W]
        """
        P_mech = torque * omega

        # Get efficiency at this operating point
        eta = self.get_efficiency(torque, omega)

        if P_mech > 0:
            # Motoring: electrical power = mechanical / efficiency
            return P_mech / eta
        else:
            # Generating: electrical power = mechanical * efficiency
            return P_mech * eta

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


# Loss parameters tuned for large industrial motors (200-500 kW class)
# These give ~92% peak efficiency with realistic variation across the map
MG1_LOSS_PARAMS = MotorLossParams(
    k_cu=0.0012,          # Copper loss coefficient [W/(N·m)²]
    k_iron_e=0.3,         # Iron loss (eddy current) [W/(rad/s)²]
    k_iron_h=8.0,         # Iron loss (hysteresis) [W/(rad/s)]
    k_mech=3.0,           # Mechanical loss [W/(rad/s)]
    P_fixed=800.0,        # Fixed losses [W]
    eta_inverter=0.98,    # Inverter efficiency
)

MG2_LOSS_PARAMS = MotorLossParams(
    k_cu=0.0008,          # Lower copper loss (larger motor, lower resistance)
    k_iron_e=0.4,         # Iron loss (eddy current) [W/(rad/s)²]
    k_iron_h=10.0,        # Iron loss (hysteresis) [W/(rad/s)]
    k_mech=4.0,           # Mechanical loss [W/(rad/s)]
    P_fixed=1200.0,       # Fixed losses [W]
    eta_inverter=0.98,    # Inverter efficiency
)


# Pre-configured motor instances for CAT 793D
MG1_PARAMS = MotorParams(
    P_max=250_000.0,      # 250 kW continuous
    P_boost=450_000.0,    # 450 kW peak
    T_max=3_500.0,        # 3,500 N·m max
    rpm_max=6_000.0,      # 6,000 rpm
    J_rotor=2.0,          # 2.0 kg·m²
    eta=0.92,             # Fallback constant efficiency
    use_efficiency_map=True,
    loss_params=MG1_LOSS_PARAMS,
)

MG2_PARAMS = MotorParams(
    P_max=500_000.0,      # 500 kW continuous
    P_boost=500_000.0,    # 500 kW (no boost)
    T_max=5_400.0,        # 5,400 N·m (direct drive on ring shaft)
    rpm_max=4_000.0,      # 4,000 rpm
    J_rotor=4.0,          # 4.0 kg·m²
    eta=0.92,             # Fallback constant efficiency
    use_efficiency_map=True,
    loss_params=MG2_LOSS_PARAMS,
)


# Motor parameters for CAT 789D (scaled for smaller truck)
# 789D is ~77% of 793D GVW, motors scaled accordingly
MG1_789D_PARAMS = MotorParams(
    P_max=220_000.0,      # 220 kW continuous
    P_boost=400_000.0,    # 400 kW peak
    T_max=3_000.0,        # 3,000 N·m max
    rpm_max=6_000.0,      # 6,000 rpm
    J_rotor=1.8,          # Slightly smaller rotor
    eta=0.92,
    use_efficiency_map=True,
    loss_params=MG1_LOSS_PARAMS,
)

MG2_789D_PARAMS = MotorParams(
    P_max=430_000.0,      # 430 kW continuous
    P_boost=430_000.0,    # No boost
    T_max=4_700.0,        # 4,700 N·m
    rpm_max=4_000.0,      # 4,000 rpm
    J_rotor=3.5,
    eta=0.92,
    use_efficiency_map=True,
    loss_params=MG2_LOSS_PARAMS,
)


def create_mg1() -> Motor:
    """Create MG1 motor instance with CAT 793D parameters."""
    return Motor(MG1_PARAMS, name="MG1")


def create_mg2() -> Motor:
    """Create MG2 motor instance with CAT 793D parameters."""
    return Motor(MG2_PARAMS, name="MG2")


def create_mg1_789d() -> Motor:
    """Create MG1 motor instance with CAT 789D parameters."""
    return Motor(MG1_789D_PARAMS, name="MG1")


def create_mg2_789d() -> Motor:
    """Create MG2 motor instance with CAT 789D parameters."""
    return Motor(MG2_789D_PARAMS, name="MG2")
