"use client";

import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Circle } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "sun", type: "mechanical", position: Position.Top, label: "Sun Gear" },
  { id: "carrier", type: "mechanical", position: Position.Left, label: "Carrier" },
  { id: "ring", type: "mechanical", position: Position.Right, label: "Ring Gear" },
];

export function PlanetaryNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    zSun?: number;
    zRing?: number;
  };

  const zSun = params.zSun ?? 30;
  const zRing = params.zRing ?? 90;
  const rho = zRing / zSun;

  return (
    <BaseNode
      {...props}
      icon={<Circle className="h-4 w-4 text-white" />}
      color="bg-teal-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Sun:</span>
          <span className="text-primary">{zSun} teeth</span>
        </div>
        <div className="flex justify-between">
          <span>Ring:</span>
          <span className="text-primary">{zRing} teeth</span>
        </div>
        <div className="flex justify-between">
          <span>ρ:</span>
          <span className="text-primary">{rho.toFixed(1)}</span>
        </div>
      </div>
    </BaseNode>
  );
}
