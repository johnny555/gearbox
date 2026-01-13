export { EngineNode } from "./EngineNode";
export { MotorNode } from "./MotorNode";
export { GearboxNode } from "./GearboxNode";
export { PlanetaryNode } from "./PlanetaryNode";
export { BatteryNode } from "./BatteryNode";
export { VehicleNode } from "./VehicleNode";

import { EngineNode } from "./EngineNode";
import { MotorNode } from "./MotorNode";
import { GearboxNode } from "./GearboxNode";
import { PlanetaryNode } from "./PlanetaryNode";
import { BatteryNode } from "./BatteryNode";
import { VehicleNode } from "./VehicleNode";

export const nodeTypes = {
  engineNode: EngineNode,
  motorNode: MotorNode,
  gearboxNode: GearboxNode,
  planetaryNode: PlanetaryNode,
  batteryNode: BatteryNode,
  vehicleNode: VehicleNode,
};
