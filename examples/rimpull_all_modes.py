#!/usr/bin/env python3
"""Generate rimpull curve with all operating modes."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    grav = 9.81
    K_low = pt.gearbox.params.K_low * pt.gearbox.params.K_final
    K_high = pt.gearbox.params.K_high * pt.gearbox.params.K_final
    eta = pt.gearbox.params.eta_total
    
    TC_stall_ratio = 2.5
    
    print("=" * 80)
    print("CAT 793D E-CVT Rimpull Curve - All Operating Modes")
    print("=" * 80)
    
    print(f"\nConfiguration:")
    print(f"  Engine: {pt.engine.get_max_torque(1200):,.0f} N·m @ 1200 rpm")
    print(f"  MG1: {pt.mg1.params.P_max/1e3:.0f} kW, {pt.mg1.params.T_max:,.0f} N·m")
    print(f"  MG2: {pt.mg2.params.P_max/1e3:.0f} kW, {pt.mg2.params.T_max:,.0f} N·m")
    print(f"  TC stall ratio: {TC_stall_ratio}:1")
    print(f"  Low gear: {K_low:.0f}:1 | High gear: {K_high:.1f}:1")
    print(f"  Wheel radius: {r_w:.2f} m | Mass: {m:,.0f} kg")
    
    print(f"\nOperating Modes:")
    print(f"  1. e-CVT:      Sun free, TC locked (1:1) - efficient cruising")
    print(f"  2. Locked Sun: Sun locked, TC locked (1:1) - mid-range torque")
    print(f"  3. Lock+TC:    Sun locked, TC at stall - maximum launch torque")
    
    # Speed range
    v_range = np.linspace(0.1, 50, 200)
    v_ms = v_range / 3.6
    
    # Arrays for each mode (low gear only for clarity)
    rimpull_ecvt = []
    rimpull_locked_sun = []
    rimpull_locked_tc = []
    
    rpm_e = 1200
    omega_e = rpm_e * np.pi / 30
    T_e_max = pt.engine.get_max_torque(rpm_e)
    
    for v in v_ms:
        omega_r = v / r_w * K_low
        rpm_r = omega_r * 30 / np.pi
        
        if rpm_r > pt.mg2.params.rpm_max:
            rimpull_ecvt.append(0)
            rimpull_locked_sun.append(0)
            rimpull_locked_tc.append(0)
            continue
        
        # MG2 torque (same for all modes)
        T_MG2 = pt.mg2.get_max_torque(rpm_r, use_boost=True)
        
        # === Mode 1: e-CVT (sun free, TC locked at 1:1) ===
        omega_MG1 = (1 + rho) * omega_e - rho * omega_r
        rpm_MG1 = abs(omega_MG1 * 30 / np.pi)
        T_MG1_max = pt.mg1.get_max_torque(rpm_MG1)
        T_e_usable = min(T_e_max, (1 + rho) * T_MG1_max)
        T_ring_ecvt = rho / (1 + rho) * T_e_usable + T_MG2
        F_ecvt = T_ring_ecvt * K_low * eta / r_w
        rimpull_ecvt.append(F_ecvt)
        
        # === Mode 2: Locked Sun, TC locked (1:1) ===
        T_ring_locked = rho / (1 + rho) * T_e_max + T_MG2
        F_locked = T_ring_locked * K_low * eta / r_w
        rimpull_locked_sun.append(F_locked)
        
        # === Mode 3: Locked Sun + TC at stall ===
        v_stall_transition = 10 / 3.6
        if v < v_stall_transition:
            TC_ratio = TC_stall_ratio - (TC_stall_ratio - 1) * (v / v_stall_transition)
        else:
            TC_ratio = 1.0
        
        T_after_TC = T_e_max * TC_ratio
        T_ring_tc = rho / (1 + rho) * T_after_TC + T_MG2
        F_tc = T_ring_tc * K_low * eta / r_w
        rimpull_locked_tc.append(F_tc)
    
    rimpull_ecvt = np.array(rimpull_ecvt)
    rimpull_locked_sun = np.array(rimpull_locked_sun)
    rimpull_locked_tc = np.array(rimpull_locked_tc)
    
    # Print comparison
    print(f"\n--- Rimpull Comparison (Low Gear) ---")
    print(f"{'Speed':<8} {'e-CVT':>10} {'Locked Sun':>12} {'Lock+TC':>12}")
    print(f"{'km/h':<8} {'kN':>10} {'kN':>12} {'kN':>12}")
    print("-" * 46)
    
    for v_kmh in [0, 2, 5, 8, 10, 15, 20, 25, 30]:
        idx = int(v_kmh / 50 * (len(v_range) - 1))
        if idx < len(rimpull_ecvt):
            print(f"{v_kmh:<8} {rimpull_ecvt[idx]/1e3:>10.0f} {rimpull_locked_sun[idx]/1e3:>12.0f} {rimpull_locked_tc[idx]/1e3:>12.0f}")
    
    # Grade lines
    grades = [0.05, 0.10, 0.15, 0.20, 0.25]
    grade_forces = {}
    for grade in grades:
        theta = np.arctan(grade)
        F = m * grav * (np.sin(theta) + 0.015 * np.cos(theta))
        grade_forces[grade] = F
    
    print(f"\n--- Grade Capability ---")
    print(f"{'Grade':<8} {'Need':>10} {'e-CVT':>10} {'Locked':>10} {'Lock+TC':>10}")
    print("-" * 52)
    for grade, F in grade_forces.items():
        e = "YES" if max(rimpull_ecvt) >= F else "no"
        l = "YES" if max(rimpull_locked_sun) >= F else "no"
        t = "YES" if max(rimpull_locked_tc) >= F else "no"
        print(f"{grade*100:>6.0f}% {F/1e3:>10.0f} {e:>10} {l:>10} {t:>10}")
    
    # Plot
    fig, ax = plt.subplots(figsize=(12, 8))
    
    ax.plot(v_range, rimpull_ecvt/1e3, 'b-', linewidth=2, label='e-CVT Mode (sun free, TC 1:1)')
    ax.plot(v_range, rimpull_locked_sun/1e3, 'g-', linewidth=2.5, label='Locked Sun (TC 1:1)')
    ax.plot(v_range, rimpull_locked_tc/1e3, 'r-', linewidth=3, label='Locked Sun + TC Stall')
    
    # Shade the envelope
    envelope = np.maximum(np.maximum(rimpull_ecvt, rimpull_locked_sun), rimpull_locked_tc)
    ax.fill_between(v_range, 0, envelope/1e3, alpha=0.1, color='red')
    
    # Grade lines
    colors = ['green', 'orange', 'red', 'purple', 'brown']
    for (grade, F), color in zip(grade_forces.items(), colors):
        ax.axhline(F/1e3, color=color, linestyle=':', linewidth=1.5, alpha=0.7,
                   label=f'{grade*100:.0f}% grade ({F/1e3:.0f} kN)')
    
    ax.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax.set_ylabel('Rimpull [kN]', fontsize=12)
    ax.set_title('CAT 793D E-CVT Rimpull - All Operating Modes (Low Gear)\n'
                 f'MG1: {pt.mg1.params.P_max/1e3:.0f}kW | MG2: {pt.mg2.params.P_max/1e3:.0f}kW | '
                 f'TC: {TC_stall_ratio}:1 | Mass: {m/1e3:.0f}t', fontsize=11)
    ax.legend(loc='upper right', fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 35)
    ax.set_ylim(0, 1050)
    
    # Annotations
    ax.annotate('TC stall\nmultiplication', xy=(1, 950), fontsize=9, color='red', ha='center')
    ax.annotate('Full engine\ntorque', xy=(8, 470), fontsize=9, color='green', ha='center')
    ax.annotate('MG1 limited\n(sweet spot ~15 km/h)', xy=(15, 480), fontsize=9, color='blue', ha='center')
    
    plt.tight_layout()
    plt.savefig('rimpull_all_modes.png', dpi=150)
    print(f"\nPlot saved to: rimpull_all_modes.png")
    plt.show()

if __name__ == "__main__":
    main()
