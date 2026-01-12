#!/usr/bin/env python3
"""Analyze MG1 (sun gear) behavior in e-CVT mode."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain


def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    rho = pt.planetary.rho  # 3.0
    r_w = pt.vehicle.r_wheel

    # Gear ratios (corrected topology)
    K_reduction = 3.0
    K_gearbox_low = 2.0
    K_final = 16.0
    K_total_low = K_reduction * K_gearbox_low * K_final  # 96:1

    # Engine operating point
    rpm_e = 1200
    omega_e = rpm_e * np.pi / 30
    T_e_max = pt.engine.get_max_torque(rpm_e)

    print("=" * 75)
    print("MG1 (Sun Gear) Behavior in e-CVT Mode")
    print("=" * 75)

    print(f"\nKey Parameters:")
    print(f"  Planetary ratio ρ = {rho}")
    print(f"  Willis equation: ω_MG1 = (1+ρ)×ω_engine - ρ×ω_ring")
    print(f"                   ω_MG1 = 4×ω_engine - 3×ω_ring")
    print(f"")
    print(f"  Engine speed: {rpm_e} rpm")
    print(f"  Engine max torque: {T_e_max:,.0f} N·m")
    print(f"")
    print(f"  MG1 must react engine torque: T_MG1 = -T_engine / (1+ρ) = -T_e / 4")
    print(f"  For full engine torque: T_MG1 needed = {T_e_max/4:,.0f} N·m")
    print(f"  MG1 max torque capacity: {pt.mg1.params.T_max:,.0f} N·m")
    print(f"  MG1 max rpm: {pt.mg1.params.rpm_max:.0f}")

    # Calculate MG1 base speed (transition from constant torque to constant power)
    mg1_base_rpm = pt.mg1.params.P_max / pt.mg1.params.T_max * 30 / np.pi
    print(f"  MG1 base speed (constant T → constant P): {mg1_base_rpm:.0f} rpm")

    print(f"\n" + "=" * 75)
    print("Speed-by-Speed Analysis (Low Gear, 96:1 total)")
    print("=" * 75)
    print("")
    print(f"  v      MG1       MG1      Engine    Rimpull")
    print(f"km/h     rpm     T_max    usable T      kN      Notes")
    print("-" * 75)

    for v_kmh in [0, 2, 4, 6, 8, 10, 11, 12, 13, 14, 15, 18, 20, 25]:
        v = v_kmh / 3.6
        omega_r = v / r_w * K_total_low
        rpm_r = omega_r * 30 / np.pi

        # MG2 speed check
        if rpm_r > pt.mg2.params.rpm_max:
            print(f"{v_kmh:>4}     --        --         --        --   MG2 SPEED LIMIT")
            continue

        # MG1 speed from Willis equation
        omega_MG1 = (1 + rho) * omega_e - rho * omega_r
        rpm_MG1 = omega_MG1 * 30 / np.pi

        # MG1 max torque at this speed
        T_MG1_max = pt.mg1.get_max_torque(abs(rpm_MG1))

        # Engine torque limited by MG1 capacity
        T_e_usable = min(T_e_max, (1 + rho) * T_MG1_max)

        # Ring torque from engine path
        T_ring_engine = rho / (1 + rho) * T_e_usable

        # MG2 contribution
        T_MG2 = pt.mg2.get_max_torque(rpm_r, use_boost=True)
        T_ring_total = T_ring_engine + T_MG2

        # Rimpull
        eta = 0.903
        F = T_ring_total * K_total_low * eta / r_w

        # Flag what is limiting
        if abs(rpm_MG1) > mg1_base_rpm:
            note = "MG1 in POWER region (T limited)"
        elif T_e_usable < T_e_max * 0.99:
            note = "MG1 limiting engine"
        else:
            note = "Full engine torque OK"

        print(f"{v_kmh:>4}   {rpm_MG1:>6.0f}    {T_MG1_max:>6.0f}     {T_e_usable:>6.0f}    {F/1e3:>6.1f}   {note}")

    print(f"\n" + "=" * 75)
    print("EXPLANATION: Why e-CVT rimpull peaks then drops")
    print("=" * 75)
    print("""
The Willis equation links MG1 speed to vehicle speed:

    ω_MG1 = 4 × ω_engine - 3 × ω_ring

┌─────────────────────────────────────────────────────────────────────────┐
│ At ZERO vehicle speed (stall):                                          │
│   • Ring is stopped (ω_ring = 0)                                        │
│   • MG1 rpm = 4 × 1200 = 4800 rpm  ← Spinning FAST!                     │
│   • MG1 is deep in constant POWER region                                │
│   • MG1 torque limited to P_max/ω = 200kW/4800rpm = 398 N·m            │
│   • Can only react 4 × 398 = 1,592 N·m of engine torque                │
│   • Rimpull is LIMITED                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ At "SWEET SPOT" (~10-12 km/h):                                          │
│   • Ring speeds up → MG1 slows DOWN                                     │
│   • MG1 drops below base speed (637 rpm)                                │
│   • MG1 enters constant TORQUE region → full 3000 N·m available         │
│   • Can react 4 × 3000 = 12,000 N·m (more than engine max!)            │
│   • FULL engine torque (11,220 N·m) flows through                       │
│   • Rimpull PEAKS here!                                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ At HIGHER speeds (13+ km/h):                                            │
│   • Ring continues to speed up                                          │
│   • MG1 goes through ZERO and reverses direction                        │
│   • MG1 now spinning NEGATIVE (opposite to engine)                      │
│   • As |MG1 rpm| increases, it re-enters constant POWER region          │
│   • MG1 torque drops again → less engine torque can be reacted          │
│   • Rimpull DROPS                                                       │
└─────────────────────────────────────────────────────────────────────────┘

This creates the characteristic "hump" in the e-CVT rimpull curve!

LOCKED SUN MODE bypasses this entirely:
  • MG1 is mechanically locked at ω = 0
  • No speed-dependent torque limitation
  • Full engine torque always available
  • Flat rimpull curve (until MG2 speed limit)
""")


if __name__ == "__main__":
    main()
