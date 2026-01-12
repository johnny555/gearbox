#!/usr/bin/env python3
"""Analyze effect of locking MG1 (sun gear) with a clutch/brake."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho  # 3.0
    r_w = pt.vehicle.r_wheel
    m = pt.vehicle.mass
    g = 9.81
    
    print("=" * 80)
    print("Locked Sun Gear (MG1) Analysis")
    print("=" * 80)
    
    print(f"\nWhen sun gear is LOCKED (ω_MG1 = 0):")
    print(f"  - Planetary becomes a FIXED RATIO gear")
    print(f"  - Engine torque reaction provided by mechanical brake, not MG1")
    print(f"  - Full engine torque available (not limited by MG1 power!)")
    print(f"  - But: lose CVT functionality (fixed speed ratio)")
    
    print(f"\n--- Kinematics with Locked Sun ---")
    print(f"From Willis: 0 = (1+ρ)·ω_e - ρ·ω_r")
    print(f"Therefore:   ω_r = (1+ρ)/ρ × ω_e = {(1+rho)/rho:.3f} × ω_e")
    print(f"For ρ=3:     ω_ring = 1.333 × ω_engine")
    
    print(f"\n--- Torque with Locked Sun ---")
    print(f"Torque split unchanged: T_ring = ρ/(1+ρ) × T_e = 0.75 × T_e")
    print(f"But now we can use FULL engine torque!")
    
    # Compare locked vs unlocked
    print(f"\n" + "=" * 80)
    print(f"Comparison: Locked Sun vs Normal e-CVT at Standstill")
    print("=" * 80)
    
    rpm_e = 1200
    omega_e = rpm_e * np.pi / 30
    
    # Engine max torque
    T_e_max = pt.engine.get_max_torque(rpm_e)
    
    # Normal e-CVT (MG1 power limited)
    omega_MG1_normal = (1 + rho) * omega_e  # 4 × engine speed
    T_MG1_max = pt.mg1.params.P_max / omega_MG1_normal
    T_e_usable_normal = (1 + rho) * T_MG1_max
    T_ring_normal = rho / (1 + rho) * T_e_usable_normal + pt.mg2.params.T_max
    
    # Locked sun (full engine torque)
    T_ring_locked = rho / (1 + rho) * T_e_max + pt.mg2.params.T_max
    
    K_total = pt.gearbox.params.K_low * pt.gearbox.params.K_final
    eta = pt.gearbox.params.eta_total
    
    F_normal = T_ring_normal * K_total * eta / r_w
    F_locked = T_ring_locked * K_total * eta / r_w
    
    print(f"\n{'':30} {'Normal e-CVT':>15} {'Locked Sun':>15}")
    print("-" * 65)
    print(f"{'Engine torque available':30} {T_e_max:>15,.0f} {T_e_max:>15,.0f} N·m")
    print(f"{'Engine torque USABLE':30} {T_e_usable_normal:>15,.0f} {T_e_max:>15,.0f} N·m")
    print(f"{'Ring torque (engine path)':30} {rho/(1+rho)*T_e_usable_normal:>15,.0f} {rho/(1+rho)*T_e_max:>15,.0f} N·m")
    print(f"{'Ring torque (MG2)':30} {pt.mg2.params.T_max:>15,.0f} {pt.mg2.params.T_max:>15,.0f} N·m")
    print(f"{'TOTAL ring torque':30} {T_ring_normal:>15,.0f} {T_ring_locked:>15,.0f} N·m")
    print(f"{'Rimpull':30} {F_normal/1e3:>15.1f} {F_locked/1e3:>15.1f} kN")
    print(f"{'Improvement':30} {'':>15} {F_locked/F_normal:>15.1f}x")
    
    # Grade capability
    print(f"\n--- Grade Capability ---")
    for grade in [0.05, 0.10, 0.15, 0.20]:
        theta = np.arctan(grade)
        F_resist = m * g * (np.sin(theta) + pt.vehicle.params.C_r * np.cos(theta))
        
        can_normal = "YES" if F_normal >= F_resist else "no"
        can_locked = "YES" if F_locked >= F_resist else "no"
        
        print(f"  {grade*100:.0f}% grade ({F_resist/1e3:.0f} kN): Normal={can_normal:>5}, Locked={can_locked:>5}")
    
    # The tradeoff
    print(f"\n" + "=" * 80)
    print("The Tradeoff: Speed Coupling")
    print("=" * 80)
    
    print(f"\nWith locked sun, engine and output are coupled:")
    print(f"  ω_ring = 1.333 × ω_engine")
    print(f"\nVehicle speed vs engine RPM (Low gear, K={K_total}):")
    
    print(f"\n{'Engine RPM':>12} {'Ring RPM':>12} {'Vehicle km/h':>15}")
    print("-" * 45)
    for rpm_e in [700, 800, 1000, 1200, 1400, 1600, 1800]:
        rpm_r = (1 + rho) / rho * rpm_e
        omega_r = rpm_r * np.pi / 30
        v = omega_r * r_w / K_total * 3.6
        print(f"{rpm_e:>12} {rpm_r:>12.0f} {v:>15.1f}")
    
    print(f"\n--- Hybrid Strategy ---")
    print(f"""
    Use LOCKED SUN for:
      - Starting from standstill on grades
      - Low speed, high torque operation
      - Hill climbing
    
    Use NORMAL e-CVT for:
      - Cruising (engine at optimal RPM)
      - Regenerative braking
      - Engine-off EV mode
    
    This is similar to Toyota's approach in some hybrid trucks!
    """)

if __name__ == "__main__":
    main()
