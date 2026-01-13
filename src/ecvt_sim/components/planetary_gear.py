"""Planetary gear set (Power Split Device) model.

Implements Willis equation kinematics and torque balance for a simple
planetary gear with:
- Sun gear connected to MG1
- Carrier connected to engine (ICE)
- Ring gear connected to output (MG2 side)

Efficiency model:
- Sun-planet mesh efficiency: ~98-99%
- Planet-ring mesh efficiency: ~98-99%
- Total path efficiency depends on power flow direction

References:
- Gear mesh efficiency in planetary systems
- Power-split hybrid transmission analysis
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

    # Mesh efficiency parameters
    eta_sun_planet: float = 0.98   # Sun-planet mesh efficiency
    eta_planet_ring: float = 0.98  # Planet-ring mesh efficiency
    use_efficiency: bool = True    # Enable efficiency losses

    @property
    def rho(self) -> float:
        """Gear ratio ρ = Z_ring / Z_sun."""
        return self.Z_ring / self.Z_sun

    @property
    def eta_total(self) -> float:
        """Total planetary gear efficiency (sun to ring path)."""
        return self.eta_sun_planet * self.eta_planet_ring


class PlanetaryGear:
    """Planetary gear set model implementing Willis equation.

    Kinematic relationship (Willis equation):
        ω_sun = (1 + ρ) · ω_carrier - ρ · ω_ring

    For ρ = 3.0:
        ω_MG1 = 4 · ω_e - 3 · ω_r

    Torque relationship (static equilibrium, ideal):
        τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ

    For ρ = 3.0:
        τ_sun : τ_carrier : τ_ring = 1 : -4 : 3

    Efficiency affects torque transfer:
        - Power flowing sun→carrier→ring: output reduced by η
        - Power flowing ring→carrier→sun: output reduced by η
    """

    def __init__(self, params: PlanetaryGearParams = None):
        self.params = params or PlanetaryGearParams()
        self._rho = self.params.rho

    @property
    def rho(self) -> float:
        """Gear ratio ρ = Z_ring / Z_sun."""
        return self._rho

    @property
    def eta(self) -> float:
        """Total mesh efficiency."""
        return self.params.eta_total if self.params.use_efficiency else 1.0

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

    def calc_torque_split(self, T_carrier: float, include_efficiency: bool = None) -> tuple[float, float]:
        """Calculate sun and ring torques from carrier (engine) torque.

        From torque balance: τ_sun + τ_carrier + τ_ring = 0
        And ratio: τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ

        Therefore (ideal):
            τ_sun = -τ_carrier / (1 + ρ)
            τ_ring = ρ · τ_sun = -ρ · τ_carrier / (1 + ρ)

        With efficiency losses:
            τ_ring_actual = τ_ring_ideal * η (power flows carrier→ring)

        Args:
            T_carrier: Carrier (engine) torque [N·m]
            include_efficiency: Override efficiency setting. If None, uses params.

        Returns:
            Tuple of (τ_sun, τ_ring) [N·m]
            τ_sun is the reaction torque on MG1 (negative = generating)
            τ_ring is the torque delivered to output
        """
        tau_sun = -T_carrier / (1 + self._rho)
        tau_ring_ideal = self._rho * tau_sun  # = -ρ · T_carrier / (1 + ρ)

        # Apply efficiency if enabled
        use_eta = include_efficiency if include_efficiency is not None else self.params.use_efficiency
        if use_eta:
            # Power flows from carrier to ring, so ring torque is reduced
            eta = self.params.eta_total
            tau_ring = tau_ring_ideal * eta
        else:
            tau_ring = tau_ring_ideal

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
