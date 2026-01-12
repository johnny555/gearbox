#!/usr/bin/env python3
"""Check how much engine torque actually reaches the ring."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015

    rho = pt.planetary.rho  # 3.0

    print("=" * 60)
    print("Engine Contribution Analysis")
    print("=" * 60)
    print(f"\nPlanetary ratio ρ = {rho}")
    print(f"Engine torque to ring = {rho/(1+rho)*100:.0f}% = {rho/(1+rho):.2f} × T_e")
    print(f"MG1 must react = {1/(1+rho)*100:.0f}% = {1/(1+rho):.2f} × T_e")

    print("\n--- At Different Operating Points ---")

    cases = [
        ("Standstill", 800, 0),
        ("5 km/h", 1000, 48),    # Low gear
        ("10 km/h", 1200, 95),   # Low gear
        ("15 km/h", 1400, 143),  # Low gear
        ("20 km/h", 1400, 191),  # Low gear
        ("30 km/h", 1200, 143),  # High gear (overdrive)
    ]

    print(f"\n{'Condition':<15} {'ω_e':>8} {'ω_r':>8} {'ω_MG1':>8} {'T_MG1_max':>10} {'T_e_usable':>12} {'Ring from eng':>14}")
    print("-" * 85)

    for name, rpm_e, rpm_r in cases:
        omega_e = rpm_e * np.pi / 30
        omega_r = rpm_r * np.pi / 30

        # MG1 speed from Willis
        omega_MG1 = (1 + rho) * omega_e - rho * omega_r
        rpm_MG1 = omega_MG1 * 30 / np.pi

        # MG1 max torque at this speed
        T_MG1_max = pt.mg1.get_max_torque(abs(rpm_MG1))

        # Max engine torque that MG1 can react
        T_e_usable = (1 + rho) * T_MG1_max

        # Engine contribution to ring
        T_ring_from_engine = rho / (1 + rho) * T_e_usable

        print(f"{name:<15} {rpm_e:>7.0f} {rpm_r:>7.0f} {rpm_MG1:>7.0f} {T_MG1_max:>10.0f} {T_e_usable:>12.0f} {T_ring_from_engine:>14.0f}")

    print("\n--- What's Needed vs What's Available ---")

    # Load torque at 10% grade, loaded
    T_load_10pct = pt.get_load_torque(0.0, grade=0.10, gear=1)
    T_load_flat = pt.get_load_torque(0.0, grade=0.0, gear=1)

    print(f"\nLoad at ring (loaded truck):")
    print(f"  Flat ground: {T_load_flat:,.0f} N·m")
    print(f"  10% grade:   {T_load_10pct:,.0f} N·m")

    print(f"\nAt standstill (MG1 at 3200 rpm):")
    T_MG1_standstill = pt.mg1.get_max_torque(3200)
    T_e_usable_standstill = 4 * T_MG1_standstill
    T_ring_engine_standstill = 0.75 * T_e_usable_standstill

    print(f"  MG1 can react: {T_MG1_standstill:,.0f} N·m")
    print(f"  Engine usable: {T_e_usable_standstill:,.0f} N·m (out of {pt.engine.get_max_torque(800):,.0f} available!)")
    print(f"  Engine → ring: {T_ring_engine_standstill:,.0f} N·m")
    print(f"  MG2 max:       {pt.mg2.params.T_max:,.0f} N·m")
    print(f"  Total:         {T_ring_engine_standstill + pt.mg2.params.T_max:,.0f} N·m")
    print(f"  Need for 10%:  {T_load_10pct:,.0f} N·m")
    print(f"  DEFICIT:       {T_load_10pct - T_ring_engine_standstill - pt.mg2.params.T_max:,.0f} N·m")

if __name__ == "__main__":
    main()
