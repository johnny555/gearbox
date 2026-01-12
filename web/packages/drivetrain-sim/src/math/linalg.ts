/**
 * Minimal linear algebra utilities for drivetrain simulation.
 */

/**
 * Solve Ax = b using Gaussian elimination with partial pivoting.
 *
 * For small matrices (< 10x10 for drivetrain systems), this is efficient enough.
 *
 * @param A - Coefficient matrix (n x n)
 * @param b - Right-hand side vector (n)
 * @returns Solution vector x (n)
 * @throws Error if matrix is singular
 */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length;

  if (n === 0) {
    return [];
  }

  // Create augmented matrix [A | b]
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let k = 0; k < n; k++) {
    // Find pivot (largest absolute value in column k)
    let maxIdx = k;
    let maxVal = Math.abs(aug[k][k]);

    for (let i = k + 1; i < n; i++) {
      const absVal = Math.abs(aug[i][k]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxIdx = i;
      }
    }

    // Swap rows if needed
    if (maxIdx !== k) {
      [aug[k], aug[maxIdx]] = [aug[maxIdx], aug[k]];
    }

    // Check for singularity
    const pivot = aug[k][k];
    if (Math.abs(pivot) < 1e-15) {
      throw new Error('Singular matrix in solveLinear');
    }

    // Eliminate column k below pivot
    for (let i = k + 1; i < n; i++) {
      const factor = aug[i][k] / pivot;
      for (let j = k; j <= n; j++) {
        aug[i][j] -= factor * aug[k][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
  }

  return x;
}

/**
 * Matrix-vector multiplication: y = A * x
 */
export function matVecMul(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((sum, val, j) => sum + val * x[j], 0));
}

/**
 * Create a zero matrix of size n x m.
 */
export function zeros(n: number, m: number): number[][] {
  return Array.from({ length: n }, () => new Array(m).fill(0));
}

/**
 * Create an identity matrix of size n.
 */
export function eye(n: number): number[][] {
  const I = zeros(n, n);
  for (let i = 0; i < n; i++) {
    I[i][i] = 1;
  }
  return I;
}

/**
 * Add two vectors: c = a + b
 */
export function addVectors(a: number[], b: number[]): number[] {
  return a.map((val, i) => val + b[i]);
}

/**
 * Subtract two vectors: c = a - b
 */
export function subtractVectors(a: number[], b: number[]): number[] {
  return a.map((val, i) => val - b[i]);
}

/**
 * Scale a vector: c = scalar * a
 */
export function scaleVector(scalar: number, a: number[]): number[] {
  return a.map(val => scalar * val);
}

/**
 * Dot product of two vectors.
 */
export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Copy a 2D array (matrix).
 */
export function copyMatrix(A: number[][]): number[][] {
  return A.map(row => [...row]);
}
