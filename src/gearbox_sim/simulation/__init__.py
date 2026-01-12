"""Simulation infrastructure for the composable drivetrain simulator."""

from .config import (
    SimulationConfig,
    SHORT_SIM,
    MEDIUM_SIM,
    LONG_SIM,
    HIGH_FIDELITY,
    RADAU_CONFIG,
    EXPLICIT_CONFIG,
)
from .result import SimulationResult
from .simulator import DrivetrainSimulator, simulate

__all__ = [
    "SimulationConfig",
    "SHORT_SIM",
    "MEDIUM_SIM",
    "LONG_SIM",
    "HIGH_FIDELITY",
    "RADAU_CONFIG",
    "EXPLICIT_CONFIG",
    "SimulationResult",
    "DrivetrainSimulator",
    "simulate",
]
