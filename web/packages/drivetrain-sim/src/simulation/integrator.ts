/**
 * ODE integration utilities.
 *
 * Provides simple numerical integrators for drivetrain simulation.
 * For production use with stiff problems, consider using odex.js.
 */

/**
 * Dynamics function signature.
 */
export type DynamicsFunction = (t: number, x: number[]) => number[];

/**
 * Integration result.
 */
export interface IntegrationResult {
  /** Time points */
  t: number[];
  /** State values at each time point (column-major: y[stateIdx][timeIdx]) */
  y: number[][];
  /** Whether integration succeeded */
  success: boolean;
  /** Error message if failed */
  message?: string;
  /** Number of function evaluations */
  nfev: number;
}

/**
 * Simple Euler integration step.
 */
export function eulerStep(
  f: DynamicsFunction,
  t: number,
  x: number[],
  h: number
): number[] {
  const dx = f(t, x);
  return x.map((xi, i) => xi + h * dx[i]);
}

/**
 * Fourth-order Runge-Kutta integration step (RK4).
 */
export function rk4Step(
  f: DynamicsFunction,
  t: number,
  x: number[],
  h: number
): number[] {
  const k1 = f(t, x);
  const k2 = f(t + h / 2, x.map((xi, i) => xi + (h / 2) * k1[i]));
  const k3 = f(t + h / 2, x.map((xi, i) => xi + (h / 2) * k2[i]));
  const k4 = f(t + h, x.map((xi, i) => xi + h * k3[i]));

  return x.map(
    (xi, i) => xi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  );
}

/**
 * Adaptive Runge-Kutta-Fehlberg (RK45) integration step.
 *
 * Returns both the new state and an error estimate.
 */
export function rk45Step(
  f: DynamicsFunction,
  t: number,
  x: number[],
  h: number
): { xNew: number[]; error: number } {
  // Butcher tableau coefficients for RK45
  const k1 = f(t, x);
  const k2 = f(
    t + h / 4,
    x.map((xi, i) => xi + (h / 4) * k1[i])
  );
  const k3 = f(
    t + (3 * h) / 8,
    x.map((xi, i) => xi + (3 * h / 32) * k1[i] + (9 * h / 32) * k2[i])
  );
  const k4 = f(
    t + (12 * h) / 13,
    x.map(
      (xi, i) =>
        xi +
        (1932 * h / 2197) * k1[i] -
        (7200 * h / 2197) * k2[i] +
        (7296 * h / 2197) * k3[i]
    )
  );
  const k5 = f(
    t + h,
    x.map(
      (xi, i) =>
        xi +
        (439 * h / 216) * k1[i] -
        8 * h * k2[i] +
        (3680 * h / 513) * k3[i] -
        (845 * h / 4104) * k4[i]
    )
  );
  const k6 = f(
    t + h / 2,
    x.map(
      (xi, i) =>
        xi -
        (8 * h / 27) * k1[i] +
        2 * h * k2[i] -
        (3544 * h / 2565) * k3[i] +
        (1859 * h / 4104) * k4[i] -
        (11 * h / 40) * k5[i]
    )
  );

  // Fifth-order solution
  const xNew = x.map(
    (xi, i) =>
      xi +
      h *
        ((16 / 135) * k1[i] +
          (6656 / 12825) * k3[i] +
          (28561 / 56430) * k4[i] -
          (9 / 50) * k5[i] +
          (2 / 55) * k6[i])
  );

  // Fourth-order solution for error estimation
  const x4 = x.map(
    (xi, i) =>
      xi +
      h *
        ((25 / 216) * k1[i] +
          (1408 / 2565) * k3[i] +
          (2197 / 4104) * k4[i] -
          (1 / 5) * k5[i])
  );

  // Error estimate (max norm)
  let error = 0;
  for (let i = 0; i < x.length; i++) {
    error = Math.max(error, Math.abs(xNew[i] - x4[i]));
  }

  return { xNew, error };
}

/**
 * Solve ODE initial value problem using RK4.
 *
 * @param f - Dynamics function dx/dt = f(t, x)
 * @param tSpan - [t_start, t_end]
 * @param x0 - Initial state
 * @param options - Integration options
 * @returns Integration result
 */
export function solveIVP(
  f: DynamicsFunction,
  tSpan: [number, number],
  x0: number[],
  options: {
    method?: 'RK4' | 'RK45' | 'Euler';
    tEval?: number[];
    rtol?: number;
    atol?: number;
    maxStep?: number;
  } = {}
): IntegrationResult {
  const { method = 'RK4', tEval, rtol = 1e-6, atol = 1e-8, maxStep = 0.01 } = options;

  const [tStart, tEnd] = tSpan;
  let t = tStart;
  let x = [...x0];
  let nfev = 0;

  // Store results at evaluation points or at step points
  const outputTimes = tEval ?? [];
  const useOutputTimes = outputTimes.length > 0;
  let outputIdx = 0;

  const tResult: number[] = [];
  const yResult: number[][] = x0.map(() => []);

  // Helper to record state
  const recordState = (time: number, state: number[]) => {
    tResult.push(time);
    for (let i = 0; i < state.length; i++) {
      yResult[i].push(state[i]);
    }
  };

  // Record initial state
  if (!useOutputTimes || (outputTimes.length > 0 && outputTimes[0] <= tStart)) {
    recordState(t, x);
    if (useOutputTimes) outputIdx++;
  }

  // Wrapped dynamics that counts evaluations
  const wrappedF: DynamicsFunction = (time, state) => {
    nfev++;
    return f(time, state);
  };

  // Integration loop
  const h = maxStep ?? 0.01;
  let stepFn: (fn: DynamicsFunction, time: number, state: number[], dt: number) => number[];

  switch (method) {
    case 'Euler':
      stepFn = eulerStep;
      break;
    case 'RK45':
    case 'RK4':
    default:
      stepFn = rk4Step;
      break;
  }

  try {
    while (t < tEnd) {
      // Determine step size (don't overshoot tEnd or next output time)
      let dt = h;
      if (t + dt > tEnd) {
        dt = tEnd - t;
      }
      if (useOutputTimes && outputIdx < outputTimes.length && t + dt > outputTimes[outputIdx]) {
        dt = outputTimes[outputIdx] - t;
      }

      // Take a step
      x = stepFn(wrappedF, t, x, dt);
      t += dt;

      // Record at output times
      if (useOutputTimes) {
        while (outputIdx < outputTimes.length && Math.abs(t - outputTimes[outputIdx]) < 1e-12) {
          recordState(t, x);
          outputIdx++;
        }
      } else {
        recordState(t, x);
      }
    }

    return {
      t: tResult,
      y: yResult,
      success: true,
      nfev,
    };
  } catch (error) {
    return {
      t: tResult,
      y: yResult,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      nfev,
    };
  }
}

/**
 * Simple fixed-step integration (no adaptive stepping).
 *
 * Useful for guaranteed output at specific times.
 */
export function integrateFixed(
  f: DynamicsFunction,
  tEval: number[],
  x0: number[],
  method: 'RK4' | 'Euler' = 'RK4'
): IntegrationResult {
  const stepFn = method === 'Euler' ? eulerStep : rk4Step;
  let nfev = 0;

  const wrappedF: DynamicsFunction = (t, x) => {
    nfev++;
    return f(t, x);
  };

  const yResult: number[][] = x0.map(() => []);
  let x = [...x0];

  // Record initial state
  for (let i = 0; i < x.length; i++) {
    yResult[i].push(x[i]);
  }

  try {
    for (let k = 1; k < tEval.length; k++) {
      const dt = tEval[k] - tEval[k - 1];
      x = stepFn(wrappedF, tEval[k - 1], x, dt);

      for (let i = 0; i < x.length; i++) {
        yResult[i].push(x[i]);
      }
    }

    return {
      t: tEval,
      y: yResult,
      success: true,
      nfev,
    };
  } catch (error) {
    return {
      t: tEval,
      y: yResult,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      nfev,
    };
  }
}
