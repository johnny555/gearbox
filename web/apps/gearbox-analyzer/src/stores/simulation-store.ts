
import { create } from "zustand";
import type { PresetName } from "./drivetrain-store";

/**
 * Simulation configuration.
 */
export interface SimConfig {
  tEnd: number; // Duration [s]
  dtOutput: number; // Output step [s]
  targetVelocity: number; // Target speed [m/s]
  grade: number; // Road grade [fraction]
  payloadFraction: number; // Payload [0-1]
}

/**
 * Simulation result data.
 */
export interface SimResult {
  time: number[];
  velocity: number[];
  grade: number[];
  fuelRate?: number[];
  soc?: number[];
  enginePower?: number[];
  motorPower?: number[];
}

/**
 * Labeled simulation result for comparison.
 */
export interface ComparisonResult {
  preset: PresetName;
  label: string;
  color: string;
  result: SimResult;
  rimpullCurves: RimpullCurve[];
}

/**
 * Rimpull data point.
 */
export interface RimpullPoint {
  velocity: number; // [m/s]
  force: number; // [N]
  gear?: number;
}

/**
 * Rimpull curve for a configuration.
 */
export interface RimpullCurve {
  name: string;
  points: RimpullPoint[];
  color: string;
}

/**
 * Operating point for motor/engine curves.
 */
export interface OperatingPoint {
  velocity: number; // Vehicle velocity [m/s]
  rpm: number;      // Component RPM
  torque: number;   // Component torque [N·m]
  power: number;    // Component power [W]
  gear?: number;
}

/**
 * Operating curve for a motor or engine.
 */
export interface OperatingCurve {
  name: string;
  component: "engine" | "mg1" | "mg2";
  gear: string;
  points: OperatingPoint[];
  color: string;
}

type SimStatus = "idle" | "running" | "completed" | "error";

interface SimulationState {
  config: SimConfig;
  status: SimStatus;
  progress: number;
  error: string | null;
  result: SimResult | null;
  rimpullCurves: RimpullCurve[];
  operatingCurves: OperatingCurve[];

  // Comparison mode
  comparisonMode: boolean;
  comparisonResults: ComparisonResult[];
  runningPreset: PresetName | null;

  // Actions
  setConfig: (config: Partial<SimConfig>) => void;
  setStatus: (status: SimStatus) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setResult: (result: SimResult | null) => void;
  setRimpullCurves: (curves: RimpullCurve[]) => void;
  setOperatingCurves: (curves: OperatingCurve[]) => void;
  reset: () => void;

  // Comparison actions
  setComparisonMode: (enabled: boolean) => void;
  addComparisonResult: (result: ComparisonResult) => void;
  clearComparisonResults: () => void;
  setRunningPreset: (preset: PresetName | null) => void;
}

const DEFAULT_CONFIG: SimConfig = {
  tEnd: 60,
  dtOutput: 0.1,
  targetVelocity: 12, // ~43 km/h
  grade: 0.0,
  payloadFraction: 1.0,
};

export const PRESET_COLORS: Record<PresetName, string> = {
  "diesel-793d": "#ef4444",   // Red
  "diesel-789d": "#22c55e",   // Green
  "ecvt-split": "#3b82f6",    // Blue
  "ecvt-detailed": "#8b5cf6", // Purple
};

export const PRESET_LABELS: Record<PresetName, string> = {
  "diesel-793d": "CAT 793D Diesel",
  "diesel-789d": "CAT 789D Diesel",
  "ecvt-split": "eCVT Power-Split",
  "ecvt-detailed": "eCVT Detailed",
};

export const useSimulationStore = create<SimulationState>((set) => ({
  config: DEFAULT_CONFIG,
  status: "idle",
  progress: 0,
  error: null,
  result: null,
  rimpullCurves: [],
  operatingCurves: [],

  // Comparison mode
  comparisonMode: false,
  comparisonResults: [],
  runningPreset: null,

  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  setStatus: (status) => set({ status }),

  setProgress: (progress) => set({ progress }),

  setError: (error) => set({ error, status: error ? "error" : "idle" }),

  setResult: (result) => set({ result, status: result ? "completed" : "idle" }),

  setRimpullCurves: (curves) => set({ rimpullCurves: curves }),

  setOperatingCurves: (curves) => set({ operatingCurves: curves }),

  reset: () =>
    set({
      status: "idle",
      progress: 0,
      error: null,
      result: null,
    }),

  // Comparison actions
  setComparisonMode: (enabled) => set({ comparisonMode: enabled }),

  addComparisonResult: (result) =>
    set((state) => ({
      comparisonResults: [
        ...state.comparisonResults.filter((r) => r.preset !== result.preset),
        result,
      ],
    })),

  clearComparisonResults: () => set({ comparisonResults: [] }),

  setRunningPreset: (preset) => set({ runningPreset: preset }),
}));
