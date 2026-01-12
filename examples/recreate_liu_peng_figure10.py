#!/usr/bin/env python3
"""Recreate Figure 10 from Liu & Peng (2008).

Figure 10 shows "Speed constraint calculation in THS" - a lever diagram
demonstrating how MG1 speed limits constrain the feasible operating region.

Reference values from paper:
- Planetary ratio: ρ = 78/30 = 2.6
- Optimal engine speed for 20 kW: ω_e_d = 2333 rpm
- MG1 max speed: 6500 rpm
- Resulting max MG2 speed: 730 rpm
- Resulting min vehicle speed: 12.6 mph

The paper's equation:
    ω_mg2_max = ω_e_d × (1 + 1/ρ) - ω_mg1_max × (1/ρ) = 730 rpm
    ⟹ v = 12.6 mph
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================================
# PRIUS PARAMETERS FROM LIU & PENG (2008)
# ============================================================================

Z_sun = 30
Z_ring = 78
rho = Z_ring / Z_sun  # = 2.6

K_final = 3.9         # Final drive ratio
r_wheel = 0.287       # m

# MG1 limits
MG1_rpm_max = 6500.0

# Reference operating point from paper
omega_e_d_rpm = 2333  # Optimal engine speed for 20 kW


def willis_mg1_speed(omega_e, omega_r, rho):
    """Willis equation: ω_MG1 = (1 + ρ)·ω_e - ρ·ω_r"""
    return (1 + rho) * omega_e - rho * omega_r


def willis_ring_speed(omega_e, omega_mg1, rho):
    """Willis equation solved for ring: ω_r = ((1+ρ)·ω_e - ω_MG1) / ρ"""
    return ((1 + rho) * omega_e - omega_mg1) / rho


def rpm_to_rads(rpm):
    return rpm * np.pi / 30


def rads_to_rpm(rads):
    return rads * 30 / np.pi


def ring_rpm_to_mph(ring_rpm, K_final, r_wheel):
    """Convert ring gear rpm to vehicle speed in mph."""
    omega_r = rpm_to_rads(ring_rpm)
    v_ms = omega_r * r_wheel / K_final
    v_mph = v_ms * 2.237  # m/s to mph
    return v_mph


def main():
    print("=" * 80)
    print("RECREATING FIGURE 10 FROM LIU & PENG (2008)")
    print("'Speed constraint calculation in THS'")
    print("=" * 80)

    print(f"\n--- Paper's Reference Values ---")
    print(f"  Planetary ratio (ρ): {rho:.2f} = {Z_ring}/{Z_sun}")
    print(f"  Optimal engine speed: {omega_e_d_rpm} rpm (for 20 kW)")
    print(f"  MG1 max speed: {MG1_rpm_max} rpm")
    print(f"  Final drive ratio: {K_final}")
    print(f"  Wheel radius: {r_wheel} m")

    # ========================================================================
    # VERIFY PAPER'S CALCULATION
    # ========================================================================
    print(f"\n--- Verifying Paper's Equation ---")
    print(f"  Paper's equation: ω_mg2_max = ω_e_d × (1 + 1/ρ) - ω_mg1_max × (1/ρ)")

    # Calculate using paper's formula
    omega_mg2_max_paper = omega_e_d_rpm * (1 + 1/rho) - MG1_rpm_max * (1/rho)
    print(f"  = {omega_e_d_rpm} × (1 + 1/{rho:.1f}) - {MG1_rpm_max} × (1/{rho:.1f})")
    print(f"  = {omega_e_d_rpm} × {1 + 1/rho:.3f} - {MG1_rpm_max} × {1/rho:.3f}")
    print(f"  = {omega_e_d_rpm * (1 + 1/rho):.0f} - {MG1_rpm_max * (1/rho):.0f}")
    print(f"  = {omega_mg2_max_paper:.0f} rpm")
    print(f"  Paper says: 730 rpm")
    print(f"  Match: {'YES' if abs(omega_mg2_max_paper - 730) < 5 else 'NO'}")

    # Convert to vehicle speed
    v_mph = ring_rpm_to_mph(omega_mg2_max_paper, K_final, r_wheel)
    print(f"\n  Vehicle speed: {v_mph:.1f} mph")
    print(f"  Paper says: 12.6 mph")
    print(f"  Match: {'YES' if abs(v_mph - 12.6) < 0.5 else 'NO'}")

    # ========================================================================
    # VERIFY WITH OUR WILLIS EQUATION
    # ========================================================================
    print(f"\n--- Verifying with Our Willis Equation ---")
    print(f"  Our Willis: ω_MG1 = (1 + ρ)·ω_e - ρ·ω_r")

    # At MG1 max speed, what is the ring speed?
    omega_e = rpm_to_rads(omega_e_d_rpm)
    omega_mg1_max = rpm_to_rads(MG1_rpm_max)

    # Solve: ω_r = ((1+ρ)·ω_e - ω_MG1) / ρ
    omega_r_max = ((1 + rho) * omega_e - omega_mg1_max) / rho
    ring_rpm_calc = rads_to_rpm(omega_r_max)

    print(f"  At engine = {omega_e_d_rpm} rpm, MG1 = {MG1_rpm_max} rpm:")
    print(f"  Ring speed = ((1+{rho:.1f}) × {omega_e_d_rpm} - {MG1_rpm_max}) / {rho:.1f}")
    print(f"            = {ring_rpm_calc:.0f} rpm")

    v_mph_calc = ring_rpm_to_mph(ring_rpm_calc, K_final, r_wheel)
    print(f"  Vehicle speed = {v_mph_calc:.1f} mph")

    # ========================================================================
    # CREATE FIGURE 10 RECREATION
    # ========================================================================
    print(f"\n--- Creating Figure 10 Recreation ---")

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # ----- Left plot: Lever diagram (like Figure 10) -----
    ax1 = axes[0]

    # Draw the lever
    lever_y = [0, 0]
    lever_x = [0, 1 + rho]  # Sun at 0, Carrier at 1, Ring at 1+ρ

    # Positions on lever
    sun_pos = 0
    carrier_pos = 1
    ring_pos = 1 + rho

    # Draw lever line
    ax1.plot([sun_pos, ring_pos], [0, 0], 'k-', linewidth=3)

    # Draw nodes
    ax1.plot(sun_pos, 0, 'bo', markersize=15, label='Sun (MG1)')
    ax1.plot(carrier_pos, 0, 'go', markersize=15, label='Carrier (Engine)')
    ax1.plot(ring_pos, 0, 'ro', markersize=15, label='Ring (Vehicle)')

    # Speed arrows (scaled for visualization)
    scale = 0.001  # Scale factor for visualization

    # Operating point from paper
    omega_e_show = omega_e_d_rpm
    omega_mg1_show = MG1_rpm_max
    omega_r_show = ring_rpm_calc

    # Draw speed arrows
    ax1.annotate('', xy=(sun_pos, omega_mg1_show * scale),
                 xytext=(sun_pos, 0),
                 arrowprops=dict(arrowstyle='->', color='blue', lw=2))
    ax1.annotate('', xy=(carrier_pos, omega_e_show * scale),
                 xytext=(carrier_pos, 0),
                 arrowprops=dict(arrowstyle='->', color='green', lw=2))
    ax1.annotate('', xy=(ring_pos, omega_r_show * scale),
                 xytext=(ring_pos, 0),
                 arrowprops=dict(arrowstyle='->', color='red', lw=2))

    # Draw the constraint line (speeds must be collinear on lever)
    ax1.plot([sun_pos, carrier_pos, ring_pos],
             [omega_mg1_show * scale, omega_e_show * scale, omega_r_show * scale],
             'k--', linewidth=1.5, alpha=0.7, label='Speed line')

    # Labels
    ax1.text(sun_pos, -0.8, 'M/G 1', ha='center', fontsize=11, fontweight='bold')
    ax1.text(carrier_pos, -0.8, 'Engine', ha='center', fontsize=11, fontweight='bold')
    ax1.text(ring_pos, -0.8, 'Vehicle', ha='center', fontsize=11, fontweight='bold')

    ax1.text(sun_pos - 0.3, omega_mg1_show * scale, f'ω_mg1_max\n= {MG1_rpm_max:.0f} rpm',
             ha='right', fontsize=10, color='blue')
    ax1.text(carrier_pos, omega_e_show * scale + 0.5, f'ω_e_d = {omega_e_show:.0f} rpm',
             ha='center', fontsize=10, color='green')
    ax1.text(ring_pos + 0.3, omega_r_show * scale, f'ω_mg2_max\n= {omega_r_show:.0f} rpm\n⇒ v = {v_mph_calc:.1f} mph',
             ha='left', fontsize=10, color='red')

    # Ratio annotation
    ax1.text((sun_pos + ring_pos) / 2, -1.5, f'ρ = {Z_ring}/{Z_sun} = {rho:.1f}',
             ha='center', fontsize=12)

    ax1.set_xlim(-1, ring_pos + 2)
    ax1.set_ylim(-2, 8)
    ax1.set_aspect('equal')
    ax1.axis('off')
    ax1.set_title('Figure 10 Recreation: Speed Constraint in THS\n(Lever Diagram at MG1 Max Speed)',
                  fontsize=12, fontweight='bold')

    # ----- Right plot: Feasible region (extension of Figure 10) -----
    ax2 = axes[1]

    # Calculate MG1 speed for various engine and vehicle speeds
    v_mph_range = np.linspace(0, 80, 200)
    v_ms_range = v_mph_range / 2.237
    omega_r_range = v_ms_range * K_final / r_wheel
    ring_rpm_range = rads_to_rpm(omega_r_range)

    # Plot MG1 speed at the reference engine speed
    omega_e_ref = rpm_to_rads(omega_e_d_rpm)
    omega_mg1_range = willis_mg1_speed(omega_e_ref, omega_r_range, rho)
    mg1_rpm_range = rads_to_rpm(omega_mg1_range)

    ax2.plot(v_mph_range, mg1_rpm_range, 'b-', linewidth=2.5,
             label=f'MG1 speed at engine = {omega_e_d_rpm} rpm')

    # MG1 limits
    ax2.axhline(MG1_rpm_max, color='red', linestyle='--', linewidth=2,
                label=f'MG1 max = {MG1_rpm_max} rpm')
    ax2.axhline(-MG1_rpm_max, color='red', linestyle='--', linewidth=2)

    # Mark the constraint point (from paper)
    ax2.plot(v_mph_calc, MG1_rpm_max, 'ko', markersize=12, zorder=5)
    ax2.annotate(f'Paper: v = 12.6 mph\nCalculated: v = {v_mph_calc:.1f} mph',
                 xy=(v_mph_calc, MG1_rpm_max),
                 xytext=(v_mph_calc + 15, MG1_rpm_max - 1500),
                 fontsize=10,
                 arrowprops=dict(arrowstyle='->', color='black'))

    # Shade infeasible region
    ax2.fill_between(v_mph_range, MG1_rpm_max, 10000,
                     where=(mg1_rpm_range > MG1_rpm_max),
                     color='red', alpha=0.2, label='Infeasible (MG1 over limit)')

    # Add other engine speeds for context
    for rpm_e in [1500, 2000, 3000]:
        omega_e_other = rpm_to_rads(rpm_e)
        omega_mg1_other = willis_mg1_speed(omega_e_other, omega_r_range, rho)
        mg1_rpm_other = rads_to_rpm(omega_mg1_other)
        ax2.plot(v_mph_range, mg1_rpm_other, '--', linewidth=1.5, alpha=0.6,
                 label=f'Engine = {rpm_e} rpm')

    ax2.axhline(0, color='gray', linestyle='-', linewidth=0.5)
    ax2.axvline(v_mph_calc, color='green', linestyle=':', linewidth=1.5, alpha=0.7)

    ax2.set_xlabel('Vehicle Speed [mph]', fontsize=12)
    ax2.set_ylabel('MG1 Speed [rpm]', fontsize=12)
    ax2.set_title('MG1 Speed vs Vehicle Speed\n(Kinematic Constraint from Willis Equation)', fontsize=12)
    ax2.legend(loc='upper right', fontsize=9)
    ax2.grid(True, alpha=0.3)
    ax2.set_xlim(0, 80)
    ax2.set_ylim(-4000, 10000)

    plt.tight_layout()
    plt.savefig('liu_peng_figure10_recreation.png', dpi=150)
    print(f"\nPlot saved to: liu_peng_figure10_recreation.png")
    plt.show()

    # ========================================================================
    # FINAL VALIDATION SUMMARY
    # ========================================================================
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    print(f"""
Paper's Figure 10 states:
  - At engine speed ω_e_d = 2333 rpm
  - With MG1 max speed = 6500 rpm
  - Max ring speed = 730 rpm
  - Min vehicle speed = 12.6 mph

Our Willis equation calculates:
  - Max ring speed = {ring_rpm_calc:.0f} rpm
  - Min vehicle speed = {v_mph_calc:.1f} mph

Difference:
  - Ring speed: {abs(ring_rpm_calc - 730):.0f} rpm ({abs(ring_rpm_calc - 730)/730*100:.1f}%)
  - Vehicle speed: {abs(v_mph_calc - 12.6):.2f} mph ({abs(v_mph_calc - 12.6)/12.6*100:.1f}%)

RESULT: {'VALIDATED - Matches paper within rounding error!' if abs(v_mph_calc - 12.6) < 0.5 else 'MISMATCH - Check implementation'}
""")


if __name__ == "__main__":
    main()
