/**
 * Vehicle component and road load tests.
 *
 * Validates road load calculations (grade, rolling resistance, aerodynamic drag)
 * against reference values from Liu & Peng (2008) and CAT 793D specs.
 */

import { describe, it, expect } from 'vitest';
import { VehicleComponent, CAT_793D_PARAMS } from '../components/vehicle';

// Prius parameters from Liu & Peng (2008)
const PRIUS_VEHICLE = {
  mEmpty: 1254,
  mPayload: 0,
  rWheel: 0.287,
  aFrontal: 2.52,
  cD: 0.3,
  cR: 0.015,
  vMax: 160 / 3.6, // ~44 m/s
  jWheels: 10,
  rhoAir: 1.225,
  g: 9.81,
};

describe('VehicleComponent', () => {
  describe('Construction', () => {
    it('should create with default CAT 793D parameters', () => {
      const vehicle = new VehicleComponent();

      expect(vehicle.params.mEmpty).toBe(165_600);
      expect(vehicle.params.mPayload).toBe(218_000);
      expect(vehicle.params.rWheel).toBe(1.78);
    });

    it('should create with custom parameters', () => {
      const vehicle = new VehicleComponent(PRIUS_VEHICLE, 0);

      expect(vehicle.params.mEmpty).toBe(1254);
      expect(vehicle.params.rWheel).toBe(0.287);
      expect(vehicle.mass).toBe(1254);
    });

    it('should calculate mass with payload', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      // Full load: 165,600 + 218,000 = 383,600 kg
      expect(vehicle.mass).toBe(383_600);
    });

    it('should calculate mass with partial payload', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 0.5);

      // Half load: 165,600 + 0.5 × 218,000 = 274,600 kg
      expect(vehicle.mass).toBe(274_600);
    });
  });

  describe('Road Load - Grade Resistance', () => {
    it('should calculate grade force on flat ground', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      // On flat ground (grade=0), grade force should be 0
      const load = vehicle.calcTotalRoadLoad(10, 0);

      // Should only have rolling + aero drag
      const m = vehicle.mass;
      const expected_rolling = vehicle.params.cR * m * 9.81;
      const v = 10;
      const expected_aero = 0.5 * 1.225 * vehicle.params.cD * vehicle.params.aFrontal * v * v;

      expect(load).toBeCloseTo(expected_rolling + expected_aero, 0);
    });

    it('should calculate grade force on 10% grade', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);
      const grade = 0.10; // 10%

      const theta = Math.atan(grade);
      const m = vehicle.mass;
      const g = 9.81;

      // Grade force = m × g × sin(θ)
      const expected_grade = m * g * Math.sin(theta);

      // At low speed, aero is small, mostly grade + rolling
      const load_at_1ms = vehicle.calcTotalRoadLoad(1, grade);
      const rolling = vehicle.params.cR * m * g * Math.cos(theta);
      const aero = 0.5 * 1.225 * vehicle.params.cD * vehicle.params.aFrontal * 1 * 1;

      expect(load_at_1ms).toBeCloseTo(expected_grade + rolling + aero, 0);
    });

    it('should require significant power on 10% grade at 15 km/h (CAT 793D loaded)', () => {
      // CAT 793D fully loaded: 383,600 kg on 10% grade at 15 km/h
      // Manual calculation:
      //   grade force = m × g × sin(atan(0.10)) ≈ 374,400 N
      //   rolling = 0.025 × m × g × cos(θ) ≈ 93,600 N
      //   total ≈ 468,000 N
      //   power = 468,000 × 4.17 m/s ≈ 1,950 kW
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);
      const grade = 0.10;
      const v_kmh = 15;
      const v_ms = v_kmh / 3.6;

      const force = vehicle.calcTotalRoadLoad(v_ms, grade);
      const power_kW = (force * v_ms) / 1000;

      // Expected around 1950 kW for grade climb
      expect(power_kW).toBeGreaterThan(1800);
      expect(power_kW).toBeLessThan(2100);
    });
  });

  describe('Road Load - Rolling Resistance', () => {
    it('should calculate rolling resistance on flat ground', () => {
      const vehicle = new VehicleComponent({ ...CAT_793D_PARAMS, cR: 0.025 }, 1.0);

      // At very low speed, aero is negligible
      const v = 0.1; // Very slow
      const load = vehicle.calcTotalRoadLoad(v, 0);

      const m = vehicle.mass;
      const expected_rolling = vehicle.params.cR * m * 9.81;

      // Should be dominated by rolling resistance
      expect(load).toBeCloseTo(expected_rolling, -2); // Within 1%
    });

    it('should increase with mass', () => {
      const vehicle_empty = new VehicleComponent(CAT_793D_PARAMS, 0);
      const vehicle_full = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      const v = 0.1;
      const load_empty = vehicle_empty.calcTotalRoadLoad(v, 0);
      const load_full = vehicle_full.calcTotalRoadLoad(v, 0);

      // Full vehicle should have higher rolling resistance
      expect(load_full).toBeGreaterThan(load_empty);

      // Should be proportional to mass
      const ratio = load_full / load_empty;
      const mass_ratio = vehicle_full.mass / vehicle_empty.mass;
      expect(ratio).toBeCloseTo(mass_ratio, 1);
    });
  });

  describe('Road Load - Aerodynamic Drag', () => {
    it('should calculate aero drag at highway speed', () => {
      const vehicle = new VehicleComponent(PRIUS_VEHICLE, 0);
      const v_kmh = 100;
      const v_ms = v_kmh / 3.6;

      // F_aero = 0.5 × ρ × Cd × A × v²
      const expected_aero =
        0.5 * 1.225 * PRIUS_VEHICLE.cD * PRIUS_VEHICLE.aFrontal * v_ms * v_ms;

      // At high speed, aero dominates
      const load_flat = vehicle.calcTotalRoadLoad(v_ms, 0);
      const rolling = PRIUS_VEHICLE.cR * PRIUS_VEHICLE.mEmpty * 9.81;

      expect(load_flat - rolling).toBeCloseTo(expected_aero, 1);
    });

    it('should scale with velocity squared', () => {
      const vehicle = new VehicleComponent(PRIUS_VEHICLE, 0);

      const load_50 = vehicle.calcTotalRoadLoad(50 / 3.6, 0);
      const load_100 = vehicle.calcTotalRoadLoad(100 / 3.6, 0);

      // Aero at 100 km/h should be ~4x aero at 50 km/h
      // But total load includes rolling, so ratio won't be exactly 4
      const rolling = PRIUS_VEHICLE.cR * PRIUS_VEHICLE.mEmpty * 9.81;
      const aero_50 = load_50 - rolling;
      const aero_100 = load_100 - rolling;

      expect(aero_100 / aero_50).toBeCloseTo(4, 0);
    });
  });

  describe('Wheel Torque', () => {
    it('should convert road load to wheel torque', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);
      const grade = 0.10;
      const v_ms = 10;

      const force = vehicle.calcTotalRoadLoad(v_ms, grade);
      const torque = vehicle.calcWheelTorqueDemand(v_ms, grade);

      // Torque = Force × wheel radius
      expect(torque).toBeCloseTo(force * vehicle.params.rWheel, 0);
    });
  });

  describe('Speed Conversions', () => {
    it('should convert wheel speed to velocity', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      // omega_wheel × r_wheel = velocity
      const omega_wheel = 10; // rad/s
      const velocity = vehicle.wheelSpeedToVelocity(omega_wheel);

      expect(velocity).toBeCloseTo(10 * 1.78, 6);
    });

    it('should convert velocity to wheel speed', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      const velocity = 15 / 3.6; // 15 km/h in m/s
      const omega_wheel = vehicle.velocityToWheelSpeed(velocity);

      expect(omega_wheel).toBeCloseTo(velocity / 1.78, 6);
    });

    it('should be inverse operations', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      const original_omega = 5.5;
      const velocity = vehicle.wheelSpeedToVelocity(original_omega);
      const recovered_omega = vehicle.velocityToWheelSpeed(velocity);

      expect(recovered_omega).toBeCloseTo(original_omega, 10);
    });
  });

  describe('Effective Mass', () => {
    it('should include rotational inertia contribution', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      const m_eff = vehicle.getEffectiveMass();
      const m_base = vehicle.mass;
      const j_wheels = vehicle.params.jWheels;
      const r_wheel = vehicle.params.rWheel;

      // m_eff = m + J_wheels / r²
      const expected = m_base + j_wheels / (r_wheel * r_wheel);
      expect(m_eff).toBeCloseTo(expected, 0);
    });

    it('should be slightly larger than base mass', () => {
      const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

      expect(vehicle.getEffectiveMass()).toBeGreaterThan(vehicle.mass);
    });
  });
});

describe('Inertia', () => {
  it('should calculate wheel inertia correctly', () => {
    const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

    const inertia = vehicle.getInertia('wheels');

    // Effective inertia = J_wheels + m × r²
    const expected = vehicle.params.jWheels + vehicle.mass * vehicle.params.rWheel ** 2;
    expect(inertia).toBeCloseTo(expected, 0);
  });

  it('should throw for unknown port', () => {
    const vehicle = new VehicleComponent(CAT_793D_PARAMS, 1.0);

    expect(() => vehicle.getInertia('unknown')).toThrow();
  });
});
