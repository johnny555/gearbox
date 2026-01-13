/**
 * Gearbox component tests.
 *
 * Tests N-speed gearbox, final drive, and efficiency models.
 */

import { describe, it, expect } from 'vitest';
import {
  NSpeedGearboxComponent,
  FinalDriveComponent,
  FixedRatioGearComponent,
  ECVT_GEARBOX_PARAMS,
  DIESEL_7SPEED_PARAMS,
} from '../components/gearbox';
import { GearRatioConstraint } from '../core/constraints';

describe('NSpeedGearboxComponent', () => {
  describe('Construction', () => {
    it('should create with default parameters', () => {
      const gearbox = new NSpeedGearboxComponent();

      expect(gearbox.nGears).toBe(3);
      expect(gearbox.gear).toBe(0);
      expect(gearbox.componentType).toBe('gearbox');
    });

    it('should create with eCVT 2-speed parameters', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      expect(gearbox.nGears).toBe(2);
      expect(gearbox.params.ratios).toEqual([5.0, 0.67]);
      expect(gearbox.params.efficiencies).toEqual([0.97, 0.97]);
    });

    it('should create with diesel 7-speed parameters', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      expect(gearbox.nGears).toBe(7);
      expect(gearbox.params.ratios[0]).toBe(4.59);
      expect(gearbox.params.ratios[6]).toBe(0.65);
    });
  });

  describe('Gear Selection', () => {
    it('should start in first gear', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      expect(gearbox.gear).toBe(0);
      expect(gearbox.currentRatio).toBe(4.59);
    });

    it('should change gear correctly', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      gearbox.gear = 3;
      expect(gearbox.gear).toBe(3);
      expect(gearbox.currentRatio).toBe(1.4);
    });

    it('should clamp gear to valid range', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      gearbox.gear = -1;
      expect(gearbox.gear).toBe(0);

      gearbox.gear = 100;
      expect(gearbox.gear).toBe(6); // Max gear is 6 (0-indexed)
    });
  });

  describe('Gear Ratios', () => {
    it('should return correct ratio for each gear', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      expect(gearbox.getRatio(0)).toBe(5.0);
      expect(gearbox.getRatio(1)).toBe(0.67);
    });

    it('should use current gear if not specified', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      gearbox.gear = 1;
      expect(gearbox.getRatio()).toBe(0.67);
    });
  });

  describe('Speed Transformations', () => {
    it('should convert input speed to output speed', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      // Low gear: ratio = 5.0
      // omega_out = omega_in / ratio
      const omega_in = 100; // rad/s
      const omega_out = gearbox.inputToOutputSpeed(omega_in, 0);

      expect(omega_out).toBeCloseTo(100 / 5.0, 6);
    });

    it('should convert output speed to input speed', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      // omega_in = omega_out × ratio
      const omega_out = 20; // rad/s
      const omega_in = gearbox.outputToInputSpeed(omega_out, 0);

      expect(omega_in).toBeCloseTo(20 * 5.0, 6);
    });
  });

  describe('Efficiency Model', () => {
    it('should return nominal efficiency when variable model disabled', () => {
      const gearbox = new NSpeedGearboxComponent({
        ...ECVT_GEARBOX_PARAMS,
        useVariableEfficiency: false,
      });

      const eta = gearbox.getEfficiency(1000, 5000, 0);
      expect(eta).toBe(0.97);
    });

    it('should decrease efficiency at high speed (churning losses)', () => {
      const gearbox = new NSpeedGearboxComponent({
        ...ECVT_GEARBOX_PARAMS,
        useVariableEfficiency: true,
      });

      const eta_low_speed = gearbox.getEfficiency(100, 0, 0);
      const eta_high_speed = gearbox.getEfficiency(1000, 0, 0);

      expect(eta_high_speed).toBeLessThan(eta_low_speed);
    });

    it('should decrease efficiency at high torque (mesh losses)', () => {
      const gearbox = new NSpeedGearboxComponent({
        ...ECVT_GEARBOX_PARAMS,
        useVariableEfficiency: true,
      });

      const eta_low_torque = gearbox.getEfficiency(100, 1000, 0);
      const eta_high_torque = gearbox.getEfficiency(100, 50000, 0);

      expect(eta_high_torque).toBeLessThan(eta_low_torque);
    });

    it('should clamp efficiency to reasonable bounds', () => {
      const gearbox = new NSpeedGearboxComponent({
        ...ECVT_GEARBOX_PARAMS,
        useVariableEfficiency: true,
      });

      // Even at extreme conditions, efficiency should be bounded
      const eta = gearbox.getEfficiency(10000, 100000, 0);

      expect(eta).toBeGreaterThanOrEqual(0.85);
      expect(eta).toBeLessThanOrEqual(0.995);
    });
  });

  describe('Constraints', () => {
    it('should return GearRatioConstraint', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      const constraints = gearbox.getConstraints();
      expect(constraints.length).toBe(1);
      expect(constraints[0]).toBeInstanceOf(GearRatioConstraint);
    });

    it('should update constraint when gear changes', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      const constraints_gear0 = gearbox.getConstraints();
      expect((constraints_gear0[0] as GearRatioConstraint).ratio).toBe(5.0);

      gearbox.gear = 1;
      const constraints_gear1 = gearbox.getConstraints();
      expect((constraints_gear1[0] as GearRatioConstraint).ratio).toBe(0.67);
    });
  });

  describe('Control Inputs', () => {
    it('should update gear from control inputs', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      gearbox.computeTorques({}, { gear: 3 });
      expect(gearbox.gear).toBe(3);
    });

    it('should floor gear value', () => {
      const gearbox = new NSpeedGearboxComponent(DIESEL_7SPEED_PARAMS);

      gearbox.computeTorques({}, { gear: 2.7 });
      expect(gearbox.gear).toBe(2);
    });
  });

  describe('Reflected Inertia', () => {
    it('should calculate reflected inertia correctly', () => {
      const gearbox = new NSpeedGearboxComponent(ECVT_GEARBOX_PARAMS);

      const j_output = 100; // kg·m²
      const ratio = 5.0;

      const j_reflected = gearbox.getReflectedInertia(j_output, 0);

      // J_reflected = J_output / ratio²
      expect(j_reflected).toBeCloseTo(100 / 25, 6);
    });
  });
});

describe('FinalDriveComponent', () => {
  it('should create with specified ratio', () => {
    const finalDrive = new FinalDriveComponent(16.0, 0.96, 'final_drive');

    expect(finalDrive.ratio).toBe(16.0);
    expect(finalDrive.nGears).toBe(1);
    expect(finalDrive.componentType).toBe('gearbox');
  });

  it('should always be in gear 0', () => {
    const finalDrive = new FinalDriveComponent(9.0);

    finalDrive.gear = 5; // Try to change
    expect(finalDrive.gear).toBe(0); // Should clamp to 0
  });
});

describe('FixedRatioGearComponent', () => {
  it('should create with custom inertias', () => {
    const gear = new FixedRatioGearComponent(2.5, 0.98, 10, 20, 'reduction');

    expect(gear.ratio).toBe(2.5);
    expect(gear.efficiency).toBe(0.98);
    expect(gear.params.jInput).toBe(10);
    expect(gear.params.jOutput).toBe(20);
  });
});

describe('GearRatioConstraint', () => {
  it('should have correct speed relation', () => {
    const constraint = new GearRatioConstraint({
      inputPort: 'input',
      outputPort: 'output',
      ratio: 5.0,
      efficiency: 0.97,
    });

    const relation = constraint.getSpeedRelation();

    // omega_in - ratio × omega_out = 0
    expect(relation['input']).toBe(1.0);
    expect(relation['output']).toBe(-5.0);
  });

  it('should transform speed correctly', () => {
    const constraint = new GearRatioConstraint({
      inputPort: 'input',
      outputPort: 'output',
      ratio: 5.0,
    });

    const omega_out = constraint.transformSpeed(100);
    expect(omega_out).toBe(20);
  });

  it('should transform torque with efficiency', () => {
    const constraint = new GearRatioConstraint({
      inputPort: 'input',
      outputPort: 'output',
      ratio: 5.0,
      efficiency: 0.97,
    });

    // Back-propagation: T_in = T_out / (ratio × efficiency)
    const t_in = constraint.transformTorque(100);
    expect(t_in).toBeCloseTo(100 / (5.0 * 0.97), 6);
  });

  it('should reflect inertia correctly', () => {
    const constraint = new GearRatioConstraint({
      inputPort: 'input',
      outputPort: 'output',
      ratio: 5.0,
    });

    const j_reflected = constraint.getReflectedInertia(100);
    expect(j_reflected).toBe(4); // 100 / 25
  });
});
