#!/usr/bin/env python3
"""Analyze adding a torque converter to the e-CVT drivetrain."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81
    K_total = pt.gearbox.params.K_low * pt.gearbox.params.K_final
    eta = pt.gearbox.params.eta_total
    
    # Torque converter specs (typical for heavy equipment)
    TC_stall_ratio = 2.5  # Torque multiplication at stall
    TC_efficiency_cruise = 0.95  # When locked up
    
    print("=" * 80)
    print("Torque Converter + e-CVT Analysis")
    print("=" * 80)
    
    print(f"\nTorque Converter specs:")
    print(f"  Stall ratio: {TC_stall_ratio}:1")
    print(f"  At stall: engine torque × {TC_stall_ratio}")
    print(f"  At lockup (cruise): 1:1, ~{TC_efficiency_cruise*100:.0f}% efficient")
    
    T_e_max = pt.engine.get_max_torque(1200)
    T_e_with_TC = T_e_max * TC_stall_ratio
    
    print(f"\n--- Option 1: TC + Normal e-CVT (sun free) ---")
    print(f"Engine torque: {T_e_max:,.0f} N·m")
    print(f"After TC at stall: {T_e_with_TC:,.0f} N·m into planetary carrier")
    print(f"\nBUT: MG1 must still react this torque!")
    
    # MG1 must react T_carrier / (1+rho)
    T_MG1_needed = T_e_with_TC / (1 + rho)
    omega_MG1 = 4 * 1200 * np.pi / 30  # Still at 4800 rpm
    T_MG1_available = pt.mg1.params.P_max / omega_MG1
    
    print(f"MG1 torque needed: {T_MG1_needed:,.0f} N·m")
    print(f"MG1 torque available (200kW @ 4800rpm): {T_MG1_available:,.0f} N·m")
    print(f"→ MG1 is still the bottleneck! TC doesn't help here.")
    
    # What actually gets through
    T_e_usable_with_TC = (1 + rho) * T_MG1_available
    T_ring_eCVT_TC = rho / (1 + rho) * T_e_usable_with_TC + pt.mg2.params.T_max
    F_eCVT_TC = T_ring_eCVT_TC * K_total * eta / r_w
    
    print(f"\nActual usable (limited by MG1): {T_e_usable_with_TC:,.0f} N·m")
    print(f"Ring torque: {T_ring_eCVT_TC:,.0f} N·m")
    print(f"Rimpull: {F_eCVT_TC/1e3:.1f} kN (same as without TC!)")
    
    print(f"\n--- Option 2: TC + Locked Sun ---")
    print(f"This is where TC shines!")
    print(f"\nWith sun locked, MG1 is bypassed - no power limitation")
    
    T_ring_locked_TC = rho / (1 + rho) * T_e_with_TC + pt.mg2.params.T_max
    F_locked_TC = T_ring_locked_TC * K_total * eta / r_w
    
    print(f"Engine torque: {T_e_max:,.0f} N·m")
    print(f"After TC (×{TC_stall_ratio}): {T_e_with_TC:,.0f} N·m")
    print(f"To ring (×0.75): {rho/(1+rho)*T_e_with_TC:,.0f} N·m")
    print(f"Plus MG2: {pt.mg2.params.T_max:,.0f} N·m")
    print(f"Total ring torque: {T_ring_locked_TC:,.0f} N·m")
    print(f"Rimpull: {F_locked_TC/1e3:.1f} kN")
    
    print(f"\n--- Comparison ---")
    print(f"{'Configuration':<35} {'Ring Torque':>15} {'Rimpull':>12}")
    print("-" * 65)
    
    # Without TC
    T_ring_eCVT = rho/(1+rho) * (1+rho) * T_MG1_available + pt.mg2.params.T_max
    F_eCVT = T_ring_eCVT * K_total * eta / r_w
    
    T_ring_locked = rho/(1+rho) * T_e_max + pt.mg2.params.T_max
    F_locked = T_ring_locked * K_total * eta / r_w
    
    print(f"{'Normal e-CVT (no TC)':<35} {T_ring_eCVT:>15,.0f} {F_eCVT/1e3:>12.1f} kN")
    print(f"{'Locked sun (no TC)':<35} {T_ring_locked:>15,.0f} {F_locked/1e3:>12.1f} kN")
    print(f"{'Normal e-CVT + TC':<35} {T_ring_eCVT_TC:>15,.0f} {F_eCVT_TC/1e3:>12.1f} kN")
    print(f"{'Locked sun + TC':<35} {T_ring_locked_TC:>15,.0f} {F_locked_TC/1e3:>12.1f} kN")
    
    print(f"\n--- Grade Capability ---")
    grades = [0.05, 0.10, 0.15, 0.20, 0.25]
    
    print(f"{'Grade':<10} {'Force Needed':>15} {'Locked+TC':>15} {'Result':>10}")
    print("-" * 55)
    
    for grade in grades:
        theta = np.arctan(grade)
        F_need = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
        result = "YES" if F_locked_TC >= F_need else "no"
        print(f"{grade*100:>8.0f}% {F_need/1e3:>15.0f} kN {F_locked_TC/1e3:>15.0f} kN {result:>10}")
    
    print(f"\n--- Architecture Summary ---")
    print(f"""
    Engine → Torque Converter → Planetary (sun lockable) → Gearbox → Wheels
                                     ↑
                                   MG1 (on sun)
                                     
                                Ring/Output ← MG2
    
    Operating Modes:
    1. Launch/Grade: Lock sun, TC at stall → {F_locked_TC/1e3:.0f} kN rimpull
    2. Normal drive: Unlock sun, TC locked up → e-CVT mode (efficient)
    3. EV mode: Engine off, MG2 drives (low speed only)
    """)

if __name__ == "__main__":
    main()
