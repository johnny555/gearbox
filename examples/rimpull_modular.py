#!/usr/bin/env python3
"""Generate rimpull curve for CAT 793D e-CVT using modular drivetrain library.

Drivetrain topology:
    Engine (Carrier) ─┐
                      ├─► Planetary ─► Ring/MG2 ─► Gearbox ─► Intermediate ─► Diff ─► Hub ─► Wheels
    MG1 ─► 3.5:1 ─► Sun ─┘

MG2 sits on the ring shaft (same speed as ring), adds torque directly.
Uses the new modular drivetrain components from ecvt_sim.

Shows all combinations: Low/High gear in e-CVT mode.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt
from ecvt_sim.powertrain import create_cat_793d_ecvt_powertrain


def main():
    # Create powertrain with modular drivetrain
    pt = create_cat_793d_ecvt_powertrain(
        payload_fraction=1.0,
        mg1_sun_ratio=3.5,
        gearbox_ratios=[3.0, 1.0],
        intermediate_ratio=2.85,
        diff_ratio=1.0,
        hub_ratio=10.83,
    )
    pt.vehicle.params.C_r = 0.015

    # Get drivetrain parameters
    rho = pt.planetary.rho
    K_mg1 = pt.mg1_reduction.ratio
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81

    # Get total ratios for each gear
    pt.set_gear(0)  # Low gear
    K_total_low = pt.get_output_ratio()
    eta_low = pt.get_output_efficiency()

    pt.set_gear(1)  # High gear
    K_total_high = pt.get_output_ratio()
    eta_high = pt.get_output_efficiency()

    # MG1 parameters
    MG1_P_continuous = pt.mg1.params.P_max  # Continuous power
    MG1_P_peak = 450_000  # Peak power (boost)
    MG1_T_max = pt.mg1.params.T_max
    MG1_rpm_max = pt.mg1.params.rpm_max

    # MG2 parameters
    MG2_P_continuous = pt.mg2.params.P_max
    MG2_T_max = pt.mg2.params.T_max
    MG2_rpm_max = pt.mg2.params.rpm_max

    # Engine parameters
    rpm_e = 1200
    T_e_max = pt.engine.get_max_torque(rpm_e)
    P_engine_max = T_e_max * rpm_e * np.pi / 30

    # MG1 base speeds
    MG1_base_rpm_cont = MG1_P_continuous / MG1_T_max * 30 / np.pi
    MG1_base_rpm_peak = MG1_P_peak / MG1_T_max * 30 / np.pi

    print("=" * 70)
    print("CAT 793D E-CVT Rimpull Curve (Modular Library)")
    print("=" * 70)

    print(f"\nDrivetrain Topology:")
    print(f"  MG1 ─► {K_mg1}:1 ─► Sun ─┐")
    print(f"                        ├─► Planetary ─► Ring/MG2 ─► Output Chain ─► Wheels")
    print(f"  Engine ─► Carrier ────┘")

    # Print output chain summary
    print(f"\nOutput Drivetrain Chain:")
    if pt.output_drivetrain is not None:
        print(pt.output_drivetrain.summary())

    print(f"\nPlanetary Gear:")
    print(f"  Ratio ρ = {rho:.2f}")

    # Calculate MG1 rpm at stall
    omega_e = rpm_e * np.pi / 30
    sun_rpm_at_stall = (1 + rho) * rpm_e
    mg1_rpm_at_stall = sun_rpm_at_stall / K_mg1  # MG1 runs slower than sun

    print(f"\nComponent Specifications:")
    print(f"  Engine: {T_e_max:,.0f} N·m @ {rpm_e} rpm (~{P_engine_max/1e6:.1f} MW)")
    print(f"  MG1: {MG1_P_continuous/1e3:.0f} kW cont / {MG1_P_peak/1e3:.0f} kW peak, {MG1_T_max:,.0f} N·m, {MG1_rpm_max} rpm max")
    print(f"       Base speed: {MG1_base_rpm_cont:.0f} rpm (cont) / {MG1_base_rpm_peak:.0f} rpm (peak)")
    print(f"       MG1:Sun reduction: {K_mg1}:1")
    print(f"       MG1 rpm at stall: {mg1_rpm_at_stall:.0f} rpm")
    print(f"  MG2: {MG2_P_continuous/1e3:.0f} kW cont, {MG2_T_max:,.0f} N·m, {MG2_rpm_max} rpm max")

    print(f"\nTotal Ratios:")
    print(f"  Low Gear:  {K_total_low:.1f}:1 (η={eta_low:.1%})")
    print(f"  High Gear: {K_total_high:.1f}:1 (η={eta_high:.1%})")

    print(f"\nVehicle:")
    print(f"  Wheel radius: {r_w:.2f} m")
    print(f"  Mass: {m:,.0f} kg (loaded)")

    # Helper function for MG1 torque (using peak power)
    def get_mg1_torque(rpm_mg1):
        """Get MG1 max torque at given speed (using peak power)."""
        if rpm_mg1 <= MG1_base_rpm_peak:
            return MG1_T_max
        elif rpm_mg1 <= MG1_rpm_max:
            return MG1_P_peak / (rpm_mg1 * np.pi / 30)
        else:
            return 0

    # Helper function for MG2 torque
    def get_mg2_torque(rpm_mg2):
        """Get MG2 max torque at given speed."""
        base_rpm = MG2_P_continuous / MG2_T_max * 30 / np.pi
        if rpm_mg2 <= base_rpm:
            return MG2_T_max
        elif rpm_mg2 <= MG2_rpm_max:
            return MG2_P_continuous / (rpm_mg2 * np.pi / 30)
        else:
            return 0

    # Speed range
    v_range = np.linspace(0.1, 70, 300)  # 0.1 to 70 km/h
    v_ms = v_range / 3.6

    omega_e = rpm_e * np.pi / 30

    # Arrays for low and high gear
    rimpull_low = []
    rimpull_high = []

    for v in v_ms:
        for gear, K_total, eta_total, rimpull_list in [
            (0, K_total_low, eta_low, rimpull_low),
            (1, K_total_high, eta_high, rimpull_high),
        ]:
            pt.set_gear(gear)

            # Ring speed from vehicle speed
            omega_r = v / r_w * K_total
            rpm_r = omega_r * 30 / np.pi

            # MG2 speed = ring speed (direct drive)
            rpm_mg2 = rpm_r

            # Check MG2 speed limit
            if rpm_mg2 > MG2_rpm_max:
                rimpull_list.append(0)
                continue

            # MG2 torque
            T_MG2 = get_mg2_torque(rpm_mg2)

            # e-CVT Mode: Sun speed from Willis equation
            omega_sun = (1 + rho) * omega_e - rho * omega_r
            rpm_sun = abs(omega_sun * 30 / np.pi)

            # MG1 speed (with reduction - MG1 runs slower than sun)
            rpm_MG1 = rpm_sun / K_mg1

            # MG1 torque available at this speed
            T_MG1_available = get_mg1_torque(rpm_MG1)

            # Sun torque = MG1 torque × reduction ratio × efficiency
            T_sun = T_MG1_available * K_mg1 * pt.mg1_reduction.efficiency

            # Engine torque limited by sun torque capacity
            T_e_usable = min(T_e_max, T_sun * (1 + rho))
            T_ring_engine = rho / (1 + rho) * T_e_usable
            T_ring_total = T_ring_engine + T_MG2
            T_wheel = T_ring_total * K_total * eta_total
            F = T_wheel / r_w
            rimpull_list.append(F)

    rimpull_low = np.array(rimpull_low)
    rimpull_high = np.array(rimpull_high)

    # Combined envelope
    rimpull_max = np.maximum(rimpull_low, rimpull_high)

    # Grade resistance lines
    grades = [0.02, 0.05, 0.10, 0.15, 0.20]
    grade_forces = {}
    for grade in grades:
        theta = np.arctan(grade)
        F_grade = m * g * np.sin(theta)
        F_roll = m * g * pt.vehicle.params.C_r * np.cos(theta)
        grade_forces[grade] = F_grade + F_roll

    # Print comparison table
    print(f"\n--- Rimpull (e-CVT Mode) ---")
    print(f"{'Speed':<8} {'Low Gear':>12} {'High Gear':>12} {'Envelope':>12}")
    print(f"{'km/h':<8} {'kN':>12} {'kN':>12} {'kN':>12}")
    print("-" * 48)
    for v_kmh in [0, 5, 10, 15, 20, 30, 40, 50, 60]:
        idx = int(v_kmh / 70 * (len(v_range) - 1))
        if idx < len(rimpull_low):
            print(f"{v_kmh:<8} {rimpull_low[idx]/1e3:>12.1f} {rimpull_high[idx]/1e3:>12.1f} "
                  f"{rimpull_max[idx]/1e3:>12.1f}")

    # Print grade capability
    print(f"\n--- Grade Capability ---")
    print(f"{'Grade':<8} {'Need':>8} {'Low Gear':>10} {'High Gear':>10} {'Envelope':>10}")
    print("-" * 50)
    for grade, F_resist in grade_forces.items():
        low_ok = "YES" if max(rimpull_low) >= F_resist else "no"
        high_ok = "YES" if max(rimpull_high) >= F_resist else "no"
        env_ok = "YES" if max(rimpull_max) >= F_resist else "no"
        print(f"{grade*100:>6.0f}% {F_resist/1e3:>8.0f} {low_ok:>10} {high_ok:>10} {env_ok:>10}")

    # Plot
    fig, ax = plt.subplots(figsize=(14, 9))

    ax.plot(v_range, rimpull_low/1e3, 'b-', linewidth=2.5, label=f'Low Gear ({K_total_low:.0f}:1)')
    ax.plot(v_range, rimpull_high/1e3, 'r-', linewidth=2.5, label=f'High Gear ({K_total_high:.1f}:1)')
    ax.fill_between(v_range, 0, rimpull_max/1e3, alpha=0.15, color='blue', label='Rimpull Envelope')

    # Grade lines
    colors = ['green', 'orange', 'red', 'purple', 'brown']
    for (grade, F_resist), color in zip(grade_forces.items(), colors):
        ax.axhline(F_resist/1e3, color=color, linestyle=':', linewidth=1.5, alpha=0.7,
                   label=f'{grade*100:.0f}% grade ({F_resist/1e3:.0f} kN)')

    # Rolling resistance
    F_roll_flat = m * g * pt.vehicle.params.C_r
    ax.axhline(F_roll_flat/1e3, color='gray', linestyle='--', linewidth=1.5, alpha=0.6,
               label=f'Flat ground ({F_roll_flat/1e3:.0f} kN)')

    ax.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax.set_ylabel('Rimpull [kN]', fontsize=12)
    ax.set_title(f'CAT 793D E-CVT Rimpull Curve (Modular Library)\n'
                 f'Engine: {T_e_max:,.0f} N·m | MG1: {MG1_P_peak/1e3:.0f}kW peak | MG2: {MG2_P_continuous/1e3:.0f}kW/{MG2_T_max:,}N·m | '
                 f'Mass: {m/1e3:.0f}t', fontsize=11)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 70)
    ax.set_ylim(0, max(rimpull_max)/1e3 * 1.15)

    plt.tight_layout()
    plt.savefig('rimpull_modular.png', dpi=150)
    print(f"\nPlot saved to: rimpull_modular.png")
    plt.show()


if __name__ == "__main__":
    main()
