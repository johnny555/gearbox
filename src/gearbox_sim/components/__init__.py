"""Drivetrain component implementations."""

from .engine import EngineComponent, EngineParams, CAT_3516E_PARAMS
from .motor import MotorComponent, MotorParams, MG1_PARAMS, MG2_PARAMS, create_mg1, create_mg2
from .gearbox import (
    NSpeedGearboxComponent,
    GearboxParams,
    FinalDriveComponent,
    FixedRatioGearComponent,
    ECVT_GEARBOX_PARAMS,
    DIESEL_7SPEED_PARAMS,
    SINGLE_SPEED_PARAMS,
)
from .planetary import PlanetaryGearComponent, PlanetaryGearParams, CAT_793D_PLANETARY_PARAMS
from .battery import (
    BatteryComponent,
    BatteryParams,
    CAT_793D_BATTERY_PARAMS,
    SERIES_HYBRID_BATTERY_PARAMS,
    EV_BATTERY_PARAMS,
)
from .vehicle import (
    VehicleComponent,
    VehicleParams,
    CAT_793D_PARAMS,
    CAT_793D_GOOD_ROAD,
    CAT_793D_POOR_ROAD,
    create_empty_793d,
    create_loaded_793d,
)

__all__ = [
    # Engine
    "EngineComponent",
    "EngineParams",
    "CAT_3516E_PARAMS",
    # Motor
    "MotorComponent",
    "MotorParams",
    "MG1_PARAMS",
    "MG2_PARAMS",
    "create_mg1",
    "create_mg2",
    # Gearbox
    "NSpeedGearboxComponent",
    "GearboxParams",
    "FinalDriveComponent",
    "FixedRatioGearComponent",
    "ECVT_GEARBOX_PARAMS",
    "DIESEL_7SPEED_PARAMS",
    "SINGLE_SPEED_PARAMS",
    # Planetary
    "PlanetaryGearComponent",
    "PlanetaryGearParams",
    "CAT_793D_PLANETARY_PARAMS",
    # Battery
    "BatteryComponent",
    "BatteryParams",
    "CAT_793D_BATTERY_PARAMS",
    "SERIES_HYBRID_BATTERY_PARAMS",
    "EV_BATTERY_PARAMS",
    # Vehicle
    "VehicleComponent",
    "VehicleParams",
    "CAT_793D_PARAMS",
    "CAT_793D_GOOD_ROAD",
    "CAT_793D_POOR_ROAD",
    "create_empty_793d",
    "create_loaded_793d",
]
