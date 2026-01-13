/**
 * Battery component for hybrid and electric drivetrains.
 *
 * Features SOC-dependent OCV and internal resistance:
 * - Nonlinear OCV curve typical of Li-ion NMC chemistry
 * - Resistance increases at low and high SOC extremes
 *
 * References:
 * - A Generalized SOC-OCV Model for Lithium-Ion Batteries, Energies 2016
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';

/**
 * OCV model parameters for polynomial SOC-OCV relationship.
 */
export interface BatteryOcvParams {
  /** Polynomial coefficients for normalized OCV (V_oc / V_nom) */
  coefficients?: number[];
  /** Use lookup table instead of polynomial */
  useLookup?: boolean;
  /** SOC points for lookup */
  socPoints?: number[];
  /** Normalized OCV values for lookup */
  ocvNormalized?: number[];
}

/**
 * Resistance model parameters for SOC-dependent resistance.
 */
export interface BatteryResistanceParams {
  /** Nominal internal resistance [Ω] */
  rNom?: number;
  /** Low-SOC resistance increase factor */
  kLow?: number;
  /** Low-SOC decay constant */
  tauLow?: number;
  /** High-SOC resistance increase factor */
  kHigh?: number;
  /** High-SOC decay constant */
  tauHigh?: number;
}

/**
 * Battery parameters.
 */
export interface BatteryParams {
  /** Energy capacity [kWh] */
  capacityKwh?: number;
  /** Nominal open circuit voltage [V] at SOC=0.5 */
  vOc?: number;
  /** Nominal voltage [V] */
  vNom?: number;
  /** Nominal internal resistance [Ω] */
  rInt?: number;
  /** Maximum discharge power [W] */
  pMaxDischarge?: number;
  /** Maximum charge power [W] */
  pMaxCharge?: number;
  /** Minimum operating SOC */
  socMin?: number;
  /** Maximum operating SOC */
  socMax?: number;
  /** Initial SOC */
  socInit?: number;
  /** Enable SOC-dependent OCV model */
  useSocDependentOcv?: boolean;
  /** Enable SOC-dependent resistance model */
  useSocDependentResistance?: boolean;
  /** OCV model parameters */
  ocvParams?: BatteryOcvParams;
  /** Resistance model parameters */
  resistanceParams?: BatteryResistanceParams;
}

/** Default OCV model parameters (polynomial coefficients) */
const DEFAULT_OCV_PARAMS: Required<BatteryOcvParams> = {
  // Gives ~0.90 at SOC=0, ~1.0 at SOC=0.5, ~1.10 at SOC=1.0
  coefficients: [0.900, 0.400, -0.800, 1.200, -0.700, 0, 0, 0],
  useLookup: false,
  socPoints: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  ocvNormalized: [0.90, 0.92, 0.95, 0.97, 0.99, 1.00, 1.01, 1.03, 1.05, 1.08, 1.10],
};

/** Default resistance model parameters */
const DEFAULT_RESISTANCE_PARAMS: Required<BatteryResistanceParams> = {
  rNom: 0.05,
  kLow: 0.5,
  tauLow: 0.15,
  kHigh: 0.3,
  tauHigh: 0.15,
};

/** CAT 793D battery parameters */
export const CAT_793D_BATTERY_PARAMS: BatteryParams = {
  capacityKwh: 200.0,
  vOc: 750.0,
  vNom: 700.0,
  rInt: 0.05,
  pMaxDischarge: 1_000_000.0,
  pMaxCharge: 500_000.0,
  socMin: 0.3,
  socMax: 0.8,
  socInit: 0.6,
  useSocDependentOcv: true,
  useSocDependentResistance: true,
};

/** Larger battery for series hybrid */
export const SERIES_HYBRID_BATTERY_PARAMS: BatteryParams = {
  capacityKwh: 400.0,
  vOc: 750.0,
  vNom: 700.0,
  rInt: 0.03,
  pMaxDischarge: 1_500_000.0,
  pMaxCharge: 800_000.0,
  socMin: 0.2,
  socMax: 0.9,
  socInit: 0.6,
};

/** Large battery for pure EV */
export const EV_BATTERY_PARAMS: BatteryParams = {
  capacityKwh: 600.0,
  vOc: 800.0,
  vNom: 750.0,
  rInt: 0.02,
  pMaxDischarge: 2_000_000.0,
  pMaxCharge: 1_000_000.0,
  socMin: 0.1,
  socMax: 0.95,
  socInit: 0.8,
};

/**
 * Battery energy storage component.
 *
 * Uses equivalent circuit model with SOC-dependent parameters:
 * V_terminal = V_oc(SOC) - I × R(SOC)
 *
 * Power limits are derated near SOC boundaries to protect the battery.
 */
export class BatteryComponent extends DrivetrainComponent {
  readonly params: Required<Omit<BatteryParams, 'ocvParams' | 'resistanceParams'>> & {
    ocvParams: Required<BatteryOcvParams>;
    resistanceParams: Required<BatteryResistanceParams>;
  };
  private _soc: number;

  constructor(params: BatteryParams = {}, name: string = 'battery') {
    super(name);

    this.params = {
      capacityKwh: params.capacityKwh ?? 200.0,
      vOc: params.vOc ?? 750.0,
      vNom: params.vNom ?? 700.0,
      rInt: params.rInt ?? 0.05,
      pMaxDischarge: params.pMaxDischarge ?? 1_000_000.0,
      pMaxCharge: params.pMaxCharge ?? 500_000.0,
      socMin: params.socMin ?? 0.3,
      socMax: params.socMax ?? 0.8,
      socInit: params.socInit ?? 0.6,
      useSocDependentOcv: params.useSocDependentOcv ?? true,
      useSocDependentResistance: params.useSocDependentResistance ?? true,
      ocvParams: { ...DEFAULT_OCV_PARAMS, ...params.ocvParams },
      resistanceParams: { ...DEFAULT_RESISTANCE_PARAMS, ...params.resistanceParams },
    };

    this._soc = this.params.socInit;
  }

  /** Capacity in Joules. */
  get qCapacity(): number {
    return this.params.capacityKwh * 3600 * 1000;
  }

  /** Capacity in Amp-hours. */
  get qAh(): number {
    return this.qCapacity / (this.params.vNom * 3600);
  }

  /** Current state of charge [0-1]. */
  get soc(): number {
    return this._soc;
  }

  set soc(value: number) {
    this._soc = Math.max(0, Math.min(1, value));
  }

  get ports(): Record<string, Port> {
    return {
      electrical: {
        name: 'electrical',
        portType: PortType.ELECTRICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Electrical power connection',
      },
    };
  }

  get stateNames(): string[] {
    return ['SOC'];
  }

  getInertia(_portName: string): number {
    return 0; // Battery has no mechanical inertia
  }

  getConstraints(): KinematicConstraint[] {
    return [];
  }

  /**
   * Get internal resistance at given SOC.
   *
   * R(SOC) = R_nom * (1 + k_low*exp(-SOC/tau_low) + k_high*exp((SOC-1)/tau_high))
   */
  getInternalResistance(soc?: number): number {
    const currentSoc = Math.max(0, Math.min(1, soc ?? this._soc));

    if (!this.params.useSocDependentResistance) {
      return this.params.rInt;
    }

    const rp = this.params.resistanceParams;
    const rLowFactor = rp.kLow * Math.exp(-currentSoc / rp.tauLow);
    const rHighFactor = rp.kHigh * Math.exp((currentSoc - 1) / rp.tauHigh);

    return rp.rNom * (1 + rLowFactor + rHighFactor);
  }

  /**
   * Get open circuit voltage at given SOC.
   *
   * Uses polynomial or lookup table model for SOC-OCV relationship.
   */
  getOpenCircuitVoltage(soc?: number): number {
    const currentSoc = Math.max(0, Math.min(1, soc ?? this._soc));

    if (!this.params.useSocDependentOcv) {
      return this.params.vOc;
    }

    const op = this.params.ocvParams;
    let ocvNorm: number;

    if (op.useLookup) {
      // Linear interpolation from lookup table
      ocvNorm = this.interpLookup(currentSoc, op.socPoints, op.ocvNormalized);
    } else {
      // Polynomial model: sum(a_i * SOC^i)
      ocvNorm = 0;
      for (let i = 0; i < op.coefficients.length; i++) {
        ocvNorm += op.coefficients[i] * Math.pow(currentSoc, i);
      }
    }

    return this.params.vOc * ocvNorm;
  }

  /** Linear interpolation helper */
  private interpLookup(x: number, xp: number[], yp: number[]): number {
    if (x <= xp[0]) return yp[0];
    if (x >= xp[xp.length - 1]) return yp[yp.length - 1];

    for (let i = 1; i < xp.length; i++) {
      if (x <= xp[i]) {
        const t = (x - xp[i - 1]) / (xp[i] - xp[i - 1]);
        return yp[i - 1] + t * (yp[i] - yp[i - 1]);
      }
    }
    return yp[yp.length - 1];
  }

  /**
   * Calculate current from power demand.
   *
   * Solves: P = V_oc × I - R_int × I²
   * Uses SOC-dependent OCV and internal resistance if enabled.
   *
   * @param power - Electrical power [W] (positive = discharge)
   * @returns Current [A] (positive = discharge)
   */
  getCurrentFromPower(power: number, soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const vOc = this.getOpenCircuitVoltage(currentSoc);
    const R = this.getInternalResistance(currentSoc);

    if (Math.abs(power) < 1e-6) {
      return 0;
    }

    // Quadratic: R × I² - V_oc × I + P = 0
    // I = (V_oc - sqrt(V_oc² - 4RP)) / (2R)
    const discriminant = vOc * vOc - 4 * R * power;

    if (discriminant < 0) {
      // Power exceeds capability - return limiting current
      return power > 0 ? vOc / (2 * R) : -vOc / (2 * R);
    }

    // Use solution that gives smaller magnitude current
    return (vOc - Math.sqrt(discriminant)) / (2 * R);
  }

  /**
   * Get terminal voltage at given current.
   * Uses SOC-dependent OCV and internal resistance if enabled.
   */
  getTerminalVoltage(current: number, soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const vOc = this.getOpenCircuitVoltage(currentSoc);
    const R = this.getInternalResistance(currentSoc);
    return vOc - current * R;
  }

  /**
   * Get power limits with SOC-based derating.
   *
   * @returns [P_min, P_max] [W]
   *   P_min is negative (max charging), P_max is positive (max discharging)
   */
  getPowerLimits(soc?: number): [number, number] {
    const currentSoc = soc ?? this._soc;

    let pDischarge = this.params.pMaxDischarge;
    let pCharge = this.params.pMaxCharge;

    // Derate discharge at low SOC
    if (currentSoc < this.params.socMin + 0.1) {
      const factor = Math.max(0, (currentSoc - this.params.socMin) / 0.1);
      pDischarge *= factor;
    }

    // Derate charge at high SOC
    if (currentSoc > this.params.socMax - 0.1) {
      const factor = Math.max(0, (this.params.socMax - currentSoc) / 0.1);
      pCharge *= factor;
    }

    return [-pCharge, pDischarge];
  }

  /**
   * Clip power to valid range.
   */
  clipPower(power: number, soc?: number): number {
    const [pMin, pMax] = this.getPowerLimits(soc);
    return Math.max(pMin, Math.min(power, pMax));
  }

  /**
   * Calculate SOC rate of change.
   *
   * dSOC/dt = -I / Q_capacity
   */
  getSocDerivative(power: number, soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const current = this.getCurrentFromPower(power, currentSoc);
    // Q_capacity is in Coulombs (A·s)
    const Q = this.qCapacity / this.params.vNom;
    return -current / Q;
  }

  /**
   * Check if battery can provide requested power.
   */
  canProvidePower(power: number, soc?: number): boolean {
    const [pMin, pMax] = this.getPowerLimits(soc);
    return power >= pMin && power <= pMax;
  }

  /**
   * Get remaining usable energy [J].
   */
  getEnergyRemaining(soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const usableSoc = Math.max(0, currentSoc - this.params.socMin);
    return usableSoc * this.qCapacity;
  }

  computeTorques(
    _portSpeeds: Record<string, number>,
    _controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    return {}; // Battery doesn't produce torque
  }

  computeStateDerivatives(
    internalStates: Record<string, number>,
    portValues: PortValues
  ): Record<string, number> {
    const soc = internalStates.SOC ?? this._soc;
    const power = portValues.electrical_power ?? 0;

    const dSoc = this.getSocDerivative(power, soc);
    return { SOC: dSoc };
  }
}
