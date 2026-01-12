#!/usr/bin/env python3
"""Debug the drivetrain compilation and dynamics."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from gearbox_sim.configs import create_conventional_diesel_793d, create_ecvt_793d

def debug_diesel():
    print("=" * 60)
    print("Debugging Conventional Diesel 793D")
    print("=" * 60)

    diesel = create_conventional_diesel_793d(payload_fraction=1.0)

    print(f"\nDrivetrain: {diesel}")
    print(f"State names: {diesel.state_names}")
    print(f"Control names: {diesel.control_names}")
    print(f"Independent DOFs: {[d.name for d in diesel._independent_dofs]}")
    print(f"Eliminated DOFs: {list(diesel._eliminated_dofs.keys())}")

    print(f"\nInertia matrix:\n{diesel.inertia_matrix}")

    # Test initial state
    x0 = {"engine.shaft": 100.0}  # ~955 rpm
    x = diesel.state_to_array(x0)
    print(f"\nInitial state array: {x}")

    # Test dynamics with some torque
    control = {"T_engine": 5000.0, "gear_gearbox": 0}
    disturbance = {"grade": 0.0}

    dx = diesel.dynamics(0.0, x, control, disturbance)
    print(f"State derivative: {dx}")

    # Get all speeds
    speeds = diesel.get_all_speeds(x)
    print(f"\nAll speeds: {speeds}")

    # Get velocity
    velocity = diesel.get_velocity(x)
    print(f"Vehicle velocity: {velocity:.4f} m/s = {velocity*3.6:.2f} km/h")

def debug_ecvt():
    print("\n" + "=" * 60)
    print("Debugging eCVT 793D")
    print("=" * 60)

    ecvt = create_ecvt_793d(payload_fraction=1.0)

    print(f"\nDrivetrain: {ecvt}")
    print(f"State names: {ecvt.state_names}")
    print(f"Control names: {ecvt.control_names}")
    print(f"Independent DOFs: {[d.name for d in ecvt._independent_dofs]}")
    print(f"Eliminated DOFs: {list(ecvt._eliminated_dofs.keys())}")

    print(f"\nInertia matrix shape: {ecvt.inertia_matrix.shape}")
    print(f"Inertia matrix:\n{ecvt.inertia_matrix}")

    # Test initial state
    x0 = {
        "planetary.carrier": 100.0,  # Engine speed
        "planetary.ring": 50.0,      # Ring speed
        "battery.SOC": 0.6
    }
    x = ecvt.state_to_array(x0)
    print(f"\nInitial state array: {x}")

    # Test dynamics
    control = {"T_engine": 5000.0, "T_MG1": -1000.0, "T_MG2": 2000.0, "gear_gearbox": 0}
    disturbance = {"grade": 0.0}

    dx = ecvt.dynamics(0.0, x, control, disturbance)
    print(f"State derivative: {dx}")

    # Get all speeds
    speeds = ecvt.get_all_speeds(x)
    print(f"\nAll speeds: {speeds}")

    velocity = ecvt.get_velocity(x)
    print(f"Vehicle velocity: {velocity:.4f} m/s = {velocity*3.6:.2f} km/h")

if __name__ == "__main__":
    debug_diesel()
    debug_ecvt()
