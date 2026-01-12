/**
 * Simulation result container.
 */

import { interp } from '../math/interpolate';

/**
 * Container for simulation results.
 *
 * All time series are arrays with length n_time_points.
 */
export interface SimulationResult {
  /** Time points [s] */
  time: number[];
  /** State variables over time {name: array} */
  states: Record<string, number[]>;
  /** Control inputs over time {name: array} */
  controls: Record<string, number[]>;
  /** Derived outputs over time {name: array} */
  outputs: Record<string, number[]>;
  /** Additional simulation metadata */
  metadata: Record<string, unknown>;
}

/**
 * Create an empty simulation result.
 */
export function createResult(): SimulationResult {
  return {
    time: [],
    states: {},
    controls: {},
    outputs: {},
    metadata: {},
  };
}

/**
 * Get number of time points.
 */
export function getNumPoints(result: SimulationResult): number {
  return result.time.length;
}

/**
 * Get simulation duration [s].
 */
export function getDuration(result: SimulationResult): number {
  const n = result.time.length;
  return n > 1 ? result.time[n - 1] - result.time[0] : 0;
}

/**
 * Get average time step [s].
 */
export function getAverageDt(result: SimulationResult): number {
  const n = result.time.length;
  return n > 1 ? getDuration(result) / (n - 1) : 0;
}

/**
 * Get a state variable by name.
 */
export function getState(result: SimulationResult, name: string): number[] | null {
  return result.states[name] ?? null;
}

/**
 * Get a control input by name.
 */
export function getControl(result: SimulationResult, name: string): number[] | null {
  return result.controls[name] ?? null;
}

/**
 * Get a derived output by name.
 */
export function getOutput(result: SimulationResult, name: string): number[] | null {
  return result.outputs[name] ?? null;
}

/**
 * Get vehicle velocity [m/s].
 */
export function getVelocity(result: SimulationResult): number[] | null {
  return result.outputs.velocity ?? null;
}

/**
 * Get vehicle velocity [km/h].
 */
export function getVelocityKmh(result: SimulationResult): number[] | null {
  const v = getVelocity(result);
  return v ? v.map((val) => val * 3.6) : null;
}

/**
 * Get battery state of charge [0-1].
 */
export function getSoc(result: SimulationResult): number[] | null {
  // Look for SOC in states (component.SOC format)
  for (const [name, values] of Object.entries(result.states)) {
    if (name.endsWith('.SOC') || name === 'SOC') {
      return values;
    }
  }
  return null;
}

/**
 * Get engine power [W].
 */
export function getEnginePower(result: SimulationResult): number[] | null {
  return result.outputs.P_engine ?? null;
}

/**
 * Get fuel consumption rate [kg/s].
 */
export function getFuelRate(result: SimulationResult): number[] | null {
  return result.outputs.fuel_rate ?? null;
}

/**
 * Get total fuel consumed [kg] using trapezoidal integration.
 */
export function getFuelTotal(result: SimulationResult): number | null {
  const rate = getFuelRate(result);
  if (!rate || result.time.length < 2) {
    return null;
  }

  // Trapezoidal integration
  let total = 0;
  for (let i = 1; i < result.time.length; i++) {
    const dt = result.time[i] - result.time[i - 1];
    total += 0.5 * (rate[i - 1] + rate[i]) * dt;
  }
  return total;
}

/**
 * Get final values of all states.
 */
export function getFinalState(result: SimulationResult): Record<string, number> {
  const final: Record<string, number> = {};
  for (const [name, values] of Object.entries(result.states)) {
    final[name] = values[values.length - 1];
  }
  return final;
}

/**
 * Get maximum value of a variable.
 */
export function getMax(result: SimulationResult, name: string): number | null {
  for (const source of [result.states, result.controls, result.outputs]) {
    if (name in source) {
      return Math.max(...source[name]);
    }
  }
  return null;
}

/**
 * Get minimum value of a variable.
 */
export function getMin(result: SimulationResult, name: string): number | null {
  for (const source of [result.states, result.controls, result.outputs]) {
    if (name in source) {
      return Math.min(...source[name]);
    }
  }
  return null;
}

/**
 * Get mean value of a variable.
 */
export function getMean(result: SimulationResult, name: string): number | null {
  for (const source of [result.states, result.controls, result.outputs]) {
    if (name in source) {
      const arr = source[name];
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
  }
  return null;
}

/**
 * Extract a time slice of the results.
 */
export function sliceResult(
  result: SimulationResult,
  tStart: number,
  tEnd: number
): SimulationResult {
  const indices: number[] = [];
  for (let i = 0; i < result.time.length; i++) {
    if (result.time[i] >= tStart && result.time[i] <= tEnd) {
      indices.push(i);
    }
  }

  const sliceArray = (arr: number[]) => indices.map((i) => arr[i]);

  return {
    time: sliceArray(result.time),
    states: Object.fromEntries(
      Object.entries(result.states).map(([k, v]) => [k, sliceArray(v)])
    ),
    controls: Object.fromEntries(
      Object.entries(result.controls).map(([k, v]) => [k, sliceArray(v)])
    ),
    outputs: Object.fromEntries(
      Object.entries(result.outputs).map(([k, v]) => [k, sliceArray(v)])
    ),
    metadata: { ...result.metadata },
  };
}

/**
 * Resample results to a new time step.
 */
export function resampleResult(result: SimulationResult, dt: number): SimulationResult {
  const newTime: number[] = [];
  for (let t = result.time[0]; t <= result.time[result.time.length - 1]; t += dt) {
    newTime.push(t);
  }

  const interpArray = (arr: number[]) =>
    newTime.map((t) => interp(t, result.time, arr));

  return {
    time: newTime,
    states: Object.fromEntries(
      Object.entries(result.states).map(([k, v]) => [k, interpArray(v)])
    ),
    controls: Object.fromEntries(
      Object.entries(result.controls).map(([k, v]) => [k, interpArray(v)])
    ),
    outputs: Object.fromEntries(
      Object.entries(result.outputs).map(([k, v]) => [k, interpArray(v)])
    ),
    metadata: { ...result.metadata },
  };
}

/**
 * Generate a text summary of results.
 */
export function summarizeResult(result: SimulationResult): string {
  const lines = [
    'Simulation Results',
    `  Duration: ${getDuration(result).toFixed(1)} s (${getNumPoints(result)} points)`,
    `  States: ${Object.keys(result.states).join(', ')}`,
    `  Controls: ${Object.keys(result.controls).join(', ')}`,
    `  Outputs: ${Object.keys(result.outputs).join(', ')}`,
  ];

  const v = getVelocity(result);
  if (v) {
    const vKmh = v.map((val) => val * 3.6);
    lines.push(
      `  Velocity: ${vKmh[0].toFixed(1)} -> ${vKmh[vKmh.length - 1].toFixed(1)} km/h ` +
        `(max ${Math.max(...vKmh).toFixed(1)} km/h)`
    );
  }

  const soc = getSoc(result);
  if (soc) {
    lines.push(
      `  SOC: ${(soc[0] * 100).toFixed(1)}% -> ${(soc[soc.length - 1] * 100).toFixed(1)}%`
    );
  }

  const fuel = getFuelTotal(result);
  if (fuel !== null) {
    lines.push(`  Fuel consumed: ${fuel.toFixed(2)} kg`);
  }

  return lines.join('\n');
}
