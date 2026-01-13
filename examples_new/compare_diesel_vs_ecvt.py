#!/usr/bin/env python3
"""Compare conventional diesel vs eCVT hybrid 789D drivetrains.

This example demonstrates how to use the composable drivetrain simulator
to compare fuel consumption between different powertrain configurations.
"""

import numpy as np
import matplotlib.pyplot as plt

# Add parent directory to path
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from gearbox_sim.configs import create_conventional_diesel_793d, create_ecvt_789d
from gearbox_sim.configs.conventional_diesel import get_initial_state as diesel_init
from gearbox_sim.configs.ecvt_hybrid import get_initial_state as ecvt_init, ECVTController
from gearbox_sim.control import ConventionalDieselController
from gearbox_sim.simulation import SimulationConfig, simulate
from gearbox_sim.analysis import compare_drivetrains, create_grade_climb_profile


def main():
    print("=" * 60)
    print("CAT 789D Drivetrain Comparison: Diesel vs eCVT Hybrid")
    print("=" * 60)
    print()

    # Create drivetrains
    print("Creating drivetrains...")
    diesel = create_conventional_diesel_793d(payload_fraction=1.0)  # TODO: create 789D diesel
    ecvt = create_ecvt_789d(payload_fraction=1.0, initial_soc=0.6)

    print(f"  Diesel: {diesel}")
    print(f"  eCVT:   {ecvt}")
    print()

    # Create controllers
    print("Creating controllers...")
    diesel_ctrl = ConventionalDieselController(diesel, engine_name="engine", gearbox_name="gearbox")
    ecvt_ctrl = ECVTController(ecvt)

    # Set target velocity
    target_v = 10.0  # m/s (~36 km/h)
    diesel_ctrl.target_velocity = target_v
    ecvt_ctrl.target_velocity = target_v

    print(f"  Target velocity: {target_v * 3.6:.1f} km/h")
    print()

    # Initial states
    diesel_x0 = diesel_init(engine_rpm=800.0)
    ecvt_x0 = ecvt_init(engine_rpm=800.0, vehicle_velocity=0.0, soc=0.6)

    # Simulation config
    config = SimulationConfig(t_start=0.0, t_end=120.0, dt_output=0.1)

    # Create duty cycle (grade climb)
    # Note: Using 5% grade as eCVT struggles on 10% grade at low speeds
    # (MG1 power-limited, can't provide full reaction torque)
    duty_cycle = create_grade_climb_profile(
        target_velocity=target_v,
        initial_flat=10.0,
        grade=0.05,  # 5% grade
    )

    print("Running comparison simulation...")
    print(f"  Duration: {config.t_end} s")
    print(f"  Grade: 5%")
    print()

    # Run comparison
    configurations = {
        "Diesel 793D": (diesel, diesel_ctrl, diesel_x0),
        "eCVT 789D": (ecvt, ecvt_ctrl, ecvt_x0),
    }

    comparison = compare_drivetrains(
        configurations,
        duty_cycle,
        config,
        metrics=["fuel_total", "energy_consumed", "max_velocity", "final_velocity", "final_soc"],
    )

    # Print results
    print("Results:")
    print("-" * 60)
    print(comparison.summary())
    print()

    # Calculate fuel savings
    diesel_fuel = comparison.metrics["Diesel 793D"]["fuel_total"]
    ecvt_fuel = comparison.metrics["eCVT 789D"]["fuel_total"]

    if diesel_fuel > 0:
        savings = (diesel_fuel - ecvt_fuel) / diesel_fuel * 100
        print(f"\nFuel savings with eCVT: {savings:.1f}%")
        print(f"  Diesel: {diesel_fuel:.2f} kg")
        print(f"  eCVT:   {ecvt_fuel:.2f} kg")
        print(f"  Saved:  {diesel_fuel - ecvt_fuel:.2f} kg")

    # Battery usage for eCVT
    ecvt_soc_init = ecvt_x0.get("battery.SOC", 0.6)
    ecvt_soc_final = comparison.metrics["eCVT 789D"]["final_soc"]
    soc_change = ecvt_soc_final - ecvt_soc_init
    print(f"\neCVT Battery usage:")
    print(f"  Initial SOC: {ecvt_soc_init * 100:.1f}%")
    print(f"  Final SOC:   {ecvt_soc_final * 100:.1f}%")
    print(f"  Change:      {soc_change * 100:+.1f}%")

    # Plot results
    plot_comparison(comparison)


def plot_comparison(comparison):
    """Plot comparison results."""
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))
    fig.suptitle("CAT 789D: Diesel vs eCVT Hybrid - 5% Grade Climb")

    colors = {"Diesel 793D": "tab:blue", "eCVT 789D": "tab:green"}

    # Velocity
    ax = axes[0, 0]
    for name, result in comparison.results.items():
        if result.velocity is not None:
            ax.plot(result.time, result.velocity * 3.6, label=name, color=colors[name])
    ax.set_xlabel("Time [s]")
    ax.set_ylabel("Velocity [km/h]")
    ax.set_title("Vehicle Velocity")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Engine Power
    ax = axes[0, 1]
    for name, result in comparison.results.items():
        P_engine = result.outputs.get("P_engine")
        if P_engine is not None:
            ax.plot(result.time, P_engine / 1000, label=name, color=colors[name])
    ax.set_xlabel("Time [s]")
    ax.set_ylabel("Engine Power [kW]")
    ax.set_title("Engine Power")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Fuel consumption (cumulative)
    ax = axes[1, 0]
    for name, result in comparison.results.items():
        fuel_rate = result.fuel_rate
        if fuel_rate is not None:
            fuel_cumulative = np.zeros_like(result.time)
            for i in range(1, len(result.time)):
                dt = result.time[i] - result.time[i-1]
                fuel_cumulative[i] = fuel_cumulative[i-1] + fuel_rate[i] * dt
            ax.plot(result.time, fuel_cumulative, label=name, color=colors[name])
    ax.set_xlabel("Time [s]")
    ax.set_ylabel("Cumulative Fuel [kg]")
    ax.set_title("Fuel Consumption")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Battery SOC (eCVT only)
    ax = axes[1, 1]
    ecvt_result = comparison.results.get("eCVT 789D")
    if ecvt_result and ecvt_result.soc is not None:
        ax.plot(ecvt_result.time, ecvt_result.soc * 100, color=colors["eCVT 789D"])
    ax.set_xlabel("Time [s]")
    ax.set_ylabel("Battery SOC [%]")
    ax.set_title("eCVT Battery State of Charge")
    ax.set_ylim(0, 100)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig("diesel_vs_ecvt_comparison.png", dpi=150)
    print("\nPlot saved to: diesel_vs_ecvt_comparison.png")
    plt.show()


if __name__ == "__main__":
    main()
