/**
 * Port types and connection definitions for drivetrain components.
 */

export enum PortType {
  /** Rotating shaft: (omega [rad/s], torque [N*m]) */
  MECHANICAL = 'MECHANICAL',
  /** Power bus: (voltage [V], current [A]) */
  ELECTRICAL = 'ELECTRICAL',
}

export enum PortDirection {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export interface Port {
  readonly name: string;
  readonly portType: PortType;
  readonly direction: PortDirection;
  readonly description?: string;
}

export interface Connection {
  readonly fromComponent: string;
  readonly fromPort: string;
  readonly toComponent: string;
  readonly toPort: string;
}

/**
 * Create a mechanical port.
 */
export function mechanicalPort(
  name: string,
  direction: PortDirection,
  description?: string
): Port {
  return {
    name,
    portType: PortType.MECHANICAL,
    direction,
    description,
  };
}

/**
 * Create an electrical port.
 */
export function electricalPort(
  name: string,
  direction: PortDirection,
  description?: string
): Port {
  return {
    name,
    portType: PortType.ELECTRICAL,
    direction,
    description,
  };
}

/**
 * Check if two ports can be connected.
 */
export function canConnect(portA: Port, portB: Port): boolean {
  // Must be same type
  if (portA.portType !== portB.portType) {
    return false;
  }

  // Check direction compatibility
  if (portA.direction === PortDirection.BIDIRECTIONAL ||
      portB.direction === PortDirection.BIDIRECTIONAL) {
    return true;
  }

  // OUTPUT can connect to INPUT
  return (
    (portA.direction === PortDirection.OUTPUT && portB.direction === PortDirection.INPUT) ||
    (portA.direction === PortDirection.INPUT && portB.direction === PortDirection.OUTPUT)
  );
}
