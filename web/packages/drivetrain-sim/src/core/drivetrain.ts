/**
 * Compiled drivetrain with automatically-derived dynamics.
 */

import { DrivetrainTopology } from './topology';
import { DrivetrainComponent } from './component';
import {
  KinematicConstraint,
  RigidConnectionConstraint,
} from './constraints';
import { PortType } from './ports';
import { solveLinear } from '../math/linalg';

/**
 * Information about a degree of freedom in the system.
 */
export interface DOFInfo {
  /** e.g., "engine.shaft" or "gearbox.output" */
  name: string;
  component: string;
  port: string;
  index: number;
}

/**
 * Information about an applied constraint.
 */
export interface ConstraintInfo {
  constraint: KinematicConstraint;
  component: string;
  /** The DOF that was eliminated */
  eliminatedDof: string;
  /** How to compute eliminated DOF from independent DOFs */
  expression: Record<string, number>;
}

/**
 * A compiled drivetrain ready for simulation.
 *
 * The Drivetrain class takes a topology and automatically derives:
 * - The independent degrees of freedom (after constraint reduction)
 * - The inertia matrix relating accelerations to torques
 * - Methods for computing dynamics for ODE integration
 *
 * The state vector consists of:
 * 1. Mechanical DOF speeds (omega values for independent shafts)
 * 2. Internal component states (e.g., battery SOC)
 */
export class Drivetrain {
  readonly topology: DrivetrainTopology;
  private _components: Map<string, DrivetrainComponent>;
  private _allDofs: DOFInfo[] = [];
  private _independentDofs: DOFInfo[] = [];
  private _eliminatedDofs: Map<string, ConstraintInfo> = new Map();
  private _internalStates: Array<[string, string]> = [];
  private _controlInputs: string[] = [];
  private _inertiaMatrix: number[][] | null = null;
  private _gearState: Map<string, number> = new Map();

  constructor(topology: DrivetrainTopology) {
    this.topology = topology;
    this._components = topology.components;
    this._compile();
  }

  private _compile(): void {
    this._identifyDofs();
    this._applyConstraints();
    this._collectInternalStates();
    this._identifyControlInputs();
    this._buildInertiaMatrix();
  }

  private _identifyDofs(): void {
    const allDofs: DOFInfo[] = [];
    let idx = 0;

    for (const [compName, component] of this._components) {
      for (const portName of Object.keys(component.getMechanicalPorts())) {
        const dofName = `${compName}.${portName}`;
        allDofs.push({ name: dofName, component: compName, port: portName, index: idx });
        idx++;
      }
    }

    this._allDofs = allDofs;
  }

  private _applyConstraints(): void {
    // Start with all DOFs as independent
    const independent = new Map<string, DOFInfo>();
    for (const dof of this._allDofs) {
      independent.set(dof.name, dof);
    }
    const eliminated = new Map<string, ConstraintInfo>();

    // First, handle connections between components (speed equality constraints)
    for (const conn of this.topology.connections) {
      const fromDof = `${conn.fromComponent}.${conn.fromPort}`;
      const toDof = `${conn.toComponent}.${conn.toPort}`;

      // Check port types
      const fromPort = this._components.get(conn.fromComponent)!.getPort(conn.fromPort);
      if (fromPort?.portType !== PortType.MECHANICAL) {
        continue; // Skip electrical connections
      }

      // The "to" port takes on the "from" port's speed
      if (independent.has(toDof)) {
        independent.delete(toDof);
        eliminated.set(toDof, {
          constraint: new RigidConnectionConstraint(fromDof, toDof),
          component: 'connection',
          eliminatedDof: toDof,
          expression: { [fromDof]: 1.0 },
        });
      }
    }

    // Then, handle component internal constraints
    for (const [compName, component] of this._components) {
      for (const constraint of component.getConstraints()) {
        const dependentPort = constraint.getDependentPort();
        const dependentDof = `${compName}.${dependentPort}`;

        // Build expression for the dependent DOF
        const expression: Record<string, number> = {};
        const relation = constraint.getSpeedRelation();

        // Find the coefficient for the dependent DOF
        const depCoeff = relation[dependentPort] ?? 0;
        if (Math.abs(depCoeff) < 1e-12) {
          continue; // Can't eliminate this DOF
        }

        // Express dependent DOF in terms of others
        for (const [portName, coeff] of Object.entries(relation)) {
          if (portName === dependentPort) {
            continue;
          }
          const fullName = `${compName}.${portName}`;

          // Resolve through any previous eliminations
          const resolved = this._resolveDof(fullName, independent, eliminated);
          for (const [dofName, factor] of Object.entries(resolved)) {
            const current = expression[dofName] ?? 0;
            expression[dofName] = current - (coeff / depCoeff) * factor;
          }
        }

        // If dependent DOF is already eliminated, follow the chain
        if (!independent.has(dependentDof)) {
          if (eliminated.has(dependentDof)) {
            const connInfo = eliminated.get(dependentDof)!;
            // Only handle 1:1 connections (rigid connections)
            const exprKeys = Object.keys(connInfo.expression);
            if (exprKeys.length === 1) {
              const connectedDof = exprKeys[0];
              const coeffConnection = connInfo.expression[connectedDof];
              if (Math.abs(coeffConnection - 1.0) < 1e-12 && independent.has(connectedDof)) {
                // Eliminate the connected DOF with the constraint expression
                independent.delete(connectedDof);
                eliminated.set(connectedDof, {
                  constraint,
                  component: compName,
                  eliminatedDof: connectedDof,
                  expression,
                });
              }
            }
          }
          continue;
        }

        independent.delete(dependentDof);
        eliminated.set(dependentDof, {
          constraint,
          component: compName,
          eliminatedDof: dependentDof,
          expression,
        });
      }
    }

    // Re-index remaining independent DOFs
    this._independentDofs = [];
    let idx = 0;
    for (const [name, dofInfo] of independent) {
      this._independentDofs.push({
        name,
        component: dofInfo.component,
        port: dofInfo.port,
        index: idx,
      });
      idx++;
    }

    this._eliminatedDofs = eliminated;
  }

  private _resolveDof(
    dofName: string,
    independent: Map<string, DOFInfo>,
    eliminated: Map<string, ConstraintInfo>
  ): Record<string, number> {
    if (independent.has(dofName)) {
      return { [dofName]: 1.0 };
    }

    if (eliminated.has(dofName)) {
      const info = eliminated.get(dofName)!;
      const result: Record<string, number> = {};
      for (const [subDof, coeff] of Object.entries(info.expression)) {
        const subResolved = this._resolveDof(subDof, independent, eliminated);
        for (const [finalDof, finalCoeff] of Object.entries(subResolved)) {
          const current = result[finalDof] ?? 0;
          result[finalDof] = current + coeff * finalCoeff;
        }
      }
      return result;
    }

    // DOF not found
    throw new Error(`DOF '${dofName}' not found in topology`);
  }

  private _collectInternalStates(): void {
    this._internalStates = [];
    for (const [compName, component] of this._components) {
      for (const stateName of component.stateNames) {
        this._internalStates.push([compName, stateName]);
      }
    }
  }

  private _identifyControlInputs(): void {
    this._controlInputs = [];

    for (const [compName, component] of this._components) {
      const compType = component.constructor.name;
      if (compType.includes('Engine')) {
        this._controlInputs.push(`T_${compName}`);
      } else if (compType.includes('Motor')) {
        this._controlInputs.push(`T_${compName}`);
      }
    }

    // Add gear selection for gearboxes
    for (const [compName, component] of this._components) {
      const compType = component.constructor.name;
      if (compType.includes('Gearbox')) {
        this._controlInputs.push(`gear_${compName}`);
        this._gearState.set(compName, 0);
      }
    }
  }

  private _buildInertiaMatrix(): void {
    const nDof = this._independentDofs.length;
    const J: number[][] = [];
    for (let i = 0; i < nDof; i++) {
      J.push(new Array(nDof).fill(0));
    }

    for (let i = 0; i < nDof; i++) {
      for (let j = 0; j < nDof; j++) {
        J[i][j] = this._computeCoupledInertia(
          this._independentDofs[i],
          this._independentDofs[j]
        );
      }
    }

    this._inertiaMatrix = J;
  }

  private _computeCoupledInertia(dofI: DOFInfo, dofJ: DOFInfo): number {
    let total = 0;

    const contributionsI = this._getInertiaContributions(dofI.name);
    const contributionsJ = this._getInertiaContributions(dofJ.name);

    for (const [key, coeffI] of contributionsI) {
      const coeffJ = contributionsJ.get(key) ?? 0;
      if (Math.abs(coeffJ) > 1e-12) {
        const [comp, port] = key.split(':');
        const jPort = this._components.get(comp)!.getInertia(port);
        total += jPort * coeffI * coeffJ;
      }
    }

    return total;
  }

  private _getInertiaContributions(dofName: string): Map<string, number> {
    const contributions = new Map<string, number>();

    // The DOF's own port
    for (const dof of this._independentDofs) {
      if (dof.name === dofName) {
        contributions.set(`${dof.component}:${dof.port}`, 1.0);
      }
    }

    // Build resolved expressions for all eliminated DOFs
    const independentMap = new Map<string, DOFInfo>();
    for (const dof of this._independentDofs) {
      independentMap.set(dof.name, dof);
    }

    const resolvedExpressions = new Map<string, Record<string, number>>();
    for (const [elimName] of this._eliminatedDofs) {
      const resolved = this._resolveDof(elimName, independentMap, this._eliminatedDofs);
      resolvedExpressions.set(elimName, resolved);
    }

    // Add contributions from eliminated DOFs that depend on dofName
    for (const [elimName, resolved] of resolvedExpressions) {
      const coeff = resolved[dofName] ?? 0;
      if (Math.abs(coeff) > 1e-12) {
        const parts = elimName.split('.');
        contributions.set(`${parts[0]}:${parts[1]}`, coeff);
      }
    }

    return contributions;
  }

  /** Names of all state variables. */
  get stateNames(): string[] {
    const names = this._independentDofs.map((dof) => dof.name);
    for (const [comp, state] of this._internalStates) {
      names.push(`${comp}.${state}`);
    }
    return names;
  }

  /** Number of mechanical degrees of freedom. */
  get nMechanicalDofs(): number {
    return this._independentDofs.length;
  }

  /** Number of internal state variables. */
  get nInternalStates(): number {
    return this._internalStates.length;
  }

  /** Total number of state variables. */
  get nStates(): number {
    return this.nMechanicalDofs + this.nInternalStates;
  }

  /** Names of control inputs. */
  get controlNames(): string[] {
    return this._controlInputs;
  }

  /** The compiled inertia matrix. */
  get inertiaMatrix(): number[][] {
    if (this._inertiaMatrix === null) {
      this._buildInertiaMatrix();
    }
    return this._inertiaMatrix!;
  }

  /** Get a component by name. */
  getComponent(name: string): DrivetrainComponent | undefined {
    return this._components.get(name);
  }

  /** Set the current gear for a gearbox component. */
  setGear(component: string, gear: number): void {
    if (this._gearState.has(component)) {
      this._gearState.set(component, gear);
      // Rebuild since ratios changed
      this._applyConstraints();
      this._buildInertiaMatrix();
    }
  }

  /** Convert state dict to array. */
  stateToArray(state: Record<string, number>): number[] {
    const x = new Array(this.nStates).fill(0);
    for (let i = 0; i < this.stateNames.length; i++) {
      x[i] = state[this.stateNames[i]] ?? 0;
    }
    return x;
  }

  /** Convert state array to dict. */
  arrayToState(x: number[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (let i = 0; i < this.stateNames.length; i++) {
      result[this.stateNames[i]] = x[i];
    }
    return result;
  }

  /**
   * Compute all port speeds from state vector.
   *
   * Returns speeds for both independent and constrained DOFs.
   */
  getAllSpeeds(x: number[]): Record<string, number> {
    const state = this.arrayToState(x);
    const speeds: Record<string, number> = {};

    // Independent DOFs have speeds directly in state
    for (const dof of this._independentDofs) {
      speeds[dof.name] = state[dof.name] ?? 0;
    }

    // Constrained DOFs computed from constraints (with recursive resolution)
    const resolveSpeed = (dofName: string): number => {
      if (speeds[dofName] !== undefined) {
        return speeds[dofName];
      }

      if (this._eliminatedDofs.has(dofName)) {
        const info = this._eliminatedDofs.get(dofName)!;
        let omega = 0;
        for (const [depName, coeff] of Object.entries(info.expression)) {
          omega += coeff * resolveSpeed(depName);
        }
        speeds[dofName] = omega;
        return omega;
      }

      return 0;
    };

    for (const elimName of this._eliminatedDofs.keys()) {
      resolveSpeed(elimName);
    }

    return speeds;
  }

  /**
   * Compute state derivatives for ODE integration.
   *
   * @param t - Current time [s]
   * @param x - State vector [omega_1, ..., omega_n, state_1, ..., state_m]
   * @param control - Control inputs (torques, gear selections)
   * @param disturbance - Disturbance inputs (e.g., grade)
   * @returns State derivative vector dx/dt
   */
  dynamics(
    t: number,
    x: number[],
    control: Record<string, number>,
    disturbance: Record<string, number>
  ): number[] {
    const dx = new Array(x.length).fill(0);

    // Get all port speeds
    const allSpeeds = this.getAllSpeeds(x);

    // Update gear states from control
    for (const compName of this._gearState.keys()) {
      const gearKey = `gear_${compName}`;
      if (gearKey in control) {
        const newGear = Math.floor(control[gearKey]);
        if (newGear !== this._gearState.get(compName)) {
          this.setGear(compName, newGear);
        }
      }
    }

    // Compute torques from all components
    const allTorques: Record<string, number> = {};

    for (const [compName, component] of this._components) {
      // Build port speeds dict for this component
      const portSpeeds: Record<string, number> = {};
      for (const portName of Object.keys(component.getMechanicalPorts())) {
        const dofName = `${compName}.${portName}`;
        portSpeeds[portName] = allSpeeds[dofName] ?? 0;
      }

      // Build control inputs for this component
      const compControl: Record<string, number> = {};
      const torqueKey = `T_${compName}`;
      if (torqueKey in control) {
        compControl.torque = control[torqueKey];
      }

      // Get internal states for this component
      const internal: Record<string, number> = {};
      for (const stateName of component.stateNames) {
        const fullName = `${compName}.${stateName}`;
        const idx = this.stateNames.indexOf(fullName);
        internal[stateName] = x[idx];
      }

      // Compute torques
      const torques = component.computeTorques(portSpeeds, compControl, internal);
      for (const [portName, torque] of Object.entries(torques)) {
        const dofName = `${compName}.${portName}`;
        allTorques[dofName] = torque;
      }
    }

    // Build generalized force vector
    const tau = new Array(this.nMechanicalDofs).fill(0);

    // First, resolve all eliminated DOFs to independent DOFs
    const independentMap = new Map<string, DOFInfo>();
    for (const dof of this._independentDofs) {
      independentMap.set(dof.name, dof);
    }

    const resolvedCoeffs = new Map<string, Record<string, number>>();
    for (const elimName of this._eliminatedDofs.keys()) {
      resolvedCoeffs.set(
        elimName,
        this._resolveDof(elimName, independentMap, this._eliminatedDofs)
      );
    }

    for (let i = 0; i < this._independentDofs.length; i++) {
      const dof = this._independentDofs[i];

      // Direct torque on this DOF
      tau[i] += allTorques[dof.name] ?? 0;

      // Add torques from constrained DOFs, using resolved coefficients
      for (const [elimName, resolved] of resolvedCoeffs) {
        const coeff = resolved[dof.name] ?? 0;
        if (Math.abs(coeff) > 1e-12) {
          tau[i] += coeff * (allTorques[elimName] ?? 0);
        }
      }
    }

    // Add load torque (from vehicle component) with grade
    const grade = disturbance.grade ?? 0;
    this._addLoadTorque(tau, allSpeeds, grade);

    // Solve for accelerations: J * omega_dot = tau
    const J = this.inertiaMatrix;
    if (this.nMechanicalDofs > 0) {
      const omegaDot = solveLinear(J, tau);
      for (let i = 0; i < this.nMechanicalDofs; i++) {
        dx[i] = omegaDot[i];
      }
    }

    // Compute internal state derivatives
    for (let i = 0; i < this._internalStates.length; i++) {
      const [compName, stateName] = this._internalStates[i];
      const component = this._components.get(compName)!;

      // Get port values
      const portValues: Record<string, number> = {};
      for (const portName of Object.keys(component.ports)) {
        const dofName = `${compName}.${portName}`;
        portValues[`${portName}_speed`] = allSpeeds[dofName] ?? 0;
        portValues[`${portName}_torque`] = allTorques[dofName] ?? 0;
      }

      // Get current internal states
      const internal: Record<string, number> = {};
      for (const sn of component.stateNames) {
        const fullName = `${compName}.${sn}`;
        const idx = this.stateNames.indexOf(fullName);
        internal[sn] = x[idx];
      }

      // Compute derivatives
      const derivs = component.computeStateDerivatives(internal, portValues);

      // Store in dx
      const stateIdx = this.nMechanicalDofs + i;
      dx[stateIdx] = derivs[stateName] ?? 0;
    }

    return dx;
  }

  private _addLoadTorque(
    tau: number[],
    speeds: Record<string, number>,
    grade: number
  ): void {
    if (this.topology.outputComponent === null) {
      return;
    }

    const outputComp = this.topology.outputComponent;
    const outputPort = this.topology.outputPort!;
    const outputDof = `${outputComp}.${outputPort}`;

    // Get vehicle velocity from wheel speed
    const component = this._components.get(outputComp)!;
    const omega = speeds[outputDof] ?? 0;

    // If this is a vehicle component, get load torque
    if ('computeLoadTorque' in component) {
      const tLoad = (component as any).computeLoadTorque(omega, grade);

      // Find which independent DOF is affected
      let found = false;
      for (let i = 0; i < this._independentDofs.length; i++) {
        if (this._independentDofs[i].name === outputDof) {
          tau[i] -= tLoad;
          found = true;
          break;
        }
      }

      if (!found) {
        // Output is a constrained DOF - resolve to independent DOFs
        const independentMap = new Map<string, DOFInfo>();
        for (const dof of this._independentDofs) {
          independentMap.set(dof.name, dof);
        }
        const resolved = this._resolveDof(
          outputDof,
          independentMap,
          this._eliminatedDofs
        );
        for (const [indDof, coeff] of Object.entries(resolved)) {
          for (let i = 0; i < this._independentDofs.length; i++) {
            if (this._independentDofs[i].name === indDof) {
              tau[i] -= coeff * tLoad;
              break;
            }
          }
        }
      }
    }
  }

  /** Get vehicle velocity from state vector. */
  getVelocity(x: number[]): number {
    if (this.topology.outputComponent === null) {
      return 0;
    }

    const outputComp = this.topology.outputComponent;
    const outputPort = this.topology.outputPort!;
    const outputDof = `${outputComp}.${outputPort}`;

    const speeds = this.getAllSpeeds(x);
    const omega = speeds[outputDof] ?? 0;

    // Convert wheel speed to velocity
    const component = this._components.get(outputComp)!;
    if ('wheelSpeedToVelocity' in component) {
      return (component as any).wheelSpeedToVelocity(omega);
    }

    return omega;
  }

  toString(): string {
    return `Drivetrain(dofs=${this.nMechanicalDofs}, states=${this.nInternalStates}, controls=${this.controlNames.length})`;
  }
}
