#!/usr/bin/env python3
"""Study what gear ratios would enable grade climbing."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho
    
    print("=" * 70)
    print("Gear Ratio Study for Grade Capability")
    print("=" * 70)
    
    # Available torque at ring
    rpm_MG1_standstill = 800 * (1 + rho)
    T_MG1_max = pt.mg1.get_max_torque(rpm_MG1_standstill)
    T_e_usable = (1 + rho) * T_MG1_max
    T_ring_from_engine = rho / (1 + rho) * T_e_usable
    T_MG2_max = pt.mg2.params.T_max
    T_ring_available = T_ring_from_engine + T_MG2_max
    
    print(f"\nAvailable torque at ring: {T_ring_available:,.0f} N·m")
    
    # Required force at wheel for different grades
    m = pt.vehicle.mass
    g = 9.81
    r_w = pt.vehicle.r_wheel
    
    print(f"\nRequired gear ratios (K = K_gear × K_final):")
    print(f"{'Grade':>8} {'F_total':>12} {'T_wheel':>14} {'K_needed':>12} {'K_gear (Kf=9)':>14}")
    print("-" * 65)
    
    K_final = 9.0
    
    for grade in [0.05, 0.10, 0.15, 0.20]:
        theta = np.arctan(grade)
        F_grade = m * g * np.sin(theta)
        F_roll = m * g * pt.vehicle.params.C_r * np.cos(theta)
        F_total = F_grade + F_roll
        T_wheel = F_total * r_w
        
        # K = T_wheel / T_ring
        K_needed = T_wheel / T_ring_available
        K_gear_needed = K_needed / K_final
        
        print(f"{grade*100:>7.0f}% {F_total:>12,.0f} {T_wheel:>14,.0f} {K_needed:>12.1f} {K_gear_needed:>14.2f}")
    
    print("\n" + "=" * 70)
    print("What if we increase low gear ratio?")
    print("=" * 70)
    
    # Current: K_low = 2.0
    # What if we go to 3.0 or 4.0?
    print(f"\nWith K_final = {K_final}:")
    
    for K_low in [2.0, 3.0, 4.0, 5.0]:
        K_total = K_low * K_final
        T_wheel = T_ring_available * K_total
        F_drive = T_wheel / r_w
        
        # Max grade = F_drive / (m*g) - C_r (simplified)
        grade_max = F_drive / (m * g) - pt.vehicle.params.C_r
        
        # MG2/ring speed at 10 km/h
        v = 10 / 3.6
        omega_wheel = v / r_w
        omega_ring = omega_wheel * K_total
        rpm_ring = omega_ring * 30 / np.pi
        
        print(f"\n  K_low = {K_low:.1f} (total K = {K_total:.1f})")
        print(f"    Wheel torque: {T_wheel:,.0f} N·m")
        print(f"    Max grade:    {grade_max*100:.1f}%")
        print(f"    Ring @ 10 km/h: {rpm_ring:.0f} rpm (MG2 max: {pt.mg2.params.rpm_max:.0f} rpm)")
    
    print("\n" + "=" * 70)
    print("What if we increase MG2 torque capacity?")
    print("=" * 70)
    
    K_low = 2.0
    K_total = K_low * K_final
    
    for T_MG2 in [4000, 6000, 8000, 10000, 15000]:
        T_ring = T_ring_from_engine + T_MG2
        T_wheel = T_ring * K_total
        F_drive = T_wheel / r_w
        grade_max = F_drive / (m * g) - pt.vehicle.params.C_r
        
        # Estimate MG2 power needed (assuming base speed 1200 rpm)
        P_MG2 = T_MG2 * 1200 * np.pi / 30 / 1e6
        
        print(f"  T_MG2 = {T_MG2:>6,} N·m → Grade: {grade_max*100:>5.1f}% (est. {P_MG2:.1f} MW motor)")
    
    print("\n" + "=" * 70)
    print("Combined: Higher gear ratio + More MG2 torque")
    print("=" * 70)
    
    target_grade = 0.10
    theta = np.arctan(target_grade)
    F_needed = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
    T_wheel_needed = F_needed * r_w
    
    print(f"\nTarget: 10% grade with loaded truck")
    print(f"Need {T_wheel_needed:,.0f} N·m at wheel")
    
    print(f"\nCombinations that achieve 10% grade:")
    print(f"{'K_low':>8} {'T_MG2':>10} {'T_ring':>12} {'T_wheel':>14} {'Achieves':>10}")
    print("-" * 60)
    
    for K_low in [2.0, 2.5, 3.0, 3.5, 4.0]:
        for T_MG2 in [4000, 6000, 8000, 10000, 12000]:
            T_ring = T_ring_from_engine + T_MG2
            K_total = K_low * K_final
            T_wheel = T_ring * K_total
            
            if abs(T_wheel - T_wheel_needed) < 50000:  # Within 50 kN·m
                status = "YES" if T_wheel >= T_wheel_needed else "no"
                print(f"{K_low:>8.1f} {T_MG2:>10,} {T_ring:>12,.0f} {T_wheel:>14,.0f} {status:>10}")

if __name__ == "__main__":
    main()
