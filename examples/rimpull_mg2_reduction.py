#!/usr/bin/env python3
"""Generate rimpull curve for CAT 793D E-CVT with 3:1 reduction after ring/MG2.

Drivetrain topology:
    Engine (Carrier) ─┐
                      ├─► Planetary ─► Ring ─► MG2 (adds torque) ─► 3:1 ─► Gearbox ─► Final Drive ─► Wheels
    MG1 (Sun) ────────┘

MG2 sits on the ring shaft (same speed as ring), adds torque directly.
The 3:1 reduction comes AFTER the combined ring + MG2 output.

Shows all combinations: Low/High gear x e-CVT/Locked Sun modes.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt
from ecvt_sim.powertrain import create_cat_793d_powertrain


def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015

    # Planetary gear: Sun 30T, Ring 90T, Planet 30T
    # ρ = Ring/Sun = 90/30 = 3.0
    rho = 90 / 30  # 3.0
    Z_sun = 30
    Z_ring = 90
    Z_planet = 30

    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81

    # Updated MG1: 250 kW continuous, 450 kW peak, 3500 N·m
    MG1_P_continuous = 250_000  # W
    MG1_P_peak = 450_000        # W
    MG1_T_max = 3_500           # N·m
    MG1_rpm_max = 6_000         # rpm

    # MG1 to Sun gear reduction
    K_mg1 = 3.5                 # 3.5:1 reduction
    eta_mg1_reduction = 0.97    # efficiency

    # Updated MG2: 5,400 N·m direct drive (Option 2)
    MG2_P_continuous = 500_000  # W (adjust if needed for wider constant-T range)
    MG2_T_max = 5_400           # N·m (direct on ring shaft)
    MG2_rpm_max = 4_000         # rpm

    # Gearbox ratios (before final drive)
    K_gearbox_low = 3.0                          # 3.0:1 (low gear)
    K_gearbox_high = 1.0                         # 1.0:1 (high gear / direct)
    eta_gearbox = 0.97

    # Intermediate reduction (after gearbox, before diff)
    K_intermediate = 2.85                        # 2.85:1
    eta_intermediate = 0.97

    # Final drive breakdown
    K_diff = 1.0                                 # Differential (1:1)
    K_wheel_hub = 10.83                          # Wheel hub reduction
    K_final = K_intermediate * K_diff * K_wheel_hub  # Total after gearbox
    eta_final = eta_intermediate * 0.96          # Combined efficiency

    # No separate reduction after ring/MG2
    K_reduction = 1.0
    eta_reduction = 1.0

    # Total ratios (ring to wheel)
    K_total_low = K_reduction * K_gearbox_low * K_final
    K_total_high = K_reduction * K_gearbox_high * K_final
    eta_total = eta_reduction * eta_gearbox * eta_final

    # Get engine max torque
    rpm_e = 1200
    T_e_max = pt.engine.get_max_torque(rpm_e)
    P_engine_max = T_e_max * rpm_e * np.pi / 30

    # MG1 base speeds (constant torque → constant power transition)
    MG1_base_rpm_cont = MG1_P_continuous / MG1_T_max * 30 / np.pi
    MG1_base_rpm_peak = MG1_P_peak / MG1_T_max * 30 / np.pi

    print("=" * 70)
    print("CAT 793D E-CVT Rimpull Curve")
    print("=" * 70)

    print(f"\nDrivetrain Topology:")
    print(f"  Engine ─► Planetary ─► Ring/MG2 ─► 3:1 ─► Gearbox ─► Final Drive ─► Wheels")

    print(f"\nPlanetary Gear:")
    print(f"  Sun: {Z_sun}T, Ring: {Z_ring}T, Planet: {Z_planet}T")
    print(f"  Ratio ρ = {rho:.2f} (ring/carrier = {(1+rho)/rho:.3f}:1 when sun locked)")

    # Calculate sun speed at stall for reference
    sun_rpm_at_stall = (1 + rho) * rpm_e
    mg1_rpm_at_stall = sun_rpm_at_stall / K_mg1

    print(f"\nComponent Specifications:")
    print(f"  Engine: {T_e_max:,.0f} N·m @ {rpm_e} rpm (~{P_engine_max/1e6:.1f} MW)")
    print(f"  MG1: {MG1_P_continuous/1e3:.0f} kW cont / {MG1_P_peak/1e3:.0f} kW peak, {MG1_T_max:,.0f} N·m, {MG1_rpm_max} rpm max")
    print(f"       Base speed: {MG1_base_rpm_cont:.0f} rpm (cont) / {MG1_base_rpm_peak:.0f} rpm (peak)")
    print(f"       MG1:Sun reduction: {K_mg1}:1 (η={eta_mg1_reduction:.0%})")
    print(f"       MG1 rpm at stall: {mg1_rpm_at_stall:.0f} rpm (sun at {sun_rpm_at_stall:.0f} rpm)")
    print(f"  MG2: {MG2_P_continuous/1e3:.0f} kW cont, {MG2_T_max:,.0f} N·m, {MG2_rpm_max} rpm max")

    print(f"\nGear Ratios:")
    print(f"  3:1 Reduction (after ring/MG2): {K_reduction}:1 (η={eta_reduction:.0%})")
    print(f"  Gearbox Low:  {K_gearbox_low}:1")
    print(f"  Gearbox High: {K_gearbox_high}:1 (η={eta_gearbox:.0%})")
    print(f"  Final Drive:  {K_final}:1 (η={eta_final:.0%})")
    print(f"  ─────────────────────────────")
    print(f"  Total Low:  {K_total_low:.0f}:1")
    print(f"  Total High: {K_total_high:.1f}:1")
    print(f"  Total η:    {eta_total:.1%}")

    print(f"\nVehicle:")
    print(f"  Wheel radius: {r_w:.2f} m (59/80R63 tires)")
    print(f"  Mass: {m:,.0f} kg (loaded)")

    print(f"\nOperating Mode:")
    print(f"  e-CVT: Sun free (MG1 reacts engine torque)")

    # Speed range
    v_range = np.linspace(0.1, 70, 300)  # 0.1 to 70 km/h
    v_ms = v_range / 3.6

    omega_e = rpm_e * np.pi / 30

    # Helper function for MG1 torque (using peak power for max rimpull)
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

    # Arrays for low and high gear (e-CVT only)
    rimpull_low = []
    rimpull_high = []

    for v in v_ms:
        for K_total, rimpull_list in [
            (K_total_low, rimpull_low),
            (K_total_high, rimpull_high),
        ]:
            # Ring speed from vehicle speed (ring = wheel * total_ratio)
            omega_r = v / r_w * K_total
            rpm_r = omega_r * 30 / np.pi

            # MG2 speed = ring speed (direct drive on ring shaft)
            rpm_mg2 = rpm_r

            # Check MG2 speed limit
            if rpm_mg2 > MG2_rpm_max:
                rimpull_list.append(0)
                continue

            # MG2 torque (direct on ring shaft)
            T_MG2 = get_mg2_torque(rpm_mg2)

            # e-CVT Mode (sun free)
            # Sun speed from Willis equation
            omega_sun = (1 + rho) * omega_e - rho * omega_r
            rpm_sun = abs(omega_sun * 30 / np.pi)

            # MG1 speed (with reduction gear)
            rpm_MG1 = rpm_sun / K_mg1

            # MG1 torque available at this speed
            T_MG1_available = get_mg1_torque(rpm_MG1)

            # Sun torque = MG1 torque × reduction ratio × efficiency
            T_sun = T_MG1_available * K_mg1 * eta_mg1_reduction

            # Engine torque limited by sun torque capacity
            # T_sun = T_engine / (1+ρ), so T_engine_max = T_sun × (1+ρ)
            T_e_usable = min(T_e_max, T_sun * (1 + rho))
            T_ring_engine = rho / (1 + rho) * T_e_usable
            T_ring_total = T_ring_engine + T_MG2
            T_wheel = T_ring_total * K_total * eta_total
            F = T_wheel / r_w
            rimpull_list.append(F)

    rimpull_low = np.array(rimpull_low)
    rimpull_high = np.array(rimpull_high)

    # Combined envelope (max of both gears)
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

    # Low gear curve
    ax.plot(v_range, rimpull_low/1e3, 'b-', linewidth=2.5, label=f'Low Gear ({K_total_low:.0f}:1)')

    # High gear curve
    ax.plot(v_range, rimpull_high/1e3, 'r-', linewidth=2.5, label=f'High Gear ({K_total_high:.1f}:1)')

    # Envelope fill
    ax.fill_between(v_range, 0, rimpull_max/1e3, alpha=0.15, color='blue', label='Rimpull Envelope')

    # Grade lines
    colors = ['green', 'orange', 'red', 'purple', 'brown']
    for (grade, F_resist), color in zip(grade_forces.items(), colors):
        ax.axhline(F_resist/1e3, color=color, linestyle=':', linewidth=1.5, alpha=0.7,
                   label=f'{grade*100:.0f}% grade ({F_resist/1e3:.0f} kN)')

    # Rolling resistance (flat)
    F_roll_flat = m * g * pt.vehicle.params.C_r
    ax.axhline(F_roll_flat/1e3, color='gray', linestyle='--', linewidth=1.5, alpha=0.6,
               label=f'Flat ground ({F_roll_flat/1e3:.0f} kN)')

    ax.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax.set_ylabel('Rimpull [kN]', fontsize=12)
    ax.set_title(f'CAT 793D E-CVT Rimpull Curve (ρ={rho:.2f})\n'
                 f'Engine: {T_e_max:,.0f} N·m | MG1: {MG1_P_peak/1e3:.0f}kW peak | MG2: {MG2_P_continuous/1e3:.0f}kW/{MG2_T_max:,}N·m | '
                 f'Mass: {m/1e3:.0f}t', fontsize=11)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 70)
    ax.set_ylim(0, max(rimpull_max)/1e3 * 1.15)

    plt.tight_layout()
    plt.savefig('rimpull_mg2_3to1.png', dpi=150)
    print(f"\nPlot saved to: rimpull_mg2_3to1.png")
    plt.show()


if __name__ == "__main__":
    main()
