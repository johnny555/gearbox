/**
 * Kinematic constraints that relate speeds and torques between ports.
 */

/**
 * Speed relation: sum(coeff_i * omega_i) = 0
 * Maps port names to coefficients.
 */
export type SpeedRelation = Record<string, number>;

/**
 * Base interface for kinematic constraints.
 */
export interface KinematicConstraint {
  /** Get the speed relation coefficients. */
  getSpeedRelation(): SpeedRelation;

  /** Get the port whose DOF is eliminated by this constraint. */
  getDependentPort(): string;

  /** Get the ports that remain independent. */
  getIndependentPorts(): string[];
}

/**
 * Gear ratio constraint: omega_out = omega_in / ratio
 *
 * Speed relation: omega_in - ratio * omega_out = 0
 * Torque relation: T_out = T_in * ratio * efficiency
 */
export interface GearRatioConstraintConfig {
  inputPort: string;
  outputPort: string;
  ratio: number;
  efficiency?: number;
}

export class GearRatioConstraint implements KinematicConstraint {
  readonly inputPort: string;
  readonly outputPort: string;
  readonly ratio: number;
  readonly efficiency: number;

  constructor(config: GearRatioConstraintConfig) {
    this.inputPort = config.inputPort;
    this.outputPort = config.outputPort;
    this.ratio = config.ratio;
    this.efficiency = config.efficiency ?? 1.0;
  }

  getSpeedRelation(): SpeedRelation {
    // omega_in - ratio * omega_out = 0
    return {
      [this.inputPort]: 1.0,
      [this.outputPort]: -this.ratio,
    };
  }

  getDependentPort(): string {
    return this.outputPort;
  }

  getIndependentPorts(): string[] {
    return [this.inputPort];
  }

  /** Transform input speed to output speed. */
  transformSpeed(omegaIn: number): number {
    return omegaIn / this.ratio;
  }

  /** Transform output torque to input torque (back-propagation). */
  transformTorque(torqueOut: number): number {
    return torqueOut / (this.ratio * this.efficiency);
  }

  /** Get inertia reflected through the gear ratio. */
  getReflectedInertia(jOutput: number): number {
    return jOutput / (this.ratio * this.ratio);
  }
}

/**
 * Willis constraint for planetary gear sets.
 *
 * omega_sun = (1 + rho) * omega_carrier - rho * omega_ring
 *
 * where rho = Z_ring / Z_sun (typically 2-4)
 *
 * Torque balance: T_sun : T_carrier : T_ring = 1 : -(1+rho) : rho
 */
export interface WillisConstraintConfig {
  sunPort: string;
  carrierPort: string;
  ringPort: string;
  rho: number;
}

export class WillisConstraint implements KinematicConstraint {
  readonly sunPort: string;
  readonly carrierPort: string;
  readonly ringPort: string;
  readonly rho: number;

  constructor(config: WillisConstraintConfig) {
    this.sunPort = config.sunPort;
    this.carrierPort = config.carrierPort;
    this.ringPort = config.ringPort;
    this.rho = config.rho;
  }

  getSpeedRelation(): SpeedRelation {
    // omega_sun - (1+rho)*omega_carrier + rho*omega_ring = 0
    return {
      [this.sunPort]: 1.0,
      [this.carrierPort]: -(1 + this.rho),
      [this.ringPort]: this.rho,
    };
  }

  getDependentPort(): string {
    // Sun is typically eliminated (connected to MG1)
    return this.sunPort;
  }

  getIndependentPorts(): string[] {
    return [this.carrierPort, this.ringPort];
  }

  /** Calculate sun speed from carrier and ring speeds. */
  calcSunSpeed(omegaCarrier: number, omegaRing: number): number {
    return (1 + this.rho) * omegaCarrier - this.rho * omegaRing;
  }

  /** Calculate carrier speed from sun and ring speeds. */
  calcCarrierSpeed(omegaSun: number, omegaRing: number): number {
    return (omegaSun + this.rho * omegaRing) / (1 + this.rho);
  }

  /** Calculate ring speed from carrier and sun speeds. */
  calcRingSpeed(omegaCarrier: number, omegaSun: number): number {
    return ((1 + this.rho) * omegaCarrier - omegaSun) / this.rho;
  }

  /**
   * Get torque ratios: [sun, carrier, ring]
   *
   * T_sun : T_carrier : T_ring = 1 : -(1+rho) : rho
   *
   * If sun torque is T_s, then:
   * - Carrier torque = -(1+rho) * T_s
   * - Ring torque = rho * T_s
   */
  getTorqueRatios(): [number, number, number] {
    return [1.0, -(1 + this.rho), this.rho];
  }

  /**
   * Get inertia coupling coefficients for 2-DOF system (carrier, ring).
   *
   * With sun eliminated, the coupled inertia matrix from sun's inertia J_sun is:
   * J_cc = (1+rho)^2 * J_sun
   * J_cr = -(1+rho) * rho * J_sun  (off-diagonal)
   * J_rr = rho^2 * J_sun
   */
  getInertiaCoefficients(): {
    carrierCarrier: number;
    carrierRing: number;
    ringRing: number;
  } {
    const onePlusRho = 1 + this.rho;
    return {
      carrierCarrier: onePlusRho * onePlusRho,
      carrierRing: -onePlusRho * this.rho,
      ringRing: this.rho * this.rho,
    };
  }
}

/**
 * Rigid connection constraint: omega_a = omega_b
 *
 * Used for shaft couplings and parallel connections.
 */
export class RigidConnectionConstraint implements KinematicConstraint {
  readonly portA: string;
  readonly portB: string;

  constructor(portA: string, portB: string) {
    this.portA = portA;
    this.portB = portB;
  }

  getSpeedRelation(): SpeedRelation {
    // omega_a - omega_b = 0
    return {
      [this.portA]: 1.0,
      [this.portB]: -1.0,
    };
  }

  getDependentPort(): string {
    return this.portB;
  }

  getIndependentPorts(): string[] {
    return [this.portA];
  }
}
