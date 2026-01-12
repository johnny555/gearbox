"""
Composable Drivetrain Simulator

A general-purpose drivetrain simulator supporting arbitrary topologies:
- Conventional diesel (engine → gearbox → wheels)
- eCVT hybrid (power-split with planetary gear)
- Series hybrid (engine → generator → battery → motor → wheels)
- Parallel hybrid (engine + motor → gearbox → wheels)
- Pure EV (battery → motor → gearbox → wheels)
"""

from .core.component import DrivetrainComponent
from .core.topology import DrivetrainTopology
from .core.drivetrain import Drivetrain
from .core.ports import Port, PortType, Connection
from .core.constraints import (
    KinematicConstraint,
    GearRatioConstraint,
    WillisConstraint,
    RigidConnectionConstraint,
)

__all__ = [
    "DrivetrainComponent",
    "DrivetrainTopology",
    "Drivetrain",
    "Port",
    "PortType",
    "Connection",
    "KinematicConstraint",
    "GearRatioConstraint",
    "WillisConstraint",
    "RigidConnectionConstraint",
]
