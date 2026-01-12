/**
 * Electric motor/generator component for drivetrain simulation.
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';

/**
 * Motor parameters.
 */
export interface MotorParams {
  /** Maximum continuous power [W] */
  pMax?: number;
  /** Boost power [W] for short duration */
  pBoost?: number;
  /** Maximum torque [N*m] */
  tMax?: number;
  /** Maximum speed [rpm] */
  rpmMax?: number;
  /** Base speed [rpm] (computed if not provided) */
  rpmBase?: number;
  /** Rotor inertia [kg*m^2] */
  jRotor?: number;
  /** Efficiency (0-1) for both motoring and generating */
  eta?: number;
}

/** MG1 motor parameters for CAT 793D */
export const MG1_PARAMS: MotorParams = {
  pMax: 200_000, // 200 kW
  tMax: 3_000, // 3,000 N*m
  rpmMax: 6_000,
  jRotor: 2.0,
  eta: 0.92,
};

/** MG2 motor parameters for CAT 793D */
export const MG2_PARAMS: MotorParams = {
  pMax: 350_000, // 350 kW continuous
  pBoost: 500_000, // 500 kW boost
  tMax: 2_000, // 2,000 N*m
  rpmMax: 4_000,
  jRotor: 4.0,
  eta: 0.92,
};

/**
 * Electric motor/generator component.
 *
 * Operates in two regions:
 * - Constant torque (0 to base speed): T = T_max
 * - Constant power (base speed to max speed): T = P_max / ω
 *
 * Can operate in all four quadrants (motoring/generating in both directions).
 */
export class MotorComponent extends DrivetrainComponent {
  readonly params: Required<Omit<MotorParams, 'pBoost'>> & { pBoost: number | null };
  private _omegaBase: number;
  private _omegaMax: number;

  constructor(params: MotorParams = {}, name: string = 'motor') {
    super(name);

    const pMax = params.pMax ?? 200_000;
    const tMax = params.tMax ?? 3_000;

    // Compute base speed if not provided: P_max / T_max (in rad/s)
    const computedRpmBase = (pMax / tMax) * (30 / Math.PI);

    this.params = {
      pMax,
      pBoost: params.pBoost ?? null,
      tMax,
      rpmMax: params.rpmMax ?? 6_000,
      rpmBase: params.rpmBase ?? computedRpmBase,
      jRotor: params.jRotor ?? 2.0,
      eta: params.eta ?? 0.92,
    };

    this._omegaBase = this.params.rpmBase * Math.PI / 30;
    this._omegaMax = this.params.rpmMax * Math.PI / 30;
  }

  get ports(): Record<string, Port> {
    return {
      shaft: {
        name: 'shaft',
        portType: PortType.MECHANICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Motor/generator shaft',
      },
      electrical: {
        name: 'electrical',
        portType: PortType.ELECTRICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Electrical power connection',
      },
    };
  }

  get stateNames(): string[] {
    return [];
  }

  getInertia(portName: string): number {
    if (portName === 'shaft') {
      return this.params.jRotor;
    }
    if (portName === 'electrical') {
      return 0; // Electrical port has no inertia
    }
    throw new Error(`Unknown port: ${portName}`);
  }

  getConstraints(): KinematicConstraint[] {
    return [];
  }

  /**
   * Get maximum available torque at given speed.
   *
   * @param rpm - Motor speed [rpm] (absolute value used)
   * @param useBoost - If true, use boost power in constant power region
   * @returns Maximum torque [N*m]
   */
  getMaxTorque(rpm: number, useBoost: boolean = false): number {
    rpm = Math.abs(rpm);
    if (rpm > this.params.rpmMax) {
      return 0;
    }

    const omega = rpm * Math.PI / 30;
    const pMax = (useBoost && this.params.pBoost) ? this.params.pBoost : this.params.pMax;

    if (rpm <= this.params.rpmBase) {
      // Constant torque region
      return this.params.tMax;
    } else {
      // Constant power region: T = P / ω
      if (omega > 0) {
        return Math.min(pMax / omega, this.params.tMax);
      }
      return this.params.tMax;
    }
  }

  /**
   * Get maximum torque at given angular velocity.
   */
  getMaxTorqueRads(omega: number, useBoost: boolean = false): number {
    const rpm = Math.abs(omega) * 30 / Math.PI;
    return this.getMaxTorque(rpm, useBoost);
  }

  /**
   * Get torque limits for 4-quadrant operation.
   *
   * @returns Tuple of [T_min, T_max] [N*m]
   */
  getTorqueLimits(rpm: number, useBoost: boolean = false): [number, number] {
    const tMax = this.getMaxTorque(rpm, useBoost);
    return [-tMax, tMax];
  }

  /**
   * Clip torque command to valid range.
   */
  clipTorque(rpm: number, torqueCmd: number, useBoost: boolean = false): number {
    const [tMin, tMax] = this.getTorqueLimits(rpm, useBoost);
    return Math.max(tMin, Math.min(torqueCmd, tMax));
  }

  /**
   * Calculate electrical power consumed/generated.
   *
   * Sign convention:
   * - Positive power: consuming from battery (motoring)
   * - Negative power: supplying to battery (generating)
   */
  getElectricalPower(torque: number, omega: number): number {
    const pMech = torque * omega;

    if (pMech > 0) {
      // Motoring: electrical power = mechanical / efficiency
      return pMech / this.params.eta;
    } else {
      // Generating: electrical power = mechanical * efficiency
      return pMech * this.params.eta;
    }
  }

  /**
   * Check if operating point is within motor envelope.
   */
  isValidOperatingPoint(rpm: number, torque: number): boolean {
    const [tMin, tMax] = this.getTorqueLimits(rpm);
    return torque >= tMin && torque <= tMax;
  }

  computeTorques(
    portSpeeds: Record<string, number>,
    controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    const omega = portSpeeds.shaft ?? 0;
    const rpm = Math.abs(omega) * 30 / Math.PI;
    const torqueCmd = controlInputs.torque ?? 0;
    const useBoost = Boolean(controlInputs.boost);

    // Clip to valid operating range
    const torque = this.clipTorque(rpm, torqueCmd, useBoost);

    return { shaft: torque };
  }

  computeStateDerivatives(
    _internalStates: Record<string, number>,
    _portValues: PortValues
  ): Record<string, number> {
    return {};
  }
}

/** Create MG1 motor with CAT 793D parameters. */
export function createMG1(): MotorComponent {
  return new MotorComponent(MG1_PARAMS, 'MG1');
}

/** Create MG2 motor with CAT 793D parameters. */
export function createMG2(): MotorComponent {
  return new MotorComponent(MG2_PARAMS, 'MG2');
}
