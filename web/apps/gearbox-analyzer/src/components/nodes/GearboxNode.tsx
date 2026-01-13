
import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Settings } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "input", type: "mechanical", position: Position.Left, label: "Input Shaft" },
  { id: "output", type: "mechanical", position: Position.Right, label: "Output Shaft" },
];

export function GearboxNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    ratios?: number[];
    efficiencies?: number[];
  };

  const ratios = params.ratios ?? [1.0];

  return (
    <BaseNode
      {...props}
      icon={<Settings className="h-4 w-4 text-white" />}
      color="bg-purple-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Gears:</span>
          <span className="text-primary">{ratios.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Ratios:</span>
          <span className="text-primary text-right truncate max-w-[80px]" title={ratios.map(r => r.toFixed(2)).join(", ")}>
            {ratios[0].toFixed(2)} - {ratios[ratios.length - 1].toFixed(2)}
          </span>
        </div>
      </div>
    </BaseNode>
  );
}
