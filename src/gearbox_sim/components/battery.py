"""Battery component for hybrid and electric drivetrains."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint


@dataclass
class BatteryParams:
    """Battery parameters.

    Attributes:
        capacity_kwh: Energy capacity [kWh]
        V_oc: Open circuit voltage [V]
        V_nom: Nominal voltage [V]
        R_int: Internal resistance [Ω]
        P_max_discharge: Maximum discharge power [W]
        P_max_charge: Maximum charge power [W]
        SOC_min: Minimum operating SOC
        SOC_max: Maximum operating SOC
        SOC_init: Initial SOC
    """

    capacity_kwh: float = 200.0
    V_oc: float = 750.0
    V_nom: float = 700.0
    R_int: float = 0.05
    P_max_discharge: float = 1_000_000.0
    P_max_charge: float = 500_000.0
    SOC_min: float = 0.3
    SOC_max: float = 0.8
    SOC_init: float = 0.6

    @property
    def Q_capacity(self) -> float:
        """Capacity in Joules."""
        return self.capacity_kwh * 3600 * 1000

    @property
    def Q_Ah(self) -> float:
        """Capacity in Amp-hours."""
        return self.Q_capacity / (self.V_nom * 3600)


# Pre-configured for CAT 793D
CAT_793D_BATTERY_PARAMS = BatteryParams(
    capacity_kwh=200.0,
    V_oc=750.0,
    V_nom=700.0,
    R_int=0.05,
    P_max_discharge=1_000_000.0,
    P_max_charge=500_000.0,
    SOC_min=0.3,
    SOC_max=0.8,
    SOC_init=0.6,
)

# Larger battery for series hybrid
SERIES_HYBRID_BATTERY_PARAMS = BatteryParams(
    capacity_kwh=400.0,
    V_oc=750.0,
    V_nom=700.0,
    R_int=0.03,
    P_max_discharge=1_500_000.0,
    P_max_charge=800_000.0,
    SOC_min=0.2,
    SOC_max=0.9,
    SOC_init=0.6,
)

# Large battery for pure EV
EV_BATTERY_PARAMS = BatteryParams(
    capacity_kwh=600.0,
    V_oc=800.0,
    V_nom=750.0,
    R_int=0.02,
    P_max_discharge=2_000_000.0,
    P_max_charge=1_000_000.0,
    SOC_min=0.1,
    SOC_max=0.95,
    SOC_init=0.8,
)


class BatteryComponent(DrivetrainComponent):
    """Battery energy storage component.

    Uses simple equivalent circuit model:
    V_terminal = V_oc - I × R_int

    Power limits are derated near SOC boundaries to protect the battery.

    Ports:
        electrical: Electrical power port (bidirectional)

    Internal states:
        SOC: State of charge [0-1]
    """

    def __init__(self, params: BatteryParams = None, name: str = "battery"):
        """Initialize battery component.

        Args:
            params: Battery parameters
            name: Component name
        """
        super().__init__(name)
        self.params = params or BatteryParams()
        self._soc = self.params.SOC_init

    @property
    def soc(self) -> float:
        """Current state of charge [0-1]."""
        return self._soc

    @soc.setter
    def soc(self, value: float) -> None:
        """Set state of charge."""
        self._soc = float(np.clip(value, 0.0, 1.0))

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "electrical": Port(
                name="electrical",
                port_type=PortType.ELECTRICAL,
                direction=PortDirection.BIDIRECTIONAL,
                description="Electrical power connection",
            )
        }

    @property
    def state_names(self) -> List[str]:
        return ["SOC"]

    def get_inertia(self, port_name: str) -> float:
        # Battery has no mechanical inertia
        return 0.0

    def get_constraints(self) -> List[KinematicConstraint]:
        return []

    def get_open_circuit_voltage(self, soc: float = None) -> float:
        """Get open circuit voltage (could be SOC-dependent).

        Args:
            soc: State of charge (uses current if None)

        Returns:
            Open circuit voltage [V]
        """
        # Simple model: constant V_oc
        # Could add SOC dependency: V_oc = f(SOC)
        return self.params.V_oc

    def get_current_from_power(self, power: float, soc: float = None) -> float:
        """Calculate current from power demand.

        Solves: P = V_oc × I - R_int × I²

        Args:
            power: Electrical power [W] (positive = discharge)
            soc: State of charge (uses current if None)

        Returns:
            Current [A] (positive = discharge)
        """
        if soc is None:
            soc = self._soc

        V_oc = self.get_open_circuit_voltage(soc)
        R = self.params.R_int

        if abs(power) < 1e-6:
            return 0.0

        # Quadratic: R × I² - V_oc × I + P = 0
        # I = (V_oc - sqrt(V_oc² - 4RP)) / (2R)
        discriminant = V_oc**2 - 4 * R * power

        if discriminant < 0:
            # Power exceeds capability - return limiting current
            return V_oc / (2 * R) if power > 0 else -V_oc / (2 * R)

        # Use solution that gives smaller magnitude current
        I = (V_oc - np.sqrt(discriminant)) / (2 * R)
        return I

    def get_terminal_voltage(self, current: float, soc: float = None) -> float:
        """Get terminal voltage at given current.

        Args:
            current: Current [A] (positive = discharge)
            soc: State of charge

        Returns:
            Terminal voltage [V]
        """
        if soc is None:
            soc = self._soc

        V_oc = self.get_open_circuit_voltage(soc)
        return V_oc - current * self.params.R_int

    def get_power_limits(self, soc: float = None) -> tuple[float, float]:
        """Get power limits with SOC-based derating.

        Args:
            soc: State of charge (uses current if None)

        Returns:
            Tuple of (P_min, P_max) [W]
            P_min is negative (max charging), P_max is positive (max discharging)
        """
        if soc is None:
            soc = self._soc

        P_discharge = self.params.P_max_discharge
        P_charge = self.params.P_max_charge

        # Derate discharge at low SOC
        if soc < self.params.SOC_min + 0.1:
            factor = max(0.0, (soc - self.params.SOC_min) / 0.1)
            P_discharge *= factor

        # Derate charge at high SOC
        if soc > self.params.SOC_max - 0.1:
            factor = max(0.0, (self.params.SOC_max - soc) / 0.1)
            P_charge *= factor

        return (-P_charge, P_discharge)

    def clip_power(self, power: float, soc: float = None) -> float:
        """Clip power to valid range.

        Args:
            power: Requested power [W]
            soc: State of charge

        Returns:
            Clipped power [W]
        """
        P_min, P_max = self.get_power_limits(soc)
        return float(np.clip(power, P_min, P_max))

    def get_soc_derivative(self, power: float, soc: float = None) -> float:
        """Calculate SOC rate of change.

        dSOC/dt = -I / Q_capacity

        Args:
            power: Electrical power [W] (positive = discharge)
            soc: Current SOC

        Returns:
            SOC rate [1/s]
        """
        if soc is None:
            soc = self._soc

        current = self.get_current_from_power(power, soc)
        # Q_capacity is in Coulombs (A·s)
        Q = self.params.Q_capacity / self.params.V_nom  # Convert to Coulombs
        return -current / Q

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Battery doesn't produce torque."""
        return {}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute SOC derivative.

        Args:
            internal_states: {"SOC": current_soc}
            port_values: Should contain "electrical_power" or be computed
                        from connected motor powers

        Returns:
            {"SOC": dSOC/dt}
        """
        soc = internal_states.get("SOC", self._soc)
        power = port_values.get("electrical_power", 0.0)

        d_soc = self.get_soc_derivative(power, soc)
        return {"SOC": d_soc}

    def can_provide_power(self, power: float, soc: float = None) -> bool:
        """Check if battery can provide requested power.

        Args:
            power: Requested power [W]
            soc: State of charge

        Returns:
            True if power is achievable
        """
        P_min, P_max = self.get_power_limits(soc)
        return P_min <= power <= P_max

    def get_energy_remaining(self, soc: float = None) -> float:
        """Get remaining usable energy.

        Args:
            soc: State of charge

        Returns:
            Usable energy [J]
        """
        if soc is None:
            soc = self._soc

        usable_soc = max(0.0, soc - self.params.SOC_min)
        return usable_soc * self.params.Q_capacity
