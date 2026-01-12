#!/usr/bin/env python3
"""Debug the simulation to find sign issue."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from ecvt_sim.powertrain import create_cat_793d_powertrain, PowertrainState, PowertrainInput
from ecvt_sim.controller import Controller

def main():
    pt = create_cat_793d_powertrain(payload_fraction=1.0)
    pt.vehicle.params.C_r = 0.015
    
    rho = pt.planetary.rho
    
    print("=" * 70)
    print("Debug: Step-by-step simulation")
    print("=" * 70)
    
    ctrl = Controller(pt)
    v_target = 15.0 / 3.6
    grade = 0.0
    
    # Initial state: standstill
    x = np.array([800 * np.pi / 30, 0.0, 0.6])  # [omega_e, omega_r, soc]
    
    print(f"\nInitial state:")
    print(f"  omega_e = {x[0]:.2f} rad/s ({x[0] * 30/np.pi:.0f} rpm)")
    print(f"  omega_r = {x[1]:.2f} rad/s ({x[1] * 30/np.pi:.0f} rpm)")
    
    for step in range(5):
        print(f"\n--- Step {step} ---")
        
        omega_e, omega_r, soc = x
        rpm_e = omega_e * 30 / np.pi
        rpm_r = omega_r * 30 / np.pi
        v = pt.get_vehicle_speed(omega_r)
        omega_MG1 = pt.get_mg1_speed(omega_e, omega_r)
        rpm_MG1 = omega_MG1 * 30 / np.pi
        
        print(f"  State: v={v*3.6:.2f} km/h, ω_e={rpm_e:.0f} rpm, ω_r={rpm_r:.0f} rpm, ω_MG1={rpm_MG1:.0f} rpm")
        
        # Get control
        u = ctrl.compute_speed_control(x, v_target, grade)
        print(f"  Control: T_e={u.T_e:,.0f}, T_MG1={u.T_MG1:,.0f}, T_MG2={u.T_MG2:,.0f}")
        
        # Calculate dynamics
        T_load = pt.get_load_torque(omega_r, grade, u.gear)
        print(f"  T_load: {T_load:,.0f} N·m")
        
        # Torque coupling
        tau1 = u.T_e + (1 + rho) * u.T_MG1
        tau2 = -rho * u.T_MG1 + u.T_MG2 - T_load
        print(f"  τ₁ (engine): T_e + (1+ρ)·T_MG1 = {u.T_e:,.0f} + 4×{u.T_MG1:,.0f} = {tau1:,.0f}")
        print(f"  τ₂ (ring):   -ρ·T_MG1 + T_MG2 - T_load = -3×{u.T_MG1:,.0f} + {u.T_MG2:,.0f} - {T_load:,.0f} = {tau2:,.0f}")
        
        # Get full derivatives
        dx = pt.dynamics(0, x, u, grade)
        print(f"  dx/dt: d(ω_e)={dx[0]:.3f}, d(ω_r)={dx[1]:.3f}, d(soc)={dx[2]:.6f}")
        
        # Predictions
        dt = 0.1
        v_next = pt.get_vehicle_speed(omega_r + dx[1] * dt)
        print(f"  → After {dt}s: v = {v_next*3.6:.2f} km/h")
        
        # Check signs
        if dx[1] < 0 and v < v_target:
            print(f"  ⚠️  PROBLEM: Ring decelerating when we want to speed up!")
            print(f"      τ₂ = {tau2:,.0f} N·m (need positive for acceleration)")
        
        # Step forward
        x = x + dx * dt

if __name__ == "__main__":
    main()
