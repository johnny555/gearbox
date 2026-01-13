/**
 * Vehicle component with road load model.
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint } from '../core/constraints';

/**
 * Vehicle parameters.
 */
export interface VehicleParams {
  /** Empty mass [kg] */
  mEmpty?: number;
  /** Payload capacity [kg] */
  mPayload?: number;
  /** Wheel radius [m] */
  rWheel?: number;
  /** Frontal area [m^2] */
  aFrontal?: number;
  /** Drag coefficient */
  cD?: number;
  /** Rolling resistance coefficient */
  cR?: number;
  /** Maximum speed [m/s] */
  vMax?: number;
  /** Total wheel inertia [kg*m^2] */
  jWheels?: number;
  /** Air density [kg/m^3] */
  rhoAir?: number;
  /** Gravitational acceleration [m/s^2] */
  g?: number;
}

/** Default CAT 793D vehicle parameters
 *
 * Specifications:
 * - Empty weight: 165,600 kg (365,000 lb)
 * - Payload capacity: 218,000 kg (480,000 lb)
 * - Gross vehicle weight: 383,600 kg (846,000 lb)
 * - Tire size: 46/90R57 (1.78m rolling radius)
 */
export const CAT_793D_PARAMS: VehicleParams = {
  mEmpty: 165_600,
  mPayload: 218_000,
  rWheel: 1.78,
  aFrontal: 45.0,
  cD: 0.9,
  cR: 0.025,
  vMax: 54.2 / 3.6, // 54.2 km/h in m/s
  jWheels: 500,
  rhoAir: 1.225,
  g: 9.81,
};

/** Good haul road conditions */
export const CAT_793D_GOOD_ROAD: VehicleParams = {
  ...CAT_793D_PARAMS,
  cR: 0.015,
};

/** Poor haul road conditions */
export const CAT_793D_POOR_ROAD: VehicleParams = {
  ...CAT_793D_PARAMS,
  cR: 0.035,
};

/**
 * Vehicle road load component.
 *
 * Represents the vehicle mass, wheels, and road resistances.
 * This is the "ground" reference for the drivetrain.
 *
 * Road loads:
 * - Grade: F_grade = m * g * sin(theta)
 * - Rolling: F_roll = m * g * C_r * cos(theta)
 * - Aero: F_aero = 0.5 * rho * C_d * A * v^2
 */
export class VehicleComponent extends DrivetrainComponent {
  readonly params: Required<VehicleParams>;
  private _payloadFraction: number;
  private _mass: number;

  constructor(
    params: VehicleParams = {},
    payloadFraction: number = 1.0,
    name: string = 'vehicle'
  ) {
    super(name);

    // Merge with defaults (CAT 793D specs)
    this.params = {
      mEmpty: params.mEmpty ?? 165_600,
      mPayload: params.mPayload ?? 218_000,
      rWheel: params.rWheel ?? 1.78,
      aFrontal: params.aFrontal ?? 45.0,
      cD: params.cD ?? 0.9,
      cR: params.cR ?? 0.025,
      vMax: params.vMax ?? 54.2 / 3.6,
      jWheels: params.jWheels ?? 500,
      rhoAir: params.rhoAir ?? 1.225,
      g: params.g ?? 9.81,
    };

    this._payloadFraction = Math.max(0, Math.min(1, payloadFraction));
    this._mass = this.params.mEmpty + this._payloadFraction * this.params.mPayload;
  }

  get mass(): number {
    return this._mass;
  }

  get payloadFraction(): number {
    return this._payloadFraction;
  }

  set payloadFraction(value: number) {
    this._payloadFraction = Math.max(0, Math.min(1, value));
    this._mass = this.params.mEmpty + this._payloadFraction * this.params.mPayload;
  }

  get ports(): Record<string, Port> {
    return {
      wheels: {
        name: 'wheels',
        portType: PortType.MECHANICAL,
        direction: PortDirection.INPUT,
        description: 'Wheel input (driven by final drive)',
      },
    };
  }

  get stateNames(): string[] {
    // Vehicle has no internal states in this model
    return [];
  }

  getInertia(portName: string): number {
    if (portName === 'wheels') {
      // Effective inertia: wheel inertia + translational mass reflected
      return this.params.jWheels + this._mass * this.params.rWheel * this.params.rWheel;
    }
    throw new Error(`Unknown port: ${portName}`);
  }

  getConstraints(): KinematicConstraint[] {
    return [];
  }

  /**
   * Calculate total road load force [N].
   *
   * @param velocity - Vehicle velocity [m/s]
   * @param grade - Road grade (fraction, e.g., 0.05 for 5%)
   * @returns Total resistance force [N]
   */
  calcTotalRoadLoad(velocity: number, grade: number): number {
    const theta = Math.atan(grade);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Grade resistance (always acts in direction of gravity)
    const fGrade = this._mass * this.params.g * sinTheta;

    // Rolling resistance (always positive, opposes motion)
    const fRoll = this.params.cR * this._mass * this.params.g * cosTheta;

    // Aerodynamic drag (opposes motion direction)
    const v = Math.abs(velocity);
    const fAero = 0.5 * this.params.rhoAir * this.params.cD * this.params.aFrontal * v * v;
    const signV = velocity >= 0 ? 1 : -1;

    // Match Python: F_grade + F_roll + F_aero * sign(v)
    // Grade and rolling resistance don't depend on direction,
    // only aero drag opposes the actual motion direction
    return fGrade + fRoll + fAero * signV;
  }

  /**
   * Calculate wheel torque demand for road load [N*m].
   */
  calcWheelTorqueDemand(velocity: number, grade: number): number {
    const force = this.calcTotalRoadLoad(velocity, grade);
    return force * this.params.rWheel;
  }

  /**
   * Compute load torque at the wheels for dynamics simulation.
   *
   * @param omegaWheel - Wheel angular velocity [rad/s]
   * @param grade - Road grade (fraction)
   * @returns Load torque [N*m]
   */
  computeLoadTorque(omegaWheel: number, grade: number): number {
    const velocity = omegaWheel * this.params.rWheel;
    return this.calcWheelTorqueDemand(velocity, grade);
  }

  /**
   * Convert wheel speed to vehicle velocity [m/s].
   */
  wheelSpeedToVelocity(omegaWheel: number): number {
    return omegaWheel * this.params.rWheel;
  }

  /**
   * Convert vehicle velocity to wheel speed [rad/s].
   */
  velocityToWheelSpeed(velocity: number): number {
    return velocity / this.params.rWheel;
  }

  /**
   * Get effective mass including rotational inertia contribution.
   */
  getEffectiveMass(): number {
    // m_eff = m + J_wheels / r^2
    return this._mass + this.params.jWheels / (this.params.rWheel * this.params.rWheel);
  }

  computeTorques(
    _portSpeeds: Record<string, number>,
    _controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    // Vehicle doesn't produce torque, only consumes it
    return {};
  }

  computeStateDerivatives(
    _internalStates: Record<string, number>,
    _portValues: PortValues
  ): Record<string, number> {
    return {};
  }
}
