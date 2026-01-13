/**
 * Simulation module exports.
 */

export type { SimulationConfig } from './config';
export {
  DEFAULT_CONFIG,
  SHORT_SIM,
  MEDIUM_SIM,
  LONG_SIM,
  HIGH_FIDELITY_SIM,
  getNumOutputPoints,
  getOutputTimes,
  createConfig,
} from './config';

export type { SimulationResult } from './result';
export {
  createResult,
  getNumPoints,
  getDuration,
  getAverageDt,
  getState,
  getControl,
  getOutput,
  getVelocity,
  getVelocityKmh,
  getSoc,
  getEnginePower,
  getFuelRate,
  getFuelTotal,
  getFinalState,
  getMax,
  getMin,
  getMean,
  sliceResult,
  resampleResult,
  summarizeResult,
} from './result';

export type { DynamicsFunction, IntegrationResult } from './integrator';
export {
  eulerStep,
  rk4Step,
  rk45Step,
  solveIVP,
  integrateFixed,
} from './integrator';

export type { ControlFunction, GradeFunction } from './simulator';
export {
  DrivetrainSimulator,
  simulate,
} from './simulator';
