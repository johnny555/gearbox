/**
 * Engine component for drivetrain simulation.
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';
import { interp } from '../math/interpolate';

/**
 * Engine parameters.
 */
export interface EngineParams {
  /** Low idle speed [rpm] */
  rpmIdle?: number;
  /** Minimum operating speed [rpm] */
  rpmMin?: number;
  /** Maximum operating speed [rpm] */
  rpmMax?: number;
  /** Rated power [W] */
  pRated?: number;
  /** Speed at rated power [rpm] */
  rpmRated?: number;
  /** Peak torque [N*m] */
  tPeak?: number;
  /** Speed at peak torque [rpm] */
  rpmPeakTorque?: number;
  /** Rotational inertia [kg*m^2] */
  jEngine?: number;
  /** Brake-specific fuel consumption [kg/J] (default 200 g/kWh) */
  bsfc?: number;
  /** Torque curve: [[rpm, torque], ...] */
  torqueCurve?: [number, number][];
}

/** Default CAT 3516E engine parameters */
export const CAT_3516E_PARAMS: EngineParams = {
  rpmIdle: 700,
  rpmMin: 700,
  rpmMax: 1800,
  pRated: 1_801_000,
  rpmRated: 1650,
  tPeak: 11_220,
  rpmPeakTorque: 1200,
  jEngine: 25,
  bsfc: 200e-9, // 200 g/kWh in kg/J
  torqueCurve: [
    [700, 9_500],
    [1000, 10_800],
    [1200, 11_220],
    [1400, 10_900],
    [1650, 10_420],
    [1800, 9_800],
  ],
};

/**
 * Internal combustion engine component.
 *
 * Provides a single mechanical output shaft with torque determined by
 * a torque curve and commanded throttle/torque.
 */
export class EngineComponent extends DrivetrainComponent {
  readonly params: Required<EngineParams>;
  private _rpmPoints: number[];
  private _torquePoints: number[];

  constructor(params: EngineParams = {}, name: string = 'engine') {
    super(name);

    // Merge with defaults
    this.params = {
      rpmIdle: params.rpmIdle ?? 700,
      rpmMin: params.rpmMin ?? 700,
      rpmMax: params.rpmMax ?? 1800,
      pRated: params.pRated ?? 1_801_000,
      rpmRated: params.rpmRated ?? 1650,
      tPeak: params.tPeak ?? 11_220,
      rpmPeakTorque: params.rpmPeakTorque ?? 1200,
      jEngine: params.jEngine ?? 25,
      bsfc: params.bsfc ?? 200e-9,
      torqueCurve: params.torqueCurve ?? [
        [700, 9_500],
        [1000, 10_800],
        [1200, 11_220],
        [1400, 10_900],
        [1650, 10_420],
        [1800, 9_800],
      ],
    };

    // Build interpolation arrays
    this._rpmPoints = this.params.torqueCurve.map(p => p[0]);
    this._torquePoints = this.params.torqueCurve.map(p => p[1]);
  }

  get ports(): Record<string, Port> {
    return {
      shaft: {
        name: 'shaft',
        portType: PortType.MECHANICAL,
        direction: PortDirection.OUTPUT,
        description: 'Engine crankshaft output',
      },
    };
  }

  get stateNames(): string[] {
    // Engine has no internal states in this model
    return [];
  }

  getInertia(portName: string): number {
    if (portName === 'shaft') {
      return this.params.jEngine;
    }
    throw new Error(`Unknown port: ${portName}`);
  }

  getConstraints(): KinematicConstraint[] {
    // Engine has no internal kinematic constraints
    return [];
  }

  /**
   * Get maximum available torque at given engine speed.
   *
   * Returns 0 below idle, interpolates curve in normal range,
   * and linearly tapers to 0 above max RPM.
   */
  getMaxTorque(rpm: number): number {
    if (rpm < this.params.rpmMin) {
      return 0;
    }
    if (rpm <= this.params.rpmMax) {
      return interp(rpm, this._rpmPoints, this._torquePoints);
    }
    // Above max RPM: linearly taper torque to zero over 200 RPM
    const tAtMax = interp(this.params.rpmMax, this._rpmPoints, this._torquePoints);
    const overspeedMargin = 200;
    const taperFactor = Math.max(0, 1 - (rpm - this.params.rpmMax) / overspeedMargin);
    return tAtMax * taperFactor;
  }

  /**
   * Get maximum torque at given angular velocity [rad/s].
   */
  getMaxTorqueRads(omega: number): number {
    const rpm = (omega * 30) / Math.PI;
    return this.getMaxTorque(rpm);
  }

  /**
   * Clip torque command to valid range.
   */
  clipTorque(rpm: number, torqueCmd: number): number {
    const tMax = this.getMaxTorque(rpm);
    return Math.max(0, Math.min(torqueCmd, tMax));
  }

  /**
   * Get fuel consumption rate [kg/s].
   */
  getFuelRate(torque: number, omega: number): number {
    if (torque <= 0 || omega <= 0) {
      return 0;
    }
    const power = torque * omega;
    return power * this.params.bsfc;
  }

  /**
   * Check if operating point is within valid envelope.
   */
  isValidOperatingPoint(rpm: number, torque: number): boolean {
    if (rpm < this.params.rpmMin || rpm > this.params.rpmMax) {
      return false;
    }
    const tMax = this.getMaxTorque(rpm);
    return torque >= 0 && torque <= tMax;
  }

  computeTorques(
    portSpeeds: Record<string, number>,
    controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    const omega = Math.abs(portSpeeds.shaft ?? 0);
    const rpm = (omega * 30) / Math.PI;

    // Get torque command
    const torqueCmd = controlInputs.torque ?? 0;

    // Clip to available torque
    const torque = this.clipTorque(rpm, torqueCmd);

    return { shaft: torque };
  }

  computeStateDerivatives(
    _internalStates: Record<string, number>,
    _portValues: PortValues
  ): Record<string, number> {
    // No internal states
    return {};
  }
}
