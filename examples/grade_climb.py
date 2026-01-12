#!/usr/bin/env python3
"""Grade climb simulation example.

Test Case 1 from state_space_model.md:
- 10% grade at 10 km/h
- Fully loaded CAT 793D (383,756 kg)
- Expected power demand: ~1,300 kW
"""

import sys
from pathlib import Path

# Add src to path for development
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt

from ecvt_sim.powertrain import Powertrain, PowertrainState, create_cat_793d_powertrain
from ecvt_sim.controller import Controller
from ecvt_sim.simulate import simulate, simulate_steady_state, SimulationConfig
from ecvt_sim.components.gearbox import Gear


def main():
    print("=" * 60)
    print("CAT 793D E-CVT Simulation: Grade Climb with Run-up")
    print("=" * 60)

    # Create powertrain - FULLY LOADED
    pt = create_cat_793d_powertrain(payload_fraction=1.0)

    # Use good haul road surface (lower rolling resistance)
    pt.vehicle.params.C_r = 0.015  # Good maintained haul road (was 0.025)

    print(f"\nVehicle mass (loaded): {pt.vehicle.mass:,.0f} kg")
    print(f"Rolling resistance: {pt.vehicle.params.C_r}")
    print(f"Planetary ratio (ρ): {pt.planetary.rho:.1f}")

    # Target conditions
    v_target = 15.0 / 3.6  # 15 km/h in m/s (higher for empty truck)
    grade_final = 0.10  # 10% final grade

    print(f"\nTarget speed: {v_target * 3.6:.1f} km/h")
    print(f"Final grade: {grade_final * 100:.0f}%")
    print(f"Run-up: 10s flat, then ramp to {grade_final*100:.0f}% over 15s")

    # Calculate steady-state operating point (flat ground test)
    print("\n--- Steady-State Analysis (flat ground) ---")
    ss = simulate_steady_state(pt, v_target, 0.0, gear=Gear.LOW)

    print(f"\nEngine: {ss.omega_e * 30 / np.pi:.0f} rpm")
    print(f"Ring gear: {ss.omega_r * 30 / np.pi:.0f} rpm")
    print(f"MG1: {ss.omega_MG1 * 30 / np.pi:.0f} rpm")
    print(f"Vehicle speed: {ss.velocity * 3.6:.1f} km/h")

    print(f"\nPower demand at wheels: {ss.T_wheel * ss.velocity / 1e6:.2f} MW")
    print(f"Load torque at ring: {ss.T_load:,.0f} N·m")

    print(f"\nEngine power: {ss.P_engine / 1e6:.2f} MW")
    print(f"MG1 power: {ss.P_MG1 / 1e3:.0f} kW (electrical)")
    print(f"MG2 power: {ss.P_MG2 / 1e3:.0f} kW (electrical)")
    print(f"Battery power: {ss.P_battery / 1e3:.0f} kW")

    # Run dynamic simulation
    print("\n--- Dynamic Simulation ---")

    # Initial state: stationary with engine at idle
    x0 = PowertrainState(
        omega_e=800 * np.pi / 30,  # 800 rpm
        omega_r=0.0,
        soc=0.6,
    )

    # Create controller
    controller = Controller(pt)

    # Grade profile: flat run-up, then gradual ramp to 10%
    def grade_profile(t):
        if t < 10:
            return 0.0  # Flat for first 10 seconds (run-up)
        elif t < 25:
            return 0.10 * (t - 10) / 15  # Ramp to 10% over 15 seconds
        return 0.10  # Constant 10%

    # Simulation config
    config = SimulationConfig(
        t_start=0.0,
        t_end=60.0,  # 60 seconds for grade climb
        dt_output=0.1,
    )

    print(f"Simulating {config.t_end} seconds...")
    result = simulate(
        pt,
        x0,
        controller=controller,
        grade_profile=grade_profile,
        config=config,
        v_target=v_target,
    )
    print("Done!")

    # Print final values
    print(f"\nFinal state at t={result.t[-1]:.1f}s:")
    print(f"  Speed: {result.velocity[-1] * 3.6:.1f} km/h")
    print(f"  Engine: {result.rpm_e[-1]:.0f} rpm")
    print(f"  MG1: {result.rpm_MG1[-1]:.0f} rpm")
    print(f"  SOC: {result.soc[-1]:.3f}")
    print(f"  Gear: {result.gear[-1]}")

    # Plot results
    fig, axes = plt.subplots(3, 2, figsize=(12, 10))

    # Speed
    ax = axes[0, 0]
    ax.plot(result.t, result.velocity * 3.6, "b-", linewidth=2)
    ax.axhline(v_target * 3.6, color="r", linestyle="--", label="Target")
    ax.set_ylabel("Speed [km/h]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Vehicle Speed")
    ax.legend()
    ax.grid(True)

    # RPM
    ax = axes[0, 1]
    ax.plot(result.t, result.rpm_e, "b-", label="Engine")
    ax.plot(result.t, result.rpm_MG1, "g-", label="MG1")
    ax.plot(result.t, result.rpm_r, "r-", label="Ring/MG2")
    ax.set_ylabel("Speed [rpm]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Component Speeds")
    ax.legend()
    ax.grid(True)

    # Torques
    ax = axes[1, 0]
    ax.plot(result.t, result.T_e / 1000, "b-", label="Engine")
    ax.plot(result.t, result.T_MG1 / 1000, "g-", label="MG1")
    ax.plot(result.t, result.T_MG2 / 1000, "r-", label="MG2")
    ax.set_ylabel("Torque [kN·m]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Torque Commands")
    ax.legend()
    ax.grid(True)

    # Powers
    ax = axes[1, 1]
    ax.plot(result.t, result.P_engine / 1e6, "b-", label="Engine")
    ax.plot(result.t, result.P_MG1 / 1e3, "g-", label="MG1 [kW]")
    ax.plot(result.t, result.P_MG2 / 1e3, "r-", label="MG2 [kW]")
    ax.plot(result.t, result.P_battery / 1e3, "m--", label="Battery [kW]")
    ax.set_ylabel("Power [MW / kW]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Power Flow")
    ax.legend()
    ax.grid(True)

    # SOC
    ax = axes[2, 0]
    ax.plot(result.t, result.soc, "b-", linewidth=2)
    ax.axhline(0.3, color="r", linestyle="--", alpha=0.5, label="SOC limits")
    ax.axhline(0.8, color="r", linestyle="--", alpha=0.5)
    ax.set_ylabel("SOC [-]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Battery State of Charge")
    ax.set_ylim(0, 1)
    ax.legend()
    ax.grid(True)

    # Grade
    ax = axes[2, 1]
    ax.plot(result.t, result.grade * 100, "b-", linewidth=2)
    ax.set_ylabel("Grade [%]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Road Grade Profile")
    ax.grid(True)

    plt.tight_layout()
    plt.savefig("grade_climb_results.png", dpi=150)
    print("\nPlot saved to: grade_climb_results.png")
    plt.show()


if __name__ == "__main__":
    main()
