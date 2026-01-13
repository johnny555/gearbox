
import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Flame } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "shaft", type: "mechanical", position: Position.Right, label: "Crankshaft" },
];

export function EngineNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    rpmIdle?: number;
    rpmMax?: number;
    pRated?: number;
    tPeak?: number;
  };

  return (
    <BaseNode
      {...props}
      icon={<Flame className="h-4 w-4 text-white" />}
      color="bg-red-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Power:</span>
          <span className="text-primary">{((params.pRated ?? 1800000) / 1000).toFixed(0)} kW</span>
        </div>
        <div className="flex justify-between">
          <span>Torque:</span>
          <span className="text-primary">{(params.tPeak ?? 11220).toLocaleString()} N·m</span>
        </div>
        <div className="flex justify-between">
          <span>RPM:</span>
          <span className="text-primary">{params.rpmIdle ?? 700} - {params.rpmMax ?? 1800}</span>
        </div>
      </div>
    </BaseNode>
  );
}
