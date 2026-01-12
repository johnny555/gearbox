"""E-CVT + 2-Speed Gearbox Simulation for CAT 793D Mining Haul Truck."""

from .powertrain import Powertrain
from .simulate import simulate

__version__ = "0.1.0"
__all__ = ["Powertrain", "simulate"]
