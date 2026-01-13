/**
 * Engine component for drivetrain simulation.
 *
 * Features variable BSFC (Brake Specific Fuel Consumption) model:
 * - Optimal BSFC ~195 g/kWh at 60-80% load, medium speed
 * - Higher BSFC at low loads (fixed losses dominate)
 * - Higher BSFC at extreme speeds
 *
 * References:
 * - Caterpillar 3516E performance data
 * - Diesel engine BSFC characteristics
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';
import { interp } from '../math/interpolate';

/**
 * BSFC map parameters.
 */
export interface BsfcMapParams {
  /** Optimal BSFC [kg/J] (~195 g/kWh = 54.2e-9 kg/J) */
  bsfcOptimal?: number;
  /** Speed at optimal BSFC [rpm] */
  rpmOptimal?: number;
  /** Load fraction at optimal BSFC */
  loadOptimal?: number;
  /** Low load penalty coefficient */
  kLowLoad?: number;
  /** Speed deviation penalty [1/rpm²] */
  kSpeed?: number;
  /** High load penalty coefficient */
  kHighLoad?: number;
}

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
  /** Constant BSFC [kg/J] - fallback if useBsfcMap=false */
  bsfc?: number;
  /** Enable variable BSFC model */
  useBsfcMap?: boolean;
  /** BSFC map parameters */
  bsfcParams?: BsfcMapParams;
  /** Torque curve: [[rpm, torque], ...] */
  torqueCurve?: [number, number][];
}

/** Default BSFC map parameters */
const DEFAULT_BSFC_PARAMS: Required<BsfcMapParams> = {
  bsfcOptimal: 54.2e-9,  // ~195 g/kWh
  rpmOptimal: 1300,
  loadOptimal: 0.70,
  kLowLoad: 0.35,
  kSpeed: 5e-7,
  kHighLoad: 0.05,
};

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
  bsfc: 54.2e-9, // ~195 g/kWh (fallback)
  useBsfcMap: true,
  bsfcParams: DEFAULT_BSFC_PARAMS,
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
 *
 * Features variable BSFC based on speed and load when enabled.
 */
export class EngineComponent extends DrivetrainComponent {
  readonly params: Required<Omit<EngineParams, 'bsfcParams'>> & {
    bsfcParams: Required<BsfcMapParams>;
  };
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
      bsfc: params.bsfc ?? 54.2e-9,
      useBsfcMap: params.useBsfcMap ?? true,
      bsfcParams: { ...DEFAULT_BSFC_PARAMS, ...params.bsfcParams },
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
   * Get engine load as fraction of maximum torque.
   */
  getLoadFraction(rpm: number, torque: number): number {
    const tMax = this.getMaxTorque(rpm);
    if (tMax <= 0) return 0;
    return Math.max(0, Math.min(1, torque / tMax));
  }

  /**
   * Get BSFC at given operating point.
   *
   * Uses analytical model with penalties for:
   * - Low load: increases rapidly below optimal load
   * - Speed deviation: increases away from optimal speed
   * - High load: slight increase near WOT
   */
  getBsfc(rpm: number, torque: number): number {
    if (!this.params.useBsfcMap) {
      return this.params.bsfc;
    }

    const bp = this.params.bsfcParams;
    const load = this.getLoadFraction(rpm, torque);

    // Low load penalty
    let lowLoadPenalty = 0;
    if (load < bp.loadOptimal) {
      const loadRatio = bp.loadOptimal > 0 ? load / bp.loadOptimal : 0;
      lowLoadPenalty = bp.kLowLoad * Math.pow(1 - loadRatio, 2);
    }

    // High load penalty
    let highLoadPenalty = 0;
    if (load > bp.loadOptimal) {
      highLoadPenalty = bp.kHighLoad * Math.pow(load - bp.loadOptimal, 2);
    }

    // Speed penalty
    const speedPenalty = bp.kSpeed * Math.pow(rpm - bp.rpmOptimal, 2);

    // Total BSFC
    const totalPenalty = lowLoadPenalty + highLoadPenalty + speedPenalty;
    let bsfc = bp.bsfcOptimal * (1 + totalPenalty);

    // Clamp to reasonable range (180-300 g/kWh = 50e-9 to 83e-9 kg/J)
    return Math.max(50e-9, Math.min(83e-9, bsfc));
  }

  /**
   * Get fuel consumption rate [kg/s].
   * Uses variable BSFC model if enabled.
   */
  getFuelRate(torque: number, omega: number): number {
    if (torque <= 0 || omega <= 0) {
      return 0;
    }
    const rpm = (omega * 30) / Math.PI;
    const power = torque * omega;
    const bsfc = this.getBsfc(rpm, torque);
    return power * bsfc;
  }

  /**
   * Get engine thermal efficiency at operating point.
   * Efficiency = 1 / (BSFC * LHV), where LHV of diesel ≈ 43 MJ/kg
   */
  getEfficiency(rpm: number, torque: number): number {
    const LHV_DIESEL = 43e6; // J/kg
    const bsfc = this.getBsfc(rpm, torque);
    return 1 / (bsfc * LHV_DIESEL);
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
