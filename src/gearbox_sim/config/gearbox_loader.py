"""Load gearbox configurations from shared JSON config files.

This module provides functions to load gearbox and shift schedule configurations
from the shared JSON format that's compatible with both Python and TypeScript.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..components.gearbox import (
    NSpeedGearboxComponent,
    GearboxParams,
    FinalDriveComponent,
    FixedRatioGearComponent,
)
from ..control.shift_controller import (
    GearShiftSchedule,
    GearShiftController,
    MultiGearboxController,
    SpeedSource,
    SpeedUnit,
    LoadBasedHold,
)


def get_default_config_path() -> Path:
    """Get path to the default shared config file."""
    # Navigate from this file to shared/gearbox-config.json
    this_file = Path(__file__)
    repo_root = this_file.parent.parent.parent.parent
    return repo_root / "shared" / "gearbox-config.json"


def load_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
    """Load gearbox configuration from JSON file.

    Args:
        config_path: Path to config file. If None, uses default shared config.

    Returns:
        Parsed configuration dict
    """
    if config_path is None:
        config_path = get_default_config_path()

    with open(config_path, "r") as f:
        return json.load(f)


def create_gearbox_params(gearbox_config: Dict[str, Any]) -> GearboxParams:
    """Create GearboxParams from config dict.

    Args:
        gearbox_config: Gearbox configuration from JSON

    Returns:
        GearboxParams instance
    """
    ratios = gearbox_config["ratios"]
    efficiencies = gearbox_config.get("efficiencies", [0.97] * len(ratios))

    return GearboxParams(
        ratios=ratios,
        efficiencies=efficiencies,
        J_input=gearbox_config.get("j_input", 5.0),
        J_output=gearbox_config.get("j_output", 5.0),
        shift_time=gearbox_config.get("shift_time", 0.5),
    )


def create_gearbox(
    gearbox_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> NSpeedGearboxComponent:
    """Create a gearbox component from config.

    Args:
        gearbox_id: ID of gearbox in config file
        config: Pre-loaded config dict (optional)
        config_path: Path to config file (optional)

    Returns:
        NSpeedGearboxComponent instance
    """
    if config is None:
        config = load_config(config_path)

    gearbox_config = config["gearboxes"][gearbox_id]
    params = create_gearbox_params(gearbox_config)

    return NSpeedGearboxComponent(params, name=gearbox_id)


def create_shift_schedule(
    schedule_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> GearShiftSchedule:
    """Create a GearShiftSchedule from config.

    Args:
        schedule_id: ID of shift schedule in config file
        config: Pre-loaded config dict (optional)
        config_path: Path to config file (optional)

    Returns:
        GearShiftSchedule instance
    """
    if config is None:
        config = load_config(config_path)

    schedule_config = config["shift_schedules"][schedule_id]
    gearbox_id = schedule_config["gearbox_id"]
    gearbox_config = config["gearboxes"][gearbox_id]
    n_gears = len(gearbox_config["ratios"])

    # Parse speed source
    speed_source_str = schedule_config.get("speed_source", "vehicle")
    speed_source = SpeedSource(speed_source_str)

    # Parse speed unit
    speed_unit_str = schedule_config.get("speed_unit", "m/s")
    speed_unit = SpeedUnit(speed_unit_str)

    # Parse load-based hold
    load_hold_config = schedule_config.get("load_based_hold", {})
    load_based_hold = LoadBasedHold(
        enabled=load_hold_config.get("enabled", False),
        load_threshold=load_hold_config.get("load_threshold", 0.8),
        speed_threshold=load_hold_config.get("speed_threshold", 15.0),
    )

    return GearShiftSchedule(
        gearbox_id=gearbox_id,
        n_gears=n_gears,
        upshift_speeds=schedule_config["upshift_speeds"],
        downshift_speeds=schedule_config["downshift_speeds"],
        speed_source=speed_source,
        speed_unit=speed_unit,
        min_gear=schedule_config.get("min_gear", 0),
        max_gear=schedule_config.get("max_gear"),
        shift_delay=schedule_config.get("shift_delay", 0.5),
        load_based_hold=load_based_hold,
    )


def create_shift_controller(
    schedule_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
    initial_gear: int = 0,
) -> GearShiftController:
    """Create a GearShiftController from config.

    Args:
        schedule_id: ID of shift schedule in config file
        config: Pre-loaded config dict (optional)
        config_path: Path to config file (optional)
        initial_gear: Starting gear

    Returns:
        GearShiftController instance
    """
    if config is None:
        config = load_config(config_path)

    schedule = create_shift_schedule(schedule_id, config)
    return GearShiftController(schedule, initial_gear)


def create_drivetrain_gearboxes(
    drivetrain_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> Tuple[List[NSpeedGearboxComponent], MultiGearboxController]:
    """Create all gearboxes and controllers for a drivetrain configuration.

    Args:
        drivetrain_id: ID of drivetrain config in config file
        config: Pre-loaded config dict (optional)
        config_path: Path to config file (optional)

    Returns:
        Tuple of:
        - List of gearbox components in chain order
        - MultiGearboxController for shift management
    """
    if config is None:
        config = load_config(config_path)

    dt_config = config["drivetrain_configs"][drivetrain_id]
    gearbox_chain = dt_config.get("gearbox_chain", [])

    gearboxes: List[NSpeedGearboxComponent] = []
    controllers: Dict[str, GearShiftController] = {}

    for item in gearbox_chain:
        gearbox_id = item["gearbox_id"]
        gearbox = create_gearbox(gearbox_id, config)
        gearboxes.append(gearbox)

        # Create controller if shift schedule is specified
        schedule_id = item.get("shift_schedule_id")
        if schedule_id:
            controller = create_shift_controller(schedule_id, config)
            controllers[gearbox_id] = controller

    wheel_radius = dt_config.get("wheel_radius", 1.0)
    final_drive_ratio = dt_config.get("final_drive_ratio", 1.0)

    multi_controller = MultiGearboxController(
        controllers=controllers,
        wheel_radius=wheel_radius,
        final_drive_ratio=final_drive_ratio,
    )

    return gearboxes, multi_controller


def list_available_gearboxes(
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> List[str]:
    """List all available gearbox IDs in config."""
    if config is None:
        config = load_config(config_path)
    return list(config.get("gearboxes", {}).keys())


def list_available_schedules(
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> List[str]:
    """List all available shift schedule IDs in config."""
    if config is None:
        config = load_config(config_path)
    return list(config.get("shift_schedules", {}).keys())


def list_available_drivetrains(
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> List[str]:
    """List all available drivetrain configuration IDs in config."""
    if config is None:
        config = load_config(config_path)
    return list(config.get("drivetrain_configs", {}).keys())


def get_gearbox_info(
    gearbox_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Get detailed information about a gearbox configuration."""
    if config is None:
        config = load_config(config_path)

    gb = config["gearboxes"][gearbox_id]
    ratios = gb["ratios"]

    return {
        "id": gearbox_id,
        "name": gb.get("name", gearbox_id),
        "n_gears": len(ratios),
        "ratios": ratios,
        "gear_names": gb.get("gear_names", [f"Gear {i}" for i in range(len(ratios))]),
        "efficiencies": gb.get("efficiencies", [0.97] * len(ratios)),
        "j_input": gb.get("j_input", 5.0),
        "j_output": gb.get("j_output", 5.0),
    }


def get_schedule_info(
    schedule_id: str,
    config: Optional[Dict[str, Any]] = None,
    config_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Get detailed information about a shift schedule."""
    if config is None:
        config = load_config(config_path)

    sched = config["shift_schedules"][schedule_id]
    gearbox_id = sched["gearbox_id"]
    gb = config["gearboxes"][gearbox_id]

    return {
        "id": schedule_id,
        "gearbox_id": gearbox_id,
        "gearbox_name": gb.get("name", gearbox_id),
        "n_gears": len(gb["ratios"]),
        "speed_unit": sched.get("speed_unit", "m/s"),
        "upshift_speeds": sched["upshift_speeds"],
        "downshift_speeds": sched["downshift_speeds"],
        "shift_delay": sched.get("shift_delay", 0.5),
        "load_based_hold": sched.get("load_based_hold", {"enabled": False}),
    }
