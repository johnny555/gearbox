"""Battery model using simple equivalent circuit.

Battery parameters for CAT 793D mining application:
- Capacity: 200 kWh
- Nominal voltage: 700 V
- Open circuit voltage: 750 V
- Internal resistance: 0.05 Ω
- Max discharge power: 1,000 kW
- SOC operating range: 0.3-0.8
"""

import numpy as np
from dataclasses import dataclass


@dataclass
class BatteryParams:
    """Battery parameters."""

    Q_capacity: float = 200.0 * 3600 * 1000  # Capacity [J] (200 kWh)
    V_oc: float = 750.0         # Open circuit voltage [V]
    V_nom: float = 700.0        # Nominal voltage [V]
    R_int: float = 0.05         # Internal resistance [Ω]
    P_max_discharge: float = 1_000_000.0  # Max discharge power [W]
    P_max_charge: float = 500_000.0       # Max charge power [W]
    SOC_min: float = 0.3        # Minimum SOC
    SOC_max: float = 0.8        # Maximum SOC
    SOC_init: float = 0.6       # Initial SOC

    @property
    def Q_Ah(self) -> float:
        """Capacity in Amp-hours."""
        return self.Q_capacity / (self.V_nom * 3600)


class Battery:
    """Simple equivalent circuit battery model.

    Model: V_terminal = V_oc - I * R_int

    Power equation: P = V_oc * I - R_int * I²

    Solving for current: I = (V_oc - √(V_oc² - 4*R_int*P)) / (2*R_int)

    SOC dynamics: dSOC/dt = -I / Q_capacity (in Coulombs)
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

    def get_open_circuit_voltage(self, soc: float = None) -> float:
        """Get open circuit voltage at given SOC.

        Simplified model: V_oc is constant.
        Could be extended to V_oc = f(SOC) for more accuracy.

        Args:
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Open circuit voltage [V]
        """
        # Simple model: constant V_oc
        # Could add SOC dependence: V_oc = V_oc_nom * (0.9 + 0.2*soc)
        return self.params.V_oc

    def get_current_from_power(self, power: float, soc: float = None) -> float:
        """Calculate battery current for given power demand.

        Sign convention:
        - Positive power: discharging (positive current)
        - Negative power: charging (negative current)

        From: P = V_oc * I - R_int * I²
        Rearranged: R_int * I² - V_oc * I + P = 0
        Solution: I = (V_oc - √(V_oc² - 4*R_int*P)) / (2*R_int)

        Args:
            power: Battery power [W] (positive = discharge)
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Battery current [A] (positive = discharge)
        """
        V_oc = self.get_open_circuit_voltage(soc)
        R = self.params.R_int

        discriminant = V_oc ** 2 - 4 * R * power
        if discriminant < 0:
            # Power exceeds capability - return max current
            return V_oc / (2 * R) if power > 0 else -V_oc / (2 * R)

        # Use smaller root for stability
        current = (V_oc - np.sqrt(discriminant)) / (2 * R)
        return current

    def get_terminal_voltage(self, current: float, soc: float = None) -> float:
        """Calculate terminal voltage at given current.

        V_term = V_oc - I * R_int

        Args:
            current: Battery current [A] (positive = discharge)
            soc: State of charge [0-1]. If None, uses current SOC.

        Returns:
            Terminal voltage [V]
        """
        V_oc = self.get_open_circuit_voltage(soc)
        return V_oc - current * self.params.R_int

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
