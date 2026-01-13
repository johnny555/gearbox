"""2-Speed gearbox and final drive model.

CAT 793D E-CVT configuration:
- 2-speed gearbox: K1=5.0 (low), K2=0.67 (overdrive)
- Final drive: Kf=16.0
- Total low gear: 80:1
- Total high gear: 10.7:1
- Gearbox efficiency: 97% nominal (varies with speed/load)
- Final drive efficiency: 96% nominal

Variable efficiency model:
- Baseline mesh efficiency: ~98-99% per gear stage
- Speed-dependent losses: churning, windage (increase with speed)
- Load-dependent losses: mesh friction (proportional to torque)
- Fixed losses: bearings, seals

Note: Deep final drive ratio needed due to large wheel radius (1.78m).
With locked sun gear, this provides 10% grade capability loaded.
"""

import numpy as np
from dataclasses import dataclass, field
from enum import IntEnum


class Gear(IntEnum):
    """Gear selection."""

    LOW = 1       # K = 5.0 (deep ratio for grade climbing)
    HIGH = 2      # K = 0.67 (overdrive)


@dataclass
class GearboxEfficiencyParams:
    """Parameters for variable gearbox efficiency model.

    Efficiency model: η = η_base - speed_losses - load_losses
    - Speed losses: k_speed * ω² (churning, windage)
    - Load losses: k_load * T / T_rated (mesh friction)
    """
    eta_base: float = 0.99          # Baseline mesh efficiency
    k_speed: float = 1e-8           # Speed loss coefficient [1/(rad/s)²]
    k_load: float = 0.03            # Load loss coefficient
    P_fixed: float = 500.0          # Fixed power loss [W]
    T_rated: float = 50000.0        # Rated torque for load normalization [N·m]


@dataclass
class GearboxParams:
    """Gearbox and final drive parameters."""

    K_low: float = 5.0          # Low gear ratio (deep for grade climbing)
    K_high: float = 0.67        # High gear ratio (overdrive)
    K_final: float = 16.0       # Final drive ratio
    eta_gearbox: float = 0.97   # Nominal gearbox efficiency (fallback)
    eta_final: float = 0.96     # Final drive efficiency
    J_gearbox: float = 5.0      # Gearbox inertia [kg·m²]

    # Variable efficiency parameters
    use_variable_efficiency: bool = True
    efficiency_params: GearboxEfficiencyParams = field(default_factory=GearboxEfficiencyParams)

    @property
    def eta_total(self) -> float:
        """Total nominal drivetrain efficiency."""
        return self.eta_gearbox * self.eta_final


class Gearbox:
    """2-speed gearbox with final drive model.

    Converts between ring gear (MG2 side) and wheel speeds/torques.

    Speed relationship: ω_ring = ω_wheel * K_gear * K_final
    Torque relationship: T_wheel = T_ring * K_gear * K_final * η

    Efficiency varies with speed and load when variable model is enabled.
    """

    def __init__(self, params: GearboxParams = None):
        self.params = params or GearboxParams()
        self._gear = Gear.LOW

    @property
    def gear(self) -> Gear:
        """Current gear selection."""
        return self._gear

    @gear.setter
    def gear(self, value: Gear | int):
        """Set current gear."""
        self._gear = Gear(value)

    @property
    def K_gear(self) -> float:
        """Current gear ratio."""
        if self._gear == Gear.LOW:
            return self.params.K_low
        else:
            return self.params.K_high

    @property
    def K_total(self) -> float:
        """Total gear ratio (gearbox × final drive)."""
        return self.K_gear * self.params.K_final

    @property
    def eta(self) -> float:
        """Total nominal efficiency."""
        return self.params.eta_total

    def get_efficiency(self, omega_input: float = 0.0, torque: float = 0.0) -> float:
        """Get gearbox efficiency at given operating point.

        Efficiency varies with speed (churning losses) and load (mesh losses).

        Args:
            omega_input: Input (ring gear) angular velocity [rad/s]
            torque: Torque [N·m]

        Returns:
            Gearbox efficiency [0-1]
        """
        if not self.params.use_variable_efficiency:
            return self.params.eta_gearbox

        ep = self.params.efficiency_params

        # Speed-dependent losses (churning, windage)
        speed_loss = ep.k_speed * omega_input ** 2

        # Load-dependent losses (mesh friction)
        load_fraction = abs(torque) / ep.T_rated if ep.T_rated > 0 else 0
        load_loss = ep.k_load * load_fraction

        # Total efficiency
        eta = ep.eta_base - speed_loss - load_loss

        # Clamp to reasonable range
        return float(np.clip(eta, 0.85, 0.995))

    def get_total_efficiency(self, omega_input: float = 0.0, torque: float = 0.0) -> float:
        """Get total drivetrain efficiency (gearbox × final drive).

        Args:
            omega_input: Input angular velocity [rad/s]
            torque: Torque [N·m]

        Returns:
            Total efficiency [0-1]
        """
        eta_gb = self.get_efficiency(omega_input, torque)
        return eta_gb * self.params.eta_final

    def get_gear_ratio(self, gear: Gear | int = None) -> float:
        """Get gear ratio for specified gear.

        Args:
            gear: Gear selection. If None, uses current gear.

        Returns:
            Gear ratio
        """
        if gear is None:
            gear = self._gear
        gear = Gear(gear)
        return self.params.K_low if gear == Gear.LOW else self.params.K_high

    def get_total_ratio(self, gear: Gear | int = None) -> float:
        """Get total ratio (gearbox × final drive).

        Args:
            gear: Gear selection. If None, uses current gear.

        Returns:
            Total ratio
        """
        return self.get_gear_ratio(gear) * self.params.K_final

    def ring_to_wheel_speed(self, omega_ring: float, gear: Gear | int = None) -> float:
        """Convert ring gear speed to wheel speed.

        ω_wheel = ω_ring / (K_gear * K_final)

        Args:
            omega_ring: Ring gear angular velocity [rad/s]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Wheel angular velocity [rad/s]
        """
        K_total = self.get_total_ratio(gear)
        return omega_ring / K_total

    def wheel_to_ring_speed(self, omega_wheel: float, gear: Gear | int = None) -> float:
        """Convert wheel speed to ring gear speed.

        ω_ring = ω_wheel * K_gear * K_final

        Args:
            omega_wheel: Wheel angular velocity [rad/s]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Ring gear angular velocity [rad/s]
        """
        K_total = self.get_total_ratio(gear)
        return omega_wheel * K_total

    def ring_to_wheel_torque(self, T_ring: float, gear: Gear | int = None) -> float:
        """Convert ring gear torque to wheel torque.

        T_wheel = T_ring * K_gear * K_final * η

        Args:
            T_ring: Ring gear torque [N·m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Wheel torque [N·m]
        """
        K_total = self.get_total_ratio(gear)
        return T_ring * K_total * self.params.eta_total

    def wheel_to_ring_torque(self, T_wheel: float, gear: Gear | int = None) -> float:
        """Convert wheel torque to ring gear torque (load seen by ring).

        T_ring = T_wheel / (K_gear * K_final * η)

        Args:
            T_wheel: Wheel torque [N·m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Ring gear torque [N·m]
        """
        K_total = self.get_total_ratio(gear)
        return T_wheel / (K_total * self.params.eta_total)

    def vehicle_to_ring_speed(
        self, velocity: float, wheel_radius: float, gear: Gear | int = None
    ) -> float:
        """Convert vehicle velocity to ring gear speed.

        ω_ring = v / r_wheel * K_gear * K_final

        Args:
            velocity: Vehicle velocity [m/s]
            wheel_radius: Wheel radius [m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Ring gear angular velocity [rad/s]
        """
        omega_wheel = velocity / wheel_radius
        return self.wheel_to_ring_speed(omega_wheel, gear)

    def ring_to_vehicle_speed(
        self, omega_ring: float, wheel_radius: float, gear: Gear | int = None
    ) -> float:
        """Convert ring gear speed to vehicle velocity.

        v = ω_ring / (K_gear * K_final) * r_wheel

        Args:
            omega_ring: Ring gear angular velocity [rad/s]
            wheel_radius: Wheel radius [m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Vehicle velocity [m/s]
        """
        omega_wheel = self.ring_to_wheel_speed(omega_ring, gear)
        return omega_wheel * wheel_radius

    def get_reflected_vehicle_inertia(
        self, vehicle_mass: float, wheel_radius: float, gear: Gear | int = None
    ) -> float:
        """Calculate vehicle inertia reflected to ring gear.

        J_v_reflected = m_v * r_w² / (K_gear * K_final)²

        Args:
            vehicle_mass: Vehicle mass [kg]
            wheel_radius: Wheel radius [m]
            gear: Gear selection. If None, uses current gear.

        Returns:
            Reflected inertia [kg·m²]
        """
        K_total = self.get_total_ratio(gear)
        return vehicle_mass * wheel_radius ** 2 / K_total ** 2


# Default gearbox for CAT 793D
CAT_793D_GEARBOX = Gearbox(GearboxParams())
