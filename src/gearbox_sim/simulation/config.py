"""Simulation configuration."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SimulationConfig:
    """Configuration for drivetrain simulation.

    Attributes:
        t_start: Start time [s]
        t_end: End time [s]
        dt_output: Output time step [s]
        method: ODE solver method. Use "BDF" or "Radau" for stiff problems
                (coupled powertrains), "RK45" for non-stiff problems.
        rtol: Relative tolerance for ODE solver
        atol: Absolute tolerance for ODE solver
        max_step: Maximum step size for ODE solver [s]
    """

    t_start: float = 0.0
    t_end: float = 60.0
    dt_output: float = 0.1
    method: str = "BDF"  # Use stiff solver for coupled drivetrain systems
    rtol: float = 1e-6
    atol: float = 1e-8
    max_step: Optional[float] = 0.1  # Limit step size for stability

    def __post_init__(self):
        if self.t_end <= self.t_start:
            raise ValueError("t_end must be greater than t_start")
        if self.dt_output <= 0:
            raise ValueError("dt_output must be positive")

    @property
    def n_output_points(self) -> int:
        """Number of output time points."""
        return int((self.t_end - self.t_start) / self.dt_output) + 1

    def get_output_times(self):
        """Get array of output time points."""
        import numpy as np
        return np.linspace(self.t_start, self.t_end, self.n_output_points)


# Pre-configured simulation profiles
SHORT_SIM = SimulationConfig(t_end=10.0, dt_output=0.05)
MEDIUM_SIM = SimulationConfig(t_end=60.0, dt_output=0.1)
LONG_SIM = SimulationConfig(t_end=300.0, dt_output=0.5)
HIGH_FIDELITY = SimulationConfig(t_end=60.0, dt_output=0.01, rtol=1e-8, atol=1e-11)

# For very stiff problems or when BDF struggles
RADAU_CONFIG = SimulationConfig(method="Radau", rtol=1e-5, atol=1e-7, max_step=0.05)

# Explicit solver for non-stiff problems (faster but less stable)
EXPLICIT_CONFIG = SimulationConfig(method="RK45", max_step=0.01, atol=1e-9)
