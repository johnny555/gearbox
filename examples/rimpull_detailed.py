#!/usr/bin/env python3
"""Generate detailed rimpull analysis with RPMs and torques.

Three-panel figure:
1. Top: Rimpull curve
2. Middle: Motor/engine RPMs
3. Bottom: Torques at different drivetrain points
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import matplotlib.pyplot as plt
from ecvt_sim.powertrain import create_cat_793d_ecvt_powertrain


def main():
    # Create powertrain with modular drivetrain
    pt = create_cat_793d_ecvt_powertrain(
        payload_fraction=1.0,
        mg1_sun_ratio=3.5,
        post_ring_ratio=1.0,        # No reduction after MG2/ring
        gearbox_ratios=[3.0, 1.0],
        intermediate_ratio=2.85,
        diff_ratio=1.0,             # 1:1 differential
        hub_ratio=10.83,
    )
    pt.vehicle.params.C_r = 0.015

    # Get parameters
    rho = pt.planetary.rho
    K_mg1 = pt.mg1_reduction.ratio
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81

    # Get total ratios for each gear
    pt.set_gear(0)  # Low gear
    K_total_low = pt.get_output_ratio()
    eta_low = pt.get_output_efficiency()

    pt.set_gear(1)  # High gear
    K_total_high = pt.get_output_ratio()
    eta_high = pt.get_output_efficiency()

    # Motor parameters
    MG1_P_peak = pt.mg1.params.P_boost or pt.mg1.params.P_max
    MG1_T_max = pt.mg1.params.T_max
    MG1_rpm_max = pt.mg1.params.rpm_max
    MG1_base_rpm_peak = MG1_P_peak / MG1_T_max * 30 / np.pi

    MG2_P_continuous = pt.mg2.params.P_max
    MG2_T_max = pt.mg2.params.T_max
    MG2_rpm_max = pt.mg2.params.rpm_max

    # Engine parameters
    rpm_e = 1200
    omega_e = rpm_e * np.pi / 30
    T_e_max = pt.engine.get_max_torque(rpm_e)

    # Helper functions
    def get_mg1_torque(rpm_mg1):
        """Get MG1 max torque at given speed (using peak power)."""
        if rpm_mg1 <= MG1_base_rpm_peak:
            return MG1_T_max
        elif rpm_mg1 <= MG1_rpm_max:
            return MG1_P_peak / (rpm_mg1 * np.pi / 30)
        else:
            return 0

    def get_mg2_torque(rpm_mg2):
        """Get MG2 max torque at given speed."""
        base_rpm = MG2_P_continuous / MG2_T_max * 30 / np.pi
        if rpm_mg2 <= base_rpm:
            return MG2_T_max
        elif rpm_mg2 <= MG2_rpm_max:
            return MG2_P_continuous / (rpm_mg2 * np.pi / 30)
        else:
            return 0

    # Speed range
    v_range = np.linspace(0.1, 70, 300)
    v_ms = v_range / 3.6

    # Data storage for both gears
    data = {
        'low': {
            'rimpull': [], 'rpm_mg1': [], 'rpm_mg2': [], 'rpm_sun': [],
            'T_mg1': [], 'T_mg2': [], 'T_sun': [], 'T_ring': [], 'T_wheel': [],
            'T_engine_used': [],
        },
        'high': {
            'rimpull': [], 'rpm_mg1': [], 'rpm_mg2': [], 'rpm_sun': [],
            'T_mg1': [], 'T_mg2': [], 'T_sun': [], 'T_ring': [], 'T_wheel': [],
            'T_engine_used': [],
        },
    }

    for v in v_ms:
        for gear_name, K_total, eta_total in [
            ('low', K_total_low, eta_low),
            ('high', K_total_high, eta_high),
        ]:
            d = data[gear_name]

            # Ring speed from vehicle speed
            omega_r = v / r_w * K_total
            rpm_r = omega_r * 30 / np.pi

            # MG2 speed = ring speed
            rpm_mg2 = rpm_r

            # Check MG2 speed limit
            if rpm_mg2 > MG2_rpm_max:
                d['rimpull'].append(0)
                d['rpm_mg1'].append(np.nan)
                d['rpm_mg2'].append(np.nan)
                d['rpm_sun'].append(np.nan)
                d['T_mg1'].append(0)
                d['T_mg2'].append(0)
                d['T_sun'].append(0)
                d['T_ring'].append(0)
                d['T_wheel'].append(0)
                d['T_engine_used'].append(0)
                continue

            # MG2 torque
            T_MG2 = get_mg2_torque(rpm_mg2)

            # Sun speed from Willis equation
            omega_sun = (1 + rho) * omega_e - rho * omega_r
            rpm_sun = omega_sun * 30 / np.pi

            # MG1 speed (with reduction)
            rpm_MG1 = abs(rpm_sun) / K_mg1

            # MG1 torque available
            T_MG1_available = get_mg1_torque(rpm_MG1)

            # Sun torque = MG1 torque * reduction * efficiency
            eta_mg1 = pt.mg1_reduction.efficiency
            T_sun = T_MG1_available * K_mg1 * eta_mg1

            # Engine torque limited by sun torque capacity
            T_e_usable = min(T_e_max, T_sun * (1 + rho))

            # Ring torque from engine + MG2
            T_ring_engine = rho / (1 + rho) * T_e_usable
            T_ring_total = T_ring_engine + T_MG2

            # Wheel torque and rimpull
            T_wheel = T_ring_total * K_total * eta_total
            F = T_wheel / r_w

            # Store data
            d['rimpull'].append(F)
            d['rpm_mg1'].append(rpm_MG1)
            d['rpm_mg2'].append(rpm_mg2)
            d['rpm_sun'].append(rpm_sun)
            d['T_mg1'].append(T_MG1_available)
            d['T_mg2'].append(T_MG2)
            d['T_sun'].append(T_sun)
            d['T_ring'].append(T_ring_total)
            d['T_wheel'].append(T_wheel)
            d['T_engine_used'].append(T_e_usable)

    # Convert to arrays
    for gear in ['low', 'high']:
        for key in data[gear]:
            data[gear][key] = np.array(data[gear][key])

    # Create 3-panel figure
    fig, axes = plt.subplots(3, 1, figsize=(14, 14), sharex=True)

    # === TOP PANEL: Rimpull ===
    ax1 = axes[0]
    ax1.plot(v_range, data['low']['rimpull']/1e3, 'b-', linewidth=2.5, label=f'Low Gear ({K_total_low:.0f}:1)')
    ax1.plot(v_range, data['high']['rimpull']/1e3, 'r-', linewidth=2.5, label=f'High Gear ({K_total_high:.1f}:1)')

    rimpull_max = np.maximum(data['low']['rimpull'], data['high']['rimpull'])
    ax1.fill_between(v_range, 0, rimpull_max/1e3, alpha=0.15, color='blue')

    # Grade lines
    grades = [0.10, 0.15, 0.20]
    colors = ['orange', 'red', 'darkred']
    for grade, color in zip(grades, colors):
        theta = np.arctan(grade)
        F_resist = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
        ax1.axhline(F_resist/1e3, color=color, linestyle=':', linewidth=1.5, alpha=0.7,
                   label=f'{grade*100:.0f}% grade ({F_resist/1e3:.0f} kN)')

    ax1.set_ylabel('Rimpull [kN]', fontsize=12)
    ax1.set_title(f'CAT 793D E-CVT Detailed Analysis\n'
                  f'Engine: {T_e_max:,.0f} N-m @ {rpm_e} rpm | MG1: {MG1_T_max:,} N-m | MG2: {MG2_T_max:,} N-m | Mass: {m/1e3:.0f}t',
                  fontsize=11)
    ax1.legend(loc='upper right', fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.set_ylim(0, max(rimpull_max)/1e3 * 1.1)

    # === MIDDLE PANEL: RPMs ===
    ax2 = axes[1]

    # Engine RPM (constant)
    ax2.axhline(rpm_e, color='green', linestyle='-', linewidth=2, label=f'Engine ({rpm_e} rpm)')

    # MG1 RPM
    ax2.plot(v_range, data['low']['rpm_mg1'], 'b-', linewidth=2, label='MG1 (Low)')
    ax2.plot(v_range, data['high']['rpm_mg1'], 'b--', linewidth=2, label='MG1 (High)')

    # MG2 RPM
    ax2.plot(v_range, data['low']['rpm_mg2'], 'r-', linewidth=2, label='MG2/Ring (Low)')
    ax2.plot(v_range, data['high']['rpm_mg2'], 'r--', linewidth=2, label='MG2/Ring (High)')

    # Sun RPM (can be negative)
    ax2.plot(v_range, data['low']['rpm_sun'], 'purple', linestyle='-', linewidth=1.5, alpha=0.7, label='Sun (Low)')
    ax2.plot(v_range, data['high']['rpm_sun'], 'purple', linestyle='--', linewidth=1.5, alpha=0.7, label='Sun (High)')

    # Speed limits
    ax2.axhline(MG1_rpm_max, color='blue', linestyle=':', alpha=0.5, label=f'MG1 max ({MG1_rpm_max:.0f})')
    ax2.axhline(MG2_rpm_max, color='red', linestyle=':', alpha=0.5, label=f'MG2 max ({MG2_rpm_max:.0f})')
    ax2.axhline(0, color='black', linestyle='-', linewidth=0.5, alpha=0.5)

    ax2.set_ylabel('Speed [rpm]', fontsize=12)
    ax2.legend(loc='upper right', fontsize=8, ncol=2)
    ax2.grid(True, alpha=0.3)
    ax2.set_ylim(-2000, max(MG1_rpm_max, MG2_rpm_max) * 1.1)

    # === BOTTOM PANEL: Torques ===
    ax3 = axes[2]

    # Engine torque used
    ax3.plot(v_range, data['low']['T_engine_used']/1e3, 'g-', linewidth=2, label='Engine used (Low)')
    ax3.plot(v_range, data['high']['T_engine_used']/1e3, 'g--', linewidth=2, label='Engine used (High)')
    ax3.axhline(T_e_max/1e3, color='green', linestyle=':', alpha=0.5, label=f'Engine max ({T_e_max/1e3:.1f} kN-m)')

    # MG1 torque
    ax3.plot(v_range, data['low']['T_mg1']/1e3, 'b-', linewidth=2, label='MG1 (Low)')
    ax3.plot(v_range, data['high']['T_mg1']/1e3, 'b--', linewidth=2, label='MG1 (High)')

    # MG2 torque
    ax3.plot(v_range, data['low']['T_mg2']/1e3, 'r-', linewidth=2, label='MG2 (Low)')
    ax3.plot(v_range, data['high']['T_mg2']/1e3, 'r--', linewidth=2, label='MG2 (High)')

    # Sun torque (MG1 * reduction)
    ax3.plot(v_range, data['low']['T_sun']/1e3, 'purple', linestyle='-', linewidth=1.5, alpha=0.7, label='Sun (Low)')
    ax3.plot(v_range, data['high']['T_sun']/1e3, 'purple', linestyle='--', linewidth=1.5, alpha=0.7, label='Sun (High)')

    # Ring torque
    ax3.plot(v_range, data['low']['T_ring']/1e3, 'orange', linestyle='-', linewidth=2, label='Ring total (Low)')
    ax3.plot(v_range, data['high']['T_ring']/1e3, 'orange', linestyle='--', linewidth=2, label='Ring total (High)')

    ax3.set_xlabel('Vehicle Speed [km/h]', fontsize=12)
    ax3.set_ylabel('Torque [kN-m]', fontsize=12)
    ax3.legend(loc='upper right', fontsize=8, ncol=2)
    ax3.grid(True, alpha=0.3)
    ax3.set_xlim(0, 70)

    plt.tight_layout()
    plt.savefig('rimpull_detailed.png', dpi=150)
    print(f"Plot saved to: rimpull_detailed.png")
    plt.show()


if __name__ == "__main__":
    main()
