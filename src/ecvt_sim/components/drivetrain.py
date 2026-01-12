"""Modular drivetrain components for flexible powertrain configurations.

This module provides composable reduction and gearbox components that can be
chained together to build complex drivetrains.

Example configurations:
    # MG1 with reduction to sun gear
    mg1_to_sun = Reduction(ratio=3.5, name="MG1:Sun")

    # Output drivetrain: Ring -> Gearbox -> Intermediate -> Diff -> Hub -> Wheels
    output_chain = ReductionChain([
        SelectableGearbox(ratios=[3.0, 1.0], names=["Low", "High"]),
        Reduction(ratio=2.85, name="Intermediate"),
        Reduction(ratio=1.0, name="Diff"),
        Reduction(ratio=10.83, name="WheelHub"),
    ])
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Optional, Union
from abc import ABC, abstractmethod


class DrivetrainComponent(ABC):
    """Abstract base class for drivetrain components."""

    @property
    @abstractmethod
    def ratio(self) -> float:
        """Current gear ratio (input speed / output speed)."""
        pass

    @property
    @abstractmethod
    def efficiency(self) -> float:
        """Current efficiency."""
        pass

    @property
    def name(self) -> str:
        """Component name."""
        return getattr(self, '_name', '')

    def input_to_output_speed(self, omega_in: float) -> float:
        """Convert input speed to output speed.

        omega_out = omega_in / ratio

        Args:
            omega_in: Input angular velocity [rad/s]

        Returns:
            Output angular velocity [rad/s]
        """
        return omega_in / self.ratio

    def output_to_input_speed(self, omega_out: float) -> float:
        """Convert output speed to input speed.

        omega_in = omega_out * ratio

        Args:
            omega_out: Output angular velocity [rad/s]

        Returns:
            Input angular velocity [rad/s]
        """
        return omega_out * self.ratio

    def input_to_output_torque(self, T_in: float) -> float:
        """Convert input torque to output torque.

        T_out = T_in * ratio * efficiency

        Args:
            T_in: Input torque [N·m]

        Returns:
            Output torque [N·m]
        """
        return T_in * self.ratio * self.efficiency

    def output_to_input_torque(self, T_out: float) -> float:
        """Convert output torque to input torque (load seen at input).

        T_in = T_out / (ratio * efficiency)

        Args:
            T_out: Output torque [N·m]

        Returns:
            Input torque [N·m]
        """
        return T_out / (self.ratio * self.efficiency)

    def input_to_output_rpm(self, rpm_in: float) -> float:
        """Convert input RPM to output RPM."""
        return rpm_in / self.ratio

    def output_to_input_rpm(self, rpm_out: float) -> float:
        """Convert output RPM to input RPM."""
        return rpm_out * self.ratio


@dataclass
class ReductionParams:
    """Parameters for a fixed reduction."""
    ratio: float = 1.0
    efficiency: float = 0.97
    J_input: float = 0.0    # Input side inertia [kg·m²]
    J_output: float = 0.0   # Output side inertia [kg·m²]


class Reduction(DrivetrainComponent):
    """Fixed ratio reduction/gearbox.

    A simple gear reduction with a fixed ratio and efficiency.
    Can represent: planetary stage, single gear mesh, belt drive, etc.

    Speed relationship: omega_out = omega_in / ratio
    Torque relationship: T_out = T_in * ratio * efficiency
    """

    def __init__(
        self,
        ratio: float = 1.0,
        efficiency: float = 0.97,
        J_input: float = 0.0,
        J_output: float = 0.0,
        name: str = ""
    ):
        """Initialize fixed reduction.

        Args:
            ratio: Gear ratio (input speed / output speed). >1 means reduction.
            efficiency: Power transmission efficiency [0-1]
            J_input: Input side inertia [kg·m²]
            J_output: Output side inertia [kg·m²]
            name: Component name for identification
        """
        self._ratio = ratio
        self._efficiency = efficiency
        self._J_input = J_input
        self._J_output = J_output
        self._name = name

    @property
    def ratio(self) -> float:
        return self._ratio

    @ratio.setter
    def ratio(self, value: float):
        self._ratio = value

    @property
    def efficiency(self) -> float:
        return self._efficiency

    @efficiency.setter
    def efficiency(self, value: float):
        self._efficiency = value

    @property
    def J_input(self) -> float:
        """Input side inertia [kg·m²]."""
        return self._J_input

    @property
    def J_output(self) -> float:
        """Output side inertia [kg·m²]."""
        return self._J_output

    def get_reflected_inertia_at_input(self) -> float:
        """Get output inertia reflected to input side.

        J_reflected = J_output / ratio²
        """
        return self._J_output / (self._ratio ** 2)

    def get_reflected_inertia_at_output(self) -> float:
        """Get input inertia reflected to output side.

        J_reflected = J_input * ratio²
        """
        return self._J_input * (self._ratio ** 2)

    def __repr__(self) -> str:
        name_str = f"'{self._name}' " if self._name else ""
        return f"Reduction({name_str}{self._ratio:.2f}:1, η={self._efficiency:.0%})"


class SelectableGearbox(DrivetrainComponent):
    """Multi-speed gearbox with selectable gear ratios.

    Represents a transmission with multiple gear options that can be
    selected during operation.
    """

    def __init__(
        self,
        ratios: list[float],
        efficiencies: Optional[list[float]] = None,
        J_input: float = 0.0,
        J_output: float = 0.0,
        gear_names: Optional[list[str]] = None,
        name: str = ""
    ):
        """Initialize selectable gearbox.

        Args:
            ratios: List of gear ratios for each gear
            efficiencies: List of efficiencies for each gear (default: 0.97 for all)
            J_input: Input side inertia [kg·m²]
            J_output: Output side inertia [kg·m²]
            gear_names: Optional names for each gear (e.g., ["Low", "High"])
            name: Component name
        """
        self._ratios = list(ratios)
        self._efficiencies = list(efficiencies) if efficiencies else [0.97] * len(ratios)
        self._J_input = J_input
        self._J_output = J_output
        self._gear_names = gear_names or [f"Gear{i+1}" for i in range(len(ratios))]
        self._name = name
        self._current_gear = 0  # Index into ratios list

        if len(self._ratios) != len(self._efficiencies):
            raise ValueError("ratios and efficiencies must have same length")
        if len(self._ratios) != len(self._gear_names):
            raise ValueError("ratios and gear_names must have same length")

    @property
    def num_gears(self) -> int:
        """Number of available gears."""
        return len(self._ratios)

    @property
    def current_gear(self) -> int:
        """Current gear index (0-based)."""
        return self._current_gear

    @current_gear.setter
    def current_gear(self, value: int):
        """Set current gear by index."""
        if not 0 <= value < len(self._ratios):
            raise ValueError(f"Gear index {value} out of range [0, {len(self._ratios)-1}]")
        self._current_gear = value

    @property
    def current_gear_name(self) -> str:
        """Name of current gear."""
        return self._gear_names[self._current_gear]

    @property
    def ratio(self) -> float:
        """Current gear ratio."""
        return self._ratios[self._current_gear]

    @property
    def efficiency(self) -> float:
        """Current gear efficiency."""
        return self._efficiencies[self._current_gear]

    @property
    def ratios(self) -> list[float]:
        """All available gear ratios."""
        return self._ratios.copy()

    @property
    def efficiencies(self) -> list[float]:
        """All gear efficiencies."""
        return self._efficiencies.copy()

    @property
    def J_input(self) -> float:
        return self._J_input

    @property
    def J_output(self) -> float:
        return self._J_output

    def set_gear(self, gear: int):
        """Set current gear by index (0-based)."""
        self.current_gear = gear

    def set_gear_by_name(self, name: str):
        """Set current gear by name."""
        try:
            idx = self._gear_names.index(name)
            self._current_gear = idx
        except ValueError:
            raise ValueError(f"Unknown gear name: {name}. Available: {self._gear_names}")

    def get_ratio(self, gear: int) -> float:
        """Get ratio for specific gear."""
        return self._ratios[gear]

    def get_efficiency(self, gear: int) -> float:
        """Get efficiency for specific gear."""
        return self._efficiencies[gear]

    def __repr__(self) -> str:
        name_str = f"'{self._name}' " if self._name else ""
        ratios_str = ", ".join(f"{r:.2f}" for r in self._ratios)
        return f"SelectableGearbox({name_str}[{ratios_str}]:1, current={self.current_gear_name})"


class ReductionChain(DrivetrainComponent):
    """Chain of reductions connected in series.

    Allows building complex drivetrains by chaining multiple
    reduction stages together.

    Example:
        chain = ReductionChain([
            SelectableGearbox([3.0, 1.0], name="Gearbox"),
            Reduction(2.85, name="Intermediate"),
            Reduction(1.0, name="Diff"),
            Reduction(10.83, name="WheelHub"),
        ])

        total_ratio = chain.ratio  # 3.0 * 2.85 * 1.0 * 10.83 = 92.6
    """

    def __init__(self, components: list[DrivetrainComponent], name: str = ""):
        """Initialize reduction chain.

        Args:
            components: List of drivetrain components in order from input to output
            name: Chain name
        """
        self._components = list(components)
        self._name = name

    @property
    def components(self) -> list[DrivetrainComponent]:
        """List of components in the chain."""
        return self._components

    @property
    def ratio(self) -> float:
        """Total ratio of the chain (product of all component ratios)."""
        return float(np.prod([c.ratio for c in self._components]))

    @property
    def efficiency(self) -> float:
        """Total efficiency of the chain (product of all component efficiencies)."""
        return float(np.prod([c.efficiency for c in self._components]))

    def get_component(self, name: str) -> Optional[DrivetrainComponent]:
        """Get component by name."""
        for c in self._components:
            if c.name == name:
                return c
        return None

    def get_component_by_index(self, index: int) -> DrivetrainComponent:
        """Get component by index."""
        return self._components[index]

    def input_to_output_speed(self, omega_in: float) -> float:
        """Convert input speed through entire chain."""
        omega = omega_in
        for component in self._components:
            omega = component.input_to_output_speed(omega)
        return omega

    def output_to_input_speed(self, omega_out: float) -> float:
        """Convert output speed back through entire chain."""
        omega = omega_out
        for component in reversed(self._components):
            omega = component.output_to_input_speed(omega)
        return omega

    def input_to_output_torque(self, T_in: float) -> float:
        """Convert input torque through entire chain."""
        T = T_in
        for component in self._components:
            T = component.input_to_output_torque(T)
        return T

    def output_to_input_torque(self, T_out: float) -> float:
        """Convert output torque back through entire chain."""
        T = T_out
        for component in reversed(self._components):
            T = component.output_to_input_torque(T)
        return T

    def get_speed_at_stage(self, omega_in: float, stage: int) -> float:
        """Get speed at a specific stage (after that component).

        Args:
            omega_in: Input speed [rad/s]
            stage: Stage index (0 = after first component)

        Returns:
            Speed after the specified stage [rad/s]
        """
        omega = omega_in
        for i, component in enumerate(self._components):
            omega = component.input_to_output_speed(omega)
            if i == stage:
                break
        return omega

    def get_torque_at_stage(self, T_in: float, stage: int) -> float:
        """Get torque at a specific stage (after that component)."""
        T = T_in
        for i, component in enumerate(self._components):
            T = component.input_to_output_torque(T)
            if i == stage:
                break
        return T

    def get_ratio_up_to_stage(self, stage: int) -> float:
        """Get cumulative ratio up to and including a stage."""
        return float(np.prod([self._components[i].ratio for i in range(stage + 1)]))

    def get_efficiency_up_to_stage(self, stage: int) -> float:
        """Get cumulative efficiency up to and including a stage."""
        return float(np.prod([self._components[i].efficiency for i in range(stage + 1)]))

    def summary(self) -> str:
        """Get a summary string of the chain."""
        lines = [f"ReductionChain '{self._name}':"]
        cumulative_ratio = 1.0
        cumulative_eta = 1.0

        for i, c in enumerate(self._components):
            cumulative_ratio *= c.ratio
            cumulative_eta *= c.efficiency
            lines.append(
                f"  [{i}] {c.name or 'unnamed'}: {c.ratio:.2f}:1 (η={c.efficiency:.0%}) "
                f"-> cumulative: {cumulative_ratio:.1f}:1 (η={cumulative_eta:.1%})"
            )

        lines.append(f"  Total: {self.ratio:.1f}:1, η={self.efficiency:.1%}")
        return "\n".join(lines)

    def __repr__(self) -> str:
        name_str = f"'{self._name}' " if self._name else ""
        return f"ReductionChain({name_str}{len(self._components)} stages, {self.ratio:.1f}:1)"

    def __len__(self) -> int:
        return len(self._components)

    def __getitem__(self, index: int) -> DrivetrainComponent:
        return self._components[index]


# Convenience functions for common configurations

def create_two_speed_gearbox(
    low_ratio: float,
    high_ratio: float,
    efficiency: float = 0.97,
    name: str = "Gearbox"
) -> SelectableGearbox:
    """Create a simple two-speed gearbox.

    Args:
        low_ratio: Low gear ratio (typically > 1)
        high_ratio: High gear ratio (typically <= 1)
        efficiency: Gear efficiency
        name: Gearbox name

    Returns:
        Configured SelectableGearbox
    """
    return SelectableGearbox(
        ratios=[low_ratio, high_ratio],
        efficiencies=[efficiency, efficiency],
        gear_names=["Low", "High"],
        name=name
    )


def create_final_drive(
    intermediate: float = 1.0,
    diff: float = 1.0,
    wheel_hub: float = 1.0,
    efficiencies: Optional[dict] = None,
    name: str = "FinalDrive"
) -> ReductionChain:
    """Create a final drive chain with intermediate, diff, and wheel hub stages.

    Args:
        intermediate: Intermediate reduction ratio
        diff: Differential ratio
        wheel_hub: Wheel hub reduction ratio
        efficiencies: Dict with keys 'intermediate', 'diff', 'wheel_hub'
        name: Chain name

    Returns:
        ReductionChain representing the final drive
    """
    eff = efficiencies or {}

    components = []

    if intermediate != 1.0:
        components.append(Reduction(
            intermediate,
            eff.get('intermediate', 0.97),
            name="Intermediate"
        ))

    if diff != 1.0:
        components.append(Reduction(
            diff,
            eff.get('diff', 0.98),
            name="Diff"
        ))
    else:
        # Even 1:1 diff has some loss
        components.append(Reduction(
            diff,
            eff.get('diff', 0.99),
            name="Diff"
        ))

    components.append(Reduction(
        wheel_hub,
        eff.get('wheel_hub', 0.96),
        name="WheelHub"
    ))

    return ReductionChain(components, name=name)
