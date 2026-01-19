/**
 * Load gearbox configurations from shared JSON config files.
 *
 * This module provides functions to load gearbox and shift schedule configurations
 * from the shared JSON format that's compatible with both Python and TypeScript.
 */

import {
  NSpeedGearboxComponent,
  GearboxParams,
} from '../components/gearbox';
import {
  GearShiftSchedule,
  GearShiftScheduleConfig,
  GearShiftController,
  MultiGearboxController,
  SpeedSource,
  SpeedUnit,
} from '../control/shift-controller';

/**
 * Gearbox definition from config file.
 */
export interface GearboxConfig {
  name?: string;
  ratios: number[];
  efficiencies?: number[];
  j_input?: number;
  j_output?: number;
  shift_time?: number;
  gear_names?: string[];
}

/**
 * Shift schedule definition from config file.
 */
export interface ShiftScheduleConfig {
  gearbox_id: string;
  speed_source?: SpeedSource;
  speed_unit?: SpeedUnit;
  upshift_speeds: number[];
  downshift_speeds: number[];
  min_gear?: number;
  max_gear?: number;
  shift_delay?: number;
  load_based_hold?: {
    enabled?: boolean;
    load_threshold?: number;
    speed_threshold?: number;
  };
}

/**
 * Gearbox chain item in drivetrain config.
 */
export interface GearboxChainItem {
  gearbox_id: string;
  shift_schedule_id?: string;
  position?: 'input' | 'intermediate' | 'output';
}

/**
 * Drivetrain configuration from config file.
 */
export interface DrivetrainConfig {
  name?: string;
  description?: string;
  gearbox_chain?: GearboxChainItem[];
  final_drive_ratio?: number;
  wheel_radius?: number;
}

/**
 * Complete configuration file structure.
 */
export interface GearboxConfigFile {
  version: string;
  gearboxes: Record<string, GearboxConfig>;
  shift_schedules: Record<string, ShiftScheduleConfig>;
  drivetrain_configs: Record<string, DrivetrainConfig>;
}

/**
 * Create GearboxParams from config object.
 */
export function createGearboxParams(config: GearboxConfig): GearboxParams {
  const ratios = config.ratios;
  const efficiencies = config.efficiencies ?? ratios.map(() => 0.97);

  return {
    ratios,
    efficiencies,
    jInput: config.j_input ?? 5.0,
    jOutput: config.j_output ?? 5.0,
    shiftTime: config.shift_time ?? 0.5,
  };
}

/**
 * Create a gearbox component from config.
 */
export function createGearbox(
  gearboxId: string,
  config: GearboxConfigFile
): NSpeedGearboxComponent {
  const gearboxConfig = config.gearboxes[gearboxId];
  if (!gearboxConfig) {
    throw new Error(`Gearbox '${gearboxId}' not found in config`);
  }

  const params = createGearboxParams(gearboxConfig);
  return new NSpeedGearboxComponent(params, gearboxId);
}

/**
 * Create a GearShiftSchedule from config file.
 */
export function createShiftScheduleFromConfig(
  scheduleId: string,
  config: GearboxConfigFile
): GearShiftSchedule {
  const scheduleConfig = config.shift_schedules[scheduleId];
  if (!scheduleConfig) {
    throw new Error(`Shift schedule '${scheduleId}' not found in config`);
  }

  const gearboxId = scheduleConfig.gearbox_id;
  const gearboxConfig = config.gearboxes[gearboxId];
  if (!gearboxConfig) {
    throw new Error(`Gearbox '${gearboxId}' referenced by schedule '${scheduleId}' not found`);
  }

  const nGears = gearboxConfig.ratios.length;

  const scheduleParams: GearShiftScheduleConfig = {
    gearboxId,
    nGears,
    upshiftSpeeds: scheduleConfig.upshift_speeds,
    downshiftSpeeds: scheduleConfig.downshift_speeds,
    speedSource: scheduleConfig.speed_source,
    speedUnit: scheduleConfig.speed_unit,
    minGear: scheduleConfig.min_gear,
    maxGear: scheduleConfig.max_gear,
    shiftDelay: scheduleConfig.shift_delay,
    loadBasedHold: scheduleConfig.load_based_hold ? {
      enabled: scheduleConfig.load_based_hold.enabled,
      loadThreshold: scheduleConfig.load_based_hold.load_threshold,
      speedThreshold: scheduleConfig.load_based_hold.speed_threshold,
    } : undefined,
  };

  return new GearShiftSchedule(scheduleParams);
}

/**
 * Create a GearShiftController from config.
 */
export function createShiftController(
  scheduleId: string,
  config: GearboxConfigFile,
  initialGear: number = 0
): GearShiftController {
  const schedule = createShiftScheduleFromConfig(scheduleId, config);
  return new GearShiftController(schedule, initialGear);
}

/**
 * Result of creating drivetrain gearboxes.
 */
export interface DrivetrainGearboxes {
  gearboxes: NSpeedGearboxComponent[];
  controller: MultiGearboxController;
}

/**
 * Create all gearboxes and controllers for a drivetrain configuration.
 */
export function createDrivetrainGearboxes(
  drivetrainId: string,
  config: GearboxConfigFile
): DrivetrainGearboxes {
  const dtConfig = config.drivetrain_configs[drivetrainId];
  if (!dtConfig) {
    throw new Error(`Drivetrain config '${drivetrainId}' not found`);
  }

  const gearboxChain = dtConfig.gearbox_chain ?? [];
  const gearboxes: NSpeedGearboxComponent[] = [];
  const controllers: Record<string, GearShiftController> = {};

  for (const item of gearboxChain) {
    const gearbox = createGearbox(item.gearbox_id, config);
    gearboxes.push(gearbox);

    // Create controller if shift schedule is specified
    if (item.shift_schedule_id) {
      const controller = createShiftController(item.shift_schedule_id, config);
      controllers[item.gearbox_id] = controller;
    }
  }

  const wheelRadius = dtConfig.wheel_radius ?? 1.0;
  const finalDriveRatio = dtConfig.final_drive_ratio ?? 1.0;

  const multiController = new MultiGearboxController(
    controllers,
    wheelRadius,
    finalDriveRatio
  );

  return { gearboxes, controller: multiController };
}

/**
 * List all available gearbox IDs in config.
 */
export function listAvailableGearboxes(config: GearboxConfigFile): string[] {
  return Object.keys(config.gearboxes ?? {});
}

/**
 * List all available shift schedule IDs in config.
 */
export function listAvailableSchedules(config: GearboxConfigFile): string[] {
  return Object.keys(config.shift_schedules ?? {});
}

/**
 * List all available drivetrain configuration IDs in config.
 */
export function listAvailableDrivetrains(config: GearboxConfigFile): string[] {
  return Object.keys(config.drivetrain_configs ?? {});
}

/**
 * Get detailed information about a gearbox configuration.
 */
export function getGearboxInfo(
  gearboxId: string,
  config: GearboxConfigFile
): {
  id: string;
  name: string;
  nGears: number;
  ratios: number[];
  gearNames: string[];
  efficiencies: number[];
  jInput: number;
  jOutput: number;
} {
  const gb = config.gearboxes[gearboxId];
  if (!gb) {
    throw new Error(`Gearbox '${gearboxId}' not found`);
  }

  const ratios = gb.ratios;
  return {
    id: gearboxId,
    name: gb.name ?? gearboxId,
    nGears: ratios.length,
    ratios,
    gearNames: gb.gear_names ?? ratios.map((_, i) => `Gear ${i}`),
    efficiencies: gb.efficiencies ?? ratios.map(() => 0.97),
    jInput: gb.j_input ?? 5.0,
    jOutput: gb.j_output ?? 5.0,
  };
}

/**
 * Get detailed information about a shift schedule.
 */
export function getScheduleInfo(
  scheduleId: string,
  config: GearboxConfigFile
): {
  id: string;
  gearboxId: string;
  gearboxName: string;
  nGears: number;
  speedUnit: string;
  upshiftSpeeds: number[];
  downshiftSpeeds: number[];
  shiftDelay: number;
  loadBasedHold: { enabled: boolean };
} {
  const sched = config.shift_schedules[scheduleId];
  if (!sched) {
    throw new Error(`Schedule '${scheduleId}' not found`);
  }

  const gearboxId = sched.gearbox_id;
  const gb = config.gearboxes[gearboxId];
  if (!gb) {
    throw new Error(`Gearbox '${gearboxId}' referenced by schedule not found`);
  }

  return {
    id: scheduleId,
    gearboxId,
    gearboxName: gb.name ?? gearboxId,
    nGears: gb.ratios.length,
    speedUnit: sched.speed_unit ?? 'm/s',
    upshiftSpeeds: sched.upshift_speeds,
    downshiftSpeeds: sched.downshift_speeds,
    shiftDelay: sched.shift_delay ?? 0.5,
    loadBasedHold: { enabled: sched.load_based_hold?.enabled ?? false },
  };
}
