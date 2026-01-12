"use client";

import { Position, type NodeProps, type Node } from "@xyflow/react";
import { Truck } from "lucide-react";
import { BaseNode, type NodeHandle } from "./BaseNode";
import { type BaseNodeData } from "@/stores/drivetrain-store";

const handles: NodeHandle[] = [
  { id: "wheels", type: "mechanical", position: Position.Left, label: "Wheel Input" },
];

export function VehicleNode(props: NodeProps<Node<BaseNodeData>>) {
  const { data } = props;
  const params = data.params as {
    mEmpty?: number;
    mPayload?: number;
    rWheel?: number;
    cR?: number;
    vMax?: number;
  };

  const mTotal = (params.mEmpty ?? 159350) + (params.mPayload ?? 190000);

  return (
    <BaseNode
      {...props}
      icon={<Truck className="h-4 w-4 text-white" />}
      color="bg-green-600"
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Mass:</span>
          <span className="text-primary">{(mTotal / 1000).toFixed(0)} t</span>
        </div>
        <div className="flex justify-between">
          <span>Wheel R:</span>
          <span className="text-primary">{params.rWheel ?? 1.78} m</span>
        </div>
        <div className="flex justify-between">
          <span>Rolling:</span>
          <span className="text-primary">{((params.cR ?? 0.025) * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>V max:</span>
          <span className="text-primary">{((params.vMax ?? 15) * 3.6).toFixed(0)} km/h</span>
        </div>
      </div>
    </BaseNode>
  );
}
