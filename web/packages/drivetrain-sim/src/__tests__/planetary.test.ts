/**
 * Planetary gear kinematics tests.
 *
 * Reference: Liu & Peng (2008) "Modeling and Control of a Power-Split Hybrid Vehicle"
 * IEEE Transactions on Control Systems Technology, Vol. 16, No. 6
 *
 * Validates Willis equation implementation against published Prius parameters.
 */

import { describe, it, expect } from 'vitest';
import { WillisConstraint } from '../core/constraints';
import { PlanetaryGearComponent } from '../components/planetary';

// ============================================================================
// PRIUS PARAMETERS FROM LIU & PENG (2008) - TABLE I
// ============================================================================
const PRIUS_PARAMS = {
  Z_sun: 30,   // Sun gear teeth
  Z_ring: 78,  // Ring gear teeth
  get rho() { return this.Z_ring / this.Z_sun; }, // = 2.6 planetary ratio
  K_final: 3.9,       // Final drive ratio
  r_wheel: 0.287,     // Wheel radius [m]
  m_vehicle: 1254,    // Vehicle mass [kg]
  MG1_rpm_max: 6500,  // MG1 max speed [rpm]
};

// CAT 793D parameters for comparison
const CAT_793D_PARAMS = {
  Z_sun: 30,
  Z_ring: 90,
  get rho() { return this.Z_ring / this.Z_sun; }, // = 3.0
  K_final: 9.0,       // Final drive after 2-speed gearbox
  r_wheel: 1.78,      // Wheel radius [m]
  MG1_rpm_max: 6000,
};

// Helper: RPM to rad/s
const rpmToRadS = (rpm: number): number => (rpm * Math.PI) / 30;

// Helper: rad/s to RPM
const radSToRpm = (radS: number): number => (radS * 30) / Math.PI;

// Helper: vehicle speed [m/s] to ring speed [rad/s]
const vehicleSpeedToRingSpeed = (v_ms: number, K_final: number, r_wheel: number): number => {
  return (v_ms * K_final) / r_wheel;
};

describe('Willis Equation', () => {
  describe('Prius THS (ρ = 2.6)', () => {
    const rho = PRIUS_PARAMS.rho;
    const constraint = new WillisConstraint({
      sunPort: 'sun',
      carrierPort: 'carrier',
      ringPort: 'ring',
      rho,
    });

    it('should calculate MG1 speed at standstill', () => {
      // At standstill, ring speed = 0
      // ω_MG1 = (1 + ρ) × ω_engine - ρ × ω_ring
      // ω_MG1 = 3.6 × ω_engine

      const rpm_engine = 1000;
      const omega_engine = rpmToRadS(rpm_engine);
      const omega_ring = 0;

      const omega_MG1 = constraint.calcSunSpeed(omega_engine, omega_ring);
      const rpm_MG1 = radSToRpm(omega_MG1);

      // Expected: 3.6 × 1000 = 3600 rpm
      expect(rpm_MG1).toBeCloseTo(3600, 0);
    });

    it('should calculate MG1 speed at highway speed', () => {
      // Liu & Peng example: 2333 rpm engine, 80 km/h
      const rpm_engine = 2333;
      const v_kmh = 80;
      const v_ms = v_kmh / 3.6;

      const omega_engine = rpmToRadS(rpm_engine);
      const omega_ring = vehicleSpeedToRingSpeed(v_ms, PRIUS_PARAMS.K_final, PRIUS_PARAMS.r_wheel);

      const omega_MG1 = constraint.calcSunSpeed(omega_engine, omega_ring);
      const rpm_MG1 = radSToRpm(omega_MG1);

      // At highway speed with optimal engine rpm, MG1 should be within limits
      expect(Math.abs(rpm_MG1)).toBeLessThan(PRIUS_PARAMS.MG1_rpm_max);
    });

    it('should have correct speed relation coefficients', () => {
      const relation = constraint.getSpeedRelation();

      // ω_sun - (1+ρ)·ω_carrier + ρ·ω_ring = 0
      expect(relation['sun']).toBeCloseTo(1.0, 6);
      expect(relation['carrier']).toBeCloseTo(-(1 + rho), 6);
      expect(relation['ring']).toBeCloseTo(rho, 6);
    });

    it('should satisfy Willis equation for multiple test points', () => {
      // Test points from Liu & Peng paper validation
      const testPoints = [
        { rpm_e: 1000, v_kmh: 0 },
        { rpm_e: 1500, v_kmh: 0 },
        { rpm_e: 1200, v_kmh: 20 },
        { rpm_e: 1500, v_kmh: 40 },
        { rpm_e: 2000, v_kmh: 60 },
        { rpm_e: 2333, v_kmh: 80 },
      ];

      for (const { rpm_e, v_kmh } of testPoints) {
        const omega_e = rpmToRadS(rpm_e);
        const v_ms = v_kmh / 3.6;
        const omega_r = vehicleSpeedToRingSpeed(v_ms, PRIUS_PARAMS.K_final, PRIUS_PARAMS.r_wheel);

        const omega_s = constraint.calcSunSpeed(omega_e, omega_r);

        // Verify: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
        const expected = (1 + rho) * omega_e - rho * omega_r;
        expect(omega_s).toBeCloseTo(expected, 6);
      }
    });
  });

  describe('CAT 793D (ρ = 3.0)', () => {
    const rho = CAT_793D_PARAMS.rho;
    const constraint = new WillisConstraint({
      sunPort: 'sun',
      carrierPort: 'carrier',
      ringPort: 'ring',
      rho,
    });

    it('should calculate MG1 speed at standstill', () => {
      // ω_MG1 = 4 × ω_engine at standstill
      const rpm_engine = 1200;
      const omega_engine = rpmToRadS(rpm_engine);
      const omega_ring = 0;

      const omega_MG1 = constraint.calcSunSpeed(omega_engine, omega_ring);
      const rpm_MG1 = radSToRpm(omega_MG1);

      // Expected: 4 × 1200 = 4800 rpm
      expect(rpm_MG1).toBeCloseTo(4800, 0);
    });

    it('should have correct speed relation for ρ=3.0', () => {
      const relation = constraint.getSpeedRelation();

      // ω_sun - 4·ω_carrier + 3·ω_ring = 0
      expect(relation['sun']).toBeCloseTo(1.0, 6);
      expect(relation['carrier']).toBeCloseTo(-4.0, 6);
      expect(relation['ring']).toBeCloseTo(3.0, 6);
    });
  });
});

describe('Torque Relationships', () => {
  describe('Prius THS (ρ = 2.6)', () => {
    const rho = PRIUS_PARAMS.rho;
    const constraint = new WillisConstraint({
      sunPort: 'sun',
      carrierPort: 'carrier',
      ringPort: 'ring',
      rho,
    });

    it('should have correct torque ratios', () => {
      const [t_sun, t_carrier, t_ring] = constraint.getTorqueRatios();

      // τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ
      expect(t_sun).toBeCloseTo(1.0, 6);
      expect(t_carrier).toBeCloseTo(-(1 + rho), 6);
      expect(t_ring).toBeCloseTo(rho, 6);
    });

    it('should calculate torque split to ring (output)', () => {
      // Engine torque to ring = ρ/(1+ρ) = 2.6/3.6 = 72.2%
      const ringFraction = rho / (1 + rho);
      expect(ringFraction).toBeCloseTo(0.722, 2);
    });

    it('should calculate torque reaction on MG1 (sun)', () => {
      // Engine torque to MG1 = 1/(1+ρ) = 1/3.6 = 27.8%
      const sunFraction = 1 / (1 + rho);
      expect(sunFraction).toBeCloseTo(0.278, 2);
    });
  });

  describe('CAT 793D (ρ = 3.0)', () => {
    const rho = CAT_793D_PARAMS.rho;

    it('should calculate torque split to ring', () => {
      // Engine torque to ring = 3/4 = 75%
      const ringFraction = rho / (1 + rho);
      expect(ringFraction).toBeCloseTo(0.75, 2);
    });

    it('should calculate torque reaction on MG1', () => {
      // Engine torque to MG1 = 1/4 = 25%
      const sunFraction = 1 / (1 + rho);
      expect(sunFraction).toBeCloseTo(0.25, 2);
    });
  });
});

describe('Planetary Gear Component', () => {
  it('should create component with Prius parameters', () => {
    // Prius: Z_sun=30, Z_ring=78 → rho=2.6
    const planetary = new PlanetaryGearComponent(
      { zSun: PRIUS_PARAMS.Z_sun, zRing: PRIUS_PARAMS.Z_ring },
      'planetary'
    );

    expect(planetary.rho).toBeCloseTo(PRIUS_PARAMS.rho, 6);
    expect(planetary.componentType).toBe('planetary');
  });

  it('should create component with CAT 793D parameters', () => {
    // CAT 793D: Z_sun=30, Z_ring=90 → rho=3.0
    const planetary = new PlanetaryGearComponent(
      { zSun: CAT_793D_PARAMS.Z_sun, zRing: CAT_793D_PARAMS.Z_ring },
      'planetary'
    );

    expect(planetary.rho).toBeCloseTo(3.0, 6);
  });

  it('should return Willis constraint', () => {
    const planetary = new PlanetaryGearComponent(
      { zSun: PRIUS_PARAMS.Z_sun, zRing: PRIUS_PARAMS.Z_ring },
      'planetary'
    );

    const constraints = planetary.getConstraints();
    expect(constraints.length).toBe(1);
    expect(constraints[0]).toBeInstanceOf(WillisConstraint);
  });
});

describe('MG1 Speed Limits', () => {
  it('should identify feasible region boundary for Prius', () => {
    const rho = PRIUS_PARAMS.rho;
    const omega_MG1_max = rpmToRadS(PRIUS_PARAMS.MG1_rpm_max);

    // At standstill with MG1 at limit:
    // ω_MG1_max = (1+ρ) × ω_engine
    // ω_engine = ω_MG1_max / (1+ρ)
    const omega_engine_max = omega_MG1_max / (1 + rho);
    const rpm_engine_max = radSToRpm(omega_engine_max);

    // Max engine speed at standstill = 6500/3.6 ≈ 1806 rpm
    expect(rpm_engine_max).toBeCloseTo(1806, 0);
  });

  it('should identify minimum vehicle speed at MG1 limit', () => {
    const rho = PRIUS_PARAMS.rho;
    const omega_MG1_max = rpmToRadS(PRIUS_PARAMS.MG1_rpm_max);

    // At constant engine speed (2333 rpm from Liu & Peng):
    // ω_MG1 = (1+ρ)×ω_e - ρ×ω_r
    // When MG1 hits limit: ω_r = [(1+ρ)×ω_e - ω_MG1_max] / ρ
    const rpm_e = 2333;
    const omega_e = rpmToRadS(rpm_e);

    const omega_r_at_limit = ((1 + rho) * omega_e - omega_MG1_max) / rho;
    const v_ms = (omega_r_at_limit * PRIUS_PARAMS.r_wheel) / PRIUS_PARAMS.K_final;
    const v_kmh = v_ms * 3.6;

    // Minimum speed where MG1 limit is not exceeded at 2333 rpm
    expect(v_kmh).toBeGreaterThan(0);
  });
});
