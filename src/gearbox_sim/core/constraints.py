"""Kinematic constraints for drivetrain components.

These constraints define relationships between port speeds and torques
within a single component. The drivetrain compiler uses these to
reduce the number of degrees of freedom and build the equations of motion.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Tuple


class KinematicConstraint(ABC):
    """Base class for kinematic constraints between ports.

    Kinematic constraints relate the speeds and/or torques at different
    ports of a component. For example, a gear ratio constraint relates
    input and output speeds by a fixed ratio.
    """

    @abstractmethod
    def get_speed_relation(self) -> Dict[str, float]:
        """Get the speed relationship coefficients.

        Returns a dict mapping port names to coefficients such that:
        sum(coeff_i * omega_i) = 0

        For example, a gear with ratio K has:
        omega_out - omega_in / K = 0
        Returns: {"input": -1/K, "output": 1}
        """
        pass

    @abstractmethod
    def get_dependent_port(self) -> str:
        """Get the name of the port whose speed is determined by others.

        This port's DOF will be eliminated during constraint reduction.
        """
        pass

    @abstractmethod
    def get_independent_ports(self) -> list[str]:
        """Get the names of ports that remain as independent DOFs."""
        pass


@dataclass
class GearRatioConstraint(KinematicConstraint):
    """Simple gear ratio constraint: omega_out = omega_in / ratio.

    This represents a fixed-ratio gear connection. The output speed
    is the input speed divided by the ratio. Torque is multiplied
    by ratio times efficiency.

    Attributes:
        input_port: Name of the input (high-speed) port
        output_port: Name of the output (low-speed) port
        ratio: Speed ratio K = omega_in / omega_out (>1 means reduction)
        efficiency: Power transmission efficiency (0-1)
    """

    input_port: str
    output_port: str
    ratio: float
    efficiency: float = 1.0

    def get_speed_relation(self) -> Dict[str, float]:
        # omega_out = omega_in / ratio
        # omega_out - omega_in / ratio = 0
        # Rearranging: -omega_in / ratio + omega_out = 0
        return {self.input_port: -1.0 / self.ratio, self.output_port: 1.0}

    def get_dependent_port(self) -> str:
        return self.output_port

    def get_independent_ports(self) -> list[str]:
        return [self.input_port]

    def transform_speed(self, omega_in: float) -> float:
        """Calculate output speed from input speed."""
        return omega_in / self.ratio

    def transform_torque(self, T_out: float) -> float:
        """Calculate input torque required for given output torque."""
        return T_out / (self.ratio * self.efficiency)

    def get_reflected_inertia(self, J_output: float) -> float:
        """Calculate inertia reflected to the input side."""
        return J_output / (self.ratio**2)


@dataclass
class WillisConstraint(KinematicConstraint):
    """Planetary gear Willis equation constraint.

    The Willis equation for a simple planetary gear set:
    omega_sun = (1 + rho) * omega_carrier - rho * omega_ring

    where rho = Z_ring / Z_sun (the planetary ratio).

    The torque balance is:
    T_sun : T_carrier : T_ring = 1 : -(1 + rho) : rho

    Attributes:
        sun_port: Name of the sun gear port (typically MG1)
        carrier_port: Name of the carrier port (typically engine)
        ring_port: Name of the ring gear port (typically output to MG2/gearbox)
        rho: Planetary ratio Z_ring / Z_sun
    """

    sun_port: str
    carrier_port: str
    ring_port: str
    rho: float

    def get_speed_relation(self) -> Dict[str, float]:
        # omega_sun = (1 + rho) * omega_carrier - rho * omega_ring
        # Rearranging: omega_sun - (1 + rho) * omega_carrier + rho * omega_ring = 0
        return {
            self.sun_port: 1.0,
            self.carrier_port: -(1.0 + self.rho),
            self.ring_port: self.rho,
        }

    def get_dependent_port(self) -> str:
        # Sun is typically eliminated (its speed is constrained by carrier and ring)
        return self.sun_port

    def get_independent_ports(self) -> list[str]:
        return [self.carrier_port, self.ring_port]

    def calc_sun_speed(self, omega_carrier: float, omega_ring: float) -> float:
        """Calculate sun gear speed from carrier and ring speeds."""
        return (1.0 + self.rho) * omega_carrier - self.rho * omega_ring

    def calc_carrier_speed(self, omega_sun: float, omega_ring: float) -> float:
        """Calculate carrier speed from sun and ring speeds."""
        return (omega_sun + self.rho * omega_ring) / (1.0 + self.rho)

    def calc_ring_speed(self, omega_carrier: float, omega_sun: float) -> float:
        """Calculate ring speed from carrier and sun speeds."""
        return ((1.0 + self.rho) * omega_carrier - omega_sun) / self.rho

    def get_torque_ratios(self) -> Tuple[float, float, float]:
        """Get the torque balance ratios (sun : carrier : ring).

        For a planetary gear in static equilibrium:
        T_sun + T_carrier + T_ring = 0 (torque balance)
        T_sun : T_carrier : T_ring = 1 : -(1+rho) : rho

        Returns:
            Tuple of (sun_ratio, carrier_ratio, ring_ratio)
        """
        return (1.0, -(1.0 + self.rho), self.rho)

    def get_inertia_coefficients(self, J_sun: float) -> Tuple[float, float, float]:
        """Get inertia coupling coefficients for 2-DOF reduction.

        When reducing from 3-DOF (sun, carrier, ring) to 2-DOF (carrier, ring)
        using the Willis constraint, the inertia matrix becomes:

        J = [J_carrier + (1+rho)^2 * J_sun,    -(1+rho) * rho * J_sun    ]
            [-(1+rho) * rho * J_sun,            J_ring + rho^2 * J_sun    ]

        Returns:
            Tuple of (J_eq_carrier_carrier, J_coupling, J_eq_ring_ring)
            where J_coupling is the off-diagonal term.
        """
        J_cc = (1.0 + self.rho) ** 2 * J_sun  # Added to carrier inertia
        J_cr = -(1.0 + self.rho) * self.rho * J_sun  # Off-diagonal coupling
        J_rr = self.rho**2 * J_sun  # Added to ring inertia
        return (J_cc, J_cr, J_rr)


@dataclass
class RigidConnectionConstraint(KinematicConstraint):
    """Rigid connection: two ports have the same speed.

    This represents a rigid coupling between two shafts or a
    parallel connection where torques sum and speeds are equal.

    Attributes:
        port_a: Name of the first port
        port_b: Name of the second port
    """

    port_a: str
    port_b: str

    def get_speed_relation(self) -> Dict[str, float]:
        # omega_a = omega_b
        # omega_a - omega_b = 0
        return {self.port_a: 1.0, self.port_b: -1.0}

    def get_dependent_port(self) -> str:
        return self.port_b

    def get_independent_ports(self) -> list[str]:
        return [self.port_a]
