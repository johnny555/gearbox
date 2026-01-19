/**
 * Control module exports.
 */

export { DrivetrainController } from './base';

export { ConventionalDieselController, createShiftSchedule } from './conventional';
// Renamed to SimpleGearShiftSchedule to avoid conflict with class-based GearShiftSchedule
export type { GearShiftSchedule as SimpleGearShiftSchedule } from './conventional';

export { SpeedController } from './speed-controller';
export type { TorqueAllocation } from './speed-controller';

// New configurable shift controller system
export {
  GearShiftSchedule,
  GearShiftController,
  MultiGearboxController,
} from './shift-controller';
export type {
  SpeedSource,
  SpeedUnit,
  LoadBasedHold,
  GearShiftScheduleConfig,
} from './shift-controller';
