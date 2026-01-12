/**
 * Drivetrain simulator with ODE integration.
 */

import { Drivetrain } from '../core/drivetrain';
import { interp } from '../math/interpolate';
import {
  SimulationConfig,
  DEFAULT_CONFIG,
  getOutputTimes,
} from './config';
import { SimulationResult, createResult } from './result';
import { solveIVP, integrateFixed } from './integrator';

/**
 * Control function type.
 * Takes time, state dict, and grade, returns control dict.
 */
export type ControlFunction = (
  t: number,
  state: Record<string, number>,
  grade: number
) => Record<string, number>;

/**
 * Grade function type.
 * Takes time, returns grade (fraction, e.g., 0.05 for 5%).
 */
export type GradeFunction = (t: number) => number;

/**
 * Drivetrain controller interface.
 */
export interface DrivetrainController {
  compute(state: Record<string, number>, grade: number): Record<string, number>;
}

/**
 * Simulator for any drivetrain topology.
 *
 * Wraps the Drivetrain dynamics with ODE integration and result processing.
 */
export class DrivetrainSimulator {
  readonly drivetrain: Drivetrain;
  private _controlLog: Array<[number, Record<string, number>]> = [];
  private _gradeLog: Array<[number, number]> = [];

  constructor(drivetrain: Drivetrain) {
    this.drivetrain = drivetrain;
  }

  /**
   * Run a time-domain simulation.
   *
   * @param x0 - Initial state {state_name: value}
   * @param controller - Control function or controller object
   * @param gradeProfile - Road grade as constant or function of time
   * @param config - Simulation configuration
   * @returns SimulationResult with all time series data
   */
  simulate(
    x0: Record<string, number>,
    controller: ControlFunction | DrivetrainController,
    gradeProfile: number | GradeFunction = 0.0,
    config: SimulationConfig = DEFAULT_CONFIG
  ): SimulationResult {
    this._controlLog = [];
    this._gradeLog = [];

    // Convert initial state to array
    const x0Arr = this.drivetrain.stateToArray(x0);

    // Wrap grade profile as function
    const gradeFn: GradeFunction =
      typeof gradeProfile === 'function'
        ? gradeProfile
        : () => gradeProfile as number;

    // Wrap controller
    const controlFn: ControlFunction =
      'compute' in controller
        ? (t, state, grade) => (controller as DrivetrainController).compute(state, grade)
        : (controller as ControlFunction);

    // Define dynamics wrapper for ODE solver
    const dynamicsWrapper = (t: number, x: number[]): number[] => {
      // Get current state as dict
      const state = this.drivetrain.arrayToState(x);

      // Get grade
      const grade = gradeFn(t);

      // Get control inputs
      const control = controlFn(t, state, grade);

      // Log for post-processing
      this._controlLog.push([t, { ...control }]);
      this._gradeLog.push([t, grade]);

      // Compute dynamics
      return this.drivetrain.dynamics(t, x, control, { grade });
    };

    // Set up output time points
    const tEval = getOutputTimes(config);

    // Run ODE integration with proper sub-stepping
    const sol = solveIVP(
      dynamicsWrapper,
      [config.tStart, config.tEnd],
      x0Arr,
      {
        method: config.method === 'RK45' ? 'RK45' : 'RK4',
        tEval,
        rtol: config.rtol,
        atol: config.atol,
        maxStep: config.maxStep ?? 0.005, // 5ms default for accuracy
      }
    );

    if (!sol.success) {
      throw new Error(`ODE integration failed: ${sol.message}`);
    }

    // Build result
    return this._buildResult(sol, config);
  }

  /**
   * Run simulation with progress callback (for UI updates).
   * Uses internal sub-stepping for accuracy (similar to scipy's adaptive stepping).
   */
  async simulateWithProgress(
    x0: Record<string, number>,
    controller: ControlFunction | DrivetrainController,
    gradeProfile: number | GradeFunction = 0.0,
    config: SimulationConfig = DEFAULT_CONFIG,
    onProgress?: (progress: number) => void
  ): Promise<SimulationResult> {
    this._controlLog = [];
    this._gradeLog = [];

    const x0Arr = this.drivetrain.stateToArray(x0);

    const gradeFn: GradeFunction =
      typeof gradeProfile === 'function'
        ? gradeProfile
        : () => gradeProfile as number;

    const controlFn: ControlFunction =
      'compute' in controller
        ? (t, state, grade) => (controller as DrivetrainController).compute(state, grade)
        : (controller as ControlFunction);

    const tEval = getOutputTimes(config);
    const totalSteps = tEval.length - 1;

    // Internal step size for accuracy (similar to scipy's adaptive stepping)
    const maxStep = config.maxStep ?? 0.005; // 5ms default for good accuracy

    // Manual integration with progress updates
    const yResult: number[][] = x0Arr.map(() => []);
    let x = [...x0Arr];
    let nfev = 0;

    // Record initial state
    for (let i = 0; i < x.length; i++) {
      yResult[i].push(x[i]);
    }

    // Helper for a single RK4 step
    const rk4Step = (t: number, state: number[], h: number, ctrl: Record<string, number>, grade: number): number[] => {
      const k1 = this.drivetrain.dynamics(t, state, ctrl, { grade });
      nfev++;
      const k2 = this.drivetrain.dynamics(
        t + h / 2,
        state.map((xi, i) => xi + (h / 2) * k1[i]),
        ctrl,
        { grade }
      );
      nfev++;
      const k3 = this.drivetrain.dynamics(
        t + h / 2,
        state.map((xi, i) => xi + (h / 2) * k2[i]),
        ctrl,
        { grade }
      );
      nfev++;
      const k4 = this.drivetrain.dynamics(
        t + h,
        state.map((xi, i) => xi + h * k3[i]),
        ctrl,
        { grade }
      );
      nfev++;

      return state.map(
        (xi, i) => xi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
      );
    };

    for (let k = 1; k < tEval.length; k++) {
      const tStart = tEval[k - 1];
      const tEnd = tEval[k];

      // Sub-step through this interval for accuracy
      let t = tStart;
      while (t < tEnd - 1e-12) {
        // Determine step size (don't overshoot)
        const h = Math.min(maxStep, tEnd - t);

        // Get current state dict and control at this sub-step time
        const stateDict = this.drivetrain.arrayToState(x);
        const grade = gradeFn(t);
        const control = controlFn(t, stateDict, grade);

        // Only log at output interval boundaries (not every sub-step)
        if (Math.abs(t - tStart) < 1e-12) {
          this._controlLog.push([t, { ...control }]);
          this._gradeLog.push([t, grade]);
        }

        // RK4 step
        x = rk4Step(t, x, h, control, grade);
        t += h;
      }

      // Record state at output time
      for (let i = 0; i < x.length; i++) {
        yResult[i].push(x[i]);
      }

      // Report progress
      if (onProgress && k % 10 === 0) {
        onProgress(k / totalSteps);
        // Yield to allow UI updates
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (onProgress) {
      onProgress(1);
    }

    const sol = {
      t: tEval,
      y: yResult,
      success: true,
      nfev,
    };

    return this._buildResult(sol, config);
  }

  private _buildResult(
    sol: { t: number[]; y: number[][]; nfev: number },
    config: SimulationConfig
  ): SimulationResult {
    const time = sol.t;
    const nPoints = time.length;

    // Extract states
    const states: Record<string, number[]> = {};
    for (let i = 0; i < this.drivetrain.stateNames.length; i++) {
      states[this.drivetrain.stateNames[i]] = sol.y[i];
    }

    // Interpolate control log to output times
    const controls = this._interpolateControls(time);

    // Compute derived outputs
    const outputs = this._computeOutputs(time, sol.y, controls);

    // Metadata
    const metadata = {
      solver_method: config.method,
      n_function_evals: sol.nfev,
      drivetrain_type: 'Drivetrain',
      components: Array.from(this.drivetrain.topology.components.keys()),
    };

    return {
      time,
      states,
      controls,
      outputs,
      metadata,
    };
  }

  private _interpolateControls(time: number[]): Record<string, number[]> {
    if (this._controlLog.length === 0) {
      return {};
    }

    // Get all control keys
    const allKeys = new Set<string>();
    for (const [, ctrl] of this._controlLog) {
      for (const key of Object.keys(ctrl)) {
        allKeys.add(key);
      }
    }

    // Build time series for each control
    const logTimes = this._controlLog.map(([t]) => t);
    const controls: Record<string, number[]> = {};

    for (const key of allKeys) {
      const values = this._controlLog.map(([, ctrl]) => ctrl[key] ?? 0);
      controls[key] = time.map((t) => interp(t, logTimes, values));
    }

    return controls;
  }

  private _computeOutputs(
    time: number[],
    y: number[][],
    controls: Record<string, number[]>
  ): Record<string, number[]> {
    const outputs: Record<string, number[]> = {};
    const nPoints = time.length;

    // Velocity
    const velocities: number[] = [];
    for (let i = 0; i < nPoints; i++) {
      const state = y.map((arr) => arr[i]);
      velocities.push(this.drivetrain.getVelocity(state));
    }
    outputs.velocity = velocities;

    // Grade (from log)
    if (this._gradeLog.length > 0) {
      const logTimes = this._gradeLog.map(([t]) => t);
      const grades = this._gradeLog.map(([, g]) => g);
      outputs.grade = time.map((t) => interp(t, logTimes, grades));
    }

    // Power calculations
    Object.assign(outputs, this._computePowerOutputs(time, y, controls));

    return outputs;
  }

  private _computePowerOutputs(
    time: number[],
    y: number[][],
    controls: Record<string, number[]>
  ): Record<string, number[]> {
    const outputs: Record<string, number[]> = {};
    const nPoints = time.length;
    const components = this.drivetrain.topology.components;

    // Engine power
    for (const [compName, component] of components) {
      if (component.constructor.name.includes('Engine')) {
        const tKey = `T_${compName}`;
        if (tKey in controls) {
          const speedKey = `${compName}.shaft`;
          const omega: number[] = [];

          for (let i = 0; i < nPoints; i++) {
            const state = y.map((arr) => arr[i]);
            const allSpeeds = this.drivetrain.getAllSpeeds(state);
            omega.push(allSpeeds[speedKey] ?? 0);
          }

          const torque = controls[tKey];
          const power = torque.map((t, i) => t * omega[i]);
          outputs[`P_${compName}`] = power;

          // Fuel rate
          if ('getFuelRate' in component) {
            const fuelRate: number[] = [];
            for (let i = 0; i < nPoints; i++) {
              fuelRate.push((component as any).getFuelRate(torque[i], omega[i]));
            }
            outputs.fuel_rate = fuelRate;
          }
        }
      }
    }

    // Motor power
    for (const [compName, component] of components) {
      if (component.constructor.name.includes('Motor')) {
        const tKey = `T_${compName}`;
        if (tKey in controls) {
          const speedKey = `${compName}.shaft`;
          const omega: number[] = [];

          for (let i = 0; i < nPoints; i++) {
            const state = y.map((arr) => arr[i]);
            const allSpeeds = this.drivetrain.getAllSpeeds(state);
            omega.push(allSpeeds[speedKey] ?? 0);
          }

          const torque = controls[tKey];
          const pMech = torque.map((t, i) => t * omega[i]);
          outputs[`P_${compName}_mech`] = pMech;

          // Electrical power
          if ('getElectricalPower' in component) {
            const pElec: number[] = [];
            for (let i = 0; i < nPoints; i++) {
              pElec.push((component as any).getElectricalPower(torque[i], omega[i]));
            }
            outputs[`P_${compName}_elec`] = pElec;
          }
        }
      }
    }

    return outputs;
  }
}

/**
 * Convenience function to run a simulation.
 */
export function simulate(
  drivetrain: Drivetrain,
  x0: Record<string, number>,
  controller: ControlFunction | DrivetrainController,
  gradeProfile: number | GradeFunction = 0.0,
  config: SimulationConfig = DEFAULT_CONFIG
): SimulationResult {
  const simulator = new DrivetrainSimulator(drivetrain);
  return simulator.simulate(x0, controller, gradeProfile, config);
}
