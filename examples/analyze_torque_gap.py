#!/usr/bin/env python3
"""Analyze the torque gap and what would close it."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho  # 3.0
    
    print("=" * 70)
    print("Torque Gap Analysis for CAT 793D E-CVT")
    print("=" * 70)
    
    # Vehicle parameters
    m = pt.vehicle.mass
    g = 9.81
    r_w = pt.vehicle.r_wheel
    
    print(f"\nVehicle mass: {m:,.0f} kg")
    print(f"Wheel radius: {r_w:.3f} m")
    
    # Gear ratios
    K_low = pt.gearbox.params.K_low * pt.gearbox.params.K_final  # 2 × 9 = 18
    K_high = pt.gearbox.params.K_high * pt.gearbox.params.K_final  # 0.67 × 9 = 6
    
    print(f"\nGear ratios:")
    print(f"  Low gear:  K = {K_low:.1f}")
    print(f"  High gear: K = {K_high:.2f}")
    
    # Load torque requirements at wheel and ring
    print("\n--- Torque Requirements ---")
    print(f"{'Grade':>8} {'F_grade':>12} {'F_roll':>12} {'T_wheel':>14} {'T_ring(L)':>14} {'T_ring(H)':>14}")
    print("-" * 80)
    
    for grade in [0.0, 0.05, 0.10, 0.15]:
        theta = np.arctan(grade)
        F_grade = m * g * np.sin(theta)
        F_roll = m * g * pt.vehicle.params.C_r * np.cos(theta)
        F_total = F_grade + F_roll
        T_wheel = F_total * r_w
        T_ring_low = T_wheel / K_low
        T_ring_high = T_wheel / K_high
        
        print(f"{grade*100:>7.0f}% {F_grade:>12,.0f} {F_roll:>12,.0f} {T_wheel:>14,.0f} {T_ring_low:>14,.0f} {T_ring_high:>14,.0f}")
    
    # What we have available
    print("\n--- Available Torque at Ring ---")
    
    # At standstill, MG1 at ~3200 rpm (engine 800 rpm × 4)
    rpm_MG1_standstill = 800 * (1 + rho)
    T_MG1_max = pt.mg1.get_max_torque(rpm_MG1_standstill)
    T_e_usable = (1 + rho) * T_MG1_max
    T_ring_from_engine = rho / (1 + rho) * T_e_usable
    T_MG2_max = pt.mg2.params.T_max
    
    print(f"\nAt standstill (MG1 @ {rpm_MG1_standstill:.0f} rpm):")
    print(f"  MG1 can produce: {T_MG1_max:,.0f} N·m (reaction torque)")
    print(f"  Engine usable:   {T_e_usable:,.0f} N·m")
    print(f"  Engine → ring:   {T_ring_from_engine:,.0f} N·m ({rho/(1+rho)*100:.0f}% of engine)")
    print(f"  MG2 direct:      {T_MG2_max:,.0f} N·m")
    print(f"  TOTAL at ring:   {T_ring_from_engine + T_MG2_max:,.0f} N·m")
    
    # Required for different grades (low gear)
    print("\n--- Gap Analysis (Low Gear) ---")
    T_available = T_ring_from_engine + T_MG2_max
    
    for grade in [0.05, 0.10, 0.15]:
        T_load = pt.get_load_torque(0.0, grade, 1)  # At standstill, low gear
        gap = T_load - T_available
        
        print(f"\n{grade*100:.0f}% grade:")
        print(f"  Need:      {T_load:>10,.0f} N·m")
        print(f"  Have:      {T_available:>10,.0f} N·m")
        print(f"  Gap:       {gap:>10,.0f} N·m")
        
        if gap > 0:
            # What MG2 torque would close the gap?
            T_MG2_needed = T_MG2_max + gap
            print(f"  → Need MG2 torque: {T_MG2_needed:,.0f} N·m to close gap")
            
            # Or what engine + MG1 combination?
            # T_ring = rho/(1+rho) * T_e + T_MG2
            # T_ring - T_MG2 = rho/(1+rho) * T_e
            # T_e = (T_ring - T_MG2) * (1+rho)/rho
            T_e_needed = (T_load - T_MG2_max) * (1 + rho) / rho
            T_MG1_needed = T_e_needed / (1 + rho)
            P_MG1_needed = T_MG1_needed * rpm_MG1_standstill * np.pi / 30 / 1e6
            print(f"  → Or engine {T_e_needed:,.0f} N·m (need MG1 {T_MG1_needed:,.0f} N·m @ {P_MG1_needed:.2f} MW)")
    
    # Alternative: What if we had a torque converter / lockup clutch?
    print("\n" + "=" * 70)
    print("Alternative: Direct engine coupling (bypassing planetary)")
    print("=" * 70)
    
    T_e_max = pt.engine.get_max_torque(800)  # At idle
    print(f"\nIf engine torque went directly to ring (lockup clutch):")
    print(f"  Engine max:     {T_e_max:,.0f} N·m")
    print(f"  MG2 max:        {T_MG2_max:,.0f} N·m")
    print(f"  TOTAL at ring:  {T_e_max + T_MG2_max:,.0f} N·m")
    
    for grade in [0.05, 0.10, 0.15]:
        T_load = pt.get_load_torque(0.0, grade, 1)
        T_direct = T_e_max + T_MG2_max
        gap = T_load - T_direct
        status = "OK" if gap <= 0 else f"Gap: {gap:,.0f} N·m"
        print(f"  {grade*100:.0f}% grade: Need {T_load:,.0f} → {status}")

    # Real CAT 793F uses mechanical drive - what's their solution?
    print("\n" + "=" * 70)
    print("Comparison: Mechanical Drive (CAT 793F)")
    print("=" * 70)
    
    # CAT 793F has torque converter with ~2.5:1 stall ratio
    # and 6-speed powershift transmission
    TC_stall_ratio = 2.5
    T_e_with_TC = T_e_max * TC_stall_ratio
    
    # First gear in 793F is about 5:1, plus final drive ~5.3:1
    K_first_mech = 5.0 * 5.3  # ~26.5
    
    print(f"\nWith torque converter (stall ratio {TC_stall_ratio}:1):")
    print(f"  Engine × TC:       {T_e_with_TC:,.0f} N·m at transmission input")
    print(f"  1st gear ratio:    ~{K_first_mech:.1f}:1")
    print(f"  Torque at wheel:   {T_e_with_TC * K_first_mech:,.0f} N·m")
    
    T_wheel_mech = T_e_with_TC * K_first_mech
    F_drive_mech = T_wheel_mech / r_w
    grade_capability = F_drive_mech / (m * g) - pt.vehicle.params.C_r
    print(f"  Grade capability:  {grade_capability*100:.1f}% (loaded)")

if __name__ == "__main__":
    main()
