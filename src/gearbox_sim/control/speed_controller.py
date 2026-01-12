"""Generic speed controller for any drivetrain type."""

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

import numpy as np

from ..core.drivetrain import Drivetrain
from .base import DrivetrainController


@dataclass
class TorqueAllocation:
    """Describes how to allocate torque demand among actuators."""

    actuators: List[str]  # Component names
    fractions: List[float]  # Fraction of demand for each
    is_engine: List[bool]  # Whether each is an engine (non-negative torque only)


class SpeedController(DrivetrainController):
    """Generic proportional-integral speed controller.

    Works with any drivetrain by discovering actuators (engines, motors)
    and distributing torque demand among them.
    """

    def __init__(
        self,
        drivetrain: Drivetrain,
        Kp: float = 50000.0,
        Ki: float = 5000.0,
        allocation: Optional[TorqueAllocation] = None,
    ):
        """Initialize the speed controller.

        Args:
            drivetrain: Drivetrain to control
            Kp: Proportional gain [N·m/(m/s)]
            Ki: Integral gain [N·m/(m·s)]
            allocation: Torque allocation strategy (auto-detected if None)
        """
        super().__init__(drivetrain)
        self.Kp = Kp
        self.Ki = Ki
        self._integral = 0.0
        self._last_time = 0.0

        # Discover actuators if not specified
        if allocation is None:
            self._discover_actuators()
        else:
            self.allocation = allocation

        # Find gearbox for gear control
        self._gearbox_name = self._find_gearbox()
        self._current_gear = 0

    def _discover_actuators(self) -> None:
        """Discover engines and motors in the drivetrain."""
        actuators = []
        fractions = []
        is_engine = []

        components = self.drivetrain.topology.components

        # Find all engines and motors
        for name, comp in components.items():
            comp_type = type(comp).__name__
            if "Engine" in comp_type:
                actuators.append(name)
                is_engine.append(True)
            elif "Motor" in comp_type:
                actuators.append(name)
                is_engine.append(False)

        if not actuators:
            raise ValueError("No actuators (engines/motors) found in drivetrain")

        # Simple equal allocation
        n = len(actuators)
        fractions = [1.0 / n] * n

        self.allocation = TorqueAllocation(actuators, fractions, is_engine)

    def _find_gearbox(self) -> Optional[str]:
        """Find gearbox component name."""
        for name, comp in self.drivetrain.topology.components.items():
            if "Gearbox" in type(comp).__name__ and comp.n_gears > 1:
                return name
        return None

    def compute(self, state: Dict[str, float], grade: float) -> Dict[str, float]:
        """Compute torque commands for all actuators.

        Args:
            state: Current state
            grade: Road grade

        Returns:
            Control dict with torque commands for all actuators
        """
        # Get current velocity
        velocity = self.get_velocity(state)

        # Get target velocity
        v_target = self._target_velocity if self._target_velocity is not None else 10.0

        # Speed error
        v_error = v_target - velocity

        # PI control
        T_demand = self.Kp * v_error + self.Ki * self._integral

        # Update integral (with anti-windup)
        if abs(self._integral) < 100.0:
            self._integral += v_error * 0.1  # Assuming ~0.1s between calls

        # Allocate torque among actuators
        controls = self._allocate_torque(state, T_demand)

        # Add gear control if gearbox exists
        if self._gearbox_name:
            gear = self._select_gear(velocity, grade)
            controls[f"gear_{self._gearbox_name}"] = gear
            self._current_gear = gear

        return controls

    def _allocate_torque(self, state: Dict[str, float], T_demand: float) -> Dict[str, float]:
        """Allocate torque demand among actuators.

        Args:
            state: Current state
            T_demand: Total torque demand

        Returns:
            Control dict with torque for each actuator
        """
        controls = {}

        for i, actuator in enumerate(self.allocation.actuators):
            T_alloc = T_demand * self.allocation.fractions[i]

            # Engines can only provide positive torque
            if self.allocation.is_engine[i]:
                T_alloc = max(0.0, T_alloc)

            # Clip to actuator limits
            component = self.drivetrain.get_component(actuator)
            if hasattr(component, "clip_torque"):
                # Get actuator speed
                speed_key = f"{actuator}.shaft"
                omega = 0.0
                for key, value in state.items():
                    if actuator in key:
                        omega = abs(value)
                        break

                rpm = omega * 30.0 / np.pi
                T_alloc = component.clip_torque(rpm, T_alloc)

            controls[f"T_{actuator}"] = T_alloc

        return controls

    def _select_gear(self, velocity: float, grade: float) -> int:
        """Simple gear selection based on velocity.

        Args:
            velocity: Current velocity [m/s]
            grade: Road grade

        Returns:
            Gear index
        """
        if self._gearbox_name is None:
            return 0

        gearbox = self.drivetrain.get_component(self._gearbox_name)
        n_gears = gearbox.n_gears

        # Simple speed-based selection
        # Each gear covers a velocity range
        v_max = 15.0  # Assumed max speed
        gear_width = v_max / n_gears

        gear = int(velocity / gear_width)
        gear = max(0, min(gear, n_gears - 1))

        # Stay in lower gear on steep grades
        if grade > 0.05:
            gear = max(0, gear - 1)
        if grade > 0.10:
            gear = 0

        return gear

    def reset(self) -> None:
        """Reset controller state."""
        self._integral = 0.0
        self._current_gear = 0
