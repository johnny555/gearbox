/**
 * Interpolation utilities for drivetrain simulation.
 */

/**
 * Linear interpolation.
 *
 * @param x - Value to interpolate at
 * @param xp - X coordinates of data points (must be increasing)
 * @param fp - Y coordinates of data points
 * @returns Interpolated value at x
 */
export function interp(x: number, xp: number[], fp: number[]): number {
  if (xp.length !== fp.length || xp.length === 0) {
    throw new Error('xp and fp must have the same non-zero length');
  }

  // Clamp to range
  if (x <= xp[0]) {
    return fp[0];
  }
  if (x >= xp[xp.length - 1]) {
    return fp[fp.length - 1];
  }

  // Find interval
  let i = 0;
  while (i < xp.length - 1 && xp[i + 1] < x) {
    i++;
  }

  // Linear interpolation
  const x0 = xp[i];
  const x1 = xp[i + 1];
  const y0 = fp[i];
  const y1 = fp[i + 1];

  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * Bilinear interpolation for 2D lookup tables.
 *
 * @param x - First coordinate
 * @param y - Second coordinate
 * @param xp - X grid points
 * @param yp - Y grid points
 * @param zp - Z values at grid points (2D array)
 * @returns Interpolated value at (x, y)
 */
export function interp2d(
  x: number,
  y: number,
  xp: number[],
  yp: number[],
  zp: number[][]
): number {
  // Clamp x
  const xClamped = Math.max(xp[0], Math.min(x, xp[xp.length - 1]));
  const yClamped = Math.max(yp[0], Math.min(y, yp[yp.length - 1]));

  // Find x interval
  let i = 0;
  while (i < xp.length - 2 && xp[i + 1] < xClamped) {
    i++;
  }

  // Find y interval
  let j = 0;
  while (j < yp.length - 2 && yp[j + 1] < yClamped) {
    j++;
  }

  // Get corners
  const x0 = xp[i];
  const x1 = xp[i + 1];
  const y0 = yp[j];
  const y1 = yp[j + 1];

  const z00 = zp[j][i];
  const z01 = zp[j][i + 1];
  const z10 = zp[j + 1][i];
  const z11 = zp[j + 1][i + 1];

  // Bilinear interpolation
  const tx = (xClamped - x0) / (x1 - x0);
  const ty = (yClamped - y0) / (y1 - y0);

  const z0 = z00 + tx * (z01 - z00);
  const z1 = z10 + tx * (z11 - z10);

  return z0 + ty * (z1 - z0);
}

/**
 * Find the interval index for a value in a sorted array.
 *
 * @param x - Value to search for
 * @param xp - Sorted array
 * @returns Index i such that xp[i] <= x < xp[i+1], or boundary indices
 */
export function searchSorted(x: number, xp: number[]): number {
  if (x <= xp[0]) return 0;
  if (x >= xp[xp.length - 1]) return xp.length - 2;

  let low = 0;
  let high = xp.length - 1;

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (xp[mid] <= x) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}
