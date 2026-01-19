#!/usr/bin/env python3
"""
Cross-validation script: Compare Python and TypeScript drivetrain calculations.

This script outputs test vectors that can be compared against TypeScript output
to verify both implementations produce identical results.

Run this script and compare its output with the TypeScript test runner.
"""

import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from gearbox_sim.core.constraints import WillisConstraint, GearRatioConstraint
from gearbox_sim.components.planetary import PlanetaryGearComponent, PlanetaryGearParams
from gearbox_sim.components.vehicle import VehicleComponent, VehicleParams


def test_willis_equation():
    """Test Willis equation with reference values."""
    print("=" * 60)
    print("TEST 1: Willis Equation Calculations")
    print("=" * 60)

    results = []

    # Test cases: (rho, omega_carrier, omega_ring)
    test_cases = [
        # Prius (rho=2.6)
        {"rho": 2.6, "omega_carrier": 104.72, "omega_ring": 0.0},        # 1000 rpm, standstill
        {"rho": 2.6, "omega_carrier": 244.35, "omega_ring": 302.24},    # 2333 rpm, 80 km/h
        # CAT 793D (rho=3.0)
        {"rho": 3.0, "omega_carrier": 125.66, "omega_ring": 0.0},        # 1200 rpm, standstill
        {"rho": 3.0, "omega_carrier": 125.66, "omega_ring": 50.0},       # 1200 rpm, moving
    ]

    for tc in test_cases:
        rho = tc["rho"]
        omega_c = tc["omega_carrier"]
        omega_r = tc["omega_ring"]

        constraint = WillisConstraint(
            sun_port="sun", carrier_port="carrier", ring_port="ring", rho=rho
        )

        omega_s = constraint.calc_sun_speed(omega_c, omega_r)
        omega_c_back = constraint.calc_carrier_speed(omega_s, omega_r)
        omega_r_back = constraint.calc_ring_speed(omega_c, omega_s)

        torque_ratios = constraint.get_torque_ratios()
        inertia_coeffs = constraint.get_inertia_coefficients(1.0)  # J_sun = 1.0 for normalization

        result = {
            "input": tc,
            "sun_speed": omega_s,
            "carrier_speed_verify": omega_c_back,
            "ring_speed_verify": omega_r_back,
            "torque_ratios": list(torque_ratios),
            "inertia_coefficients": list(inertia_coeffs),
        }
        results.append(result)

        print(f"\nρ={rho}, ω_carrier={omega_c:.2f}, ω_ring={omega_r:.2f}")
        print(f"  ω_sun = {omega_s:.6f}")
        print(f"  Torque ratios: {torque_ratios}")
        print(f"  Inertia coeffs (J_sun=1): {inertia_coeffs}")

    return results


def test_gear_ratio_constraint():
    """Test gear ratio constraint calculations."""
    print("\n" + "=" * 60)
    print("TEST 2: Gear Ratio Constraint")
    print("=" * 60)

    results = []

    test_cases = [
        {"ratio": 2.0, "omega_in": 100.0},
        {"ratio": 9.0, "omega_in": 50.0},
        {"ratio": 18.0, "omega_in": 125.66},  # Low gear total ratio
    ]

    for tc in test_cases:
        ratio = tc["ratio"]
        omega_in = tc["omega_in"]

        constraint = GearRatioConstraint(
            input_port="input", output_port="output", ratio=ratio, efficiency=0.95
        )

        omega_out = constraint.transform_speed(omega_in)
        T_in = constraint.transform_torque(100.0)  # 100 Nm at output
        J_reflected = constraint.get_reflected_inertia(1000.0)  # 1000 kg.m² at output
        speed_relation = constraint.get_speed_relation()

        result = {
            "input": tc,
            "omega_out": omega_out,
            "torque_in_for_100Nm_out": T_in,
            "reflected_inertia_for_1000kgm2": J_reflected,
            "speed_relation": speed_relation,
        }
        results.append(result)

        print(f"\nRatio={ratio}, ω_in={omega_in}")
        print(f"  ω_out = {omega_out:.6f}")
        print(f"  Speed relation: {speed_relation}")
        print(f"  T_in for 100 Nm out (η=0.95): {T_in:.6f}")
        print(f"  J_reflected for 1000 kg.m²: {J_reflected:.6f}")

    return results


def test_vehicle_road_load():
    """Test vehicle road load calculations."""
    print("\n" + "=" * 60)
    print("TEST 3: Vehicle Road Load")
    print("=" * 60)

    results = []

    # Create CAT 793D vehicle with exact parameters
    params = VehicleParams(
        m_empty=165_600.0,
        m_payload=218_000.0,
        r_wheel=1.78,
        A_frontal=45.0,
        C_d=0.9,
        C_r=0.025,
        rho_air=1.225,
        g=9.81,
    )

    vehicle = VehicleComponent(params, payload_fraction=1.0)

    test_cases = [
        {"velocity": 0.0, "grade": 0.0},
        {"velocity": 5.0, "grade": 0.0},       # ~18 km/h flat
        {"velocity": 5.0, "grade": 0.10},      # ~18 km/h, 10% grade
        {"velocity": 10.0, "grade": 0.10},     # ~36 km/h, 10% grade
        {"velocity": 15.0, "grade": 0.0},      # ~54 km/h flat
    ]

    for tc in test_cases:
        v = tc["velocity"]
        grade = tc["grade"]

        F_total = vehicle.calc_total_road_load(v, grade)
        F_grade = vehicle.calc_grade_force(grade)
        F_roll = vehicle.calc_rolling_resistance(grade)
        F_aero = vehicle.calc_aero_drag(v)
        T_wheel = vehicle.calc_wheel_torque_demand(v, grade)

        result = {
            "input": tc,
            "mass": vehicle.mass,
            "F_total": F_total,
            "F_grade": F_grade,
            "F_roll": F_roll,
            "F_aero": F_aero,
            "T_wheel": T_wheel,
        }
        results.append(result)

        print(f"\nv={v:.1f} m/s, grade={grade:.0%}")
        print(f"  Mass: {vehicle.mass:,.0f} kg")
        print(f"  F_grade: {F_grade/1000:.2f} kN")
        print(f"  F_roll:  {F_roll/1000:.2f} kN")
        print(f"  F_aero:  {F_aero/1000:.2f} kN")
        print(f"  F_total: {F_total/1000:.2f} kN")
        print(f"  T_wheel: {T_wheel/1000:.2f} kNm")

    return results


def test_planetary_torque_split():
    """Test planetary gear torque split."""
    print("\n" + "=" * 60)
    print("TEST 4: Planetary Torque Split")
    print("=" * 60)

    results = []

    test_cases = [
        {"Z_sun": 30, "Z_ring": 78, "T_carrier": 100.0},   # Prius
        {"Z_sun": 30, "Z_ring": 90, "T_carrier": 100.0},   # CAT 793D
        {"Z_sun": 30, "Z_ring": 90, "T_carrier": 11220.0}, # CAT 793D at max engine torque
    ]

    for tc in test_cases:
        params = PlanetaryGearParams(Z_sun=tc["Z_sun"], Z_ring=tc["Z_ring"])
        planetary = PlanetaryGearComponent(params)

        T_carrier = tc["T_carrier"]
        T_sun, T_ring = planetary.calc_torque_split(T_carrier)
        rho = planetary.rho

        # Verify torque balance: T_sun + T_carrier + T_ring = 0
        balance = T_sun + T_carrier + T_ring

        result = {
            "input": tc,
            "rho": rho,
            "T_sun": T_sun,
            "T_ring": T_ring,
            "torque_balance_error": balance,
            "sun_fraction": abs(T_sun) / T_carrier,
            "ring_fraction": abs(T_ring) / T_carrier,
        }
        results.append(result)

        print(f"\nZ_sun={tc['Z_sun']}, Z_ring={tc['Z_ring']} (ρ={rho:.2f})")
        print(f"  T_carrier = {T_carrier:.1f} Nm")
        print(f"  T_sun = {T_sun:.3f} Nm ({abs(T_sun)/T_carrier*100:.1f}%)")
        print(f"  T_ring = {T_ring:.3f} Nm ({abs(T_ring)/T_carrier*100:.1f}%)")
        print(f"  Balance error: {balance:.6f}")

    return results


def test_inertia_matrix_coefficients():
    """Test inertia matrix coefficient calculations."""
    print("\n" + "=" * 60)
    print("TEST 5: Inertia Matrix Coefficients")
    print("=" * 60)

    results = []

    # Test with different rho and J_sun values
    test_cases = [
        {"rho": 2.6, "J_sun": 0.5},
        {"rho": 3.0, "J_sun": 0.5},
        {"rho": 3.0, "J_sun": 10.0},  # Larger motor inertia
    ]

    for tc in test_cases:
        rho = tc["rho"]
        J_sun = tc["J_sun"]

        constraint = WillisConstraint(
            sun_port="sun", carrier_port="carrier", ring_port="ring", rho=rho
        )

        J_cc, J_cr, J_rr = constraint.get_inertia_coefficients(J_sun)

        # Build 2x2 inertia matrix
        J_matrix = [
            [J_cc, J_cr],
            [J_cr, J_rr],
        ]

        result = {
            "input": tc,
            "J_cc": J_cc,
            "J_cr": J_cr,
            "J_rr": J_rr,
            "J_matrix": J_matrix,
        }
        results.append(result)

        print(f"\nρ={rho}, J_sun={J_sun}")
        print(f"  J_cc = (1+ρ)² × J_sun = {J_cc:.6f}")
        print(f"  J_cr = -(1+ρ)×ρ × J_sun = {J_cr:.6f}")
        print(f"  J_rr = ρ² × J_sun = {J_rr:.6f}")

    return results


def main():
    """Run all cross-validation tests and output JSON for TypeScript comparison."""

    print("\n" + "=" * 60)
    print("CROSS-VALIDATION: Python Drivetrain Simulator")
    print("=" * 60)
    print("\nThese values should match TypeScript implementation exactly.")
    print("Tolerance: < 1e-10 for deterministic calculations")
    print("           < 1e-6 for integration-based calculations")

    all_results = {
        "willis_equation": test_willis_equation(),
        "gear_ratio": test_gear_ratio_constraint(),
        "road_load": test_vehicle_road_load(),
        "torque_split": test_planetary_torque_split(),
        "inertia_coefficients": test_inertia_matrix_coefficients(),
    }

    # Output JSON for automated comparison
    print("\n" + "=" * 60)
    print("JSON OUTPUT FOR AUTOMATED COMPARISON")
    print("=" * 60)

    # Save to file for TypeScript comparison
    output_path = Path(__file__).parent / "python_reference_values.json"
    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2)

    print(f"\nReference values saved to: {output_path}")
    print("\nTo verify TypeScript matches, run the TypeScript test suite with:")
    print("  cd web/packages/drivetrain-sim")
    print("  npm test -- --grep 'cross-validation'")

    return all_results


if __name__ == "__main__":
    main()
