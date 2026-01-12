"""Analysis tools for drivetrain comparison."""

from .comparison import compare_drivetrains, ComparisonResult, create_grade_climb_profile, create_haul_cycle
from .metrics import compute_fuel_consumption, compute_efficiency

__all__ = [
    "compare_drivetrains",
    "ComparisonResult",
    "create_grade_climb_profile",
    "create_haul_cycle",
    "compute_fuel_consumption",
    "compute_efficiency",
]
