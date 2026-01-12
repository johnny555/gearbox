"""Conventional diesel 793D drivetrain configuration.

Topology:
    Engine -> 7-Speed Gearbox -> Final Drive -> Vehicle

This represents a traditional diesel-mechanical powertrain with:
- CAT 3516E diesel engine (1,801 kW)
- 7-speed automatic transmission
- Fixed final drive (16:1)
- No electric motors or battery
"""

from ..core.topology import DrivetrainTopology
from ..core.drivetrain import Drivetrain
from ..components.engine import EngineComponent, CAT_3516E_PARAMS
from ..components.gearbox import NSpeedGearboxComponent, GearboxParams, FinalDriveComponent
from ..components.vehicle import VehicleComponent, CAT_793D_PARAMS


# Typical CAT 793D 7-speed transmission ratios
DIESEL_793D_GEARBOX_PARAMS = GearboxParams(
    ratios=[4.59, 2.95, 1.94, 1.40, 1.00, 0.74, 0.65],
    efficiencies=[0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97],
    J_input=8.0,
    J_output=8.0,
)


def create_conventional_diesel_793d(
    payload_fraction: float = 1.0,
    rolling_resistance: float = 0.025,
) -> Drivetrain:
    """Create a conventional diesel CAT 793D drivetrain.

    Topology:
        Engine -> Gearbox (7-speed) -> Final Drive -> Vehicle

    Args:
        payload_fraction: Fraction of full payload [0-1]
        rolling_resistance: Rolling resistance coefficient

    Returns:
        Compiled Drivetrain ready for simulation
    """
    # Create components
    engine = EngineComponent(CAT_3516E_PARAMS, name="engine")

    gearbox = NSpeedGearboxComponent(DIESEL_793D_GEARBOX_PARAMS, name="gearbox")

    final_drive = FinalDriveComponent(ratio=16.0, efficiency=0.96, name="final_drive")

    vehicle_params = CAT_793D_PARAMS
    vehicle_params.C_r = rolling_resistance
    vehicle = VehicleComponent(vehicle_params, payload_fraction, name="vehicle")

    # Build topology
    topology = (
        DrivetrainTopology()
        .add_component("engine", engine)
        .add_component("gearbox", gearbox)
        .add_component("final_drive", final_drive)
        .add_component("vehicle", vehicle)
        .connect("engine", "shaft", "gearbox", "input")
        .connect("gearbox", "output", "final_drive", "input")
        .connect("final_drive", "output", "vehicle", "wheels")
        .set_output("vehicle", "wheels")
    )

    return topology.build()


def get_initial_state(engine_rpm: float = 800.0) -> dict:
    """Get initial state for conventional diesel simulation.

    Args:
        engine_rpm: Initial engine RPM

    Returns:
        Initial state dict
    """
    import numpy as np

    omega_e = engine_rpm * np.pi / 30.0

    return {
        "engine.shaft": omega_e,
    }
