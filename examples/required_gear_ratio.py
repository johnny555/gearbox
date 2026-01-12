#!/usr/bin/env python3
"""Calculate required gear ratio for 10% grade with original motors."""

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
    print("Required Gear Ratio Analysis")
    print("=" * 70)
    
    print(f"\nMotor specs:")
    print(f"  MG1: {pt.mg1.params.P_max/1e3:.0f} kW, {pt.mg1.params.T_max:,.0f} N·m max")
    print(f"  MG2: {pt.mg2.params.P_max/1e3:.0f} kW, {pt.mg2.params.T_max:,.0f} N·m max")
    
    # At standstill
    rpm_MG1 = 800 * (1 + rho)  # 3200 rpm
    T_MG1_max = pt.mg1.get_max_torque(rpm_MG1)
    T_e_usable = (1 + rho) * T_MG1_max
    T_ring_from_engine = rho / (1 + rho) * T_e_usable
    T_MG2_max = pt.mg2.params.T_max
    T_ring_available = T_ring_from_engine + T_MG2_max
    
    print(f"\nAt standstill (MG1 @ {rpm_MG1:.0f} rpm):")
    print(f"  MG1 max torque: {T_MG1_max:,.0f} N·m")
    print(f"  Engine usable:  {T_e_usable:,.0f} N·m")
    print(f"  Engine → ring:  {T_ring_from_engine:,.0f} N·m")
    print(f"  MG2 direct:     {T_MG2_max:,.0f} N·m")
    print(f"  TOTAL at ring:  {T_ring_available:,.0f} N·m")
    
    # Required force at wheel for 10% grade
    m = pt.vehicle.mass
    g = 9.81
    r_w = pt.vehicle.r_wheel
    C_r = pt.vehicle.params.C_r
    grade = 0.10
    
    theta = np.arctan(grade)
    F_grade = m * g * np.sin(theta)
    F_roll = m * g * C_r * np.cos(theta)
    F_total = F_grade + F_roll
    T_wheel_needed = F_total * r_w
    
    print(f"\nFor 10% grade (loaded):")
    print(f"  F_grade: {F_grade:,.0f} N")
    print(f"  F_roll:  {F_roll:,.0f} N")
    print(f"  T_wheel: {T_wheel_needed:,.0f} N·m")
    
    # Required gear ratio
    eta = pt.gearbox.params.eta_total
    K_needed = T_wheel_needed / (T_ring_available * eta)
    K_final = pt.gearbox.params.K_final
    K_gear_needed = K_needed / K_final
    
    print(f"\nRequired gear ratio:")
    print(f"  Total K needed: {K_needed:.1f}:1")
    print(f"  With K_final={K_final:.0f}: K_low = {K_gear_needed:.1f}:1")
    
    # What speed at MG2 limit?
    rpm_MG2_max = pt.mg2.params.rpm_max
    v_max_low = (rpm_MG2_max * np.pi / 30) * r_w / K_needed * 3.6
    
    print(f"\nWith this gear ratio:")
    print(f"  Max speed (MG2 limited): {v_max_low:.1f} km/h in low gear")
    
    # Alternative: what if we add more MG2 torque?
    print(f"\n--- Alternative: Increase MG2 torque ---")
    for T_MG2_alt in [2000, 3000, 4000, 5000, 6000, 8000, 10000]:
        T_ring_alt = T_ring_from_engine + T_MG2_alt
        K_needed_alt = T_wheel_needed / (T_ring_alt * eta)
        K_gear_alt = K_needed_alt / K_final
        print(f"  T_MG2 = {T_MG2_alt:>6,} N·m → K_low = {K_gear_alt:.1f}:1 (total {K_needed_alt:.1f}:1)")

if __name__ == "__main__":
    main()
