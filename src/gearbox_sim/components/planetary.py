"""Planetary gear component for power-split drivetrains."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint, WillisConstraint


@dataclass
class PlanetaryGearParams:
    """Planetary gear set parameters.

    Attributes:
        Z_sun: Number of teeth on sun gear
        Z_ring: Number of teeth on ring gear
        J_sun: Sun gear inertia [kg·m²]
        J_carrier: Carrier inertia [kg·m²]
        J_ring: Ring gear inertia [kg·m²]
        eta: Efficiency (mesh losses)
    """

    Z_sun: int = 30
    Z_ring: int = 90
    J_sun: float = 0.5
    J_carrier: float = 1.0
    J_ring: float = 0.5
    eta: float = 0.98

    @property
    def rho(self) -> float:
        """Planetary ratio ρ = Z_ring / Z_sun."""
        return self.Z_ring / self.Z_sun


# Pre-configured for CAT 793D (ρ = 3.0)
CAT_793D_PLANETARY_PARAMS = PlanetaryGearParams(
    Z_sun=30,
    Z_ring=90,
    J_sun=0.5,
    J_carrier=1.0,
    J_ring=0.5,
)


class PlanetaryGearComponent(DrivetrainComponent):
    """Planetary gear set implementing Willis equation.

    A planetary gear set has three rotating members:
    - Sun gear: Center gear, typically connected to MG1
    - Carrier: Holds planet gears, typically connected to engine
    - Ring gear: Outer ring, typically connected to output/MG2

    Willis equation: ω_sun = (1 + ρ) × ω_carrier - ρ × ω_ring

    Torque balance: τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ

    Ports:
        sun: Sun gear shaft (typically MG1)
        carrier: Carrier shaft (typically engine)
        ring: Ring gear shaft (typically output)
    """

    def __init__(self, params: PlanetaryGearParams = None, name: str = "planetary"):
        """Initialize planetary gear component.

        Args:
            params: Planetary gear parameters
            name: Component name
        """
        super().__init__(name)
        self.params = params or PlanetaryGearParams()
        self._rho = self.params.rho

    @property
    def rho(self) -> float:
        """Planetary ratio ρ = Z_ring / Z_sun."""
        return self._rho

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "sun": Port(
                name="sun",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Sun gear (typically MG1)",
            ),
            "carrier": Port(
                name="carrier",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Carrier (typically engine)",
            ),
            "ring": Port(
                name="ring",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Ring gear (typically output)",
            ),
        }

    @property
    def state_names(self) -> List[str]:
        return []

    def get_inertia(self, port_name: str) -> float:
        if port_name == "sun":
            return self.params.J_sun
        elif port_name == "carrier":
            return self.params.J_carrier
        elif port_name == "ring":
            return self.params.J_ring
        raise ValueError(f"Unknown port: {port_name}")

    def get_constraints(self) -> List[KinematicConstraint]:
        """Return Willis equation constraint."""
        return [
            WillisConstraint(
                sun_port="sun",
                carrier_port="carrier",
                ring_port="ring",
                rho=self._rho,
            )
        ]

    def calc_sun_speed(self, omega_carrier: float, omega_ring: float) -> float:
        """Calculate sun gear speed from Willis equation.

        ω_sun = (1 + ρ) × ω_carrier - ρ × ω_ring

        Args:
            omega_carrier: Carrier angular velocity [rad/s]
            omega_ring: Ring angular velocity [rad/s]

        Returns:
            Sun angular velocity [rad/s]
        """
        return (1.0 + self._rho) * omega_carrier - self._rho * omega_ring

    def calc_carrier_speed(self, omega_sun: float, omega_ring: float) -> float:
        """Calculate carrier speed from sun and ring speeds.

        Args:
            omega_sun: Sun angular velocity [rad/s]
            omega_ring: Ring angular velocity [rad/s]

        Returns:
            Carrier angular velocity [rad/s]
        """
        return (omega_sun + self._rho * omega_ring) / (1.0 + self._rho)

    def calc_ring_speed(self, omega_carrier: float, omega_sun: float) -> float:
        """Calculate ring speed from carrier and sun speeds.

        Args:
            omega_carrier: Carrier angular velocity [rad/s]
            omega_sun: Sun angular velocity [rad/s]

        Returns:
            Ring angular velocity [rad/s]
        """
        return ((1.0 + self._rho) * omega_carrier - omega_sun) / self._rho

    def get_torque_ratios(self) -> Tuple[float, float, float]:
        """Get torque balance ratios (sun : carrier : ring).

        For a planetary gear in static equilibrium:
        τ_sun + τ_carrier + τ_ring = 0

        Returns:
            Tuple of (sun_ratio, carrier_ratio, ring_ratio)
        """
        return (1.0, -(1.0 + self._rho), self._rho)

    def calc_torque_split(self, T_carrier: float) -> Tuple[float, float]:
        """Calculate sun and ring torques from carrier torque.

        Based on torque ratios 1 : -(1+ρ) : ρ

        Args:
            T_carrier: Carrier torque [N·m]

        Returns:
            Tuple of (T_sun, T_ring) [N·m]
        """
        # From T_carrier and ratio τ_carrier = -(1+ρ)
        # T_sun / 1 = T_carrier / -(1+ρ)
        T_sun = -T_carrier / (1.0 + self._rho)
        T_ring = T_sun * self._rho
        return (T_sun, T_ring)

    def get_inertia_coefficients(self, J_sun: float) -> Tuple[float, float, float]:
        """Get inertia coupling coefficients for 2-DOF reduction.

        When reducing from 3-DOF to 2-DOF using Willis constraint:

        J = [J_c + (1+ρ)² × J_s,     -(1+ρ)×ρ × J_s    ]
            [-(1+ρ)×ρ × J_s,          J_r + ρ² × J_s    ]

        Args:
            J_sun: Sun gear inertia (including attached motor)

        Returns:
            Tuple of (J_carrier_add, J_coupling, J_ring_add)
        """
        J_cc = (1.0 + self._rho) ** 2 * J_sun
        J_cr = -(1.0 + self._rho) * self._rho * J_sun
        J_rr = self._rho**2 * J_sun
        return (J_cc, J_cr, J_rr)

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Compute torques (planetary is passive).

        The planetary gear doesn't generate torque, it distributes it
        according to the Willis constraint. Actual torques come from
        connected components.

        Returns:
            Empty dict
        """
        return {}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute state derivatives (none for planetary)."""
        return {}
