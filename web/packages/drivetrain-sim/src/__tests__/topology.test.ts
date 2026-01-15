/**
 * Topology validation tests.
 *
 * Tests the path connectivity validation to ensure disconnections
 * in the drive chain are properly detected.
 */

import { describe, it, expect } from 'vitest';
import { DrivetrainTopology, TopologyError } from '../core/topology';
import { EngineComponent } from '../components/engine';
import { NSpeedGearboxComponent } from '../components/gearbox';
import { VehicleComponent } from '../components/vehicle';
import { MotorComponent } from '../components/motor';
import { PlanetaryGearComponent } from '../components/planetary';

describe('DrivetrainTopology Validation', () => {
  describe('Basic validation', () => {
    it('should pass for a valid simple drivetrain', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      expect(errors).toHaveLength(0);
    });

    it('should fail when no components exist', () => {
      const topology = new DrivetrainTopology();
      const errors = topology.validate();
      expect(errors).toContain('Topology has no components');
    });

    it('should fail when no output is set', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'vehicle', 'wheels');

      const errors = topology.validate();
      expect(errors.some(e => e.includes('No output port set'))).toBe(true);
    });

    it('should fail when no actuator exists', () => {
      const topology = new DrivetrainTopology()
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      expect(errors.some(e => e.includes('at least one actuator'))).toBe(true);
    });
  });

  describe('Path connectivity validation', () => {
    it('should fail when engine is not connected to vehicle', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        // Engine connected to gearbox input, but gearbox output not connected to vehicle
        .connect('engine', 'shaft', 'gearbox', 'input')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      // Should detect that vehicle is disconnected
      expect(errors.some(e => e.includes('not connected'))).toBe(true);
    });

    it('should fail when drive chain has a gap', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        // Only connect engine to gearbox, leave vehicle disconnected
        .connect('engine', 'shaft', 'gearbox', 'input')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(e =>
          e.includes('not connected') ||
          e.includes('No mechanical path')
        )
      ).toBe(true);
    });

    it('should detect actuator without path to output', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('motor', new MotorComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        // Engine is connected to vehicle via gearbox
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        // Motor is not connected to anything mechanical
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      // Motor should be flagged as disconnected
      expect(
        errors.some(e =>
          e.includes('motor') &&
          (e.includes('not connected') || e.includes('no mechanical path'))
        )
      ).toBe(true);
    });

    it('should pass when all components are on the path to vehicle', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();
      expect(errors).toHaveLength(0);
    });
  });

  describe('hasMechanicalPathToOutput', () => {
    it('should return true when path exists', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      expect(topology.hasMechanicalPathToOutput('engine')).toBe(true);
      expect(topology.hasMechanicalPathToOutput('gearbox')).toBe(true);
      expect(topology.hasMechanicalPathToOutput('vehicle')).toBe(true);
    });

    it('should return false when no path exists', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        // Only partial connection
        .connect('engine', 'shaft', 'gearbox', 'input')
        .setOutput('vehicle', 'wheels');

      expect(topology.hasMechanicalPathToOutput('engine')).toBe(false);
      expect(topology.hasMechanicalPathToOutput('gearbox')).toBe(false);
      expect(topology.hasMechanicalPathToOutput('vehicle')).toBe(true);
    });
  });

  describe('getConnectedMechanicalComponents', () => {
    it('should return all components on the mechanical path', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const connected = topology.getConnectedMechanicalComponents();
      expect(connected.has('engine')).toBe(true);
      expect(connected.has('gearbox')).toBe(true);
      expect(connected.has('vehicle')).toBe(true);
    });

    it('should not include disconnected components', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('motor', new MotorComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        // Engine connected via gearbox, motor is standalone
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const connected = topology.getConnectedMechanicalComponents();
      expect(connected.has('engine')).toBe(true);
      expect(connected.has('gearbox')).toBe(true);
      expect(connected.has('vehicle')).toBe(true);
      expect(connected.has('motor')).toBe(false);
    });
  });

  describe('build() with invalid topology', () => {
    it('should throw TopologyError for disconnected drivetrain', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('vehicle', new VehicleComponent())
        // No connection between engine and vehicle
        .setOutput('vehicle', 'wheels');

      expect(() => topology.build()).toThrow(TopologyError);
    });

    it('should build successfully for valid topology', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('gearbox', new NSpeedGearboxComponent())
        .addComponent('vehicle', new VehicleComponent())
        .connect('engine', 'shaft', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      expect(() => topology.build()).not.toThrow();
      const drivetrain = topology.build();
      expect(drivetrain).toBeDefined();
      expect(drivetrain.nMechanicalDofs).toBeGreaterThan(0);
    });
  });

  describe('Complex topologies', () => {
    it('should validate eCVT topology with planetary gear', () => {
      const topology = new DrivetrainTopology()
        .addComponent('engine', new EngineComponent())
        .addComponent('mg1', new MotorComponent())
        .addComponent('mg2', new MotorComponent())
        .addComponent('planetary', new PlanetaryGearComponent({ zSun: 30, zRing: 90 }))
        .addComponent('gearbox', new NSpeedGearboxComponent({ ratios: [3.0, 1.0] }))
        .addComponent('vehicle', new VehicleComponent())
        // Engine to carrier
        .connect('engine', 'shaft', 'planetary', 'carrier')
        // MG1 to sun
        .connect('mg1', 'shaft', 'planetary', 'sun')
        // MG2 and ring to gearbox (simplified - in reality these would merge)
        .connect('planetary', 'ring', 'gearbox', 'input')
        .connect('gearbox', 'output', 'vehicle', 'wheels')
        .setOutput('vehicle', 'wheels');

      const errors = topology.validate();

      // MG2 is not connected, should be flagged
      const mg2Errors = errors.filter(e => e.toLowerCase().includes('mg2'));
      expect(mg2Errors.length).toBeGreaterThan(0);

      // But the rest of the topology should be valid
      // Engine, MG1, planetary, gearbox, vehicle should all be connected
      const connected = topology.getConnectedMechanicalComponents();
      expect(connected.has('engine')).toBe(true);
      expect(connected.has('mg1')).toBe(true);
      expect(connected.has('planetary')).toBe(true);
      expect(connected.has('gearbox')).toBe(true);
      expect(connected.has('vehicle')).toBe(true);
    });
  });
});
