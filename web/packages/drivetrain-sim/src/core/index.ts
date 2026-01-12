/**
 * Core module exports.
 */

export { DrivetrainComponent } from './component';
export type { PortValues } from './component';

export { PortType, PortDirection, mechanicalPort, electricalPort, canConnect } from './ports';
export type { Port, Connection } from './ports';

export {
  GearRatioConstraint,
  WillisConstraint,
  RigidConnectionConstraint,
} from './constraints';
export type { KinematicConstraint, SpeedRelation } from './constraints';

export { DrivetrainTopology, TopologyError } from './topology';

export { Drivetrain } from './drivetrain';
export type { DOFInfo, ConstraintInfo } from './drivetrain';
