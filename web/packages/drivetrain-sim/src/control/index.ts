/**
 * Control module exports.
 */

export { DrivetrainController } from './base';

export { ConventionalDieselController, createShiftSchedule } from './conventional';
export type { GearShiftSchedule } from './conventional';

export { SpeedController } from './speed-controller';
export type { TorqueAllocation } from './speed-controller';
