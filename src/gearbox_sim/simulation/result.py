"""Simulation result container."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np
from numpy.typing import NDArray


@dataclass
class SimulationResult:
    """Container for simulation results.

    All time series are numpy arrays with shape (n_time_points,).

    Attributes:
        time: Time points [s]
        states: State variables over time {name: array}
        controls: Control inputs over time {name: array}
        outputs: Derived outputs over time {name: array}
        metadata: Additional simulation metadata
    """

    time: NDArray
    states: Dict[str, NDArray] = field(default_factory=dict)
    controls: Dict[str, NDArray] = field(default_factory=dict)
    outputs: Dict[str, NDArray] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def n_points(self) -> int:
        """Number of time points."""
        return len(self.time)

    @property
    def duration(self) -> float:
        """Simulation duration [s]."""
        return self.time[-1] - self.time[0]

    @property
    def dt(self) -> float:
        """Average time step [s]."""
        return self.duration / (self.n_points - 1) if self.n_points > 1 else 0.0

    def get_state(self, name: str) -> Optional[NDArray]:
        """Get a state variable by name."""
        return self.states.get(name)

    def get_control(self, name: str) -> Optional[NDArray]:
        """Get a control input by name."""
        return self.controls.get(name)

    def get_output(self, name: str) -> Optional[NDArray]:
        """Get a derived output by name."""
        return self.outputs.get(name)

    # Convenience properties for common outputs
    @property
    def velocity(self) -> Optional[NDArray]:
        """Vehicle velocity [m/s]."""
        return self.outputs.get("velocity")

    @property
    def velocity_kmh(self) -> Optional[NDArray]:
        """Vehicle velocity [km/h]."""
        v = self.velocity
        return v * 3.6 if v is not None else None

    @property
    def soc(self) -> Optional[NDArray]:
        """Battery state of charge [0-1]."""
        # Look for SOC in states (component.SOC format)
        for name, values in self.states.items():
            if name.endswith(".SOC") or name == "SOC":
                return values
        return None

    @property
    def power_engine(self) -> Optional[NDArray]:
        """Engine power [W]."""
        return self.outputs.get("P_engine")

    @property
    def fuel_rate(self) -> Optional[NDArray]:
        """Fuel consumption rate [kg/s]."""
        return self.outputs.get("fuel_rate")

    @property
    def fuel_total(self) -> Optional[float]:
        """Total fuel consumed [kg]."""
        rate = self.fuel_rate
        if rate is not None and self.n_points > 1:
            return float(np.trapezoid(rate, self.time))
        return None

    def get_final_state(self) -> Dict[str, float]:
        """Get final values of all states."""
        return {name: float(values[-1]) for name, values in self.states.items()}

    def get_max(self, name: str) -> Optional[float]:
        """Get maximum value of a variable."""
        for source in [self.states, self.controls, self.outputs]:
            if name in source:
                return float(np.max(source[name]))
        return None

    def get_min(self, name: str) -> Optional[float]:
        """Get minimum value of a variable."""
        for source in [self.states, self.controls, self.outputs]:
            if name in source:
                return float(np.min(source[name]))
        return None

    def get_mean(self, name: str) -> Optional[float]:
        """Get mean value of a variable."""
        for source in [self.states, self.controls, self.outputs]:
            if name in source:
                return float(np.mean(source[name]))
        return None

    def slice(self, t_start: float, t_end: float) -> "SimulationResult":
        """Extract a time slice of the results.

        Args:
            t_start: Start time [s]
            t_end: End time [s]

        Returns:
            New SimulationResult with sliced data
        """
        mask = (self.time >= t_start) & (self.time <= t_end)

        return SimulationResult(
            time=self.time[mask],
            states={k: v[mask] for k, v in self.states.items()},
            controls={k: v[mask] for k, v in self.controls.items()},
            outputs={k: v[mask] for k, v in self.outputs.items()},
            metadata=self.metadata.copy(),
        )

    def resample(self, dt: float) -> "SimulationResult":
        """Resample results to a new time step.

        Args:
            dt: New time step [s]

        Returns:
            New SimulationResult with resampled data
        """
        new_time = np.arange(self.time[0], self.time[-1] + dt / 2, dt)

        def interp(arr):
            return np.interp(new_time, self.time, arr)

        return SimulationResult(
            time=new_time,
            states={k: interp(v) for k, v in self.states.items()},
            controls={k: interp(v) for k, v in self.controls.items()},
            outputs={k: interp(v) for k, v in self.outputs.items()},
            metadata=self.metadata.copy(),
        )

    def to_dataframe(self):
        """Convert to pandas DataFrame (if pandas available)."""
        try:
            import pandas as pd

            data = {"time": self.time}
            for prefix, source in [
                ("state.", self.states),
                ("control.", self.controls),
                ("output.", self.outputs),
            ]:
                for name, values in source.items():
                    data[prefix + name] = values

            return pd.DataFrame(data)
        except ImportError:
            raise ImportError("pandas is required for to_dataframe()")

    def summary(self) -> str:
        """Generate a text summary of results."""
        lines = [
            f"Simulation Results",
            f"  Duration: {self.duration:.1f} s ({self.n_points} points)",
            f"  States: {list(self.states.keys())}",
            f"  Controls: {list(self.controls.keys())}",
            f"  Outputs: {list(self.outputs.keys())}",
        ]

        if self.velocity is not None:
            v = self.velocity
            lines.append(
                f"  Velocity: {v[0]*3.6:.1f} -> {v[-1]*3.6:.1f} km/h "
                f"(max {np.max(v)*3.6:.1f} km/h)"
            )

        if self.soc is not None:
            soc = self.soc
            lines.append(f"  SOC: {soc[0]*100:.1f}% -> {soc[-1]*100:.1f}%")

        if self.fuel_total is not None:
            lines.append(f"  Fuel consumed: {self.fuel_total:.2f} kg")

        return "\n".join(lines)

    def __repr__(self) -> str:
        return f"SimulationResult(duration={self.duration:.1f}s, n_points={self.n_points})"
