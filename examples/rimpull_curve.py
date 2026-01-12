#!/usr/bin/env python3
"""Generate rimpull curve for CAT 793D E-CVT."""

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
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81
    
    # Get engine max power (calculate from torque curve)
    P_engine_max = pt.engine.get_max_torque(1200) * 1200 * np.pi / 30
    
    print("=" * 70)
    print("CAT 793D E-CVT Rimpull Curve")
    print("=" * 70)
    
    print(f"\nConfiguration:")
    print(f"  MG1: {pt.mg1.params.P_max/1e3:.0f} kW, {pt.mg1.params.T_max:,.0f} N·m")
    print(f"  MG2: {pt.mg2.params.P_max/1e3:.0f} kW, {pt.mg2.params.T_max:,.0f} N·m")
    print(f"  Engine: ~{P_engine_max/1e6:.1f} MW peak")
    print(f"  Low gear: {pt.gearbox.params.K_low}:1 (total {pt.gearbox.params.K_low * pt.gearbox.params.K_final}:1)")
    print(f"  High gear: {pt.gearbox.params.K_high}:1 (total {pt.gearbox.params.K_high * pt.gearbox.params.K_final:.1f}:1)")
    print(f"  Vehicle mass: {m:,.0f} kg")
    
    # Speed range
    v_range = np.linspace(0.1, 60, 200)  # 0.1 to 60 km/h
    v_ms = v_range / 3.6
    
    # Calculate rimpull for each gear
    rimpull_low = []
    rimpull_high = []
    power_low = []
    power_high = []
    
    for v in v_ms:
        for gear in [1, 2]:  # Low, High
            K_total = pt.gearbox.get_total_ratio(gear)
            eta = pt.gearbox.params.eta_total
            
            # Ring speed from vehicle speed
            omega_r = v / r_w * K_total
            rpm_r = omega_r * 30 / np.pi
            
            # Check MG2 speed limit
            if rpm_r > pt.mg2.params.rpm_max:
                F_rimpull = 0
                P = 0
            else:
                # Engine speed - assume optimal around 1200-1400 rpm
                rpm_e = 1200  # Near peak torque
                omega_e = rpm_e * np.pi / 30
                
                # MG1 speed from Willis equation
                omega_MG1 = (1 + rho) * omega_e - rho * omega_r
                rpm_MG1 = omega_MG1 * 30 / np.pi
                
                # Check MG1 speed limits and adjust engine speed
                if abs(rpm_MG1) > pt.mg1.params.rpm_max:
                    if rpm_MG1 > 0:
                        omega_MG1_limit = pt.mg1.params.rpm_max * np.pi / 30
                        omega_e = (omega_MG1_limit + rho * omega_r) / (1 + rho)
                    else:
                        omega_MG1_limit = -pt.mg1.params.rpm_max * np.pi / 30
                        omega_e = (omega_MG1_limit + rho * omega_r) / (1 + rho)
                    
                    rpm_e = omega_e * 30 / np.pi
                    omega_MG1 = (1 + rho) * omega_e - rho * omega_r
                    rpm_MG1 = omega_MG1 * 30 / np.pi
                
                # Clamp engine to valid range
                rpm_e = np.clip(rpm_e, pt.engine.params.rpm_min, pt.engine.params.rpm_max)
                omega_e = rpm_e * np.pi / 30
                omega_MG1 = (1 + rho) * omega_e - rho * omega_r
                rpm_MG1 = omega_MG1 * 30 / np.pi
                
                # Get max torques
                T_e_max = pt.engine.get_max_torque(rpm_e)
                T_MG1_max_abs = pt.mg1.get_max_torque(abs(rpm_MG1))
                T_MG2_max = pt.mg2.get_max_torque(rpm_r, use_boost=True)
                
                # MG1 must react engine torque: T_MG1 = -T_e / (1+rho)
                # Max engine torque limited by MG1
                T_e_limited = min(T_e_max, (1 + rho) * T_MG1_max_abs)
                
                # Ring torque from engine path
                T_MG1 = -T_e_limited / (1 + rho)
                T_ring_engine = -rho * T_MG1  # = rho/(1+rho) * T_e
                
                # Total ring torque
                T_ring_total = T_ring_engine + T_MG2_max
                
                # Wheel torque and rimpull
                T_wheel = T_ring_total * K_total * eta
                F_rimpull = T_wheel / r_w
                
                # Power at wheel
                P = F_rimpull * v / 1e3  # kW
            
            if gear == 1:
                rimpull_low.append(F_rimpull)
                power_low.append(P)
            else:
                rimpull_high.append(F_rimpull)
                power_high.append(P)
    
    rimpull_low = np.array(rimpull_low)
    rimpull_high = np.array(rimpull_high)
    power_low = np.array(power_low)
    power_high = np.array(power_high)
    
    # Combined envelope (max of both gears)
    rimpull_max = np.maximum(rimpull_low, rimpull_high)
    
    # Grade resistance lines
    grades = [0.02, 0.05, 0.10, 0.15]
    grade_forces = {}
    for grade in grades:
        theta = np.arctan(grade)
        F_grade = m * g * np.sin(theta)
        F_roll = m * g * pt.vehicle.params.C_r * np.cos(theta)
        grade_forces[grade] = F_grade + F_roll
    
    # Print key values
    print(f"\n--- Rimpull at Key Speeds ---")
    print(f"{'Speed':>10} {'Low Gear':>15} {'High Gear':>15} {'Max':>15}")
    print(f"{'km/h':>10} {'kN':>15} {'kN':>15} {'kN':>15}")
    print("-" * 60)
    for v in [0, 5, 10, 15, 20, 30, 40, 50]:
        idx = int(v / 60 * (len(v_range) - 1))
        if idx < len(rimpull_low):
            print(f"{v:>10} {rimpull_low[idx]/1e3:>15.1f} {rimpull_high[idx]/1e3:>15.1f} {rimpull_max[idx]/1e3:>15.1f}")
    
    # Print grade capability
    print(f"\n--- Grade Capability (where rimpull = resistance) ---")
    for grade, F_resist in grade_forces.items():
        crossings = np.where(rimpull_max >= F_resist)[0]
        if len(crossings) > 0:
            max_speed_idx = crossings[-1]
            max_speed = v_range[max_speed_idx]
            print(f"  {grade*100:.0f}% grade: can maintain up to {max_speed:.1f} km/h")
        else:
            print(f"  {grade*100:.0f}% grade: cannot climb (need {F_resist/1e3:.0f} kN, have {rimpull_max[0]/1e3:.0f} kN)")
    
    # Plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # Rimpull curve
    ax1.plot(v_range, rimpull_low/1e3, 'b-', linewidth=2, label='Low Gear (5:1)')
    ax1.plot(v_range, rimpull_high/1e3, 'r-', linewidth=2, label='High Gear (0.67:1)')
    ax1.fill_between(v_range, 0, rimpull_max/1e3, alpha=0.1, color='blue')
    
    # Grade lines
    colors = ['green', 'orange', 'red', 'purple']
    for (grade, F_resist), color in zip(grade_forces.items(), colors):
        ax1.axhline(F_resist/1e3, color=color, linestyle=':', linewidth=2, alpha=0.8, 
                   label=f'{grade*100:.0f}% grade ({F_resist/1e3:.0f} kN)')
    
    # Rolling resistance (flat)
    F_roll_flat = m * g * pt.vehicle.params.C_r
    ax1.axhline(F_roll_flat/1e3, color='gray', linestyle='--', linewidth=1.5, alpha=0.6,
               label=f'Flat ground ({F_roll_flat/1e3:.0f} kN)')
    
    ax1.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax1.set_ylabel('Rimpull [kN]', fontsize=12)
    ax1.set_title('CAT 793D E-CVT Rimpull Curve\n(MG1: 200kW, MG2: 350kW, Loaded: 377t)', fontsize=12)
    ax1.legend(loc='upper right', fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.set_xlim(0, 60)
    ax1.set_ylim(0, max(rimpull_max)/1e3 * 1.2)
    
    # Power curve
    ax2.plot(v_range, power_low, 'b-', linewidth=2, label='Low Gear')
    ax2.plot(v_range, power_high, 'r-', linewidth=2, label='High Gear')
    ax2.fill_between(v_range, 0, np.maximum(power_low, power_high), alpha=0.1, color='blue')
    
    ax2.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax2.set_ylabel('Power at Wheels [kW]', fontsize=12)
    ax2.set_title('Power at Wheels vs Speed', fontsize=12)
    ax2.legend(loc='upper left', fontsize=9)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim(0, 60)
    
    plt.tight_layout()
    plt.savefig('rimpull_curve.png', dpi=150)
    print(f"\nPlot saved to: rimpull_curve.png")
    plt.show()

if __name__ == "__main__":
    main()
