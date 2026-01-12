#!/usr/bin/env python3
"""Find maximum speed on flat ground for loaded truck."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt

from ecvt_sim.powertrain import create_cat_793d_powertrain, PowertrainState
from ecvt_sim.controller import Controller
from ecvt_sim.simulate import simulate, SimulationConfig


def main():
    print("=" * 60)
    print("CAT 793D E-CVT: Maximum Speed on Flat Ground")
    print("=" * 60)

    # Fully loaded truck
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015

    print(f"\nVehicle mass (loaded): {pt.vehicle.mass:,.0f} kg")
    print(f"Rolling resistance: {pt.vehicle.params.C_r}")
    print(f"Max vehicle speed spec: {pt.vehicle.params.v_max * 3.6:.1f} km/h")

    # Calculate theoretical limits
    print("\n--- Theoretical Limits ---")

    # Engine speed limits
    rpm_e_max = pt.engine.params.rpm_max
    rpm_e_min = pt.engine.params.rpm_min
    print(f"Engine: {rpm_e_min:.0f} - {rpm_e_max:.0f} rpm")

    # MG1 speed limits
    rpm_MG1_max = pt.mg1.params.rpm_max
    print(f"MG1 max: {rpm_MG1_max:.0f} rpm")

    # MG2/ring speed limits
    rpm_MG2_max = pt.mg2.params.rpm_max
    print(f"MG2 max: {rpm_MG2_max:.0f} rpm")

    # From Willis equation: ω_MG1 = 4·ω_e - 3·ω_r
    # For MG1 to be at max (6000 rpm) with engine at max (1800 rpm):
    # 6000 = 4×1800 - 3×ω_r → ω_r = (7200-6000)/3 = 400 rpm
    # For MG1 to be at 0 (minimum generating): ω_r = 4×ω_e/3

    # Speed at MG2 limit (low gear)
    K_low = pt.gearbox.params.K_low * pt.gearbox.params.K_final  # 2×9 = 18
    K_high = pt.gearbox.params.K_high * pt.gearbox.params.K_final  # 0.67×9 = 6.03
    r_w = pt.vehicle.r_wheel

    v_max_low = (rpm_MG2_max * np.pi / 30) * r_w / K_low * 3.6
    v_max_high = (rpm_MG2_max * np.pi / 30) * r_w / K_high * 3.6

    print(f"\nMax speed (MG2 limited):")
    print(f"  Low gear (K={K_low:.1f}): {v_max_low:.1f} km/h")
    print(f"  High gear (K={K_high:.1f}): {v_max_high:.1f} km/h")

    # Run simulation - let it accelerate to max speed
    print("\n--- Dynamic Simulation ---")

    x0 = PowertrainState(
        omega_e=1000 * np.pi / 30,
        omega_r=0.0,
        soc=0.6,
    )

    controller = Controller(pt)

    # Target very high speed to find natural limit
    v_target = 60.0 / 3.6  # 60 km/h target

    config = SimulationConfig(
        t_start=0.0,
        t_end=120.0,  # 2 minutes
        dt_output=0.5,
    )

    print(f"Simulating {config.t_end}s, target={v_target*3.6:.0f} km/h...")
    result = simulate(
        pt, x0,
        controller=controller,
        grade_profile=lambda t: 0.0,  # Flat ground
        config=config,
        v_target=v_target,
    )
    print("Done!")

    # Find max speed achieved
    v_max_achieved = np.max(result.velocity) * 3.6
    t_at_max = result.t[np.argmax(result.velocity)]

    print(f"\n--- Results ---")
    print(f"Max speed achieved: {v_max_achieved:.1f} km/h at t={t_at_max:.1f}s")
    print(f"Final speed: {result.velocity[-1] * 3.6:.1f} km/h")
    print(f"Final engine: {result.rpm_e[-1]:.0f} rpm")
    print(f"Final MG1: {result.rpm_MG1[-1]:.0f} rpm")
    print(f"Final ring: {result.rpm_r[-1]:.0f} rpm")
    print(f"Final gear: {result.gear[-1]}")
    print(f"Final SOC: {result.soc[-1]:.3f}")

    # Plot
    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    ax = axes[0, 0]
    ax.plot(result.t, result.velocity * 3.6, 'b-', linewidth=2)
    ax.axhline(v_max_achieved, color='r', linestyle='--', alpha=0.5)
    ax.set_ylabel("Speed [km/h]")
    ax.set_xlabel("Time [s]")
    ax.set_title(f"Vehicle Speed (Max: {v_max_achieved:.1f} km/h)")
    ax.grid(True)

    ax = axes[0, 1]
    ax.plot(result.t, result.rpm_e, 'b-', label='Engine')
    ax.plot(result.t, result.rpm_MG1, 'g-', label='MG1')
    ax.plot(result.t, result.rpm_r, 'r-', label='Ring/MG2')
    ax.axhline(rpm_e_max, color='b', linestyle=':', alpha=0.5)
    ax.axhline(rpm_MG1_max, color='g', linestyle=':', alpha=0.5)
    ax.axhline(rpm_MG2_max, color='r', linestyle=':', alpha=0.5)
    ax.set_ylabel("Speed [rpm]")
    ax.set_xlabel("Time [s]")
    ax.set_title("Component Speeds")
    ax.legend()
    ax.grid(True)

    ax = axes[1, 0]
    ax.plot(result.t, result.P_engine / 1e6, 'b-', label='Engine [MW]')
    ax.plot(result.t, result.P_MG1 / 1e3, 'g-', label='MG1 [kW]')
    ax.plot(result.t, result.P_MG2 / 1e3, 'r-', label='MG2 [kW]')
    ax.set_ylabel("Power")
    ax.set_xlabel("Time [s]")
    ax.set_title("Power Flow")
    ax.legend()
    ax.grid(True)

    ax = axes[1, 1]
    ax.plot(result.t, result.gear, 'b-', linewidth=2)
    ax.set_ylabel("Gear")
    ax.set_xlabel("Time [s]")
    ax.set_title("Gear Selection")
    ax.set_ylim(0.5, 2.5)
    ax.set_yticks([1, 2])
    ax.set_yticklabels(['Low (2:1)', 'High (0.67:1)'])
    ax.grid(True)

    plt.tight_layout()
    plt.savefig("max_speed_flat.png", dpi=150)
    print(f"\nPlot saved to: max_speed_flat.png")
    plt.show()


if __name__ == "__main__":
    main()
