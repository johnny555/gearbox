
import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Battery } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "electrical", type: "electrical", position: Position.Top, label: "Electrical" },
];

export function BatteryNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    capacityKwh?: number;
    vNom?: number;
    pMaxDischarge?: number;
    pMaxCharge?: number;
    socInit?: number;
  };

  return (
    <BaseNode
      {...props}
      icon={<Battery className="h-4 w-4 text-white" />}
      color="bg-amber-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Capacity:</span>
          <span className="text-primary">{params.capacityKwh ?? 200} kWh</span>
        </div>
        <div className="flex justify-between">
          <span>Voltage:</span>
          <span className="text-primary">{params.vNom ?? 700} V</span>
        </div>
        <div className="flex justify-between">
          <span>P max:</span>
          <span className="text-primary">{((params.pMaxDischarge ?? 1000000) / 1000).toFixed(0)} kW</span>
        </div>
        <div className="flex justify-between">
          <span>SOC:</span>
          <span className="text-primary">{((params.socInit ?? 0.6) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </BaseNode>
  );
}
