#!/usr/bin/env python3
"""Explore effect of high-rpm MG1."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    
    rho = pt.planetary.rho
    
    print("=" * 80)
    print("High-RPM MG1 Analysis")
    print("=" * 80)
    
    print(f"\nCurrent MG1: {pt.mg1.params.P_max/1e3:.0f} kW, max {pt.mg1.params.rpm_max:.0f} rpm")
    print(f"Base speed: {pt.mg1.params.P_max / pt.mg1.params.T_max * 30/np.pi:.0f} rpm")
    
    print(f"\nKey insight: At standstill with engine at 1200 rpm:")
    print(f"  MG1 speed = (1+ρ)×ω_e = 4×1200 = 4800 rpm")
    print(f"  MG1 torque = P/ω = 200kW / 4800rpm = {200000 / (4800*np.pi/30):.0f} N·m")
    print(f"\nThis is POWER limited, not RPM limited!")
    print(f"Higher max RPM doesn't change the torque at 4800 rpm.")
    
    print(f"\n" + "=" * 80)
    print("What WOULD help: Lower MG1 speed at standstill")
    print("=" * 80)
    
    print(f"\nMG1 speed at standstill = (1+ρ) × engine_rpm")
    print(f"To reduce MG1 speed, we need SMALLER planetary ratio ρ")
    
    print(f"\n{'ρ':>6} {'MG1 rpm':>10} {'T_MG1':>10} {'T_e_usable':>12} {'T_ring_eng':>12} {'+MG2':>10} {'Rimpull':>12}")
    print("-" * 80)
    
    rpm_e = 1200
    omega_e = rpm_e * np.pi / 30
    T_MG2 = 2000  # N·m
    K_total = 45  # gear ratio
    r_w = 1.0  # wheel radius
    eta = 0.93  # efficiency
    P_MG1 = 200000  # W
    
    for rho_test in [3.0, 2.5, 2.0, 1.5, 1.0, 0.5]:
        # MG1 speed at standstill
        omega_MG1 = (1 + rho_test) * omega_e
        rpm_MG1 = omega_MG1 * 30 / np.pi
        
        # MG1 torque (power limited)
        T_MG1 = P_MG1 / omega_MG1
        
        # Usable engine torque
        T_e_usable = (1 + rho_test) * T_MG1
        
        # Ring torque from engine
        T_ring_eng = rho_test / (1 + rho_test) * T_e_usable
        
        # Total ring torque
        T_ring_total = T_ring_eng + T_MG2
        
        # Rimpull
        F = T_ring_total * K_total * eta / r_w
        
        print(f"{rho_test:>6.1f} {rpm_MG1:>10.0f} {T_MG1:>10.0f} {T_e_usable:>12.0f} {T_ring_eng:>12.0f} {T_ring_total:>10.0f} {F/1e3:>12.1f} kN")
    
    print(f"\n" + "=" * 80)
    print("The Math: Engine torque to ring is INDEPENDENT of ρ!")
    print("=" * 80)
    
    print(f"""
    T_MG1 = P_MG1 / ω_MG1 = P_MG1 / [(1+ρ)·ω_e]
    
    T_e_usable = (1+ρ) × T_MG1 = (1+ρ) × P_MG1 / [(1+ρ)·ω_e] = P_MG1 / ω_e
    
    This is constant regardless of ρ!
    At ω_e = {omega_e:.0f} rad/s: T_e_usable = {P_MG1/omega_e:.0f} N·m
    
    BUT the ring torque depends on ρ:
    T_ring_engine = ρ/(1+ρ) × T_e_usable = ρ/(1+ρ) × P_MG1/ω_e
    
    So HIGHER ρ = MORE ring torque from engine path!
    """)
    
    print("=" * 80)
    print("What if we could run engine SLOWER at standstill?")
    print("=" * 80)
    
    print(f"\nWith ρ=3, MG1 speed = 4×engine_rpm")
    print(f"If engine at 700 rpm (idle): MG1 = 2800 rpm")
    print(f"If engine at 500 rpm: MG1 = 2000 rpm")
    print(f"If engine at 300 rpm: MG1 = 1200 rpm")
    
    print(f"\n{'Engine rpm':>12} {'MG1 rpm':>10} {'T_MG1':>10} {'T_e_usable':>12} {'T_ring':>12} {'Rimpull':>12}")
    print("-" * 75)
    
    rho_test = 3.0
    for rpm_e in [1200, 1000, 800, 700, 600, 500, 400]:
        omega_e = rpm_e * np.pi / 30
        omega_MG1 = (1 + rho_test) * omega_e
        rpm_MG1 = omega_MG1 * 30 / np.pi
        
        # MG1 limited by either max torque or power
        T_MG1_power = P_MG1 / omega_MG1
        T_MG1 = min(T_MG1_power, 3000)  # 3000 N·m max
        
        T_e_usable = (1 + rho_test) * T_MG1
        T_ring_eng = rho_test / (1 + rho_test) * T_e_usable
        T_ring_total = T_ring_eng + T_MG2
        F = T_ring_total * K_total * eta / r_w
        
        limited = "(torque limited)" if T_MG1 >= 3000 else ""
        print(f"{rpm_e:>12} {rpm_MG1:>10.0f} {T_MG1:>10.0f} {T_e_usable:>12.0f} {T_ring_total:>12.0f} {F/1e3:>12.1f} kN {limited}")

if __name__ == "__main__":
    main()
