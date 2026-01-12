#!/usr/bin/env python3
"""Analyze different torque converter placements."""

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
    
    TC_stall = 2.5
    
    T_e_max = pt.engine.get_max_torque(1200)
    T_MG2_max = pt.mg2.params.T_max
    
    # MG1 limited engine contribution (normal e-CVT)
    omega_MG1 = 4 * 1200 * np.pi / 30
    T_MG1_available = pt.mg1.params.P_max / omega_MG1
    T_ring_from_engine_limited = rho * T_MG1_available  # ~1,194 N·m
    
    # Full engine contribution (locked sun)
    T_ring_from_engine_full = rho / (1 + rho) * T_e_max  # ~8,415 N·m
    
    print("=" * 80)
    print("Torque Converter Placement Analysis")
    print("=" * 80)
    
    print(f"""
    Option A: TC before planetary (between engine and carrier)
    =========================================================
    Engine → [TC] → Planetary → Gearbox → Wheels
    
    Option B: TC after planetary (between ring and gearbox)  
    =========================================================
    Engine → Planetary → [TC] → Gearbox → Wheels
                ↑
              MG1 + MG2 connect here
    
    Option C: TC after gearbox (before final drive)
    =========================================================
    Engine → Planetary → Gearbox → [TC] → Final Drive → Wheels
    """)
    
    print("=" * 80)
    print("Analysis: Normal e-CVT mode (sun free, MG1 reacting)")
    print("=" * 80)
    
    T_ring_eCVT = T_ring_from_engine_limited + T_MG2_max  # 1,194 + 2,000 = 3,194 N·m
    
    print(f"\nRing torque (MG1 limited): {T_ring_eCVT:,.0f} N·m")
    
    # Option A: TC before planetary - doesn't help (MG1 still limits)
    F_A_eCVT = T_ring_eCVT * K_total * eta / r_w
    print(f"\nOption A (TC before planetary):")
    print(f"  TC multiplies engine torque, but MG1 still limits what gets through")
    print(f"  Ring torque: {T_ring_eCVT:,.0f} N·m (unchanged)")
    print(f"  Rimpull: {F_A_eCVT/1e3:.1f} kN")
    
    # Option B: TC after planetary - multiplies the ring torque!
    T_after_TC_B = T_ring_eCVT * TC_stall
    F_B_eCVT = T_after_TC_B * K_total * eta / r_w
    print(f"\nOption B (TC after planetary, before gearbox):")
    print(f"  TC multiplies TOTAL ring torque (engine path + MG2)")
    print(f"  Ring torque: {T_ring_eCVT:,.0f} N·m")
    print(f"  After TC (×{TC_stall}): {T_after_TC_B:,.0f} N·m")
    print(f"  Rimpull: {F_B_eCVT/1e3:.1f} kN")
    
    # Option C: TC after gearbox
    T_after_gearbox = T_ring_eCVT * K_total * eta
    T_after_TC_C = T_after_gearbox * TC_stall
    F_C_eCVT = T_after_TC_C / r_w
    print(f"\nOption C (TC after gearbox):")
    print(f"  Same as B, just different location")
    print(f"  Rimpull: {F_C_eCVT/1e3:.1f} kN")
    
    print("\n" + "=" * 80)
    print("Analysis: Locked sun mode")
    print("=" * 80)
    
    T_ring_locked = T_ring_from_engine_full + T_MG2_max  # 8,415 + 2,000 = 10,415 N·m
    
    print(f"\nRing torque (locked sun): {T_ring_locked:,.0f} N·m")
    
    # Option A: TC before planetary
    T_e_with_TC = T_e_max * TC_stall
    T_ring_A_locked = rho / (1 + rho) * T_e_with_TC + T_MG2_max
    F_A_locked = T_ring_A_locked * K_total * eta / r_w
    print(f"\nOption A (TC before planetary):")
    print(f"  Engine × TC: {T_e_with_TC:,.0f} N·m")
    print(f"  To ring (×0.75): {rho/(1+rho)*T_e_with_TC:,.0f} N·m")
    print(f"  + MG2: {T_MG2_max:,.0f} N·m")
    print(f"  Total ring: {T_ring_A_locked:,.0f} N·m")
    print(f"  Rimpull: {F_A_locked/1e3:.1f} kN")
    
    # Option B: TC after planetary
    T_after_TC_B_locked = T_ring_locked * TC_stall
    F_B_locked = T_after_TC_B_locked * K_total * eta / r_w
    print(f"\nOption B (TC after planetary):")
    print(f"  Ring torque: {T_ring_locked:,.0f} N·m")
    print(f"  After TC (×{TC_stall}): {T_after_TC_B_locked:,.0f} N·m")
    print(f"  Rimpull: {F_B_locked/1e3:.1f} kN")
    
    print("\n" + "=" * 80)
    print("Summary Comparison")
    print("=" * 80)
    
    print(f"\n{'Configuration':<40} {'e-CVT Mode':>12} {'Locked Sun':>12}")
    print("-" * 70)
    print(f"{'No TC':<40} {F_A_eCVT/1e3:>12.0f} kN {T_ring_locked * K_total * eta / r_w/1e3:>12.0f} kN")
    print(f"{'Option A: TC before planetary':<40} {F_A_eCVT/1e3:>12.0f} kN {F_A_locked/1e3:>12.0f} kN")
    print(f"{'Option B: TC after planetary':<40} {F_B_eCVT/1e3:>12.0f} kN {F_B_locked/1e3:>12.0f} kN")
    
    print(f"\n*** Option B is BETTER in e-CVT mode! ***")
    print(f"    It multiplies MG2 torque too, not just engine path.")
    
    # Grade capability
    print(f"\n--- Grade Capability (Option B: TC after planetary) ---")
    for grade in [0.10, 0.15, 0.20, 0.25, 0.30]:
        theta = np.arctan(grade)
        F_need = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
        
        can_eCVT = "YES" if F_B_eCVT >= F_need else "no"
        can_locked = "YES" if F_B_locked >= F_need else "no"
        
        print(f"  {grade*100:.0f}%: need {F_need/1e3:.0f} kN | e-CVT: {can_eCVT}, Locked: {can_locked}")

if __name__ == "__main__":
    main()
