/**
 * Automatic gear shift controller based on vehicle speed and load.
 *
 * This module provides:
 * - GearShiftSchedule: Defines when to shift gears
 * - GearShiftController: Controls gear selection for one or more gearboxes
 * - MultiGearboxController: Coordinates multiple gearboxes in a drivetrain
 */

/**
 * Source of speed for shift decisions.
 */
export type SpeedSource = 'vehicle' | 'output_shaft' | 'input_shaft';

/**
 * Unit for speed thresholds.
 */
export type SpeedUnit = 'm/s' | 'km/h' | 'mph' | 'rad/s';

/**
 * Configuration for load-based gear hold.
 */
export interface LoadBasedHold {
  /** Enable load-based gear hold */
  enabled: boolean;
  /** Throttle/load fraction to prevent upshift */
  loadThreshold: number;
  /** Speed below which load-hold is active */
  speedThreshold: number;
}

/**
 * Gear shift schedule configuration.
 */
export interface GearShiftScheduleConfig {
  /** Reference to gearbox this schedule controls */
  gearboxId: string;
  /** Number of gears in the gearbox */
  nGears: number;
  /** Speed thresholds to upshift (n-1 values) */
  upshiftSpeeds: number[];
  /** Speed thresholds to downshift (n-1 values) */
  downshiftSpeeds: number[];
  /** What speed to use for shift decisions */
  speedSource?: SpeedSource;
  /** Unit for speed thresholds */
  speedUnit?: SpeedUnit;
  /** Minimum allowed gear index */
  minGear?: number;
  /** Maximum allowed gear index */
  maxGear?: number;
  /** Minimum time between shifts [s] */
  shiftDelay?: number;
  /** Configuration for load-based gear hold */
  loadBasedHold?: Partial<LoadBasedHold>;
}

/**
 * Defines when to shift gears based on speed thresholds.
 */
export class GearShiftSchedule {
  readonly gearboxId: string;
  readonly nGears: number;
  readonly upshiftSpeeds: number[];
  readonly downshiftSpeeds: number[];
  readonly speedSource: SpeedSource;
  readonly speedUnit: SpeedUnit;
  readonly minGear: number;
  readonly maxGear: number;
  readonly shiftDelay: number;
  readonly loadBasedHold: LoadBasedHold;

  constructor(config: GearShiftScheduleConfig) {
    this.gearboxId = config.gearboxId;
    this.nGears = config.nGears;
    this.upshiftSpeeds = config.upshiftSpeeds;
    this.downshiftSpeeds = config.downshiftSpeeds;
    this.speedSource = config.speedSource ?? 'vehicle';
    this.speedUnit = config.speedUnit ?? 'm/s';
    this.minGear = config.minGear ?? 0;
    this.maxGear = config.maxGear ?? this.nGears - 1;
    this.shiftDelay = config.shiftDelay ?? 0.5;
    this.loadBasedHold = {
      enabled: config.loadBasedHold?.enabled ?? false,
      loadThreshold: config.loadBasedHold?.loadThreshold ?? 0.8,
      speedThreshold: config.loadBasedHold?.speedThreshold ?? 15.0,
    };

    // Validate arrays have correct length
    const expectedLen = this.nGears - 1;
    if (this.upshiftSpeeds.length !== expectedLen) {
      throw new Error(
        `upshiftSpeeds must have ${expectedLen} values for ${this.nGears} gears, ` +
        `got ${this.upshiftSpeeds.length}`
      );
    }
    if (this.downshiftSpeeds.length !== expectedLen) {
      throw new Error(
        `downshiftSpeeds must have ${expectedLen} values for ${this.nGears} gears, ` +
        `got ${this.downshiftSpeeds.length}`
      );
    }
  }

  /**
   * Convert speed from schedule units to m/s.
   */
  convertSpeedToMs(speed: number): number {
    switch (this.speedUnit) {
      case 'm/s':
        return speed;
      case 'km/h':
        return speed / 3.6;
      case 'mph':
        return speed * 0.44704;
      case 'rad/s':
        return speed; // Assume wheel radius = 1 for angular velocity
      default:
        return speed;
    }
  }

  /**
   * Determine target gear based on current speed and load.
   *
   * @param currentGear - Current gear index (0-based)
   * @param speedMs - Current speed in m/s
   * @param loadFraction - Current load/throttle fraction [0-1]
   * @returns Target gear index
   */
  getTargetGear(currentGear: number, speedMs: number, loadFraction: number = 0.0): number {
    let target = currentGear;

    // Convert thresholds to m/s for comparison
    const upshiftMs = this.upshiftSpeeds.map(s => this.convertSpeedToMs(s));
    const downshiftMs = this.downshiftSpeeds.map(s => this.convertSpeedToMs(s));

    // Check for upshift
    if (currentGear < this.maxGear) {
      const thresholdIdx = currentGear;
      if (thresholdIdx < upshiftMs.length) {
        const upshiftThreshold = upshiftMs[thresholdIdx];

        // Check load-based hold
        let shouldHold = false;
        if (this.loadBasedHold.enabled) {
          const loadSpeedThreshold = this.convertSpeedToMs(this.loadBasedHold.speedThreshold);
          if (
            loadFraction >= this.loadBasedHold.loadThreshold &&
            speedMs < loadSpeedThreshold
          ) {
            shouldHold = true;
          }
        }

        if (speedMs > upshiftThreshold && !shouldHold) {
          target = currentGear + 1;
        }
      }
    }

    // Check for downshift (takes priority over upshift)
    if (currentGear > this.minGear) {
      const thresholdIdx = currentGear - 1;
      if (thresholdIdx >= 0 && thresholdIdx < downshiftMs.length) {
        const downshiftThreshold = downshiftMs[thresholdIdx];
        if (speedMs < downshiftThreshold) {
          target = currentGear - 1;
        }
      }
    }

    // Clamp to allowed range
    return Math.max(this.minGear, Math.min(target, this.maxGear));
  }
}

/**
 * Controls automatic gear selection for a single gearbox.
 */
export class GearShiftController {
  readonly schedule: GearShiftSchedule;
  private _currentGear: number;
  private _lastShiftTime: number = -Infinity;

  constructor(schedule: GearShiftSchedule, initialGear: number = 0) {
    this.schedule = schedule;
    this._currentGear = initialGear;
  }

  get currentGear(): number {
    return this._currentGear;
  }

  set currentGear(value: number) {
    this._currentGear = Math.max(
      this.schedule.minGear,
      Math.min(value, this.schedule.maxGear)
    );
  }

  get gearboxId(): string {
    return this.schedule.gearboxId;
  }

  /**
   * Update gear selection based on current conditions.
   *
   * @param time - Current simulation time [s]
   * @param speedMs - Current speed in m/s
   * @param loadFraction - Current load/throttle fraction [0-1]
   * @returns Object with currentGear and shiftOccurred
   */
  update(
    time: number,
    speedMs: number,
    loadFraction: number = 0.0
  ): { currentGear: number; shiftOccurred: boolean } {
    // Check shift lockout
    const timeSinceShift = time - this._lastShiftTime;
    if (timeSinceShift < this.schedule.shiftDelay) {
      return { currentGear: this._currentGear, shiftOccurred: false };
    }

    // Get target gear from schedule
    const targetGear = this.schedule.getTargetGear(
      this._currentGear,
      speedMs,
      loadFraction
    );

    // Check if shift needed
    if (targetGear !== this._currentGear) {
      this._currentGear = targetGear;
      this._lastShiftTime = time;
      return { currentGear: this._currentGear, shiftOccurred: true };
    }

    return { currentGear: this._currentGear, shiftOccurred: false };
  }

  /**
   * Force a specific gear (manual override).
   */
  forceGear(gear: number, time: number): void {
    this._currentGear = Math.max(
      this.schedule.minGear,
      Math.min(gear, this.schedule.maxGear)
    );
    this._lastShiftTime = time;
  }

  /**
   * Reset controller to initial state.
   */
  reset(initialGear: number = 0): void {
    this._currentGear = initialGear;
    this._lastShiftTime = -Infinity;
  }
}

/**
 * Coordinates gear selection across multiple gearboxes.
 */
export class MultiGearboxController {
  readonly controllers: Map<string, GearShiftController>;
  readonly wheelRadius: number;
  readonly finalDriveRatio: number;

  constructor(
    controllers: Map<string, GearShiftController> | Record<string, GearShiftController>,
    wheelRadius: number = 1.0,
    finalDriveRatio: number = 1.0
  ) {
    this.controllers = controllers instanceof Map
      ? controllers
      : new Map(Object.entries(controllers));
    this.wheelRadius = wheelRadius;
    this.finalDriveRatio = finalDriveRatio;
  }

  /**
   * Get controller for specific gearbox.
   */
  getController(gearboxId: string): GearShiftController | undefined {
    return this.controllers.get(gearboxId);
  }

  /**
   * Get current gear for all gearboxes.
   */
  getAllGears(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [gearboxId, ctrl] of this.controllers) {
      result[gearboxId] = ctrl.currentGear;
    }
    return result;
  }

  /**
   * Update all gearbox controllers.
   *
   * @returns Object mapping gearbox_id to {currentGear, shiftOccurred}
   */
  updateAll(
    time: number,
    speedMs: number,
    loadFraction: number = 0.0
  ): Record<string, { currentGear: number; shiftOccurred: boolean }> {
    const results: Record<string, { currentGear: number; shiftOccurred: boolean }> = {};
    for (const [gearboxId, ctrl] of this.controllers) {
      results[gearboxId] = ctrl.update(time, speedMs, loadFraction);
    }
    return results;
  }

  /**
   * Convert wheel angular velocity to vehicle speed.
   */
  wheelSpeedToVehicleSpeed(omegaWheel: number): number {
    return omegaWheel * this.wheelRadius;
  }

  /**
   * Convert vehicle speed to wheel angular velocity.
   */
  vehicleSpeedToWheelSpeed(vVehicle: number): number {
    return vVehicle / this.wheelRadius;
  }

  /**
   * Reset all controllers.
   */
  resetAll(initialGears?: Record<string, number>): void {
    for (const [gearboxId, ctrl] of this.controllers) {
      ctrl.reset(initialGears?.[gearboxId] ?? 0);
    }
  }
}
