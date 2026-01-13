/**
 * Controller for conventional diesel drivetrains.
 */

import { Drivetrain } from '../core/drivetrain';
import { DrivetrainController } from './base';

/**
 * Gear shift schedule based on vehicle speed.
 */
export interface GearShiftSchedule {
  /** Speed thresholds for upshifting [m/s] */
  upshiftSpeeds: number[];
  /** Speed thresholds for downshifting [m/s] */
  downshiftSpeeds: number[];
  /** Speed hysteresis to prevent hunting [m/s] */
  hysteresis: number;
}

/**
 * Create shift schedule from gear ratios.
 *
 * @param ratios - Gear ratios [K1, K2, ...]
 * @param engineRpmUpshift - Engine RPM to upshift at
 * @param engineRpmDownshift - Engine RPM to downshift at
 * @param wheelRadius - Wheel radius [m]
 * @param finalDrive - Final drive ratio
 */
export function createShiftSchedule(
  ratios: number[],
  engineRpmUpshift: number = 1500.0,
  engineRpmDownshift: number = 1000.0,
  wheelRadius: number,
  finalDrive: number
): GearShiftSchedule {
  const omegaUp = (engineRpmUpshift * Math.PI) / 30.0;
  const omegaDown = (engineRpmDownshift * Math.PI) / 30.0;

  const upshiftSpeeds: number[] = [];
  const downshiftSpeeds: number[] = [];

  // Speed at which to upshift from gear i to i+1
  for (let i = 0; i < ratios.length - 1; i++) {
    const ratio = ratios[i];
    const vUp = (omegaUp * wheelRadius) / (ratio * finalDrive);
    upshiftSpeeds.push(vUp);
  }

  // Speed at which to downshift from gear i to i-1
  for (let i = 1; i < ratios.length; i++) {
    const ratio = ratios[i];
    const vDown = (omegaDown * wheelRadius) / (ratio * finalDrive);
    downshiftSpeeds.push(vDown);
  }

  return {
    upshiftSpeeds,
    downshiftSpeeds,
    hysteresis: 1.0,
  };
}

/**
 * Controller for conventional diesel drivetrain.
 *
 * Controls:
 * - Engine torque based on speed error (proportional control)
 * - Gear selection based on speed schedule
 *
 * Works with drivetrains that have:
 * - One engine component
 * - One multi-speed gearbox
 */
export class ConventionalDieselController extends DrivetrainController {
  readonly engineName: string;
  readonly gearboxName: string;
  readonly Kp: number;
  shiftSchedule!: GearShiftSchedule;
  private _currentGear: number = 0;
  private _engine: any;
  private _gearbox: any;
  private _wheelRadius: number;
  private _finalDrive: number;

  constructor(
    drivetrain: Drivetrain,
    engineName: string = 'engine',
    gearboxName: string = 'gearbox',
    Kp: number = 50000.0,
    shiftSchedule?: GearShiftSchedule
  ) {
    super(drivetrain);
    this.engineName = engineName;
    this.gearboxName = gearboxName;
    this.Kp = Kp;

    // Get component references
    this._engine = drivetrain.getComponent(engineName);
    this._gearbox = drivetrain.getComponent(gearboxName);

    // Discover wheel radius and final drive from components
    const { wheelRadius, finalDrive } = this._discoverDrivelineParams();
    this._wheelRadius = wheelRadius;
    this._finalDrive = finalDrive;

    // Create shift schedule if not provided
    if (shiftSchedule) {
      this.shiftSchedule = shiftSchedule;
    } else {
      this._createDefaultSchedule();
    }
  }

  private _discoverDrivelineParams(): { wheelRadius: number; finalDrive: number } {
    let wheelRadius: number | null = null;
    let finalDrive: number | null = null;

    for (const comp of this.drivetrain.topology.components.values()) {
      // Find vehicle for wheel radius
      if (comp.componentType === 'vehicle' && 'params' in comp) {
        const vehicleParams = (comp as any).params;
        if ('rWheel' in vehicleParams) {
          wheelRadius = vehicleParams.rWheel;
        }
      }
      // Find final drive ratio
      if (
        comp.componentType === 'gearbox' &&
        comp.name.toLowerCase().includes('final') &&
        'currentRatio' in comp
      ) {
        finalDrive = (comp as any).currentRatio;
      }
    }

    if (wheelRadius === null) {
      throw new Error('Could not find vehicle component with wheel radius');
    }
    if (finalDrive === null) {
      throw new Error('Could not find final drive component');
    }

    return { wheelRadius, finalDrive };
  }

  private _createDefaultSchedule(): void {
    const ratios = this._gearbox.params.ratios;

    this.shiftSchedule = createShiftSchedule(
      ratios,
      1500.0,
      1000.0,
      this._wheelRadius,
      this._finalDrive
    );
  }

  compute(state: Record<string, number>, grade: number): Record<string, number> {
    // Get current velocity
    const velocity = this.getVelocity(state);

    // Get target velocity
    const vTarget = this._targetVelocity ?? 10.0;

    // Gear selection
    const gear = this._selectGear(velocity, grade);
    this._currentGear = gear;

    // Engine torque (proportional speed control)
    const vError = vTarget - velocity;
    const tDemand = this.Kp * vError;

    // Get engine torque after clipping
    const tEngine = this._computeEngineTorque(state, tDemand);

    return {
      [`T_${this.engineName}`]: tEngine,
      [`gear_${this.gearboxName}`]: gear,
    };
  }

  private _selectGear(velocity: number, grade: number): number {
    let gear = this._currentGear;
    const nGears = this._gearbox.nGears;

    // Consider grade in shift decisions
    const gradeFactor = 1.0 - grade * 5.0; // Lower shift points on grades

    // Check for upshift
    if (gear < nGears - 1) {
      const upshiftSpeed =
        this.shiftSchedule.upshiftSpeeds[gear] * gradeFactor;
      if (velocity > upshiftSpeed + this.shiftSchedule.hysteresis) {
        gear = gear + 1;
      }
    }

    // Check for downshift
    if (gear > 0) {
      const downshiftSpeed =
        this.shiftSchedule.downshiftSpeeds[gear - 1] * gradeFactor;
      if (velocity < downshiftSpeed - this.shiftSchedule.hysteresis) {
        gear = gear - 1;
      }
    }

    return gear;
  }

  private _computeEngineTorque(
    state: Record<string, number>,
    tDemand: number
  ): number {
    // Get engine speed from state using exact key format
    const engineShaftKey = `${this.engineName}.shaft`;
    let omegaE = Math.abs(state[engineShaftKey] ?? 0);

    // If not in state (shaft may be eliminated by constraint), estimate from vehicle speed
    if (omegaE < 1.0) {
      const velocity = this.getVelocity(state);
      const gearRatio = this._gearbox.getRatio(this._currentGear);
      const omegaWheel = velocity / this._wheelRadius;
      omegaE = omegaWheel * gearRatio * this._finalDrive;
    }

    // Convert to RPM and clip
    const rpm = (omegaE * 30.0) / Math.PI;
    const tClipped = this._engine.clipTorque(rpm, Math.max(0.0, tDemand));

    return tClipped;
  }

  reset(): void {
    this._currentGear = 0;
  }
}
