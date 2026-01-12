"""N-speed gearbox component for the composable drivetrain simulator."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np

from ..core.component import DrivetrainComponent
from ..core.ports import Port, PortType, PortDirection
from ..core.constraints import KinematicConstraint, GearRatioConstraint


@dataclass
class GearboxParams:
    """N-speed gearbox parameters.

    Attributes:
        ratios: List of gear ratios [K1, K2, ..., Kn] where K = omega_in / omega_out
        efficiencies: Efficiency for each gear (same length as ratios)
        J_input: Input shaft inertia [kg·m²]
        J_output: Output shaft inertia [kg·m²]
        shift_time: Time to complete a gear shift [s] (for future use)
    """

    ratios: List[float] = field(default_factory=lambda: [3.5, 2.0, 1.0])
    efficiencies: List[float] = field(default_factory=lambda: [0.97, 0.97, 0.97])
    J_input: float = 5.0
    J_output: float = 5.0
    shift_time: float = 0.5

    def __post_init__(self):
        # Ensure efficiencies list matches ratios
        if len(self.efficiencies) != len(self.ratios):
            self.efficiencies = [0.97] * len(self.ratios)


# Pre-configured gearbox parameters
# CAT 793D eCVT 2-speed
ECVT_GEARBOX_PARAMS = GearboxParams(
    ratios=[5.0, 0.67],  # Low and overdrive
    efficiencies=[0.97, 0.97],
    J_input=5.0,
    J_output=5.0,
)

# Typical 7-speed automatic for conventional diesel
DIESEL_7SPEED_PARAMS = GearboxParams(
    ratios=[4.59, 2.95, 1.94, 1.40, 1.0, 0.74, 0.65],
    efficiencies=[0.97] * 7,
    J_input=5.0,
    J_output=5.0,
)

# Single-speed reduction for EVs
SINGLE_SPEED_PARAMS = GearboxParams(
    ratios=[10.0],
    efficiencies=[0.98],
    J_input=2.0,
    J_output=5.0,
)


class NSpeedGearboxComponent(DrivetrainComponent):
    """N-speed discrete gearbox component.

    Converts between input and output shafts with selectable gear ratios.
    Speed: omega_out = omega_in / K
    Torque: T_out = T_in * K * eta

    Ports:
        input: High-speed input shaft
        output: Low-speed output shaft

    Control inputs:
        gear: Gear selection (0 to n_gears-1)
    """

    def __init__(self, params: GearboxParams = None, name: str = "gearbox"):
        """Initialize the gearbox component.

        Args:
            params: Gearbox parameters
            name: Component name
        """
        super().__init__(name)
        self.params = params or GearboxParams()
        self._current_gear = 0

    @property
    def n_gears(self) -> int:
        """Number of available gears."""
        return len(self.params.ratios)

    @property
    def gear(self) -> int:
        """Current gear (0-indexed)."""
        return self._current_gear

    @gear.setter
    def gear(self, value: int) -> None:
        """Set current gear."""
        self._current_gear = max(0, min(value, self.n_gears - 1))

    @property
    def current_ratio(self) -> float:
        """Current gear ratio."""
        return self.params.ratios[self._current_gear]

    @property
    def current_efficiency(self) -> float:
        """Current gear efficiency."""
        return self.params.efficiencies[self._current_gear]

    @property
    def ports(self) -> Dict[str, Port]:
        return {
            "input": Port(
                name="input",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.INPUT,
                description="High-speed input shaft",
            ),
            "output": Port(
                name="output",
                port_type=PortType.MECHANICAL,
                direction=PortDirection.OUTPUT,
                description="Low-speed output shaft",
            ),
        }

    @property
    def state_names(self) -> List[str]:
        # Gear is discrete, not a continuous state
        return []

    def get_inertia(self, port_name: str) -> float:
        if port_name == "input":
            return self.params.J_input
        elif port_name == "output":
            return self.params.J_output
        raise ValueError(f"Unknown port: {port_name}")

    def get_constraints(self) -> List[KinematicConstraint]:
        """Get current gear ratio constraint."""
        return [
            GearRatioConstraint(
                input_port="input",
                output_port="output",
                ratio=self.current_ratio,
                efficiency=self.current_efficiency,
            )
        ]

    def get_ratio(self, gear: int = None) -> float:
        """Get gear ratio for specified gear.

        Args:
            gear: Gear index (0-based). If None, use current gear.

        Returns:
            Gear ratio K = omega_in / omega_out
        """
        if gear is None:
            gear = self._current_gear
        gear = max(0, min(gear, self.n_gears - 1))
        return self.params.ratios[gear]

    def get_efficiency(self, gear: int = None) -> float:
        """Get efficiency for specified gear."""
        if gear is None:
            gear = self._current_gear
        gear = max(0, min(gear, self.n_gears - 1))
        return self.params.efficiencies[gear]

    def input_to_output_speed(self, omega_in: float, gear: int = None) -> float:
        """Convert input speed to output speed.

        Args:
            omega_in: Input angular velocity [rad/s]
            gear: Gear index (None for current)

        Returns:
            Output angular velocity [rad/s]
        """
        K = self.get_ratio(gear)
        return omega_in / K

    def output_to_input_speed(self, omega_out: float, gear: int = None) -> float:
        """Convert output speed to input speed.

        Args:
            omega_out: Output angular velocity [rad/s]
            gear: Gear index (None for current)

        Returns:
            Input angular velocity [rad/s]
        """
        K = self.get_ratio(gear)
        return omega_out * K

    def input_to_output_torque(self, T_in: float, gear: int = None) -> float:
        """Convert input torque to output torque.

        Args:
            T_in: Input torque [N·m]
            gear: Gear index (None for current)

        Returns:
            Output torque [N·m]
        """
        K = self.get_ratio(gear)
        eta = self.get_efficiency(gear)
        return T_in * K * eta

    def output_to_input_torque(self, T_out: float, gear: int = None) -> float:
        """Convert output torque to input torque.

        Args:
            T_out: Output torque [N·m]
            gear: Gear index (None for current)

        Returns:
            Input torque [N·m]
        """
        K = self.get_ratio(gear)
        eta = self.get_efficiency(gear)
        return T_out / (K * eta)

    def get_reflected_inertia(self, J_output: float, gear: int = None) -> float:
        """Calculate inertia reflected to input side.

        Args:
            J_output: Inertia on output side [kg·m²]
            gear: Gear index (None for current)

        Returns:
            Reflected inertia [kg·m²]
        """
        K = self.get_ratio(gear)
        return J_output / (K**2)

    def compute_torques(
        self,
        port_speeds: Dict[str, float],
        control_inputs: Dict[str, float],
        internal_states: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """Compute gearbox torques.

        The gearbox passes through torque with ratio and efficiency.
        Actual torque flow depends on the connected components.

        Args:
            port_speeds: {"input": omega_in, "output": omega_out}
            control_inputs: {"gear": gear_index}
            internal_states: Not used

        Returns:
            Empty dict - gearbox doesn't generate torque
        """
        # Update gear selection from control
        if "gear" in control_inputs:
            self.gear = int(control_inputs["gear"])

        # Gearbox itself doesn't produce torque, it transforms it
        return {}

    def compute_state_derivatives(
        self,
        internal_states: Dict[str, float],
        port_values: Dict[str, Any],
    ) -> Dict[str, float]:
        """Compute state derivatives (none for gearbox)."""
        return {}


class FinalDriveComponent(NSpeedGearboxComponent):
    """Final drive (fixed-ratio) component.

    A specialized single-speed gearbox for the final drive reduction.
    """

    def __init__(self, ratio: float = 16.0, efficiency: float = 0.96, name: str = "final_drive"):
        """Initialize final drive.

        Args:
            ratio: Final drive ratio
            efficiency: Efficiency
            name: Component name
        """
        params = GearboxParams(
            ratios=[ratio],
            efficiencies=[efficiency],
            J_input=2.0,
            J_output=10.0,
        )
        super().__init__(params, name)

    @property
    def ratio(self) -> float:
        """Fixed drive ratio."""
        return self.params.ratios[0]


class FixedRatioGearComponent(NSpeedGearboxComponent):
    """Fixed-ratio gear component with configurable inertias.

    Use for modeling fixed ratio gear sets like:
    - Locked planetary gear (sun or ring brake engaged)
    - Simple reduction/overdrive stages
    - Transfer cases
    """

    def __init__(
        self,
        ratio: float = 1.0,
        efficiency: float = 0.98,
        J_input: float = 1.0,
        J_output: float = 1.0,
        name: str = "gear",
    ):
        """Initialize fixed ratio gear.

        Args:
            ratio: Gear ratio (omega_in / omega_out)
                   ratio > 1: speed reduction (torque multiplication)
                   ratio < 1: speed increase (overdrive)
            efficiency: Mechanical efficiency
            J_input: Input side rotational inertia [kg·m²]
            J_output: Output side rotational inertia [kg·m²]
            name: Component name
        """
        params = GearboxParams(
            ratios=[ratio],
            efficiencies=[efficiency],
            J_input=J_input,
            J_output=J_output,
        )
        super().__init__(params, name)

    @property
    def ratio(self) -> float:
        """Fixed gear ratio."""
        return self.params.ratios[0]

    @property
    def efficiency(self) -> float:
        """Gear efficiency."""
        return self.params.efficiencies[0]
