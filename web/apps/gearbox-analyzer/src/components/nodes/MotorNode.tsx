
import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Zap } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "shaft-in", type: "mechanical", position: Position.Left, label: "Shaft In" },
  { id: "shaft-out", type: "mechanical", position: Position.Right, label: "Shaft Out" },
  { id: "electrical", type: "electrical", position: Position.Bottom, label: "Electrical" },
];

export function MotorNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    pMax?: number;
    tMax?: number;
    rpmMax?: number;
    eta?: number;
    pBoost?: number;
  };

  return (
    <BaseNode
      {...props}
      icon={<Zap className="h-4 w-4 text-white" />}
      color="bg-blue-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Power:</span>
          <span className="text-primary">{((params.pMax ?? 200000) / 1000).toFixed(0)} kW</span>
        </div>
        {params.pBoost && (
          <div className="flex justify-between">
            <span>Boost:</span>
            <span className="text-accent">{(params.pBoost / 1000).toFixed(0)} kW</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Torque:</span>
          <span className="text-primary">{(params.tMax ?? 3000).toLocaleString()} N·m</span>
        </div>
        <div className="flex justify-between">
          <span>Efficiency:</span>
          <span className="text-primary">{((params.eta ?? 0.92) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </BaseNode>
  );
}
