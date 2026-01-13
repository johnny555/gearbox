"""Battery model using equivalent circuit with SOC-dependent parameters.

Battery parameters for CAT 793D mining application:
- Capacity: 200 kWh
- Nominal voltage: 700 V (varies with SOC: ~630V at 0% to ~770V at 100%)
- Internal resistance: 0.05 Ω nominal (varies with SOC)
- Max discharge power: 1,000 kW
- SOC operating range: 0.3-0.8

SOC-OCV model based on literature:
- Nonlinear relationship typical of Li-ion NMC chemistry
- OCV varies ~15% across SOC range
- Internal resistance increases at low (<20%) and high (>80%) SOC

References:
- A Generalized SOC-OCV Model for Lithium-Ion Batteries, Energies 2016
- Fitting the OCV-SOC relationship using genetic algorithm, E3S Web Conf 2021
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class BatteryOCVParams:
    """Parameters for SOC-OCV relationship model.

    Uses polynomial model: V_oc(SOC) = V_nom * sum(a_i * SOC^i)

    Default coefficients approximate NMC Li-ion chemistry with
    ~15% voltage variation across SOC range.
    """
    # Polynomial coefficients for normalized OCV (V_oc / V_nom)
    # ocv_normalized = a0 + a1*SOC + a2*SOC² + a3*SOC³ + ...
    # Default gives: 0.90 at SOC=0, 1.0 at SOC=0.5, 1.10 at SOC=1.0
    coefficients: tuple = (
        0.900,    # a0: constant term
        0.400,    # a1: linear term
        -0.800,   # a2: quadratic (creates nonlinearity at extremes)
        1.200,    # a3: cubic
        -0.700,   # a4: quartic (flattens middle region)
        0.0,      # a5
        0.0,      # a6
        0.0,      # a7
    )

    # Alternative: use lookup table instead of polynomial
    use_lookup: bool = False
    soc_points: tuple = (0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0)
    ocv_normalized: tuple = (0.90, 0.92, 0.95, 0.97, 0.99, 1.00, 1.01, 1.03, 1.05, 1.08, 1.10)


@dataclass
class BatteryResistanceParams:
    """Parameters for SOC-dependent internal resistance model.

    R(SOC) = R_nom * (1 + k_low * exp(-SOC/tau_low) + k_high * exp((SOC-1)/tau_high))

    Resistance increases at low and high SOC due to:
    - Concentration polarization at low SOC
    - Charge transfer limitations at high SOC
    """
    R_nom: float = 0.05         # Nominal internal resistance [Ω]
    k_low: float = 0.5          # Low-SOC resistance increase factor
    tau_low: float = 0.15       # Low-SOC decay constant
    k_high: float = 0.3         # High-SOC resistance increase factor
    tau_high: float = 0.15      # High-SOC decay constant


@dataclass
class BatteryParams:
    """Battery parameters."""

    Q_capacity: float = 200.0 * 3600 * 1000  # Capacity [J] (200 kWh)
    V_oc: float = 750.0         # Nominal open circuit voltage [V] at SOC=0.5
    V_nom: float = 700.0        # Nominal terminal voltage [V]
    R_int: float = 0.05         # Nominal internal resistance [Ω]
    P_max_discharge: float = 1_000_000.0  # Max discharge power [W]
    P_max_charge: float = 500_000.0       # Max charge power [W]
    SOC_min: float = 0.3        # Minimum SOC
    SOC_max: float = 0.8        # Maximum SOC
    SOC_init: float = 0.6       # Initial SOC

    # SOC-dependent model parameters
    use_soc_dependent_ocv: bool = True
    use_soc_dependent_resistance: bool = True
    ocv_params: BatteryOCVParams = field(default_factory=BatteryOCVParams)
    resistance_params: BatteryResistanceParams = field(default_factory=BatteryResistanceParams)

    @property
    def Q_Ah(self) -> float:
        """Capacity in Amp-hours."""
        return self.Q_capacity / (self.V_nom * 3600)


class Battery:
    """Equivalent circuit battery model with SOC-dependent parameters.

    Model: V_terminal = V_oc(SOC) - I * R(SOC)

    Power equation: P = V_oc * I - R_int * I²

    Solving for current: I = (V_oc - √(V_oc² - 4*R_int*P)) / (2*R_int)

    SOC dynamics: dSOC/dt = -I / Q_capacity (in Coulombs)

    Features:
    - SOC-dependent open circuit voltage (nonlinear curve)
    - SOC-dependent internal resistance (increases at extremes)
    - Backward compatible with constant parameters
    """

    def __init__(self, params: BatteryParams = None):
        self.params = params or BatteryParams()
        self._soc = self.params.SOC_init

    @property
    def soc(self) -> float:
        """Current state of charge [0-1]."""
        return self._soc

    @soc.setter
    def soc(self, value: float):
        """Set SOC (clipped to valid range)."""
        self._soc = float(np.clip(value, 0.0, 1.0))

    def get_internal_resistance(self, soc: float = None) -> float:
        """Get internal resistance at given SOC.

        R(SOC) = R_nom * (1 + k_low*exp(-SOC/tau_low) + k_high*exp((SOC-1)/tau_high))

        Resistance increases at low and high SOC extremes.

        Args:
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Internal resistance [Ω]
        """
        if soc is None:
            soc = self._soc

        if not self.params.use_soc_dependent_resistance:
            return self.params.R_int

        rp = self.params.resistance_params
        soc = np.clip(soc, 0.0, 1.0)

        # Resistance increase at low and high SOC
        r_low_factor = rp.k_low * np.exp(-soc / rp.tau_low)
        r_high_factor = rp.k_high * np.exp((soc - 1.0) / rp.tau_high)

        return rp.R_nom * (1.0 + r_low_factor + r_high_factor)

    def get_open_circuit_voltage(self, soc: float = None) -> float:
        """Get open circuit voltage at given SOC.

        Uses polynomial or lookup table model for SOC-OCV relationship.
        Typical Li-ion NMC chemistry shows ~15% voltage variation.

        Args:
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Open circuit voltage [V]
        """
        if soc is None:
            soc = self._soc

        if not self.params.use_soc_dependent_ocv:
            return self.params.V_oc

        soc = np.clip(soc, 0.0, 1.0)
        op = self.params.ocv_params

        if op.use_lookup:
            # Linear interpolation from lookup table
            ocv_norm = np.interp(soc, op.soc_points, op.ocv_normalized)
        else:
            # Polynomial model: sum(a_i * SOC^i)
            ocv_norm = sum(
                coef * (soc ** i)
                for i, coef in enumerate(op.coefficients)
            )

        # Scale by nominal OCV
        return self.params.V_oc * ocv_norm

    def get_current_from_power(self, power: float, soc: float = None) -> float:
        """Calculate battery current for given power demand.

        Sign convention:
        - Positive power: discharging (positive current)
        - Negative power: charging (negative current)

        From: P = V_oc * I - R_int * I²
        Rearranged: R_int * I² - V_oc * I + P = 0
        Solution: I = (V_oc - √(V_oc² - 4*R_int*P)) / (2*R_int)

        Uses SOC-dependent OCV and internal resistance if enabled.

        Args:
            power: Battery power [W] (positive = discharge)
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Battery current [A] (positive = discharge)
        """
        V_oc = self.get_open_circuit_voltage(soc)
        R = self.get_internal_resistance(soc)

        discriminant = V_oc ** 2 - 4 * R * power
        if discriminant < 0:
            # Power exceeds capability - return max current
            return V_oc / (2 * R) if power > 0 else -V_oc / (2 * R)

        # Use smaller root for stability
        current = (V_oc - np.sqrt(discriminant)) / (2 * R)
        return current

    def get_terminal_voltage(self, current: float, soc: float = None) -> float:
        """Calculate terminal voltage at given current.

        V_term = V_oc(SOC) - I * R(SOC)

        Uses SOC-dependent OCV and internal resistance if enabled.

        Args:
            current: Battery current [A] (positive = discharge)
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Terminal voltage [V]
        """
        V_oc = self.get_open_circuit_voltage(soc)
        R = self.get_internal_resistance(soc)
        return V_oc - current * R

    def get_power_limits(self, soc: float = None) -> tuple[float, float]:
        """Get power limits based on SOC.

        Args:
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Tuple of (P_min, P_max) [W]
            P_min is negative (max charge), P_max is positive (max discharge)
        """
        if soc is None:
            soc = self._soc

        # Reduce limits near SOC boundaries
        P_discharge = self.params.P_max_discharge
        P_charge = self.params.P_max_charge

        # Reduce discharge capability at low SOC
        if soc < self.params.SOC_min + 0.1:
            factor = (soc - self.params.SOC_min) / 0.1
            P_discharge *= max(0.0, factor)

        # Reduce charge capability at high SOC
        if soc > self.params.SOC_max - 0.1:
            factor = (self.params.SOC_max - soc) / 0.1
            P_charge *= max(0.0, factor)

        return (-P_charge, P_discharge)

    def get_soc_derivative(self, power: float, soc: float = None) -> float:
        """Calculate SOC rate of change.

        dSOC/dt = -I / Q_capacity

        Args:
            power: Battery power [W] (positive = discharge)
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            SOC derivative [1/s]
        """
        current = self.get_current_from_power(power, soc)
        # Q_capacity is in Joules, need to convert to Coulombs (divide by V_nom)
        Q_coulombs = self.params.Q_capacity / self.params.V_nom
        return -current / Q_coulombs

    def clip_power(self, power: float, soc: float = None) -> float:
        """Clip power to valid range.

        Args:
            power: Requested power [W]
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Clipped power [W]
        """
        P_min, P_max = self.get_power_limits(soc)
        return float(np.clip(power, P_min, P_max))

    def can_provide_power(self, power: float, soc: float = None) -> bool:
        """Check if battery can provide requested power.

        Args:
            power: Requested power [W]
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            True if power is within limits
        """
        P_min, P_max = self.get_power_limits(soc)
        return P_min <= power <= P_max


# Default battery for CAT 793D
CAT_793D_BATTERY = Battery(BatteryParams())
