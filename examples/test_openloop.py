#!/usr/bin/env python3
"""Simple open-loop test to verify dynamics."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import Powertrain, PowertrainState, PowertrainInput, create_cat_793d_powertrain

def main():
    print("=" * 60)
    print("Open-Loop Dynamics Test")
    print("=" * 60)

    # Empty truck, low rolling resistance
    pt = create_cat_793d_powertrain(payload_fraction=0.0)
    pt.vehicle.params.C_r = 0.010

    print(f"Vehicle mass: {pt.vehicle.mass:,.0f} kg")
    print(f"Planetary ratio ρ = {pt.planetary.rho}")

    # Initial state: engine at 1000 rpm, stationary
    omega_e = 1000 * np.pi / 30
    omega_r = 0.0
    soc = 0.6
    x = np.array([omega_e, omega_r, soc])

    # Fixed control inputs
    T_e = 2000.0      # Modest engine torque
    T_MG1 = -500.0    # MG1 generating (reacting engine)
    T_MG2 = 1000.0    # MG2 motoring
    gear = 1

    u = PowertrainInput(T_e=T_e, T_MG1=T_MG1, T_MG2=T_MG2, gear=gear)

    print(f"\nFixed control inputs:")
    print(f"  T_e = {T_e:,.0f} N·m")
    print(f"  T_MG1 = {T_MG1:,.0f} N·m")
    print(f"  T_MG2 = {T_MG2:,.0f} N·m")

    rho = pt.planetary.rho
    print(f"\nExpected torque contributions:")
    print(f"  τ₁ = T_e + (1+ρ)·T_MG1 = {T_e} + {(1+rho)*T_MG1} = {T_e + (1+rho)*T_MG1} N·m")
    print(f"  Ring from MG1: -ρ·T_MG1 = {-rho*T_MG1} N·m")
    print(f"  Ring from MG2: {T_MG2} N·m")

    print("\n--- Euler Integration (dt=0.1s, 100 steps) ---")
    dt = 0.1
    for i in range(100):
        t = i * dt

        # Get load torque
        T_load = pt.get_load_torque(x[1], grade=0.0, gear=gear)

        # Compute dynamics
        dx = pt.dynamics(t, x, u, grade=0.0)

        # Integrate
        x_new = x + dx * dt

        # Compute velocity
        v = pt.get_vehicle_speed(x[1])
        omega_MG1 = pt.get_mg1_speed(x[0], x[1])

        if i % 10 == 0:
            print(f"t={t:5.1f}s: v={v*3.6:6.2f} km/h, ω_e={x[0]*30/np.pi:6.0f} rpm, "
                  f"ω_r={x[1]*30/np.pi:6.0f} rpm, T_load={T_load:,.0f} N·m, "
                  f"dω_r/dt={dx[1]:.2f}")

        x = x_new

        # Safety check
        if abs(v) > 100 / 3.6:  # > 100 km/h
            print(f"  WARNING: Unrealistic speed, stopping")
            break

    print(f"\nFinal: v={pt.get_vehicle_speed(x[1])*3.6:.1f} km/h")


if __name__ == "__main__":
    main()
