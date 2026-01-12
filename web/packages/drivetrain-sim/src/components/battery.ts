/**
 * Battery component for hybrid and electric drivetrains.
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';

/**
 * Battery parameters.
 */
export interface BatteryParams {
  /** Energy capacity [kWh] */
  capacityKwh?: number;
  /** Open circuit voltage [V] */
  vOc?: number;
  /** Nominal voltage [V] */
  vNom?: number;
  /** Internal resistance [Ω] */
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
}

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
 * Uses simple equivalent circuit model:
 * V_terminal = V_oc - I × R_int
 *
 * Power limits are derated near SOC boundaries to protect the battery.
 */
export class BatteryComponent extends DrivetrainComponent {
  readonly params: Required<BatteryParams>;
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
   * Get open circuit voltage (could be SOC-dependent).
   */
  getOpenCircuitVoltage(_soc?: number): number {
    // Simple model: constant V_oc
    return this.params.vOc;
  }

  /**
   * Calculate current from power demand.
   *
   * Solves: P = V_oc × I - R_int × I²
   *
   * @param power - Electrical power [W] (positive = discharge)
   * @returns Current [A] (positive = discharge)
   */
  getCurrentFromPower(power: number, soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const vOc = this.getOpenCircuitVoltage(currentSoc);
    const R = this.params.rInt;

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
   */
  getTerminalVoltage(current: number, soc?: number): number {
    const currentSoc = soc ?? this._soc;
    const vOc = this.getOpenCircuitVoltage(currentSoc);
    return vOc - current * this.params.rInt;
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
