"""Automatic gear shift controller based on vehicle speed and load.

This module provides:
- GearShiftSchedule: Defines when to shift gears
- GearShiftController: Controls gear selection for one or more gearboxes
- MultiGearboxController: Coordinates multiple gearboxes in a drivetrain
"""

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from enum import Enum


class SpeedSource(Enum):
    """Source of speed for shift decisions."""
    VEHICLE = "vehicle"
    OUTPUT_SHAFT = "output_shaft"
    INPUT_SHAFT = "input_shaft"


class SpeedUnit(Enum):
    """Unit for speed thresholds."""
    M_S = "m/s"
    KM_H = "km/h"
    MPH = "mph"
    RAD_S = "rad/s"


@dataclass
class LoadBasedHold:
    """Configuration for load-based gear hold."""
    enabled: bool = False
    load_threshold: float = 0.8  # Throttle/load fraction to prevent upshift
    speed_threshold: float = 15.0  # Speed below which load-hold is active


@dataclass
class GearShiftSchedule:
    """Defines when to shift gears based on speed thresholds.

    Attributes:
        gearbox_id: Reference to gearbox this schedule controls
        n_gears: Number of gears in the gearbox
        upshift_speeds: Speed thresholds to upshift (n-1 values)
        downshift_speeds: Speed thresholds to downshift (n-1 values)
        speed_source: What speed to use for shift decisions
        speed_unit: Unit for speed thresholds
        min_gear: Minimum allowed gear index
        max_gear: Maximum allowed gear index
        shift_delay: Minimum time between shifts [s]
        load_based_hold: Configuration for load-based gear hold
    """
    gearbox_id: str
    n_gears: int
    upshift_speeds: List[float]
    downshift_speeds: List[float]
    speed_source: SpeedSource = SpeedSource.VEHICLE
    speed_unit: SpeedUnit = SpeedUnit.M_S
    min_gear: int = 0
    max_gear: Optional[int] = None
    shift_delay: float = 0.5
    load_based_hold: LoadBasedHold = field(default_factory=LoadBasedHold)

    def __post_init__(self):
        if self.max_gear is None:
            self.max_gear = self.n_gears - 1

        # Validate arrays have correct length
        expected_len = self.n_gears - 1
        if len(self.upshift_speeds) != expected_len:
            raise ValueError(
                f"upshift_speeds must have {expected_len} values for {self.n_gears} gears, "
                f"got {len(self.upshift_speeds)}"
            )
        if len(self.downshift_speeds) != expected_len:
            raise ValueError(
                f"downshift_speeds must have {expected_len} values for {self.n_gears} gears, "
                f"got {len(self.downshift_speeds)}"
            )

    def convert_speed_to_m_s(self, speed: float) -> float:
        """Convert speed from schedule units to m/s."""
        if self.speed_unit == SpeedUnit.M_S:
            return speed
        elif self.speed_unit == SpeedUnit.KM_H:
            return speed / 3.6
        elif self.speed_unit == SpeedUnit.MPH:
            return speed * 0.44704
        elif self.speed_unit == SpeedUnit.RAD_S:
            return speed  # Assume wheel radius = 1 for angular velocity
        return speed

    def get_target_gear(
        self,
        current_gear: int,
        speed_m_s: float,
        load_fraction: float = 0.0,
    ) -> int:
        """Determine target gear based on current speed and load.

        Args:
            current_gear: Current gear index (0-based)
            speed_m_s: Current speed in m/s
            load_fraction: Current load/throttle fraction [0-1]

        Returns:
            Target gear index
        """
        target = current_gear

        # Convert thresholds to m/s for comparison
        upshift_m_s = [self.convert_speed_to_m_s(s) for s in self.upshift_speeds]
        downshift_m_s = [self.convert_speed_to_m_s(s) for s in self.downshift_speeds]

        # Check for upshift
        if current_gear < self.max_gear:
            threshold_idx = current_gear  # Index into threshold arrays
            if threshold_idx < len(upshift_m_s):
                upshift_threshold = upshift_m_s[threshold_idx]

                # Check load-based hold
                should_hold = False
                if self.load_based_hold.enabled:
                    load_speed_threshold = self.convert_speed_to_m_s(
                        self.load_based_hold.speed_threshold
                    )
                    if (load_fraction >= self.load_based_hold.load_threshold and
                        speed_m_s < load_speed_threshold):
                        should_hold = True

                if speed_m_s > upshift_threshold and not should_hold:
                    target = current_gear + 1

        # Check for downshift (takes priority over upshift)
        if current_gear > self.min_gear:
            threshold_idx = current_gear - 1  # Index into threshold arrays
            if threshold_idx >= 0 and threshold_idx < len(downshift_m_s):
                downshift_threshold = downshift_m_s[threshold_idx]
                if speed_m_s < downshift_threshold:
                    target = current_gear - 1

        # Clamp to allowed range
        return max(self.min_gear, min(target, self.max_gear))


class GearShiftController:
    """Controls automatic gear selection for a single gearbox.

    Handles:
    - Speed-based shift decisions
    - Load-based gear hold
    - Shift delay/lockout
    - Gear limits
    """

    def __init__(
        self,
        schedule: GearShiftSchedule,
        initial_gear: int = 0,
    ):
        """Initialize the shift controller.

        Args:
            schedule: Shift schedule configuration
            initial_gear: Starting gear
        """
        self.schedule = schedule
        self._current_gear = initial_gear
        self._last_shift_time = -float('inf')
        self._pending_shift: Optional[int] = None

    @property
    def current_gear(self) -> int:
        """Current gear index."""
        return self._current_gear

    @current_gear.setter
    def current_gear(self, value: int) -> None:
        """Set current gear (for manual override)."""
        self._current_gear = max(
            self.schedule.min_gear,
            min(value, self.schedule.max_gear)
        )

    @property
    def gearbox_id(self) -> str:
        """ID of the gearbox this controller manages."""
        return self.schedule.gearbox_id

    def update(
        self,
        time: float,
        speed_m_s: float,
        load_fraction: float = 0.0,
    ) -> Tuple[int, bool]:
        """Update gear selection based on current conditions.

        Args:
            time: Current simulation time [s]
            speed_m_s: Current speed in m/s
            load_fraction: Current load/throttle fraction [0-1]

        Returns:
            Tuple of (current_gear, shift_occurred)
        """
        # Check shift lockout
        time_since_shift = time - self._last_shift_time
        if time_since_shift < self.schedule.shift_delay:
            return self._current_gear, False

        # Get target gear from schedule
        target_gear = self.schedule.get_target_gear(
            self._current_gear, speed_m_s, load_fraction
        )

        # Check if shift needed
        if target_gear != self._current_gear:
            self._current_gear = target_gear
            self._last_shift_time = time
            return self._current_gear, True

        return self._current_gear, False

    def force_gear(self, gear: int, time: float) -> None:
        """Force a specific gear (manual override).

        Args:
            gear: Target gear index
            time: Current simulation time
        """
        self._current_gear = max(
            self.schedule.min_gear,
            min(gear, self.schedule.max_gear)
        )
        self._last_shift_time = time

    def reset(self, initial_gear: int = 0) -> None:
        """Reset controller to initial state."""
        self._current_gear = initial_gear
        self._last_shift_time = -float('inf')
        self._pending_shift = None


class MultiGearboxController:
    """Coordinates gear selection across multiple gearboxes.

    Use this when you have multiple gearboxes in series (e.g., MG1 reduction +
    main gearbox + final drive) and want coordinated shift logic.
    """

    def __init__(
        self,
        controllers: Dict[str, GearShiftController],
        wheel_radius: float = 1.0,
        final_drive_ratio: float = 1.0,
    ):
        """Initialize multi-gearbox controller.

        Args:
            controllers: Dict mapping gearbox_id to shift controller
            wheel_radius: Wheel radius for vehicle speed calculation [m]
            final_drive_ratio: Combined ratio of any fixed-ratio gearboxes
        """
        self.controllers = controllers
        self.wheel_radius = wheel_radius
        self.final_drive_ratio = final_drive_ratio

    def get_controller(self, gearbox_id: str) -> Optional[GearShiftController]:
        """Get controller for specific gearbox."""
        return self.controllers.get(gearbox_id)

    def get_all_gears(self) -> Dict[str, int]:
        """Get current gear for all gearboxes."""
        return {
            gearbox_id: ctrl.current_gear
            for gearbox_id, ctrl in self.controllers.items()
        }

    def get_total_ratio(self) -> float:
        """Calculate total gear ratio through all gearboxes."""
        total = self.final_drive_ratio
        for ctrl in self.controllers.values():
            # This would need access to the actual gearbox to get ratio
            # For now, this is a placeholder
            pass
        return total

    def update_all(
        self,
        time: float,
        speed_m_s: float,
        load_fraction: float = 0.0,
    ) -> Dict[str, Tuple[int, bool]]:
        """Update all gearbox controllers.

        Args:
            time: Current simulation time [s]
            speed_m_s: Current vehicle speed in m/s
            load_fraction: Current load/throttle fraction [0-1]

        Returns:
            Dict mapping gearbox_id to (gear, shift_occurred) tuples
        """
        results = {}
        for gearbox_id, ctrl in self.controllers.items():
            results[gearbox_id] = ctrl.update(time, speed_m_s, load_fraction)
        return results

    def wheel_speed_to_vehicle_speed(self, omega_wheel: float) -> float:
        """Convert wheel angular velocity to vehicle speed.

        Args:
            omega_wheel: Wheel angular velocity [rad/s]

        Returns:
            Vehicle speed [m/s]
        """
        return omega_wheel * self.wheel_radius

    def vehicle_speed_to_wheel_speed(self, v_vehicle: float) -> float:
        """Convert vehicle speed to wheel angular velocity.

        Args:
            v_vehicle: Vehicle speed [m/s]

        Returns:
            Wheel angular velocity [rad/s]
        """
        return v_vehicle / self.wheel_radius

    def reset_all(self, initial_gears: Optional[Dict[str, int]] = None) -> None:
        """Reset all controllers.

        Args:
            initial_gears: Optional dict of initial gears per gearbox
        """
        initial_gears = initial_gears or {}
        for gearbox_id, ctrl in self.controllers.items():
            ctrl.reset(initial_gears.get(gearbox_id, 0))
