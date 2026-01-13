/**
 * N-speed gearbox component for drivetrain simulation.
 *
 * Features variable efficiency model based on speed and load:
 * - Speed losses: churning, windage (increase with speed²)
 * - Load losses: mesh friction (proportional to torque)
 * - Fixed losses: bearings, seals
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { GearRatioConstraint, KinematicConstraint } from '../core/constraints';

/**
 * Variable efficiency model parameters.
 */
export interface GearboxEfficiencyParams {
  /** Baseline mesh efficiency */
  etaBase?: number;
  /** Speed loss coefficient [1/(rad/s)²] */
  kSpeed?: number;
  /** Load loss coefficient */
  kLoad?: number;
  /** Fixed power loss [W] */
  pFixed?: number;
  /** Rated torque for load normalization [N*m] */
  tRated?: number;
}

/** Default efficiency parameters */
const DEFAULT_EFFICIENCY_PARAMS: Required<GearboxEfficiencyParams> = {
  etaBase: 0.99,
  kSpeed: 1e-8,
  kLoad: 0.03,
  pFixed: 500.0,
  tRated: 50000.0,
};

/**
 * Gearbox parameters.
 */
export interface GearboxParams {
  /** List of gear ratios [K1, K2, ..., Kn] where K = omega_in / omega_out */
  ratios?: number[];
  /** Efficiency for each gear (same length as ratios) - used as nominal values */
  efficiencies?: number[];
  /** Input shaft inertia [kg*m^2] */
  jInput?: number;
  /** Output shaft inertia [kg*m^2] */
  jOutput?: number;
  /** Time to complete a gear shift [s] */
  shiftTime?: number;
  /** Enable variable efficiency model */
  useVariableEfficiency?: boolean;
  /** Variable efficiency model parameters */
  efficiencyParams?: GearboxEfficiencyParams;
}

/** CAT 793D eCVT 2-speed */
export const ECVT_GEARBOX_PARAMS: GearboxParams = {
  ratios: [5.0, 0.67], // Low and overdrive
  efficiencies: [0.97, 0.97],
  jInput: 5.0,
  jOutput: 5.0,
  useVariableEfficiency: true,
};

/** Typical 7-speed automatic for conventional diesel */
export const DIESEL_7SPEED_PARAMS: GearboxParams = {
  ratios: [4.59, 2.95, 1.94, 1.40, 1.0, 0.74, 0.65],
  efficiencies: [0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97],
  jInput: 5.0,
  jOutput: 5.0,
};

/** Single-speed reduction for EVs */
export const SINGLE_SPEED_PARAMS: GearboxParams = {
  ratios: [10.0],
  efficiencies: [0.98],
  jInput: 2.0,
  jOutput: 5.0,
};

/**
 * N-speed discrete gearbox component.
 *
 * Converts between input and output shafts with selectable gear ratios.
 * Speed: omega_out = omega_in / K
 * Torque: T_out = T_in * K * eta
 *
 * Features variable efficiency based on speed and load when enabled.
 */
export class NSpeedGearboxComponent extends DrivetrainComponent {
  readonly params: Required<Omit<GearboxParams, 'efficiencyParams'>> & {
    efficiencyParams: Required<GearboxEfficiencyParams>;
  };
  private _currentGear: number;

  constructor(params: GearboxParams = {}, name: string = 'gearbox') {
    super(name);

    const ratios = params.ratios ?? [3.5, 2.0, 1.0];
    const efficiencies = params.efficiencies ?? ratios.map(() => 0.97);

    // Ensure efficiencies list matches ratios
    const finalEfficiencies = efficiencies.length === ratios.length
      ? efficiencies
      : ratios.map(() => 0.97);

    this.params = {
      ratios,
      efficiencies: finalEfficiencies,
      jInput: params.jInput ?? 5.0,
      jOutput: params.jOutput ?? 5.0,
      shiftTime: params.shiftTime ?? 0.5,
      useVariableEfficiency: params.useVariableEfficiency ?? true,
      efficiencyParams: { ...DEFAULT_EFFICIENCY_PARAMS, ...params.efficiencyParams },
    };

    this._currentGear = 0;
  }

  get nGears(): number {
    return this.params.ratios.length;
  }

  get gear(): number {
    return this._currentGear;
  }

  set gear(value: number) {
    this._currentGear = Math.max(0, Math.min(value, this.nGears - 1));
  }

  get currentRatio(): number {
    return this.params.ratios[this._currentGear];
  }

  get currentEfficiency(): number {
    return this.params.efficiencies[this._currentGear];
  }

  get ports(): Record<string, Port> {
    return {
      input: {
        name: 'input',
        portType: PortType.MECHANICAL,
        direction: PortDirection.INPUT,
        description: 'High-speed input shaft',
      },
      output: {
        name: 'output',
        portType: PortType.MECHANICAL,
        direction: PortDirection.OUTPUT,
        description: 'Low-speed output shaft',
      },
    };
  }

  get stateNames(): string[] {
    return [];
  }

  getInertia(portName: string): number {
    if (portName === 'input') {
      return this.params.jInput;
    }
    if (portName === 'output') {
      return this.params.jOutput;
    }
    throw new Error(`Unknown port: ${portName}`);
  }

  getConstraints(): KinematicConstraint[] {
    return [
      new GearRatioConstraint({
        inputPort: 'input',
        outputPort: 'output',
        ratio: this.currentRatio,
        efficiency: this.currentEfficiency,
      }),
    ];
  }

  /**
   * Get gear ratio for specified gear.
   */
  getRatio(gear?: number): number {
    const g = gear ?? this._currentGear;
    return this.params.ratios[Math.max(0, Math.min(g, this.nGears - 1))];
  }

  /**
   * Get nominal efficiency for specified gear.
   */
  getNominalEfficiency(gear?: number): number {
    const g = gear ?? this._currentGear;
    return this.params.efficiencies[Math.max(0, Math.min(g, this.nGears - 1))];
  }

  /**
   * Get efficiency at given operating point.
   *
   * Uses variable efficiency model if enabled:
   * η = η_base - k_speed × ω² - k_load × (T / T_rated)
   *
   * @param omegaInput - Input angular velocity [rad/s]
   * @param torque - Torque [N*m]
   * @param gear - Gear selection
   * @returns Efficiency [0-1]
   */
  getEfficiency(omegaInput: number = 0, torque: number = 0, gear?: number): number {
    if (!this.params.useVariableEfficiency) {
      return this.getNominalEfficiency(gear);
    }

    const ep = this.params.efficiencyParams;

    // Speed-dependent losses (churning, windage)
    const speedLoss = ep.kSpeed * omegaInput * omegaInput;

    // Load-dependent losses (mesh friction)
    const loadFraction = ep.tRated > 0 ? Math.abs(torque) / ep.tRated : 0;
    const loadLoss = ep.kLoad * loadFraction;

    // Total efficiency
    let eta = ep.etaBase - speedLoss - loadLoss;

    // Clamp to reasonable range
    return Math.max(0.85, Math.min(0.995, eta));
  }

  /**
   * Convert input speed to output speed.
   */
  inputToOutputSpeed(omegaIn: number, gear?: number): number {
    return omegaIn / this.getRatio(gear);
  }

  /**
   * Convert output speed to input speed.
   */
  outputToInputSpeed(omegaOut: number, gear?: number): number {
    return omegaOut * this.getRatio(gear);
  }

  /**
   * Convert input torque to output torque.
   */
  inputToOutputTorque(tIn: number, gear?: number): number {
    const K = this.getRatio(gear);
    const eta = this.getEfficiency(gear);
    return tIn * K * eta;
  }

  /**
   * Convert output torque to input torque.
   */
  outputToInputTorque(tOut: number, gear?: number): number {
    const K = this.getRatio(gear);
    const eta = this.getEfficiency(gear);
    return tOut / (K * eta);
  }

  /**
   * Calculate inertia reflected to input side.
   */
  getReflectedInertia(jOutput: number, gear?: number): number {
    const K = this.getRatio(gear);
    return jOutput / (K * K);
  }

  computeTorques(
    _portSpeeds: Record<string, number>,
    controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    // Update gear selection from control
    if ('gear' in controlInputs) {
      this.gear = Math.floor(controlInputs.gear);
    }

    // Gearbox itself doesn't produce torque, it transforms it
    return {};
  }

  computeStateDerivatives(
    _internalStates: Record<string, number>,
    _portValues: PortValues
  ): Record<string, number> {
    return {};
  }
}

/**
 * Final drive (fixed-ratio) component.
 */
export class FinalDriveComponent extends NSpeedGearboxComponent {
  constructor(
    ratio: number = 16.0,
    efficiency: number = 0.96,
    name: string = 'final_drive'
  ) {
    super(
      {
        ratios: [ratio],
        efficiencies: [efficiency],
        jInput: 2.0,
        jOutput: 10.0,
      },
      name
    );
  }

  get ratio(): number {
    return this.params.ratios[0];
  }
}

/**
 * Fixed-ratio gear component with configurable inertias.
 *
 * Use for modeling fixed ratio gear sets like:
 * - Locked planetary gear (sun or ring brake engaged)
 * - Simple reduction/overdrive stages
 * - Transfer cases
 */
export class FixedRatioGearComponent extends NSpeedGearboxComponent {
  constructor(
    ratio: number = 1.0,
    efficiency: number = 0.98,
    jInput: number = 1.0,
    jOutput: number = 1.0,
    name: string = 'gear'
  ) {
    super(
      {
        ratios: [ratio],
        efficiencies: [efficiency],
        jInput,
        jOutput,
      },
      name
    );
  }

  get ratio(): number {
    return this.params.ratios[0];
  }

  get efficiency(): number {
    return this.params.efficiencies[0];
  }
}
