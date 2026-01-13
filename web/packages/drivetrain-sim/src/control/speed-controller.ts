/**
 * Generic speed controller for any drivetrain type.
 */

import { Drivetrain } from '../core/drivetrain';
import { DrivetrainController } from './base';

/**
 * Describes how to allocate torque demand among actuators.
 */
export interface TorqueAllocation {
  /** Component names */
  actuators: string[];
  /** Fraction of demand for each */
  fractions: number[];
  /** Whether each is an engine (non-negative torque only) */
  isEngine: boolean[];
}

/**
 * Generic proportional-integral speed controller.
 *
 * Works with any drivetrain by discovering actuators (engines, motors)
 * and distributing torque demand among them.
 */
export class SpeedController extends DrivetrainController {
  readonly Kp: number;
  readonly Ki: number;
  allocation!: TorqueAllocation;
  private _integral: number = 0;
  private _gearboxName: string | null = null;
  private _currentGear: number = 0;
  private _vMax: number;

  constructor(
    drivetrain: Drivetrain,
    Kp: number = 50000.0,
    Ki: number = 5000.0,
    allocation?: TorqueAllocation
  ) {
    super(drivetrain);
    this.Kp = Kp;
    this.Ki = Ki;

    // Discover actuators if not specified
    if (allocation) {
      this.allocation = allocation;
    } else {
      this._discoverActuators();
    }

    // Find gearbox for gear control
    this._gearboxName = this._findGearbox();

    // Discover max speed from vehicle component
    this._vMax = this._discoverMaxSpeed();
  }

  private _discoverMaxSpeed(): number {
    for (const comp of this.drivetrain.topology.components.values()) {
      if (comp.componentType === 'vehicle' && 'params' in comp) {
        const vehicleParams = (comp as any).params;
        if ('vMax' in vehicleParams) {
          return vehicleParams.vMax;
        }
      }
    }
    // Default fallback if no vehicle found
    return 15.0;
  }

  private _discoverActuators(): void {
    const actuators: string[] = [];
    const fractions: number[] = [];
    const isEngine: boolean[] = [];

    const components = this.drivetrain.topology.components;

    // Find all engines and motors using componentType (survives minification)
    for (const [name, comp] of components) {
      if (comp.componentType === 'engine') {
        actuators.push(name);
        isEngine.push(true);
      } else if (comp.componentType === 'motor') {
        actuators.push(name);
        isEngine.push(false);
      }
    }

    if (actuators.length === 0) {
      throw new Error('No actuators (engines/motors) found in drivetrain');
    }

    // Simple equal allocation
    const n = actuators.length;
    for (let i = 0; i < n; i++) {
      fractions.push(1.0 / n);
    }

    this.allocation = { actuators, fractions, isEngine };
  }

  private _findGearbox(): string | null {
    for (const [name, comp] of this.drivetrain.topology.components) {
      if (comp.componentType === 'gearbox' && 'nGears' in comp) {
        if ((comp as any).nGears > 1) {
          return name;
        }
      }
    }
    return null;
  }

  compute(state: Record<string, number>, grade: number): Record<string, number> {
    // Get current velocity
    const velocity = this.getVelocity(state);

    // Get target velocity
    const vTarget = this._targetVelocity ?? 10.0;

    // Speed error
    const vError = vTarget - velocity;

    // PI control
    const tDemand = this.Kp * vError + this.Ki * this._integral;

    // Update integral (with anti-windup)
    if (Math.abs(this._integral) < 100.0) {
      this._integral += vError * 0.1; // Assuming ~0.1s between calls
    }

    // Allocate torque among actuators
    const controls = this._allocateTorque(state, tDemand);

    // Add gear control if gearbox exists
    if (this._gearboxName) {
      const gear = this._selectGear(velocity, grade);
      controls[`gear_${this._gearboxName}`] = gear;
      this._currentGear = gear;
    }

    return controls;
  }

  private _allocateTorque(
    state: Record<string, number>,
    tDemand: number
  ): Record<string, number> {
    const controls: Record<string, number> = {};

    for (let i = 0; i < this.allocation.actuators.length; i++) {
      const actuator = this.allocation.actuators[i];
      let tAlloc = tDemand * this.allocation.fractions[i];

      // Engines can only provide positive torque
      if (this.allocation.isEngine[i]) {
        tAlloc = Math.max(0.0, tAlloc);
      }

      // Clip to actuator limits
      const component = this.drivetrain.getComponent(actuator);
      if (component && 'clipTorque' in component) {
        // Get actuator speed using exact state key format
        // Engines and motors have a 'shaft' port
        const shaftKey = `${actuator}.shaft`;
        const omega = Math.abs(state[shaftKey] ?? 0);

        const rpm = (omega * 30.0) / Math.PI;
        tAlloc = (component as any).clipTorque(rpm, tAlloc);
      }

      controls[`T_${actuator}`] = tAlloc;
    }

    return controls;
  }

  private _selectGear(velocity: number, grade: number): number {
    if (this._gearboxName === null) {
      return 0;
    }

    const gearbox = this.drivetrain.getComponent(this._gearboxName) as any;
    const nGears = gearbox.nGears;

    // Simple speed-based selection
    const gearWidth = this._vMax / nGears;

    let gear = Math.floor(velocity / gearWidth);
    gear = Math.max(0, Math.min(gear, nGears - 1));

    // Stay in lower gear on steep grades
    if (grade > 0.05) {
      gear = Math.max(0, gear - 1);
    }
    if (grade > 0.1) {
      gear = 0;
    }

    return gear;
  }

  reset(): void {
    this._integral = 0;
    this._currentGear = 0;
  }
}
