#!/usr/bin/env python3
"""Generate rimpull curve with torque converter (TC before planetary)."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho  # 3.0
    r_w = pt.vehicle.r_wheel  # 1.78 m
    m = pt.vehicle.mass
    g = 9.81
    K_low = pt.gearbox.params.K_low * pt.gearbox.params.K_final  # 80:1
    K_high = pt.gearbox.params.K_high * pt.gearbox.params.K_final  # 10.7:1
    eta = pt.gearbox.params.eta_total
    
    # Torque converter specs
    TC_stall_ratio = 2.5
    TC_coupling_speed = 0.8  # TC couples at 80% speed ratio
    
    print("=" * 80)
    print("CAT 793D E-CVT + Torque Converter Rimpull Curve")
    print("=" * 80)
    
    print(f"\nConfiguration:")
    print(f"  Engine: ~1.8 MW, {pt.engine.get_max_torque(1200):,.0f} N·m peak")
    print(f"  MG1: {pt.mg1.params.P_max/1e3:.0f} kW, {pt.mg1.params.T_max:,.0f} N·m")
    print(f"  MG2: {pt.mg2.params.P_max/1e3:.0f} kW (boost {pt.mg2.params.P_boost/1e3:.0f} kW), {pt.mg2.params.T_max:,.0f} N·m")
    print(f"  Torque Converter: {TC_stall_ratio}:1 stall ratio (before planetary)")
    print(f"  Low gear: {K_low:.0f}:1 total")
    print(f"  High gear: {K_high:.1f}:1 total")
    print(f"  Wheel radius: {r_w:.2f} m")
    print(f"  Vehicle mass: {m:,.0f} kg")
    
    # Speed range
    v_range = np.linspace(0.1, 50, 200)  # km/h
    v_ms = v_range / 3.6
    
    # Calculate rimpull for different modes
    rimpull_ecvt_low = []      # Normal e-CVT, low gear (no TC benefit)
    rimpull_ecvt_high = []     # Normal e-CVT, high gear
    rimpull_locked_tc_low = [] # Locked sun + TC, low gear
    rimpull_locked_tc_high = [] # Locked sun + TC, high gear
    
    for v in v_ms:
        # Engine at good operating point
        rpm_e = 1200
        omega_e = rpm_e * np.pi / 30
        T_e_max = pt.engine.get_max_torque(rpm_e)
        
        for gear, K_total in [(1, K_low), (2, K_high)]:
            # Ring speed from vehicle speed
            omega_r = v / r_w * K_total
            rpm_r = omega_r * 30 / np.pi
            
            # Check MG2 speed limit
            if rpm_r > pt.mg2.params.rpm_max:
                F_ecvt = 0
                F_locked_tc = 0
            else:
                # === Normal e-CVT mode (TC locked up, sun free) ===
                # MG1 speed from Willis
                omega_MG1 = (1 + rho) * omega_e - rho * omega_r
                rpm_MG1 = abs(omega_MG1 * 30 / np.pi)
                
                # MG1 limits engine torque
                T_MG1_max = pt.mg1.get_max_torque(rpm_MG1)
                T_e_usable = min(T_e_max, (1 + rho) * T_MG1_max)
                
                # Ring torque
                T_ring_engine = rho / (1 + rho) * T_e_usable
                T_MG2_max = pt.mg2.get_max_torque(rpm_r, use_boost=True)
                T_ring_ecvt = T_ring_engine + T_MG2_max
                
                # Rimpull
                F_ecvt = T_ring_ecvt * K_total * eta / r_w
                
                # === Locked Sun + TC mode ===
                # TC multiplies engine torque at stall
                # As speed increases, TC ratio approaches 1:1
                
                # Estimate TC ratio based on speed (simplified)
                # At low speed: full stall ratio, at high speed: 1:1
                v_stall_transition = 10 / 3.6  # TC couples by ~10 km/h
                if v < v_stall_transition:
                    TC_ratio = TC_stall_ratio - (TC_stall_ratio - 1) * (v / v_stall_transition)
                else:
                    TC_ratio = 1.0
                
                # Engine torque after TC
                T_after_TC = T_e_max * TC_ratio
                
                # Ring torque (sun locked, no MG1 limitation)
                T_ring_locked = rho / (1 + rho) * T_after_TC + T_MG2_max
                
                # Rimpull
                F_locked_tc = T_ring_locked * K_total * eta / r_w
            
            if gear == 1:
                rimpull_ecvt_low.append(F_ecvt)
                rimpull_locked_tc_low.append(F_locked_tc)
            else:
                rimpull_ecvt_high.append(F_ecvt)
                rimpull_locked_tc_high.append(F_locked_tc)
    
    rimpull_ecvt_low = np.array(rimpull_ecvt_low)
    rimpull_ecvt_high = np.array(rimpull_ecvt_high)
    rimpull_locked_tc_low = np.array(rimpull_locked_tc_low)
    rimpull_locked_tc_high = np.array(rimpull_locked_tc_high)
    
    # Print key values
    print(f"\n--- Rimpull at Key Speeds ---")
    print(f"{'Speed':<10} {'e-CVT Low':>12} {'e-CVT High':>12} {'Lock+TC Low':>12} {'Lock+TC High':>12}")
    print("-" * 62)
    
    for v_kmh in [0, 5, 10, 15, 20, 30, 40]:
        idx = int(v_kmh / 50 * (len(v_range) - 1))
        if idx < len(rimpull_ecvt_low):
            print(f"{v_kmh:<10} {rimpull_ecvt_low[idx]/1e3:>12.0f} {rimpull_ecvt_high[idx]/1e3:>12.0f} "
                  f"{rimpull_locked_tc_low[idx]/1e3:>12.0f} {rimpull_locked_tc_high[idx]/1e3:>12.0f}")
    
    # Grade resistance lines
    grades = [0.05, 0.10, 0.15, 0.20, 0.25]
    grade_forces = {}
    for grade in grades:
        theta = np.arctan(grade)
        F = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
        grade_forces[grade] = F
    
    print(f"\n--- Grade Capability ---")
    print(f"{'Grade':<8} {'Resistance':>12} {'e-CVT':>12} {'Locked+TC':>12}")
    print("-" * 48)
    for grade, F_resist in grade_forces.items():
        can_ecvt = "YES" if max(rimpull_ecvt_low) >= F_resist else "no"
        can_locked = "YES" if max(rimpull_locked_tc_low) >= F_resist else "no"
        print(f"{grade*100:>6.0f}% {F_resist/1e3:>12.0f} kN {can_ecvt:>12} {can_locked:>12}")
    
    # Plot
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # e-CVT mode
    ax.plot(v_range, rimpull_ecvt_low/1e3, 'b-', linewidth=2, label='e-CVT Mode - Low Gear')
    ax.plot(v_range, rimpull_ecvt_high/1e3, 'b--', linewidth=2, label='e-CVT Mode - High Gear')
    
    # Locked sun + TC mode
    ax.plot(v_range, rimpull_locked_tc_low/1e3, 'r-', linewidth=2.5, label='Locked Sun + TC - Low Gear')
    ax.plot(v_range, rimpull_locked_tc_high/1e3, 'r--', linewidth=2, label='Locked Sun + TC - High Gear')
    
    # Grade lines
    colors = ['green', 'orange', 'red', 'purple', 'brown']
    for (grade, F_resist), color in zip(grade_forces.items(), colors):
        ax.axhline(F_resist/1e3, color=color, linestyle=':', linewidth=1.5, alpha=0.7,
                   label=f'{grade*100:.0f}% grade ({F_resist/1e3:.0f} kN)')
    
    # Rolling resistance (flat)
    F_roll = m * g * pt.vehicle.params.C_r
    ax.axhline(F_roll/1e3, color='gray', linestyle='--', linewidth=1, alpha=0.5,
               label=f'Flat ground ({F_roll/1e3:.0f} kN)')
    
    ax.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax.set_ylabel('Rimpull [kN]', fontsize=12)
    ax.set_title('CAT 793D E-CVT + TC Rimpull Curve\n'
                 f'(MG1: {pt.mg1.params.P_max/1e3:.0f}kW, MG2: {pt.mg2.params.P_max/1e3:.0f}kW, '
                 f'TC: {TC_stall_ratio}:1 stall, Loaded: {m/1e3:.0f}t)', fontsize=11)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 50)
    ax.set_ylim(0, 1100)
    
    # Add annotations
    ax.annotate('TC stall multiplication\n(launch mode)', 
                xy=(2, rimpull_locked_tc_low[10]/1e3), 
                xytext=(8, 900),
                fontsize=9,
                arrowprops=dict(arrowstyle='->', color='red', alpha=0.7))
    
    ax.annotate('MG1 power limited\n(e-CVT mode)', 
                xy=(2, rimpull_ecvt_low[10]/1e3), 
                xytext=(12, 200),
                fontsize=9,
                arrowprops=dict(arrowstyle='->', color='blue', alpha=0.7))
    
    plt.tight_layout()
    plt.savefig('rimpull_with_tc.png', dpi=150)
    print(f"\nPlot saved to: rimpull_with_tc.png")
    plt.show()

if __name__ == "__main__":
    main()
