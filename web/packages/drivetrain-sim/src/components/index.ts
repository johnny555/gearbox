/**
 * Component exports.
 */

export { EngineComponent, CAT_3516E_PARAMS } from './engine';
export type { EngineParams } from './engine';

export { MotorComponent, MG1_PARAMS, MG2_PARAMS, createMG1, createMG2 } from './motor';
export type { MotorParams } from './motor';

export {
  NSpeedGearboxComponent,
  FinalDriveComponent,
  FixedRatioGearComponent,
  ECVT_GEARBOX_PARAMS,
  DIESEL_7SPEED_PARAMS,
  SINGLE_SPEED_PARAMS,
} from './gearbox';
export type { GearboxParams } from './gearbox';

export { PlanetaryGearComponent, CAT_793D_PLANETARY_PARAMS } from './planetary';
export type { PlanetaryGearParams } from './planetary';

export {
  BatteryComponent,
  CAT_793D_BATTERY_PARAMS,
  SERIES_HYBRID_BATTERY_PARAMS,
  EV_BATTERY_PARAMS,
} from './battery';
export type { BatteryParams } from './battery';

export {
  VehicleComponent,
  CAT_793D_PARAMS,
  CAT_793D_GOOD_ROAD,
  CAT_793D_POOR_ROAD,
} from './vehicle';
export type { VehicleParams } from './vehicle';
