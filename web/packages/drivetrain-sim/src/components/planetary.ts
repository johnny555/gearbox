/**
 * Planetary gear component for power-split drivetrains.
 */

import { DrivetrainComponent, PortValues } from '../core/component';
import { Port, PortDirection, PortType } from '../core/ports';
import { KinematicConstraint, WillisConstraint } from '../core/constraints';

/**
 * Planetary gear set parameters.
 */
export interface PlanetaryGearParams {
  /** Number of teeth on sun gear */
  zSun?: number;
  /** Number of teeth on ring gear */
  zRing?: number;
  /** Sun gear inertia [kg*m^2] */
  jSun?: number;
  /** Carrier inertia [kg*m^2] */
  jCarrier?: number;
  /** Ring gear inertia [kg*m^2] */
  jRing?: number;
  /** Sun-planet mesh efficiency (~98-99%) */
  etaSunPlanet?: number;
  /** Planet-ring mesh efficiency (~98-99%) */
  etaPlanetRing?: number;
  /** Enable efficiency losses */
  useEfficiency?: boolean;
}

/** CAT 793D planetary gear (ρ = 3.0) */
export const CAT_793D_PLANETARY_PARAMS: PlanetaryGearParams = {
  zSun: 30,
  zRing: 90,
  jSun: 0.5,
  jCarrier: 1.0,
  jRing: 0.5,
  etaSunPlanet: 0.98,
  etaPlanetRing: 0.98,
  useEfficiency: true,
};

/**
 * Planetary gear set implementing Willis equation.
 *
 * A planetary gear set has three rotating members:
 * - Sun gear: Center gear, typically connected to MG1
 * - Carrier: Holds planet gears, typically connected to engine
 * - Ring gear: Outer ring, typically connected to output/MG2
 *
 * Willis equation: ω_sun = (1 + ρ) × ω_carrier - ρ × ω_ring
 *
 * Torque balance: τ_sun : τ_carrier : τ_ring = 1 : -(1+ρ) : ρ
 */
export class PlanetaryGearComponent extends DrivetrainComponent {
  readonly params: Required<PlanetaryGearParams>;
  private _rho: number;

  constructor(params: PlanetaryGearParams = {}, name: string = 'planetary') {
    super(name);

    this.params = {
      zSun: params.zSun ?? 30,
      zRing: params.zRing ?? 90,
      jSun: params.jSun ?? 0.5,
      jCarrier: params.jCarrier ?? 1.0,
      jRing: params.jRing ?? 0.5,
      etaSunPlanet: params.etaSunPlanet ?? 0.98,
      etaPlanetRing: params.etaPlanetRing ?? 0.98,
      useEfficiency: params.useEfficiency ?? true,
    };

    this._rho = this.params.zRing / this.params.zSun;
  }

  /** Planetary ratio ρ = Z_ring / Z_sun. */
  get rho(): number {
    return this._rho;
  }

  /** Total mesh efficiency (sun-planet × planet-ring). */
  get eta(): number {
    if (!this.params.useEfficiency) {
      return 1.0;
    }
    return this.params.etaSunPlanet * this.params.etaPlanetRing;
  }

  get ports(): Record<string, Port> {
    return {
      sun: {
        name: 'sun',
        portType: PortType.MECHANICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Sun gear (typically MG1)',
      },
      carrier: {
        name: 'carrier',
        portType: PortType.MECHANICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Carrier (typically engine)',
      },
      ring: {
        name: 'ring',
        portType: PortType.MECHANICAL,
        direction: PortDirection.BIDIRECTIONAL,
        description: 'Ring gear (typically output)',
      },
    };
  }

  get stateNames(): string[] {
    return [];
  }

  getInertia(portName: string): number {
    if (portName === 'sun') {
      return this.params.jSun;
    }
    if (portName === 'carrier') {
      return this.params.jCarrier;
    }
    if (portName === 'ring') {
      return this.params.jRing;
    }
    throw new Error(`Unknown port: ${portName}`);
  }

  getConstraints(): KinematicConstraint[] {
    return [
      new WillisConstraint({
        sunPort: 'sun',
        carrierPort: 'carrier',
        ringPort: 'ring',
        rho: this._rho,
      }),
    ];
  }

  /**
   * Calculate sun gear speed from Willis equation.
   *
   * ω_sun = (1 + ρ) × ω_carrier - ρ × ω_ring
   */
  calcSunSpeed(omegaCarrier: number, omegaRing: number): number {
    return (1 + this._rho) * omegaCarrier - this._rho * omegaRing;
  }

  /**
   * Calculate carrier speed from sun and ring speeds.
   */
  calcCarrierSpeed(omegaSun: number, omegaRing: number): number {
    return (omegaSun + this._rho * omegaRing) / (1 + this._rho);
  }

  /**
   * Calculate ring speed from carrier and sun speeds.
   */
  calcRingSpeed(omegaCarrier: number, omegaSun: number): number {
    return ((1 + this._rho) * omegaCarrier - omegaSun) / this._rho;
  }

  /**
   * Get torque balance ratios (sun : carrier : ring).
   *
   * For a planetary gear in static equilibrium:
   * τ_sun + τ_carrier + τ_ring = 0
   */
  getTorqueRatios(): [number, number, number] {
    return [1.0, -(1 + this._rho), this._rho];
  }

  /**
   * Calculate sun and ring torques from carrier torque.
   *
   * Based on torque ratios 1 : -(1+ρ) : ρ
   * With efficiency losses applied to ring torque.
   *
   * @param tCarrier - Carrier (engine) torque [N*m]
   * @param includeEfficiency - Override efficiency setting
   * @returns [tSun, tRing] - Sun and ring torques [N*m]
   */
  calcTorqueSplit(tCarrier: number, includeEfficiency?: boolean): [number, number] {
    // From T_carrier and ratio τ_carrier = -(1+ρ)
    const tSun = -tCarrier / (1 + this._rho);
    const tRingIdeal = tSun * this._rho;

    // Apply efficiency if enabled
    const useEta = includeEfficiency ?? this.params.useEfficiency;
    const tRing = useEta ? tRingIdeal * this.eta : tRingIdeal;

    return [tSun, tRing];
  }

  /**
   * Get inertia coupling coefficients for 2-DOF reduction.
   *
   * When reducing from 3-DOF to 2-DOF using Willis constraint:
   *
   * J = [J_c + (1+ρ)² × J_s,     -(1+ρ)×ρ × J_s    ]
   *     [-(1+ρ)×ρ × J_s,          J_r + ρ² × J_s    ]
   *
   * @param jSun - Sun gear inertia (including attached motor)
   * @returns [J_carrier_add, J_coupling, J_ring_add]
   */
  getInertiaCoefficients(jSun: number): [number, number, number] {
    const jCarrierAdd = (1 + this._rho) ** 2 * jSun;
    const jCoupling = -(1 + this._rho) * this._rho * jSun;
    const jRingAdd = this._rho ** 2 * jSun;
    return [jCarrierAdd, jCoupling, jRingAdd];
  }

  computeTorques(
    _portSpeeds: Record<string, number>,
    _controlInputs: Record<string, number>,
    _internalStates?: Record<string, number>
  ): Record<string, number> {
    // Planetary gear doesn't generate torque, it distributes it
    return {};
  }

  computeStateDerivatives(
    _internalStates: Record<string, number>,
    _portValues: PortValues
  ): Record<string, number> {
    return {};
  }
}
