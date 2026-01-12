/**
 * Base controller class for drivetrains.
 */

import { Drivetrain } from '../core/drivetrain';

/**
 * Abstract base class for drivetrain controllers.
 *
 * Controllers compute control inputs (torques, gear selections) based
 * on the current state and desired behavior (speed target, power demand, etc.).
 */
export abstract class DrivetrainController {
  readonly drivetrain: Drivetrain;
  protected _targetVelocity: number | null = null;

  constructor(drivetrain: Drivetrain) {
    this.drivetrain = drivetrain;
  }

  /** Target velocity [m/s]. */
  get targetVelocity(): number | null {
    return this._targetVelocity;
  }

  set targetVelocity(value: number | null) {
    this._targetVelocity = value;
  }

  /**
   * Compute control inputs.
   *
   * @param state - Current state {state_name: value}
   * @param grade - Current road grade [fraction]
   * @returns Control inputs {control_name: value}
   *   Typical keys: T_engine, T_MG1, T_MG2, gear_gearbox
   */
  abstract compute(state: Record<string, number>, grade: number): Record<string, number>;

  /**
   * Reset controller state (for stateful controllers).
   */
  reset(): void {
    // Override in subclass if needed
  }

  /**
   * Get current vehicle velocity from state.
   *
   * @param state - Current state dict
   * @returns Velocity [m/s]
   */
  getVelocity(state: Record<string, number>): number {
    const x = this.drivetrain.stateToArray(state);
    return this.drivetrain.getVelocity(x);
  }
}
