"""Planetary gear set (Power Split Device) model.

Implements Willis equation kinematics and torque balance for a simple
planetary gear with:
- Sun gear connected to MG1
- Carrier connected to engine (ICE)
- Ring gear connected to output (MG2 side)
"""

import numpy as np
from dataclasses import dataclass


@dataclass
class PlanetaryGearParams:
    """Planetary gear parameters."""

    Z_sun: int = 30      # Sun gear teeth
    Z_ring: int = 90     # Ring gear teeth
    J_sun: float = 0.5   # Sun gear inertia [kg·m²]
    J_carrier: float = 1.0  # Carrier inertia [kg·m²]
    J_ring: float = 0.5  # Ring gear inertia [kg·m²]

    @property
    def rho(self) -> float:
        """Gear ratio ρ = Z_ring / Z_sun."""
        return self.Z_ring / self.Z_sun


class PlanetaryGear:
    """Planetary gear set model implementing Willis equation.

    Kinematic relationship (Willis equation):
        ω_sun = (1 + ρ) · ω_carrier - ρ · ω_ring

    For ρ = 3.0:
        ω_MG1 = 4 · ω_e - 3 · ω_r

    Torque relationship (static equilibrium):
        τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ

    For ρ = 3.0:
        τ_sun : τ_carrier : τ_ring = 1 : -4 : 3
    """

    def __init__(self, params: PlanetaryGearParams = None):
        self.params = params or PlanetaryGearParams()
        self._rho = self.params.rho

    @property
    def rho(self) -> float:
        """Gear ratio ρ = Z_ring / Z_sun."""
        return self._rho

    def calc_sun_speed(self, omega_carrier: float, omega_ring: float) -> float:
        """Calculate sun gear (MG1) speed from Willis equation.

        ω_sun = (1 + ρ) · ω_carrier - ρ · ω_ring

        Args:
            omega_carrier: Carrier (engine) angular velocity [rad/s]
            omega_ring: Ring gear angular velocity [rad/s]

        Returns:
            Sun gear (MG1) angular velocity [rad/s]
        """
        return (1 + self._rho) * omega_carrier - self._rho * omega_ring

    def calc_carrier_speed(self, omega_sun: float, omega_ring: float) -> float:
        """Calculate carrier (engine) speed from Willis equation.

        ω_carrier = (ω_sun + ρ · ω_ring) / (1 + ρ)

        Args:
            omega_sun: Sun gear (MG1) angular velocity [rad/s]
            omega_ring: Ring gear angular velocity [rad/s]

        Returns:
            Carrier (engine) angular velocity [rad/s]
        """
        return (omega_sun + self._rho * omega_ring) / (1 + self._rho)

    def calc_ring_speed(self, omega_carrier: float, omega_sun: float) -> float:
        """Calculate ring gear speed from Willis equation.

        ω_ring = ((1 + ρ) · ω_carrier - ω_sun) / ρ

        Args:
            omega_carrier: Carrier (engine) angular velocity [rad/s]
            omega_sun: Sun gear (MG1) angular velocity [rad/s]

        Returns:
            Ring gear angular velocity [rad/s]
        """
        return ((1 + self._rho) * omega_carrier - omega_sun) / self._rho

    def calc_torque_split(self, T_carrier: float) -> tuple[float, float]:
        """Calculate sun and ring torques from carrier (engine) torque.

        From torque balance: τ_sun + τ_carrier + τ_ring = 0
        And ratio: τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ

        Therefore:
            τ_sun = -τ_carrier / (1 + ρ)
            τ_ring = ρ · τ_sun = -ρ · τ_carrier / (1 + ρ)

        Args:
            T_carrier: Carrier (engine) torque [N·m]

        Returns:
            Tuple of (τ_sun, τ_ring) [N·m]
            τ_sun is the reaction torque on MG1 (negative = generating)
            τ_ring is the torque delivered to output
        """
        tau_sun = -T_carrier / (1 + self._rho)
        tau_ring = self._rho * tau_sun  # = -ρ · T_carrier / (1 + ρ)
        return tau_sun, tau_ring

    def calc_carrier_torque(self, T_sun: float, T_ring: float) -> float:
        """Calculate carrier torque from sun and ring torques.

        From torque balance: τ_carrier = -(τ_sun + τ_ring)

        Args:
            T_sun: Sun gear (MG1) torque [N·m]
            T_ring: Ring gear torque [N·m]

        Returns:
            Carrier (engine) torque [N·m]
        """
        return -(T_sun + T_ring)

    def get_inertia_coefficients(self, J_MG1: float) -> tuple[float, float, float]:
        """Get equivalent inertia coefficients for state-space model.

        When reducing the 3-DOF system (sun, carrier, ring) to 2-DOF (carrier, ring)
        using the Willis constraint, the inertia matrix becomes:

        J = [J_eq1,  J_12 ]
            [J_12,   J_eq2]

        Where:
            J_eq1 = J_e + (1+ρ)² · J_MG1
            J_12  = -(1+ρ) · ρ · J_MG1
            J_eq2 = J_MG2 + ρ² · J_MG1

        Args:
            J_MG1: MG1 rotor inertia [kg·m²]

        Returns:
            Tuple of (coeff_eq1, coeff_12, coeff_eq2) to multiply by J_MG1
            Note: J_e and J_MG2 must be added separately
        """
        rho = self._rho
        coeff_eq1 = (1 + rho) ** 2  # = 16 for ρ=3
        coeff_12 = -(1 + rho) * rho  # = -12 for ρ=3
        coeff_eq2 = rho ** 2  # = 9 for ρ=3
        return coeff_eq1, coeff_12, coeff_eq2


# Convenience function for quick calculations
def willis_equation(omega_carrier: float, omega_ring: float, rho: float = 3.0) -> float:
    """Calculate sun gear speed using Willis equation.

    ω_sun = (1 + ρ) · ω_carrier - ρ · ω_ring
    """
    return (1 + rho) * omega_carrier - rho * omega_ring
