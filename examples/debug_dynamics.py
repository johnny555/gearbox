#!/usr/bin/env python3
"""Debug script to trace dynamics issues."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import Powertrain, PowertrainState, PowertrainInput, create_cat_793d_powertrain
from ecvt_sim.controller import Controller
from ecvt_sim.components.gearbox import Gear

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)

    # TEMPORARY: Reduce rolling resistance to test simulation
    pt.vehicle.params.C_r = 0.005  # Reduced from 0.025
    print(f"[TEST] Reduced C_r from 0.025 to {pt.vehicle.params.C_r}")

    ctrl = Controller(pt)

    print("=" * 60)
    print("Debugging Powertrain Dynamics")
    print("=" * 60)

    # Initial state: engine at idle, vehicle stationary
    omega_e = 800 * np.pi / 30  # 800 rpm
    omega_r = 0.0
    soc = 0.6

    x = np.array([omega_e, omega_r, soc])
    grade = 0.0  # Start flat
    v_target = 10.0 / 3.6  # 10 km/h

    print(f"\nInitial State:")
    print(f"  Engine: {omega_e * 30 / np.pi:.0f} rpm")
    print(f"  Ring: {omega_r * 30 / np.pi:.0f} rpm")
    print(f"  MG1: {pt.get_mg1_speed(omega_e, omega_r) * 30 / np.pi:.0f} rpm")
    print(f"  Vehicle speed: {pt.get_vehicle_speed(omega_r) * 3.6:.1f} km/h")

    # Get controller output
    u = ctrl.compute_speed_control(x, v_target, grade)

    print(f"\nController Output:")
    print(f"  T_e: {u.T_e:,.0f} N·m")
    print(f"  T_MG1: {u.T_MG1:,.0f} N·m")
    print(f"  T_MG2: {u.T_MG2:,.0f} N·m")
    print(f"  Gear: {u.gear}")

    # Check torque limits
    rpm_e = omega_e * 30 / np.pi
    T_e_max = pt.engine.get_max_torque(rpm_e)
    print(f"\nEngine max torque at {rpm_e:.0f} rpm: {T_e_max:,.0f} N·m")

    omega_MG1 = pt.get_mg1_speed(omega_e, omega_r)
    rpm_MG1 = abs(omega_MG1) * 30 / np.pi
    T_MG1_min, T_MG1_max = pt.mg1.get_torque_limits(rpm_MG1)
    print(f"MG1 torque limits at {rpm_MG1:.0f} rpm: [{T_MG1_min:,.0f}, {T_MG1_max:,.0f}] N·m")

    rpm_r = abs(omega_r) * 30 / np.pi
    T_MG2_min, T_MG2_max = pt.mg2.get_torque_limits(rpm_r, use_boost=True)
    print(f"MG2 torque limits at {rpm_r:.0f} rpm: [{T_MG2_min:,.0f}, {T_MG2_max:,.0f}] N·m")

    # Calculate load torque
    T_load = pt.get_load_torque(omega_r, grade)
    print(f"\nLoad torque at ring: {T_load:,.0f} N·m")

    # Calculate dynamics
    dx = pt.dynamics(0, x, u, grade)

    print(f"\nState Derivatives:")
    print(f"  dω_e/dt: {dx[0]:.2f} rad/s² = {dx[0] * 30 / np.pi:.1f} rpm/s")
    print(f"  dω_r/dt: {dx[1]:.2f} rad/s² = {dx[1] * 30 / np.pi:.1f} rpm/s")
    print(f"  dSOC/dt: {dx[2]:.6f} 1/s")

    # Show the torque balance
    rho = pt.planetary.rho
    tau1 = u.T_e + (1 + rho) * u.T_MG1
    tau2 = -rho * u.T_MG1 + u.T_MG2 - T_load

    print(f"\nTorque vector:")
    print(f"  τ₁ = T_e + (1+ρ)·T_MG1 = {u.T_e:,.0f} + {(1+rho)*u.T_MG1:,.0f} = {tau1:,.0f} N·m")
    print(f"  τ₂ = -ρ·T_MG1 + T_MG2 - T_load = {-rho*u.T_MG1:,.0f} + {u.T_MG2:,.0f} - {T_load:,.0f} = {tau2:,.0f} N·m")

    # Show inertia matrix
    J = pt.get_inertia_matrix(u.gear)
    print(f"\nInertia matrix:")
    print(f"  J = [{J[0,0]:,.0f}, {J[0,1]:,.0f}]")
    print(f"      [{J[1,0]:,.0f}, {J[1,1]:,.0f}]")
    print(f"  det(J) = {np.linalg.det(J):,.0f}")

    # Vehicle acceleration
    v_current = pt.get_vehicle_speed(omega_r)
    dv_dt = dx[1] / (pt.gearbox.K_total * pt.vehicle.r_wheel) * pt.vehicle.r_wheel
    # Actually: dv/dt = dω_wheel/dt × r_wheel = (dω_r/dt / K_total) × r_wheel
    dv_dt = dx[1] * pt.vehicle.r_wheel / pt.gearbox.K_total

    print(f"\nVehicle acceleration: {dv_dt:.2f} m/s²")

    # Simulate a few steps manually
    print("\n--- Manual Integration (10 steps of 0.1s) ---")
    dt = 0.1
    for i in range(10):
        t = i * dt
        grade_t = 0.0  # Keep flat for debug

        u = ctrl.compute_speed_control(x, v_target, grade_t)
        dx = pt.dynamics(t, x, u, grade_t)
        x = x + dx * dt

        v = pt.get_vehicle_speed(x[1])
        print(f"t={t:.1f}s: v={v*3.6:.2f} km/h, ω_e={x[0]*30/np.pi:.0f} rpm, " +
              f"ω_r={x[1]*30/np.pi:.0f} rpm, T_MG2={u.T_MG2:.0f} N·m")


if __name__ == "__main__":
    main()
