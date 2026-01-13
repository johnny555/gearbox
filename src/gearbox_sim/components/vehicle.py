"""Vehicle component with road load model."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint


@dataclass
class VehicleParams:
    """Vehicle parameters.

    Attributes:
        m_empty: Empty mass [kg]
        m_payload: Payload capacity [kg]
        r_wheel: Wheel radius [m]
        A_frontal: Frontal area [m²]
        C_d: Drag coefficient
        C_r: Rolling resistance coefficient
        v_max: Maximum speed [m/s]
        J_wheels: Total wheel inertia [kg·m²]
        rho_air: Air density [kg/m³]
        g: Gravitational acceleration [m/s²]
    """

    m_empty: float = 165_600.0
    m_payload: float = 218_000.0
    r_wheel: float = 1.78
    A_frontal: float = 45.0
    C_d: float = 0.9
    C_r: float = 0.025
    v_max: float = 54.2 / 3.6
    J_wheels: float = 500.0
    rho_air: float = 1.225
    g: float = 9.81


# Pre-configured CAT 793D vehicles (240-ton class)
CAT_793D_PARAMS = VehicleParams()

# Good haul road conditions
CAT_793D_GOOD_ROAD = VehicleParams(C_r=0.015)

# Poor haul road conditions
CAT_793D_POOR_ROAD = VehicleParams(C_r=0.035)

# CAT 789D vehicle parameters (181-ton class)
CAT_789D_PARAMS = VehicleParams(
    m_empty=130_000.0,
    m_payload=164_000.0,
    r_wheel=1.67,
    A_frontal=40.0,
    C_d=0.9,
    C_r=0.025,
    v_max=57.2 / 3.6,
    J_wheels=400.0,
)


class VehicleComponent(DrivetrainComponent):
    """Vehicle road load component.

    Represents the vehicle mass, wheels, and road resistances.
    This is the "ground" reference for the drivetrain.

    Road loads:
    - Grade: F_grade = m × g × sin(θ)
    - Rolling: F_roll = m × g × C_r × cos(θ)
    - Aero: F_aero = 0.5 × ρ × C_d × A × v²

    Ports:
        wheels: Wheel input (driven by final drive)

    Control inputs:
        None (passive component)
    """

    def __init__(
        self,
        params: VehicleParams = None,
        payload_fraction: float = 1.0,
        name: str = "vehicle",
    ):
        """Initialize vehicle component.

        Args:
            params: Vehicle parameters
            payload_fraction: Fraction of full payload [0-1]
            name: Component name
        """
        super().__init__(name)
        self.params = params or VehicleParams()
        self._payload_fraction = payload_fraction
        self._update_mass()

    def _update_mass(self) -> None:
        """Update vehicle mass based on payload fraction."""
        self._mass = self.params.m_empty + self._payload_fraction * self.params.m_payload

    @property
    def mass(self) -> float:
        """Current vehicle mass [kg]."""
        return self._mass

    @property
    def payload_fraction(self) -> float:
        """Current payload fraction [0-1]."""
        return self._payload_fraction

    @payload_fraction.setter
    def payload_fraction(self, value: float) -> None:
        """Set payload fraction."""
        self._payload_fraction = float(np.clip(value, 0.0, 1.0))
        self._update_mass()

    @property
    def r_wheel(self) -> float:
        """Wheel radius [m]."""
        return self.params.r_wheel

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "wheels": Port(
                name="wheels",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.INPUT,
                description="Wheel axle input",
            )
        }

    @property
    def state_names(self) -> List[str]:
        return []

    def get_inertia(self, port_name: str) -> float:
        if port_name == "wheels":
            # Effective inertia = wheel inertia + translational mass reflected
            return self.params.J_wheels + self._mass * self.params.r_wheel**2
        raise ValueError(f"Unknown port: {port_name}")

    def get_constraints(self) -> List[KinematicConstraint]:
        return []

    def velocity_to_wheel_speed(self, velocity: float) -> float:
        """Convert vehicle velocity to wheel angular velocity.

        Args:
            velocity: Vehicle velocity [m/s]

        Returns:
            Wheel angular velocity [rad/s]
        """
        return velocity / self.params.r_wheel

    def wheel_speed_to_velocity(self, omega_wheel: float) -> float:
        """Convert wheel angular velocity to vehicle velocity.

        Args:
            omega_wheel: Wheel angular velocity [rad/s]

        Returns:
            Vehicle velocity [m/s]
        """
        return omega_wheel * self.params.r_wheel

    def calc_grade_force(self, grade: float) -> float:
        """Calculate grade resistance force.

        Args:
            grade: Road grade [fraction]

        Returns:
            Grade force [N]
        """
        theta = np.arctan(grade)
        return self._mass * self.params.g * np.sin(theta)

    def calc_rolling_resistance(self, grade: float = 0.0) -> float:
        """Calculate rolling resistance force.

        Args:
            grade: Road grade [fraction]

        Returns:
            Rolling resistance [N]
        """
        theta = np.arctan(grade)
        return self._mass * self.params.g * self.params.C_r * np.cos(theta)

    def calc_aero_drag(self, velocity: float) -> float:
        """Calculate aerodynamic drag force.

        Args:
            velocity: Vehicle velocity [m/s]

        Returns:
            Drag force [N]
        """
        return (
            0.5
            * self.params.rho_air
            * self.params.C_d
            * self.params.A_frontal
            * velocity**2
        )

    def calc_total_road_load(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate total road load force.

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Total road load [N]
        """
        F_grade = self.calc_grade_force(grade)
        F_roll = self.calc_rolling_resistance(grade)
        F_aero = self.calc_aero_drag(abs(velocity)) * np.sign(velocity)
        return F_grade + F_roll + F_aero

    def calc_wheel_torque_demand(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate wheel torque to maintain velocity.

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Wheel torque demand [N·m]
        """
        F_total = self.calc_total_road_load(velocity, grade)
        return F_total * self.params.r_wheel

    def compute_load_torque(self, omega_wheel: float, grade: float = 0.0) -> float:
        """Calculate load torque at wheel.

        This is used by the drivetrain dynamics to add road load.

        Args:
            omega_wheel: Wheel angular velocity [rad/s]
            grade: Road grade [fraction]

        Returns:
            Load torque [N·m]
        """
        velocity = self.wheel_speed_to_velocity(omega_wheel)
        return self.calc_wheel_torque_demand(velocity, grade)

    def calc_power_demand(self, velocity: float, grade: float = 0.0) -> float:
        """Calculate power needed to maintain velocity.

        Args:
            velocity: Vehicle velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Power demand [W]
        """
        F_total = self.calc_total_road_load(velocity, grade)
        return F_total * velocity

    def calc_acceleration(
        self, F_tractive: float, velocity: float, grade: float = 0.0
    ) -> float:
        """Calculate vehicle acceleration.

        Args:
            F_tractive: Tractive force [N]
            velocity: Current velocity [m/s]
            grade: Road grade [fraction]

        Returns:
            Acceleration [m/s²]
        """
        F_load = self.calc_total_road_load(velocity, grade)
        return (F_tractive - F_load) / self._mass

    def get_effective_mass(self) -> float:
        """Get effective mass including wheel inertia.

        Returns:
            Effective mass [kg]
        """
        return self._mass + self.params.J_wheels / self.params.r_wheel**2

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Vehicle is passive - produces resistance torque.

        The load torque is handled separately via compute_load_torque()
        which is called by the drivetrain dynamics.
        """
        return {}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Vehicle has no internal states."""
        return {}


def create_empty_793d() -> VehicleComponent:
    """Create empty CAT 793D vehicle."""
    return VehicleComponent(CAT_793D_PARAMS, payload_fraction=0.0, name="vehicle")


def create_loaded_793d() -> VehicleComponent:
    """Create fully loaded CAT 793D vehicle."""
    return VehicleComponent(CAT_793D_PARAMS, payload_fraction=1.0, name="vehicle")
