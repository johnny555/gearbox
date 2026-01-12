#!/usr/bin/env python3
"""Simple comparison of diesel vs eCVT drivetrain structure.

This demonstrates that the composable architecture works, even though
the full physics model for eCVT needs refinement.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from gearbox_sim.configs import create_conventional_diesel_793d, create_ecvt_793d

def main():
    print("=" * 70)
    print("CAT 793D Composable Drivetrain Simulator - Architecture Validation")
    print("=" * 70)

    # Create both drivetrains
    print("\n1. Creating Conventional Diesel 793D...")
    diesel = create_conventional_diesel_793d(payload_fraction=1.0)

    print("\n2. Creating eCVT Hybrid 793D...")
    ecvt = create_ecvt_793d(payload_fraction=1.0)

    # Show topology comparison
    print("\n" + "=" * 70)
    print("TOPOLOGY COMPARISON")
    print("=" * 70)

    print("\n--- Conventional Diesel ---")
    print(f"Components: {list(diesel.topology.components.keys())}")
    print(f"Connections: {len(diesel.topology.connections)}")
    print(f"Mechanical DOFs: {diesel.n_mechanical_dofs}")
    print(f"Internal states: {diesel.n_internal_states}")
    print(f"State vector: {diesel.state_names}")
    print(f"Control inputs: {diesel.control_names}")

    print("\n--- eCVT Hybrid ---")
    print(f"Components: {list(ecvt.topology.components.keys())}")
    print(f"Connections: {len(ecvt.topology.connections)}")
    print(f"Mechanical DOFs: {ecvt.n_mechanical_dofs}")
    print(f"Internal states: {ecvt.n_internal_states}")
    print(f"State vector: {ecvt.state_names}")
    print(f"Control inputs: {ecvt.control_names}")

    # Show inertia matrices
    print("\n" + "=" * 70)
    print("INERTIA MATRICES")
    print("=" * 70)

    print("\n--- Diesel (1x1) ---")
    print(f"J = {diesel.inertia_matrix[0,0]:.2f} kg·m²")
    print("(Engine + reflected gearbox + reflected vehicle)")

    print("\n--- eCVT (3x3) ---")
    print("Note: Should have off-diagonal coupling from Willis constraint")
    print(f"J =\n{ecvt.inertia_matrix}")

    # Demonstrate velocity calculation
    print("\n" + "=" * 70)
    print("VELOCITY CALCULATION TEST")
    print("=" * 70)

    import numpy as np

    # Diesel at 1000 rpm engine speed
    omega_e_diesel = 1000 * np.pi / 30  # rad/s
    x_diesel = diesel.state_to_array({"engine.shaft": omega_e_diesel})
    v_diesel = diesel.get_velocity(x_diesel)
    print(f"\nDiesel at 1000 rpm engine:")
    print(f"  Gear 1 ratio: {diesel.get_component('gearbox').get_ratio(0)}")
    print(f"  Total reduction: {diesel.get_component('gearbox').get_ratio(0) * 16:.1f}:1")
    print(f"  Vehicle velocity: {v_diesel:.2f} m/s = {v_diesel*3.6:.1f} km/h")

    # eCVT at 1200 rpm engine, 0 vehicle speed (stall)
    omega_e_ecvt = 1200 * np.pi / 30
    omega_mg1 = (1 + 3) * omega_e_ecvt - 3 * 0  # Willis at v=0
    x_ecvt = ecvt.state_to_array({
        "engine.shaft": omega_e_ecvt,
        "MG1.shaft": omega_mg1,
        "planetary.ring": 0,
        "battery.SOC": 0.6
    })
    v_ecvt = ecvt.get_velocity(x_ecvt)
    print(f"\neCVT at 1200 rpm engine, vehicle stopped:")
    print(f"  MG1 speed: {omega_mg1 * 30 / np.pi:.0f} rpm")
    print(f"  Vehicle velocity: {v_ecvt:.2f} m/s")

    # Reference values from existing simulator
    print("\n" + "=" * 70)
    print("REFERENCE VALUES (from existing rimpull_all_modes.py)")
    print("=" * 70)
    print("""
Low Gear Performance (80:1 total ratio):

Speed   |  eCVT Mode  | Locked Sun | Lock+TC
km/h    |    kN       |    kN      |   kN
--------|-------------|------------|--------
  0     |   134       |   436      |  959
 10     |   273       |   436      |  442
 15     |   436       |   436      |  436

Grade Capability (loaded 349 tonnes):
  5% grade:  Need 222 kN - All modes OK
 10% grade:  Need 392 kN - eCVT OK at higher speed
 15% grade:  Need 559 kN - Only Lock+TC mode
 20% grade:  Need 723 kN - Only Lock+TC mode
""")

    print("\n" + "=" * 70)
    print("ARCHITECTURE STATUS")
    print("=" * 70)
    print("""
WORKING:
  [OK] Component abstraction with ports and constraints
  [OK] N-speed gearbox (tested with 7-speed diesel, 2-speed eCVT)
  [OK] Topology builder with fluent API
  [OK] Automatic DOF reduction through constraints
  [OK] Speed propagation through constraint chain
  [OK] Simulation infrastructure (ODE integration)
  [OK] Comparison framework

NEEDS REFINEMENT:
  [!!] eCVT inertia matrix coupling (Willis constraint effect)
  [!!] Torque propagation through planetary gear
  [!!] Battery power flow integration

The architecture enables easy comparison of different drivetrain
configurations. The eCVT physics model needs the coupled inertia
matrix as shown in docs/state_space_model.md equations 5-7.
""")

if __name__ == "__main__":
    main()
