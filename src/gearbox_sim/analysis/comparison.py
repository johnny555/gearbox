"""Drivetrain comparison tools."""

from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Union

import numpy as np

from ..core.drivetrain import Drivetrain
from ..simulation.config import SimulationConfig
from ..simulation.result import SimulationResult
from ..simulation.simulator import simulate


@dataclass
class ComparisonResult:
    """Results from comparing multiple drivetrain configurations.

    Attributes:
        names: Names of configurations compared
        results: SimulationResult for each configuration
        metrics: Computed metrics for each configuration
    """

    names: List[str]
    results: Dict[str, SimulationResult]
    metrics: Dict[str, Dict[str, float]]

    def get_metric(self, metric_name: str) -> Dict[str, float]:
        """Get a specific metric for all configurations.

        Args:
            metric_name: Name of the metric

        Returns:
            Dict mapping config name to metric value
        """
        return {name: self.metrics[name].get(metric_name, float("nan")) for name in self.names}

    def get_best(self, metric_name: str, lower_is_better: bool = True) -> str:
        """Get the configuration with the best metric value.

        Args:
            metric_name: Name of the metric
            lower_is_better: If True, lowest value wins

        Returns:
            Name of the best configuration
        """
        values = self.get_metric(metric_name)
        if lower_is_better:
            return min(values, key=values.get)
        else:
            return max(values, key=values.get)

    def summary(self) -> str:
        """Generate a comparison summary."""
        lines = ["Drivetrain Comparison Results", "=" * 40]

        # Find all metrics
        all_metrics = set()
        for metrics in self.metrics.values():
            all_metrics.update(metrics.keys())

        # Table header
        header = ["Metric"] + self.names
        col_widths = [max(20, len(h)) for h in header]

        lines.append("  ".join(h.ljust(w) for h, w in zip(header, col_widths)))
        lines.append("-" * sum(col_widths))

        # Rows
        for metric in sorted(all_metrics):
            row = [metric]
            for name in self.names:
                value = self.metrics[name].get(metric, float("nan"))
                if isinstance(value, float):
                    row.append(f"{value:.4g}")
                else:
                    row.append(str(value))
            lines.append("  ".join(r.ljust(w) for r, w in zip(row, col_widths)))

        return "\n".join(lines)

    def __repr__(self) -> str:
        return f"ComparisonResult(configs={self.names})"


def compare_drivetrains(
    configurations: Dict[str, tuple],
    duty_cycle: Callable[[float], tuple],
    config: SimulationConfig = None,
    metrics: Optional[List[str]] = None,
) -> ComparisonResult:
    """Compare multiple drivetrain configurations on the same duty cycle.

    Args:
        configurations: Dict mapping name to (drivetrain, controller, initial_state)
        duty_cycle: Function (t) -> (target_velocity, grade)
        config: Simulation configuration
        metrics: List of metrics to compute (default: all)

    Returns:
        ComparisonResult with simulation results and metrics
    """
    config = config or SimulationConfig()

    if metrics is None:
        metrics = [
            "fuel_total",
            "energy_consumed",
            "final_velocity",
            "max_velocity",
            "final_soc",
            "avg_power",
        ]

    names = list(configurations.keys())
    results = {}
    computed_metrics = {}

    for name, (drivetrain, controller, x0) in configurations.items():
        # Create grade and velocity profiles from duty cycle
        def grade_profile(t):
            _, grade = duty_cycle(t)
            return grade

        # Set controller target from duty cycle
        def control_wrapper(t, state, grade):
            target_v, _ = duty_cycle(t)
            if hasattr(controller, "target_velocity"):
                controller.target_velocity = target_v
            return controller.compute(state, grade)

        # Run simulation
        result = simulate(
            drivetrain,
            x0,
            control_wrapper,
            grade_profile,
            config,
        )
        results[name] = result

        # Compute metrics
        computed_metrics[name] = _compute_metrics(result, metrics)

    return ComparisonResult(names, results, computed_metrics)


def _compute_metrics(result: SimulationResult, metric_names: List[str]) -> Dict[str, float]:
    """Compute metrics for a simulation result."""
    metrics = {}

    for name in metric_names:
        if name == "fuel_total":
            metrics[name] = result.fuel_total or 0.0

        elif name == "energy_consumed":
            # Total energy = integral of power
            if "P_engine" in result.outputs:
                power = result.outputs["P_engine"]
                metrics[name] = float(np.trapezoid(power, result.time))
            else:
                metrics[name] = 0.0

        elif name == "final_velocity":
            if result.velocity is not None:
                metrics[name] = float(result.velocity[-1])
            else:
                metrics[name] = 0.0

        elif name == "max_velocity":
            if result.velocity is not None:
                metrics[name] = float(np.max(result.velocity))
            else:
                metrics[name] = 0.0

        elif name == "final_soc":
            if result.soc is not None:
                metrics[name] = float(result.soc[-1])
            else:
                metrics[name] = float("nan")

        elif name == "avg_power":
            if "P_engine" in result.outputs:
                metrics[name] = float(np.mean(result.outputs["P_engine"]))
            else:
                metrics[name] = 0.0

        elif name == "efficiency":
            # Output energy / input energy
            if result.velocity is not None and "P_engine" in result.outputs:
                # Kinetic energy change
                v = result.velocity
                m = 349350  # Approximate mass
                dKE = 0.5 * m * (v[-1] ** 2 - v[0] ** 2)

                # Energy input
                E_in = float(np.trapezoid(result.outputs["P_engine"], result.time))

                if E_in > 0:
                    metrics[name] = dKE / E_in
                else:
                    metrics[name] = 0.0
            else:
                metrics[name] = 0.0

    return metrics


def create_haul_cycle(
    load_duration: float = 300.0,
    return_duration: float = 200.0,
    load_grade: float = 0.10,
    return_grade: float = -0.08,
    load_speed: float = 8.0,
    return_speed: float = 12.0,
) -> Callable[[float], tuple]:
    """Create a typical haul cycle duty profile.

    The cycle consists of:
    1. Loaded climb (uphill at grade, slower speed)
    2. Unloaded return (downhill, faster speed)

    Args:
        load_duration: Duration of loaded haul [s]
        return_duration: Duration of return [s]
        load_grade: Grade during loaded haul (positive = uphill)
        return_grade: Grade during return (negative = downhill)
        load_speed: Target speed during loaded haul [m/s]
        return_speed: Target speed during return [m/s]

    Returns:
        Function (t) -> (target_velocity, grade)
    """
    total = load_duration + return_duration

    def duty_cycle(t: float) -> tuple:
        # Wrap time to cycle
        t = t % total

        if t < load_duration:
            # Loaded climb
            return (load_speed, load_grade)
        else:
            # Unloaded return
            return (return_speed, return_grade)

    return duty_cycle


def create_grade_climb_profile(
    target_velocity: float = 10.0,
    initial_flat: float = 10.0,
    grade: float = 0.10,
) -> Callable[[float], tuple]:
    """Create a grade climb profile.

    Starts flat, then climbs a constant grade.

    Args:
        target_velocity: Target velocity [m/s]
        initial_flat: Duration of flat section [s]
        grade: Grade to climb [fraction]

    Returns:
        Function (t) -> (target_velocity, grade)
    """

    def duty_cycle(t: float) -> tuple:
        if t < initial_flat:
            return (target_velocity, 0.0)
        else:
            return (target_velocity, grade)

    return duty_cycle
