"""Controller for conventional diesel drivetrains."""

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np

from ..core.drivetrain import Drivetrain
from .base import DrivetrainController


@dataclass
class GearShiftSchedule:
    """Gear shift schedule based on vehicle speed.

    Attributes:
        upshift_speeds: Speed thresholds for upshifting [m/s]
        downshift_speeds: Speed thresholds for downshifting [m/s]
        hysteresis: Speed hysteresis to prevent hunting [m/s]
    """

    upshift_speeds: List[float]
    downshift_speeds: List[float]
    hysteresis: float = 1.0

    @classmethod
    def from_ratios(
        cls,
        ratios: List[float],
        engine_rpm_upshift: float = 1500.0,
        engine_rpm_downshift: float = 1000.0,
        wheel_radius: float = 1.78,
        final_drive: float = 16.0,
    ) -> "GearShiftSchedule":
        """Create shift schedule from gear ratios.

        Args:
            ratios: Gear ratios [K1, K2, ...]
            engine_rpm_upshift: Engine RPM to upshift at
            engine_rpm_downshift: Engine RPM to downshift at
            wheel_radius: Wheel radius [m]
            final_drive: Final drive ratio

        Returns:
            GearShiftSchedule
        """
        omega_up = engine_rpm_upshift * np.pi / 30.0
        omega_down = engine_rpm_downshift * np.pi / 30.0

        upshift_speeds = []
        downshift_speeds = []

        for i, ratio in enumerate(ratios[:-1]):
            # Speed at which to upshift from gear i to i+1
            v_up = omega_up * wheel_radius / (ratio * final_drive)
            upshift_speeds.append(v_up)

        for i, ratio in enumerate(ratios[1:], 1):
            # Speed at which to downshift from gear i to i-1
            v_down = omega_down * wheel_radius / (ratio * final_drive)
            downshift_speeds.append(v_down)

        return cls(upshift_speeds, downshift_speeds)


class ConventionalDieselController(DrivetrainController):
    """Controller for conventional diesel drivetrain.

    Controls:
    - Engine torque based on speed error (proportional control)
    - Gear selection based on speed schedule

    Works with drivetrains that have:
    - One engine component
    - One multi-speed gearbox
    """

    def __init__(
        self,
        drivetrain: Drivetrain,
        engine_name: str = "engine",
        gearbox_name: str = "gearbox",
        Kp: float = 50000.0,
        shift_schedule: Optional[GearShiftSchedule] = None,
    ):
        """Initialize the controller.

        Args:
            drivetrain: Drivetrain to control
            engine_name: Name of the engine component
            gearbox_name: Name of the gearbox component
            Kp: Proportional gain for speed control [N·m/(m/s)]
            shift_schedule: Gear shift schedule (created from gearbox if None)
        """
        super().__init__(drivetrain)
        self.engine_name = engine_name
        self.gearbox_name = gearbox_name
        self.Kp = Kp

        # Get component references
        self._engine = drivetrain.get_component(engine_name)
        self._gearbox = drivetrain.get_component(gearbox_name)

        # Create shift schedule if not provided
        if shift_schedule is None:
            self._create_default_schedule()
        else:
            self.shift_schedule = shift_schedule

        self._current_gear = 0

    def _create_default_schedule(self) -> None:
        """Create default shift schedule from gearbox parameters."""
        ratios = self._gearbox.params.ratios

        # Find vehicle component for wheel radius
        wheel_radius = 1.78  # Default
        final_drive = 16.0  # Default

        for comp in self.drivetrain.topology.components.values():
            if hasattr(comp, "r_wheel"):
                wheel_radius = comp.r_wheel
            if "final" in comp.name.lower() and hasattr(comp, "current_ratio"):
                final_drive = comp.current_ratio

        self.shift_schedule = GearShiftSchedule.from_ratios(
            ratios,
            engine_rpm_upshift=1500.0,
            engine_rpm_downshift=1000.0,
            wheel_radius=wheel_radius,
            final_drive=final_drive,
        )

    def compute(self, state: Dict[str, float], grade: float) -> Dict[str, float]:
        """Compute engine torque and gear selection.

        Args:
            state: Current state
            grade: Road grade [fraction]

        Returns:
            {T_engine: torque, gear_gearbox: gear}
        """
        # Get current velocity
        velocity = self.get_velocity(state)

        # Get target velocity
        v_target = self._target_velocity if self._target_velocity is not None else 10.0

        # Gear selection
        gear = self._select_gear(velocity, grade)
        self._current_gear = gear

        # Engine torque (proportional speed control)
        v_error = v_target - velocity
        T_demand = self.Kp * v_error

        # Get engine speed and clip torque
        T_engine = self._compute_engine_torque(state, T_demand)

        return {
            f"T_{self.engine_name}": T_engine,
            f"gear_{self.gearbox_name}": gear,
        }

    def _select_gear(self, velocity: float, grade: float) -> int:
        """Select gear based on speed and grade.

        Args:
            velocity: Current velocity [m/s]
            grade: Road grade

        Returns:
            Gear index (0-based)
        """
        gear = self._current_gear
        n_gears = self._gearbox.n_gears

        # Consider grade in shift decisions
        grade_factor = 1.0 - grade * 5.0  # Lower shift points on grades

        # Check for upshift
        if gear < n_gears - 1:
            upshift_speed = self.shift_schedule.upshift_speeds[gear] * grade_factor
            if velocity > upshift_speed + self.shift_schedule.hysteresis:
                gear = gear + 1

        # Check for downshift
        if gear > 0:
            downshift_speed = self.shift_schedule.downshift_speeds[gear - 1] * grade_factor
            if velocity < downshift_speed - self.shift_schedule.hysteresis:
                gear = gear - 1

        return gear

    def _compute_engine_torque(self, state: Dict[str, float], T_demand: float) -> float:
        """Compute actual engine torque after clipping.

        Args:
            state: Current state
            T_demand: Demanded torque

        Returns:
            Actual torque [N·m]
        """
        # Get engine speed from state
        engine_speed_key = f"{self.engine_name}.shaft"
        omega_e = 0.0

        # Look for engine speed in state (may need to compute from vehicle speed)
        for key, value in state.items():
            if engine_speed_key in key or self.engine_name in key:
                omega_e = abs(value)
                break

        # If not found, estimate from vehicle speed
        if omega_e < 1.0:
            velocity = self.get_velocity(state)
            # Back-calculate engine speed through gearbox and final drive
            gear_ratio = self._gearbox.get_ratio(self._current_gear)
            final_drive = 16.0  # Default
            wheel_radius = 1.78
            omega_wheel = velocity / wheel_radius
            omega_e = omega_wheel * gear_ratio * final_drive

        # Convert to RPM and clip
        rpm = omega_e * 30.0 / np.pi
        T_clipped = self._engine.clip_torque(rpm, max(0.0, T_demand))

        return T_clipped

    def reset(self) -> None:
        """Reset controller state."""
        self._current_gear = 0
