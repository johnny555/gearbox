/**
 * Simulation configuration.
 */

/**
 * Configuration for drivetrain simulation.
 */
export interface SimulationConfig {
  /** Start time [s] */
  tStart: number;
  /** End time [s] */
  tEnd: number;
  /** Output time step [s] */
  dtOutput: number;
  /** ODE solver method */
  method: 'RK4' | 'RK45' | 'Euler';
  /** Relative tolerance for ODE solver */
  rtol: number;
  /** Absolute tolerance for ODE solver */
  atol: number;
  /** Maximum step size for ODE solver [s] */
  maxStep: number | null;
}

/** Default simulation configuration */
export const DEFAULT_CONFIG: SimulationConfig = {
  tStart: 0.0,
  tEnd: 60.0,
  dtOutput: 0.1,
  method: 'RK4',
  rtol: 1e-6,
  atol: 1e-8,
  maxStep: 0.01,
};

/** Short simulation profile */
export const SHORT_SIM: SimulationConfig = {
  ...DEFAULT_CONFIG,
  tEnd: 10.0,
  dtOutput: 0.05,
};

/** Medium simulation profile */
export const MEDIUM_SIM: SimulationConfig = {
  ...DEFAULT_CONFIG,
  tEnd: 60.0,
  dtOutput: 0.1,
};

/** Long simulation profile */
export const LONG_SIM: SimulationConfig = {
  ...DEFAULT_CONFIG,
  tEnd: 300.0,
  dtOutput: 0.5,
};

/** High fidelity simulation profile */
export const HIGH_FIDELITY_SIM: SimulationConfig = {
  ...DEFAULT_CONFIG,
  tEnd: 60.0,
  dtOutput: 0.01,
  rtol: 1e-8,
  atol: 1e-11,
};

/**
 * Get number of output points for a config.
 */
export function getNumOutputPoints(config: SimulationConfig): number {
  return Math.floor((config.tEnd - config.tStart) / config.dtOutput) + 1;
}

/**
 * Get array of output time points for a config.
 */
export function getOutputTimes(config: SimulationConfig): number[] {
  const n = getNumOutputPoints(config);
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    times.push(config.tStart + i * config.dtOutput);
  }
  return times;
}

/**
 * Create a custom simulation config.
 */
export function createConfig(options: Partial<SimulationConfig> = {}): SimulationConfig {
  const config = { ...DEFAULT_CONFIG, ...options };

  if (config.tEnd <= config.tStart) {
    throw new Error('tEnd must be greater than tStart');
  }
  if (config.dtOutput <= 0) {
    throw new Error('dtOutput must be positive');
  }

  return config;
}
