/**
 * Base class for all drivetrain components.
 */

import { Port, PortType } from './ports';
import { KinematicConstraint } from './constraints';

/**
 * Values at a component's ports.
 */
export interface PortValues {
  [key: string]: number;
}

/**
 * Abstract base class for drivetrain components.
 *
 * Components represent physical elements like engines, motors, gearboxes, etc.
 * Each component has:
 * - Ports: Connection points (mechanical shafts, electrical buses)
 * - Internal states: Variables that evolve over time (e.g., SOC)
 * - Inertia: Rotational inertia at mechanical ports
 * - Constraints: Internal kinematic relationships (e.g., gear ratios)
 */
export abstract class DrivetrainComponent {
  protected _name: string;

  constructor(name: string = 'component') {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  /** Get all ports for this component. */
  abstract get ports(): Record<string, Port>;

  /** Get names of internal state variables. */
  abstract get stateNames(): string[];

  /** Get rotational inertia at a mechanical port [kg*m^2]. */
  abstract getInertia(portName: string): number;

  /** Get kinematic constraints within this component. */
  abstract getConstraints(): KinematicConstraint[];

  /**
   * Compute output torques based on port speeds and control inputs.
   *
   * @param portSpeeds - Angular velocities at each port [rad/s]
   * @param controlInputs - Control signals (e.g., torque command)
   * @param internalStates - Current values of internal states
   * @returns Torques produced at each port [N*m]
   */
  abstract computeTorques(
    portSpeeds: Record<string, number>,
    controlInputs: Record<string, number>,
    internalStates?: Record<string, number>
  ): Record<string, number>;

  /**
   * Compute derivatives of internal states.
   *
   * @param internalStates - Current values of internal states
   * @param portValues - Port speeds and torques
   * @returns Time derivatives of each state
   */
  abstract computeStateDerivatives(
    internalStates: Record<string, number>,
    portValues: PortValues
  ): Record<string, number>;

  /** Get a port by name. */
  getPort(name: string): Port | undefined {
    return this.ports[name];
  }

  /** Check if a port exists. */
  hasPort(name: string): boolean {
    return name in this.ports;
  }

  /** Get all mechanical ports. */
  getMechanicalPorts(): Record<string, Port> {
    const result: Record<string, Port> = {};
    for (const [name, port] of Object.entries(this.ports)) {
      if (port.portType === PortType.MECHANICAL) {
        result[name] = port;
      }
    }
    return result;
  }

  /** Get all electrical ports. */
  getElectricalPorts(): Record<string, Port> {
    const result: Record<string, Port> = {};
    for (const [name, port] of Object.entries(this.ports)) {
      if (port.portType === PortType.ELECTRICAL) {
        result[name] = port;
      }
    }
    return result;
  }

  /** Get total inertia across all mechanical ports. */
  getTotalInertia(): number {
    let total = 0;
    for (const portName of Object.keys(this.getMechanicalPorts())) {
      total += this.getInertia(portName);
    }
    return total;
  }

  /** Validate component configuration. Returns list of error messages. */
  validate(): string[] {
    const errors: string[] = [];

    // Check that all ports have valid types
    for (const [name, port] of Object.entries(this.ports)) {
      if (!port.portType) {
        errors.push(`Port '${name}' has no type`);
      }
    }

    return errors;
  }
}
