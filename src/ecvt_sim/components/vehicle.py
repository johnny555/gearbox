"""Vehicle model with road load calculations.

CAT 793D Mining Haul Truck specifications:
- Empty mass: 165,600 kg (365,000 lb)
- Payload capacity: 218,000 kg (480,500 lb) - rated payload
- Gross vehicle mass: 383,600 kg (845,600 lb)
- Wheel radius (59/80R63 tires): 1.78 m
- Frontal area: 45.0 m²
- Drag coefficient: 0.9
- Rolling resistance (haul road): 0.02-0.03 depending on conditions
- Max vehicle speed: 54.2 km/h (33.7 mph)

Note: Values from CAT 793D specification sheet.
Payload varies by body configuration (standard, coal, etc.)
"""

import numpy as np
from dataclasses import dataclass


@dataclass
class VehicleParams:
    """Vehicle parameters."""

    # Mass (from CAT 793D specs)
    m_empty: float = 165_600.0      # Empty mass [kg] (365,000 lb)
    m_payload: float = 218_000.0    # Payload capacity [kg] (480,500 lb)
    m_gross: float = 383_600.0      # Gross vehicle mass [kg] (845,600 lb)

    # Dimensions
    r_wheel: float = 1.78           # Wheel radius [m] (59/80R63 tires)
    wheelbase: float = 5.92         # Wheelbase [m]
    A_frontal: float = 45.0         # Frontal area [m²]

    # Aerodynamics and rolling resistance
    C_d: float = 0.9                # Drag coefficient
    C_r: float = 0.025              # Rolling resistance coefficient

    # Speed limits
    v_max: float = 54.2 / 3.6       # Max speed [m/s] (54.2 km/h)

    # Wheel inertia (4 wheels, estimated)
    J_wheels: float = 500.0         # Total wheel inertia [kg·m²]

    # Environment
    rho_air: float = 1.225          # Air density [kg/m³]
    g: float = 9.81                 # Gravitational acceleration [m/s²]


class Vehicle:
    """Vehicle model with road load calculations.

    Road loads:
    - Grade resistance: F_grade = m * g * sin(θ)
    - Rolling resistance: F_roll = m * g * C_r * cos(θ)
    - Aerodynamic drag: F_aero = 0.5 * ρ * C_d * A * v²
    """

    def __init__(self, params: VehicleParams = None, payload_fraction: float = 1.0):
        """Initialize vehicle.

        Args:
            params: Vehicle parameters
            payload_fraction: Fraction of full payload [0-1]
        """
        self.params = params or VehicleParams()
        self._payload_fraction = payload_fraction
        self._update_mass()

    def _update_mass(self):
        """Update vehicle mass based on payload fraction."""
        self._mass = (
            self.params.m_empty + self._payload_fraction * self.params.m_payload
        )

    @property
    def mass(self) -> float:
        """Current vehicle mass [kg]."""
        return self._mass

    @property
    def payload_fraction(self) -> float:
        """Current payload fraction [0-1]."""
        return self._payload_fraction

    @payload_fraction.setter
    def payload_fraction(self, value: float):
        """Set payload fraction [0-1]."""
        self._payload_fraction = float(np.clip(value, 0.0, 1.0))
        self._update_mass()

    @property
    def r_wheel(self) -> float:
        """Wheel radius [m]."""
        return self.params.r_wheel

    def velocity_to_wheel_speed(self, velocity: float) -> float:
        """Convert vehicle velocity to wheel angular velocity.

        ω_wheel = v / r_wheel

        Args:
            velocity: Vehicle velocity [m/s]

        Returns:
            Wheel angular velocity [rad/s]
        """
        return velocity / self.params.r_wheel

    def wheel_speed_to_velocity(self, omega_wheel: float) -> float:
        """Convert wheel angular velocity to vehicle velocity.

        v = ω_wheel * r_wheel

        Args:
            omega_wheel: Wheel angular velocity [rad/s]

        Returns:
            Vehicle velocity [m/s]
        """
        return omega_wheel * self.params.r_wheel

    def calc_grade_force(self, grade: float) -> float:
        """Calculate grade resistance force.

        F_grade = m * g * sin(θ)

        Args:
            grade: Road grade [fraction, e.g., 0.10 for 10%]
                  Positive = uphill, Negative = downhill

        Returns:
            Grade resistance force [N] (positive resists forward motion uphill)
        """
        # Convert grade percentage to angle
        theta = np.arctan(grade)
        return self._mass * self.params.g * np.sin(theta)

    def calc_rolling_resistance(self, grade: float = 0.0) -> float:
        """Calculate rolling resistance force.

        F_roll = m * g * C_r * cos(θ)

        Args:
            grade: Road grade [fraction]

        Returns:
            Rolling resistance force [N] (always resists motion)
        """
        theta = np.arctan(grade)
        return self._mass * self.params.g * self.params.C_r * np.cos(theta)

    def calc_aero_drag(self, velocity: float) -> float:
        """Calculate aerodynamic drag force.

        F_aero = 0.5 * ρ * C_d * A * v²

        Args:
            velocity: Vehicle velocity [m/s]

        Returns:
            Aerodynamic drag force [N] (always opposes motion)
        """
        return (
            0.5
            * self.params.rho_air
            * self.params.C_d
            * self.params.A_frontal
            * velocity ** 2
        )

    def calc_total_road_load(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate total road load force.

        F_total = F_grade + F_roll + F_aero

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction] (positive = uphill)

        Returns:
            Total road load force [N] (positive = resisting forward motion)
        """
        F_grade = self.calc_grade_force(grade)
        F_roll = self.calc_rolling_resistance(grade)
        F_aero = self.calc_aero_drag(abs(velocity)) * np.sign(velocity)
        return F_grade + F_roll + F_aero

    def calc_wheel_torque_demand(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate wheel torque needed to maintain velocity.

        T_wheel = F_total * r_wheel

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Wheel torque demand [N·m]
        """
        F_total = self.calc_total_road_load(velocity, grade)
        return F_total * self.params.r_wheel

    def calc_power_demand(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate power needed to maintain velocity.

        P = F_total * v

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Power demand [W]
        """
        F_total = self.calc_total_road_load(velocity, grade)
        return F_total * velocity

    def calc_acceleration(self, F_tractive: float, velocity: float, grade: float = 0.0) -> float:
        """Calculate vehicle acceleration.

        a = (F_tractive - F_load) / m

        Args:
            F_tractive: Tractive force at wheels [N]
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Acceleration [m/s²]
        """
        F_load = self.calc_total_road_load(velocity, grade)
        return (F_tractive - F_load) / self._mass

    def get_effective_mass(self) -> float:
        """Get effective mass including wheel inertia.

        m_eff = m + J_wheels / r_wheel²

        Returns:
            Effective mass [kg]
        """
        return self._mass + self.params.J_wheels / self.params.r_wheel ** 2


# Pre-configured vehicles
def create_empty_793d() -> Vehicle:
    """Create empty CAT 793D vehicle."""
    return Vehicle(VehicleParams(), payload_fraction=0.0)


def create_loaded_793d() -> Vehicle:
    """Create fully loaded CAT 793D vehicle."""
    return Vehicle(VehicleParams(), payload_fraction=1.0)
