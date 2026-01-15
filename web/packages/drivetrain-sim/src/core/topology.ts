/**
 * Drivetrain topology builder with fluent API.
 */

import { DrivetrainComponent } from './component';
import { Connection, PortType } from './ports';
import { Drivetrain } from './drivetrain';

/**
 * Error in drivetrain topology configuration.
 */
export class TopologyError extends Error {
  constructor(
    message: string,
    public component?: string,
    public port?: string
  ) {
    const location = component
      ? ` at component '${component}'${port ? `.${port}` : ''}`
      : '';
    super(`TopologyError${location}: ${message}`);
    this.name = 'TopologyError';
  }
}

/**
 * Builder for constructing drivetrain topologies.
 *
 * Use the fluent API to add components and connections, then call
 * build() to compile into a simulatable Drivetrain.
 *
 * Example:
 *   const topology = new DrivetrainTopology()
 *     .addComponent("engine", new EngineComponent())
 *     .addComponent("gearbox", new GearboxComponent())
 *     .addComponent("vehicle", new VehicleComponent())
 *     .connect("engine", "shaft", "gearbox", "input")
 *     .connect("gearbox", "output", "vehicle", "wheels")
 *     .setOutput("vehicle", "wheels");
 *   const drivetrain = topology.build();
 */
export class DrivetrainTopology {
  readonly components: Map<string, DrivetrainComponent> = new Map();
  readonly connections: Connection[] = [];
  outputComponent: string | null = null;
  outputPort: string | null = null;
  private _electricalBuses: Map<string, Array<[string, string]>> = new Map();

  /**
   * Add a component to the topology.
   *
   * @param name - Unique identifier for this component
   * @param component - The component instance
   * @returns this for method chaining
   */
  addComponent(name: string, component: DrivetrainComponent): this {
    if (this.components.has(name)) {
      throw new TopologyError(`Component name '${name}' already exists`, name);
    }

    component.name = name;
    this.components.set(name, component);
    return this;
  }

  /**
   * Connect two component ports.
   *
   * Creates a physical connection between ports. Both ports must be
   * of the same type (both mechanical or both electrical).
   */
  connect(
    fromComponent: string,
    fromPort: string,
    toComponent: string,
    toPort: string
  ): this {
    // Validate components exist
    if (!this.components.has(fromComponent)) {
      throw new TopologyError(`Unknown component '${fromComponent}'`, fromComponent);
    }
    if (!this.components.has(toComponent)) {
      throw new TopologyError(`Unknown component '${toComponent}'`, toComponent);
    }

    const fromComp = this.components.get(fromComponent)!;
    const toComp = this.components.get(toComponent)!;

    // Validate ports exist
    if (!fromComp.hasPort(fromPort)) {
      throw new TopologyError(
        `No port '${fromPort}' on component`,
        fromComponent,
        fromPort
      );
    }
    if (!toComp.hasPort(toPort)) {
      throw new TopologyError(
        `No port '${toPort}' on component`,
        toComponent,
        toPort
      );
    }

    // Validate port types match
    const fromPortObj = fromComp.getPort(fromPort)!;
    const toPortObj = toComp.getPort(toPort)!;
    if (fromPortObj.portType !== toPortObj.portType) {
      throw new TopologyError(
        `Port type mismatch: ${fromPortObj.portType} != ${toPortObj.portType}`,
        fromComponent,
        fromPort
      );
    }

    // Check for duplicate connections
    const conn: Connection = {
      fromComponent,
      fromPort,
      toComponent,
      toPort,
    };

    for (const existing of this.connections) {
      if (
        (existing.fromComponent === conn.fromComponent &&
          existing.fromPort === conn.fromPort) ||
        (existing.toComponent === conn.toComponent &&
          existing.toPort === conn.toPort)
      ) {
        throw new TopologyError(
          `Port already connected`,
          fromComponent,
          fromPort
        );
      }
    }

    this.connections.push(conn);
    return this;
  }

  /**
   * Set the output port (connected to vehicle/ground).
   *
   * The output port is where the drivetrain connects to the vehicle
   * road load. This is typically the wheels port on the vehicle component.
   */
  setOutput(component: string, port: string): this {
    if (!this.components.has(component)) {
      throw new TopologyError(`Unknown component '${component}'`, component);
    }

    const comp = this.components.get(component)!;
    if (!comp.hasPort(port)) {
      throw new TopologyError(
        `No port '${port}' on component`,
        component,
        port
      );
    }

    this.outputComponent = component;
    this.outputPort = port;
    return this;
  }

  /**
   * Create a named electrical bus for power sharing.
   */
  createElectricalBus(busName: string): this {
    if (this._electricalBuses.has(busName)) {
      throw new TopologyError(`Electrical bus '${busName}' already exists`);
    }
    this._electricalBuses.set(busName, []);
    return this;
  }

  /**
   * Connect a component's electrical port to a bus.
   */
  connectToBus(busName: string, component: string, port: string): this {
    if (!this._electricalBuses.has(busName)) {
      throw new TopologyError(`Unknown electrical bus '${busName}'`);
    }

    if (!this.components.has(component)) {
      throw new TopologyError(`Unknown component '${component}'`, component);
    }

    const comp = this.components.get(component)!;
    if (!comp.hasPort(port)) {
      throw new TopologyError(
        `No port '${port}' on component`,
        component,
        port
      );
    }

    const portObj = comp.getPort(port)!;
    if (portObj.portType !== PortType.ELECTRICAL) {
      throw new TopologyError(
        `Port '${port}' is not electrical`,
        component,
        port
      );
    }

    this._electricalBuses.get(busName)!.push([component, port]);
    return this;
  }

  /**
   * Get all connections involving a component.
   */
  getConnectionsFor(component: string): Connection[] {
    return this.connections.filter(
      (c) => c.fromComponent === component || c.toComponent === component
    );
  }

  /**
   * Get all MECHANICAL connections involving a component.
   * Filters out electrical connections.
   */
  getMechanicalConnectionsFor(component: string): Connection[] {
    return this.connections.filter((c) => {
      if (c.fromComponent !== component && c.toComponent !== component) {
        return false;
      }
      // Check if this is a mechanical connection
      const comp = this.components.get(c.fromComponent);
      if (!comp) return false;
      const port = comp.getPort(c.fromPort);
      return port?.portType === PortType.MECHANICAL;
    });
  }

  /**
   * Check if there's a mechanical path from a component to the output.
   * Uses BFS to traverse the mechanical connection graph.
   */
  hasMechanicalPathToOutput(startComponent: string): boolean {
    if (this.outputComponent === null) {
      return false;
    }

    if (startComponent === this.outputComponent) {
      return true;
    }

    const visited = new Set<string>();
    const queue: string[] = [startComponent];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const connections = this.getMechanicalConnectionsFor(current);
      for (const conn of connections) {
        const neighbor =
          conn.fromComponent === current ? conn.toComponent : conn.fromComponent;

        if (neighbor === this.outputComponent) {
          return true;
        }

        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  /**
   * Get all components reachable via mechanical connections from the output.
   * Returns the set of component names on the mechanical path.
   */
  getConnectedMechanicalComponents(): Set<string> {
    const connected = new Set<string>();

    if (this.outputComponent === null) {
      return connected;
    }

    const queue: string[] = [this.outputComponent];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (connected.has(current)) {
        continue;
      }
      connected.add(current);

      const connections = this.getMechanicalConnectionsFor(current);
      for (const conn of connections) {
        const neighbor =
          conn.fromComponent === current ? conn.toComponent : conn.fromComponent;
        if (!connected.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    return connected;
  }

  /**
   * Find what a port is connected to.
   *
   * @returns [component_name, port_name] or null if not connected
   */
  getConnectedPort(component: string, port: string): [string, string] | null {
    for (const conn of this.connections) {
      if (conn.fromComponent === component && conn.fromPort === port) {
        return [conn.toComponent, conn.toPort];
      }
      if (conn.toComponent === component && conn.toPort === port) {
        return [conn.fromComponent, conn.fromPort];
      }
    }
    return null;
  }

  /**
   * Validate the topology configuration.
   *
   * @returns List of validation error messages (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Check that we have at least one component
    if (this.components.size === 0) {
      errors.push('Topology has no components');
      return errors; // Can't continue validation without components
    }

    // Validate each component
    for (const [name, component] of this.components) {
      const compErrors = component.validate();
      for (const err of compErrors) {
        errors.push(`Component '${name}': ${err}`);
      }
    }

    // Check that output is set
    if (this.outputComponent === null) {
      errors.push('No output port set (use setOutput())');
      return errors; // Can't validate paths without output
    }

    // Check for disconnected components (basic check)
    const connectedComponents = new Set<string>();
    for (const conn of this.connections) {
      connectedComponents.add(conn.fromComponent);
      connectedComponents.add(conn.toComponent);
    }

    for (const [name, component] of this.components) {
      if (!connectedComponents.has(name) && this.components.size > 1) {
        // Allow if component only has electrical ports
        const mechPorts = component.getMechanicalPorts();
        if (Object.keys(mechPorts).length > 0) {
          errors.push(`Component '${name}' is not connected to anything`);
        }
      }
    }

    // Find all actuators (engines and motors)
    const actuators: string[] = [];
    for (const [name, component] of this.components) {
      if (component.componentType === 'engine' || component.componentType === 'motor') {
        actuators.push(name);
      }
    }

    // Check that at least one actuator exists
    if (actuators.length === 0) {
      errors.push('Topology needs at least one actuator (engine or motor)');
    }

    // Check that at least one actuator has a mechanical path to the output
    let hasPathToOutput = false;
    const actuatorsWithoutPath: string[] = [];

    for (const actuatorName of actuators) {
      if (this.hasMechanicalPathToOutput(actuatorName)) {
        hasPathToOutput = true;
      } else {
        actuatorsWithoutPath.push(actuatorName);
      }
    }

    if (!hasPathToOutput && actuators.length > 0) {
      errors.push(
        `No mechanical path from any actuator to output '${this.outputComponent}.${this.outputPort}'. ` +
        `Disconnected actuators: ${actuatorsWithoutPath.join(', ')}`
      );
    } else if (actuatorsWithoutPath.length > 0) {
      // Warn about actuators that aren't connected to the output
      // This could be intentional (e.g., a generator that's only electrically connected)
      // but we should still flag it
      for (const name of actuatorsWithoutPath) {
        const component = this.components.get(name)!;
        const mechPorts = component.getMechanicalPorts();
        if (Object.keys(mechPorts).length > 0) {
          errors.push(
            `Actuator '${name}' has no mechanical path to output - ` +
            `will not contribute to vehicle motion`
          );
        }
      }
    }

    // Check that all mechanical components are reachable from the output
    // Components not on the mechanical path will have independent DOFs that don't affect vehicle
    const reachableFromOutput = this.getConnectedMechanicalComponents();

    for (const [name, component] of this.components) {
      const mechPorts = component.getMechanicalPorts();
      if (Object.keys(mechPorts).length > 0 && !reachableFromOutput.has(name)) {
        // Only error if it's connected to something but not to the output path
        if (connectedComponents.has(name)) {
          errors.push(
            `Component '${name}' is mechanically connected but not on the path to output - ` +
            `this will create an independent DOF that doesn't affect vehicle motion`
          );
        }
      }
    }

    // Check electrical bus connections
    for (const [busName, members] of this._electricalBuses) {
      if (members.length < 2) {
        errors.push(
          `Electrical bus '${busName}' has fewer than 2 connections`
        );
      }
    }

    return errors;
  }

  /**
   * Compile the topology into a simulatable Drivetrain.
   */
  build(): Drivetrain {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new TopologyError('Invalid topology: ' + errors.join('; '));
    }

    return new Drivetrain(this);
  }

  toString(): string {
    const compNames = Array.from(this.components.keys());
    return `DrivetrainTopology(components=[${compNames.join(', ')}], connections=${this.connections.length})`;
  }
}
