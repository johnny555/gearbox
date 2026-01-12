#!/usr/bin/env python3
"""Test controller output at various states."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain, PowertrainInput
from ecvt_sim.controller import Controller

def main():
    print("=" * 60)
    print("Controller Test")
    print("=" * 60)

    # Test EMPTY truck
    pt = create_cat_793d_powertrain(payload_fraction=0.0)
    pt.vehicle.params.C_r = 0.015

    ctrl = Controller(pt)

    v_target = 15.0 / 3.6  # 15 km/h

    print(f"Vehicle mass: {pt.vehicle.mass:,.0f} kg")
    print(f"Target speed: {v_target * 3.6:.1f} km/h")

    # Test at different states
    test_cases = [
        ("Standstill, flat", 800, 0, 0.0),
        ("Standstill, 5% grade", 800, 0, 0.05),
        ("5 km/h, flat", 900, 50, 0.0),
        ("10 km/h, flat", 1000, 100, 0.0),
        ("15 km/h, flat", 1100, 150, 0.0),
        ("15 km/h, 10% grade", 1100, 150, 0.10),
    ]

    for name, rpm_e, rpm_r, grade in test_cases:
        omega_e = rpm_e * np.pi / 30
        omega_r = rpm_r * np.pi / 30
        x = np.array([omega_e, omega_r, 0.6])

        v_current = pt.get_vehicle_speed(omega_r)
        omega_MG1 = pt.get_mg1_speed(omega_e, omega_r)

        # Get controller output
        u = ctrl.compute_speed_control(x, v_target, grade)

        # Calculate what the dynamics will produce
        T_load = pt.get_load_torque(omega_r, grade, u.gear)
        rho = pt.planetary.rho
        tau1 = u.T_e + (1 + rho) * u.T_MG1
        tau2 = -rho * u.T_MG1 + u.T_MG2 - T_load

        print(f"\n{name}:")
        print(f"  State: ω_e={rpm_e} rpm, ω_r={rpm_r} rpm, v={v_current*3.6:.1f} km/h")
        print(f"  MG1 speed: {omega_MG1*30/np.pi:.0f} rpm")
        print(f"  Controller: T_e={u.T_e:,.0f}, T_MG1={u.T_MG1:,.0f}, T_MG2={u.T_MG2:,.0f}")
        print(f"  Load at ring: {T_load:,.0f} N·m")
        print(f"  τ₁ (engine accel): {tau1:,.0f} N·m")
        print(f"  τ₂ (ring accel): {tau2:,.0f} N·m")

        # Sign check
        if tau2 < 0 and v_current < v_target:
            print(f"  ⚠️  WARNING: τ₂ < 0 will decelerate ring!")


if __name__ == "__main__":
    main()
