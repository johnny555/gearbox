#!/usr/bin/env python3
"""
Generate reference test vectors for cross-validation between Python and TypeScript.

This script reads the test vector template from shared/test-vectors.json,
computes the expected values using the Python implementation, and writes
them back to the file.

Usage:
    python scripts/generate_test_vectors.py

The generated file should be committed to version control so TypeScript
tests can validate against it.
"""

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
from gearbox_sim.core.constraints import WillisConstraint, GearRatioConstraint
from gearbox_sim.components.planetary import PlanetaryGearComponent, PlanetaryGearParams
from gearbox_sim.components.vehicle import VehicleComponent, VehicleParams
from gearbox_sim.control.shift_controller import (
    GearShiftSchedule,
    SpeedSource,
    SpeedUnit,
    LoadBasedHold,
)


def compute_willis_equation(test_case: dict) -> dict:
    """Compute Willis equation expected values."""
    inp = test_case["input"]
    rho = inp["rho"]
    omega_c = inp["omega_carrier"]
    omega_r = inp["omega_ring"]

    constraint = WillisConstraint(
        sun_port="sun", carrier_port="carrier", ring_port="ring", rho=rho
    )

    omega_s = constraint.calc_sun_speed(omega_c, omega_r)

    return {"omega_sun": omega_s}


def compute_torque_ratios(test_case: dict) -> dict:
    """Compute torque ratio expected values."""
    inp = test_case["input"]
    rho = inp["rho"]

    constraint = WillisConstraint(
        sun_port="sun", carrier_port="carrier", ring_port="ring", rho=rho
    )

    sun, carrier, ring = constraint.get_torque_ratios()

    return {
        "sun_ratio": sun,
        "carrier_ratio": carrier,
        "ring_ratio": ring,
    }


def compute_inertia_coefficients(test_case: dict) -> dict:
    """Compute inertia coefficient expected values."""
    inp = test_case["input"]
    rho = inp["rho"]
    j_sun = inp["j_sun"]

    constraint = WillisConstraint(
        sun_port="sun", carrier_port="carrier", ring_port="ring", rho=rho
    )

    j_cc, j_cr, j_rr = constraint.get_inertia_coefficients(j_sun)

    return {
        "j_cc": j_cc,
        "j_cr": j_cr,
        "j_rr": j_rr,
    }


def compute_gear_ratio(test_case: dict) -> dict:
    """Compute gear ratio transformation expected values."""
    inp = test_case["input"]

    constraint = GearRatioConstraint(
        input_port="input",
        output_port="output",
        ratio=inp["ratio"],
        efficiency=inp["efficiency"],
    )

    omega_out = constraint.transform_speed(inp["omega_in"])
    torque_in = constraint.transform_torque(inp["torque_out"])
    j_reflected = constraint.get_reflected_inertia(inp["j_out"])

    return {
        "omega_out": omega_out,
        "torque_in": torque_in,
        "j_reflected": j_reflected,
    }


def compute_road_load(test_case: dict, vehicle_params: dict) -> dict:
    """Compute road load expected values."""
    inp = test_case["input"]

    params = VehicleParams(
        m_empty=vehicle_params["m_empty"],
        m_payload=vehicle_params["m_payload"],
        r_wheel=vehicle_params["r_wheel"],
        A_frontal=vehicle_params["a_frontal"],
        C_d=vehicle_params["c_d"],
        C_r=vehicle_params["c_r"],
        rho_air=vehicle_params["rho_air"],
        g=vehicle_params["g"],
    )

    vehicle = VehicleComponent(params, payload_fraction=vehicle_params["payload_fraction"])

    v = inp["velocity"]
    grade = inp["grade"]

    f_grade = vehicle.calc_grade_force(grade)
    f_roll = vehicle.calc_rolling_resistance(grade)
    f_aero = vehicle.calc_aero_drag(v)
    f_total = vehicle.calc_total_road_load(v, grade)
    t_wheel = vehicle.calc_wheel_torque_demand(v, grade)

    return {
        "f_grade": f_grade,
        "f_roll": f_roll,
        "f_aero": f_aero,
        "f_total": f_total,
        "t_wheel": t_wheel,
    }


def compute_torque_split(test_case: dict) -> dict:
    """Compute torque split expected values."""
    inp = test_case["input"]

    params = PlanetaryGearParams(Z_sun=inp["z_sun"], Z_ring=inp["z_ring"])
    planetary = PlanetaryGearComponent(params)

    t_carrier = inp["t_carrier"]
    t_sun, t_ring = planetary.calc_torque_split(t_carrier)

    # Verify torque balance
    balance = t_sun + t_carrier + t_ring

    return {
        "t_sun": t_sun,
        "t_ring": t_ring,
        "balance_error": balance,
    }


def compute_gear_selection(test_case: dict, schedule_config: dict) -> dict:
    """Compute gear selection expected values."""
    inp = test_case["input"]

    # Parse load-based hold config
    load_hold_config = schedule_config.get("load_based_hold", {})
    load_based_hold = LoadBasedHold(
        enabled=load_hold_config.get("enabled", False),
        load_threshold=load_hold_config.get("load_threshold", 0.8),
        speed_threshold=load_hold_config.get("speed_threshold", 15.0),
    )

    # Create schedule
    schedule = GearShiftSchedule(
        gearbox_id="test",
        n_gears=schedule_config["n_gears"],
        upshift_speeds=schedule_config["upshift_speeds"],
        downshift_speeds=schedule_config["downshift_speeds"],
        speed_source=SpeedSource(schedule_config.get("speed_source", "vehicle")),
        speed_unit=SpeedUnit(schedule_config.get("speed_unit", "m/s")),
        min_gear=schedule_config.get("min_gear", 0),
        max_gear=schedule_config.get("max_gear"),
        shift_delay=schedule_config.get("shift_delay", 0.5),
        load_based_hold=load_based_hold,
    )

    # Get target gear
    target_gear = schedule.get_target_gear(
        current_gear=inp["current_gear"],
        speed_m_s=inp["speed_m_s"],
        load_fraction=inp.get("load_fraction", 0.0),
    )

    return {
        "target_gear": target_gear,
    }


def generate_test_vectors(input_path: Path, output_path: Path) -> None:
    """Generate test vectors and write to output file."""
    with open(input_path, "r") as f:
        data = json.load(f)

    suites = data["test_suites"]

    # Willis equation
    for tc in suites["willis_equation"]["test_cases"]:
        tc["expected"] = compute_willis_equation(tc)

    # Torque ratios
    for tc in suites["torque_ratios"]["test_cases"]:
        tc["expected"] = compute_torque_ratios(tc)

    # Inertia coefficients
    for tc in suites["inertia_coefficients"]["test_cases"]:
        tc["expected"] = compute_inertia_coefficients(tc)

    # Gear ratio
    for tc in suites["gear_ratio"]["test_cases"]:
        tc["expected"] = compute_gear_ratio(tc)

    # Road load
    vehicle_params = suites["road_load"]["vehicle_params"]
    for tc in suites["road_load"]["test_cases"]:
        tc["expected"] = compute_road_load(tc, vehicle_params)

    # Torque split
    for tc in suites["torque_split"]["test_cases"]:
        tc["expected"] = compute_torque_split(tc)

    # Gear selection
    if "gear_selection" in suites:
        schedule_config = suites["gear_selection"]["schedule_config"]
        for tc in suites["gear_selection"]["test_cases"]:
            tc["expected"] = compute_gear_selection(tc, schedule_config)

    # Update metadata
    data["generated_at"] = datetime.now(timezone.utc).isoformat()
    data["generated_by"] = "python"

    # Write output
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Generated test vectors: {output_path}")

    # Print summary
    total_tests = sum(
        len(suite["test_cases"])
        for suite in suites.values()
        if "test_cases" in suite
    )
    print(f"Total test cases: {total_tests}")


def validate_python_implementation() -> bool:
    """Run quick sanity checks on Python implementation."""
    print("Validating Python implementation...")

    # Willis equation sanity check
    constraint = WillisConstraint(
        sun_port="sun", carrier_port="carrier", ring_port="ring", rho=3.0
    )
    omega_s = constraint.calc_sun_speed(100.0, 0.0)
    assert abs(omega_s - 400.0) < 1e-10, f"Willis equation failed: {omega_s} != 400.0"

    # Torque balance check
    params = PlanetaryGearParams(Z_sun=30, Z_ring=90)
    planetary = PlanetaryGearComponent(params)
    t_sun, t_ring = planetary.calc_torque_split(100.0)
    balance = t_sun + 100.0 + t_ring
    assert abs(balance) < 1e-10, f"Torque balance failed: {balance}"

    # Gear selection sanity check
    schedule = GearShiftSchedule(
        gearbox_id="test",
        n_gears=2,
        upshift_speeds=[10.0],
        downshift_speeds=[5.0],
    )
    target = schedule.get_target_gear(current_gear=0, speed_m_s=15.0)
    assert target == 1, f"Gear selection failed: expected 1, got {target}"
    target = schedule.get_target_gear(current_gear=1, speed_m_s=3.0)
    assert target == 0, f"Gear selection failed: expected 0, got {target}"

    print("Python implementation validated successfully.")
    return True


def main():
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent

    input_path = repo_root / "shared" / "test-vectors.json"
    output_path = input_path  # Overwrite in place

    if not input_path.exists():
        print(f"Error: Test vectors file not found: {input_path}")
        sys.exit(1)

    # Validate implementation first
    if not validate_python_implementation():
        sys.exit(1)

    # Generate test vectors
    generate_test_vectors(input_path, output_path)

    print("\nTo validate TypeScript implementation, run:")
    print("  cd web/packages/drivetrain-sim && npm test")


if __name__ == "__main__":
    main()
