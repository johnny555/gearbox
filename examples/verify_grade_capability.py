#!/usr/bin/env python3
"""Verify 10% grade capability with current configuration."""

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
    print("CAT 793D E-CVT Grade Capability Verification")
    print("=" * 70)
    
    # Print configuration
    print(f"\nConfiguration:")
    print(f"  MG1: {pt.mg1.params.P_max/1e6:.1f} MW, {pt.mg1.params.T_max:,.0f} N·m max")
    print(f"  MG2: {pt.mg2.params.P_max/1e6:.1f} MW, {pt.mg2.params.T_max:,.0f} N·m max")
    print(f"  MG2 boost: {pt.mg2.params.P_boost/1e6:.1f} MW")
    print(f"  Low gear: {pt.gearbox.params.K_low:.1f}:1")
    print(f"  Final drive: {pt.gearbox.params.K_final:.1f}:1")
    print(f"  Total low gear: {pt.gearbox.params.K_low * pt.gearbox.params.K_final:.1f}:1")
    print(f"  Vehicle mass: {pt.vehicle.mass:,.0f} kg")
    
    # At standstill with engine at 800 rpm
    rpm_e = 800
    rpm_MG1 = rpm_e * (1 + rho)
    
    T_MG1_max = pt.mg1.get_max_torque(rpm_MG1)
    T_e_usable = (1 + rho) * T_MG1_max
    T_ring_from_engine = rho / (1 + rho) * T_e_usable
    T_MG2_normal = pt.mg2.params.T_max
    T_MG2_boost = pt.mg2.get_max_torque(0, use_boost=True)  # At 0 rpm, uses T_max
    
    # Total torque available at ring
    T_ring_normal = T_ring_from_engine + T_MG2_normal
    T_ring_boost = T_ring_from_engine + T_MG2_boost
    
    print(f"\n--- Torque at Ring (Standstill) ---")
    print(f"  From engine path: {T_ring_from_engine:,.0f} N·m")
    print(f"  MG2 (normal):     {T_MG2_normal:,.0f} N·m")
    print(f"  MG2 (boost):      {T_MG2_boost:,.0f} N·m")
    print(f"  Total (normal):   {T_ring_normal:,.0f} N·m")
    print(f"  Total (boost):    {T_ring_boost:,.0f} N·m")
    
    # What grade can we achieve?
    K_total = pt.gearbox.params.K_low * pt.gearbox.params.K_final
    m = pt.vehicle.mass
    g = 9.81
    r_w = pt.vehicle.r_wheel
    C_r = pt.vehicle.params.C_r
    eta = pt.gearbox.params.eta_total
    
    T_wheel_normal = T_ring_normal * K_total * eta
    T_wheel_boost = T_ring_boost * K_total * eta
    
    F_drive_normal = T_wheel_normal / r_w
    F_drive_boost = T_wheel_boost / r_w
    
    # grade_max ≈ F_drive / (m*g) - C_r
    grade_normal = F_drive_normal / (m * g) - C_r
    grade_boost = F_drive_boost / (m * g) - C_r
    
    print(f"\n--- Grade Capability ---")
    print(f"  Wheel torque (normal): {T_wheel_normal:,.0f} N·m")
    print(f"  Wheel torque (boost):  {T_wheel_boost:,.0f} N·m")
    print(f"  Max grade (normal):    {grade_normal*100:.1f}%")
    print(f"  Max grade (boost):     {grade_boost*100:.1f}%")
    
    # Verify against 10% grade requirement
    print(f"\n--- 10% Grade Check ---")
    T_load_10pct = pt.get_load_torque(0.0, 0.10, 1)  # At ring, low gear
    
    gap_normal = T_load_10pct - T_ring_normal
    gap_boost = T_load_10pct - T_ring_boost
    
    print(f"  Need at ring:  {T_load_10pct:,.0f} N·m")
    print(f"  Have (normal): {T_ring_normal:,.0f} N·m → Gap: {gap_normal:,.0f} N·m")
    print(f"  Have (boost):  {T_ring_boost:,.0f} N·m → Gap: {gap_boost:,.0f} N·m")
    
    if gap_boost <= 0:
        print(f"\n  ✓ CAN climb 10% grade with boost!")
    else:
        print(f"\n  ✗ Cannot climb 10% grade even with boost")
        print(f"    Additional MG2 torque needed: {gap_boost:,.0f} N·m")
    
    # What about empty truck?
    print(f"\n--- Empty Truck (for comparison) ---")
    pt_empty = create_cat_793d_powertrain(payload_fraction=0.0)
    pt_empty.vehicle.params.C_r = 0.015
    
    T_load_10pct_empty = pt_empty.get_load_torque(0.0, 0.10, 1)
    print(f"  Empty mass: {pt_empty.vehicle.mass:,.0f} kg")
    print(f"  Need at ring (10%): {T_load_10pct_empty:,.0f} N·m")
    print(f"  Have (boost): {T_ring_boost:,.0f} N·m")
    
    if T_ring_boost >= T_load_10pct_empty:
        print(f"  ✓ CAN climb 10% grade empty!")

if __name__ == "__main__":
    main()
