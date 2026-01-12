"""Metric computation functions for drivetrain analysis."""

from typing import Dict, Optional

import numpy as np

from ..simulation.result import SimulationResult


def compute_fuel_consumption(result: SimulationResult) -> Dict[str, float]:
    """Compute fuel consumption metrics.

    Args:
        result: Simulation result

    Returns:
        Dict with fuel metrics:
            - total_kg: Total fuel consumed [kg]
            - total_liters: Total fuel consumed [L] (assuming diesel)
            - avg_rate_kg_s: Average consumption rate [kg/s]
            - per_km: Fuel per distance [L/km]
    """
    metrics = {}

    fuel_rate = result.fuel_rate
    if fuel_rate is None:
        return {"total_kg": 0.0, "total_liters": 0.0, "avg_rate_kg_s": 0.0, "per_km": 0.0}

    # Total fuel
    total_kg = float(np.trapezoid(fuel_rate, result.time))
    metrics["total_kg"] = total_kg

    # Convert to liters (diesel density ~0.85 kg/L)
    metrics["total_liters"] = total_kg / 0.85

    # Average rate
    metrics["avg_rate_kg_s"] = float(np.mean(fuel_rate))

    # Per km
    if result.velocity is not None:
        distance = float(np.trapezoid(result.velocity, result.time)) / 1000.0  # km
        if distance > 0:
            metrics["per_km"] = metrics["total_liters"] / distance
        else:
            metrics["per_km"] = 0.0
    else:
        metrics["per_km"] = 0.0

    return metrics


def compute_efficiency(result: SimulationResult) -> Dict[str, float]:
    """Compute efficiency metrics.

    Args:
        result: Simulation result

    Returns:
        Dict with efficiency metrics:
            - overall: Overall drivetrain efficiency
            - tank_to_wheel: Energy at wheels / fuel energy
            - regen_captured: Energy captured by regen braking [J]
    """
    metrics = {}

    # Get power signals
    P_engine = result.outputs.get("P_engine")
    velocity = result.velocity

    if P_engine is None or velocity is None:
        return {"overall": 0.0, "tank_to_wheel": 0.0, "regen_captured": 0.0}

    # Energy input from engine
    E_engine = float(np.trapezoid(np.maximum(P_engine, 0), result.time))

    # Kinetic energy change
    m = 349350  # Approximate loaded mass
    v_init = velocity[0]
    v_final = velocity[-1]
    dKE = 0.5 * m * (v_final**2 - v_init**2)

    # Work against road load
    grade = result.outputs.get("grade", np.zeros_like(velocity))
    F_road = compute_road_load_work(velocity, grade, m)
    W_road = float(np.trapezoid(F_road * velocity, result.time))

    # Total useful work = road work + KE change
    W_useful = W_road + max(0, dKE)

    # Overall efficiency
    if E_engine > 0:
        metrics["overall"] = W_useful / E_engine
    else:
        metrics["overall"] = 0.0

    # Tank to wheel (including fuel energy conversion)
    # Diesel: ~43 MJ/kg, engine efficiency ~40%
    fuel_total = result.fuel_total or 0.0
    E_fuel = fuel_total * 43e6  # J
    if E_fuel > 0:
        metrics["tank_to_wheel"] = W_useful / E_fuel
    else:
        metrics["tank_to_wheel"] = 0.0

    # Regen captured (for hybrids)
    regen = 0.0
    for key in result.outputs:
        if "MG" in key and "elec" in key:
            P_elec = result.outputs[key]
            # Negative electrical power = generating = regen
            regen += float(np.trapezoid(np.minimum(P_elec, 0), result.time))
    metrics["regen_captured"] = -regen  # Make positive

    return metrics


def compute_road_load_work(
    velocity: np.ndarray,
    grade: np.ndarray,
    mass: float = 349350.0,
    C_r: float = 0.025,
    C_d: float = 0.9,
    A: float = 45.0,
) -> np.ndarray:
    """Compute road load force at each time point.

    Args:
        velocity: Velocity array [m/s]
        grade: Grade array [fraction]
        mass: Vehicle mass [kg]
        C_r: Rolling resistance
        C_d: Drag coefficient
        A: Frontal area [m²]

    Returns:
        Road load force array [N]
    """
    g = 9.81
    rho_air = 1.225

    F_grade = mass * g * np.sin(np.arctan(grade))
    F_roll = mass * g * C_r * np.cos(np.arctan(grade))
    F_aero = 0.5 * rho_air * C_d * A * velocity**2

    return F_grade + F_roll + F_aero


def compute_performance_metrics(result: SimulationResult) -> Dict[str, float]:
    """Compute performance metrics.

    Args:
        result: Simulation result

    Returns:
        Dict with performance metrics
    """
    metrics = {}

    if result.velocity is None:
        return metrics

    v = result.velocity

    metrics["max_velocity_ms"] = float(np.max(v))
    metrics["max_velocity_kmh"] = float(np.max(v)) * 3.6
    metrics["avg_velocity_ms"] = float(np.mean(v))
    metrics["avg_velocity_kmh"] = float(np.mean(v)) * 3.6
    metrics["distance_m"] = float(np.trapezoid(v, result.time))
    metrics["distance_km"] = metrics["distance_m"] / 1000.0

    # Acceleration
    dt = np.diff(result.time)
    dv = np.diff(v)
    accel = dv / dt
    metrics["max_acceleration"] = float(np.max(accel))
    metrics["max_deceleration"] = float(np.min(accel))

    # Time to reach various speeds
    for target_v in [5.0, 10.0, 15.0]:  # m/s
        idx = np.where(v >= target_v)[0]
        if len(idx) > 0:
            metrics[f"time_to_{target_v}ms"] = float(result.time[idx[0]])
        else:
            metrics[f"time_to_{target_v}ms"] = float("inf")

    return metrics


def compute_battery_metrics(result: SimulationResult) -> Dict[str, float]:
    """Compute battery-related metrics for hybrid drivetrains.

    Args:
        result: Simulation result

    Returns:
        Dict with battery metrics
    """
    metrics = {}

    soc = result.soc
    if soc is None:
        return {"soc_change": 0.0, "soc_final": float("nan")}

    metrics["soc_initial"] = float(soc[0])
    metrics["soc_final"] = float(soc[-1])
    metrics["soc_change"] = float(soc[-1] - soc[0])
    metrics["soc_min"] = float(np.min(soc))
    metrics["soc_max"] = float(np.max(soc))

    # Estimate energy used from battery
    # dSOC * capacity_kwh
    capacity_kwh = 200.0  # Default CAT 793D
    metrics["battery_energy_kwh"] = -metrics["soc_change"] * capacity_kwh

    return metrics
