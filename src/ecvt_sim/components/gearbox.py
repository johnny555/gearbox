"""2-Speed gearbox and final drive model.

CAT 793D E-CVT configuration:
- 2-speed gearbox: K1=5.0 (low), K2=0.67 (overdrive)
- Final drive: Kf=16.0
- Total low gear: 80:1
- Total high gear: 10.7:1
- Gearbox efficiency: 97%
- Final drive efficiency: 96%

Note: Deep final drive ratio needed due to large wheel radius (1.78m).
With locked sun gear, this provides 10% grade capability loaded.
"""

import numpy as np
from dataclasses import dataclass
from enum import IntEnum


class Gear(IntEnum):
    """Gear selection."""

    LOW = 1       # K = 5.0 (deep ratio for grade climbing)
    HIGH = 2      # K = 0.67 (overdrive)


@dataclass
class GearboxParams:
    """Gearbox and final drive parameters."""

    K_low: float = 5.0          # Low gear ratio (deep for grade climbing)
    K_high: float = 0.67        # High gear ratio (overdrive)
    K_final: float = 16.0       # Final drive ratio
    eta_gearbox: float = 0.97   # Gearbox efficiency
    eta_final: float = 0.96     # Final drive efficiency
    J_gearbox: float = 5.0      # Gearbox inertia [kg·m²]

    @property
    def eta_total(self) -> float:
        """Total drivetrain efficiency."""
        return self.eta_gearbox * self.eta_final


class Gearbox:
    """2-speed gearbox with final drive model.

    Converts between ring gear (MG2 side) and wheel speeds/torques.

    Speed relationship: ω_ring = ω_wheel * K_gear * K_final
    Torque relationship: T_wheel = T_ring * K_gear * K_final * η
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
        """Total efficiency."""
        return self.params.eta_total

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
