
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useDrivetrainStore, type BaseNodeData } from "@/stores/drivetrain-store";

export interface NodeHandle {
  id: string;
  type: "mechanical" | "electrical";
  position: Position;
  label: string;
}

interface BaseNodeProps extends NodeProps<Node<BaseNodeData>> {
  icon: React.ReactNode;
  color: string;
  handles: NodeHandle[];
  children?: React.ReactNode;
}

export function BaseNode({
  id,
  data,
  selected,
  icon,
  color,
  handles,
  children,
}: BaseNodeProps) {
  const setSelectedNode = useDrivetrainStore((s) => s.setSelectedNode);

  return (
    <div
      className={cn(
        "relative min-w-[140px] rounded-lg border-2 bg-surface p-3 shadow-lg transition-all",
        selected ? "border-accent shadow-accent/20" : "border-subtle hover:border-secondary"
      )}
      onClick={() => setSelectedNode(id)}
    >
      {/* Handles */}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.position === Position.Left || handle.position === Position.Top ? "target" : "source"}
          position={handle.position}
          className={cn(
            "!h-3 !w-3 !rounded-full !border-2 !border-dark transition-all hover:!scale-125",
            handle.type === "mechanical" ? "!bg-emerald-500" : "!bg-amber-500"
          )}
          title={handle.label}
        />
      ))}

      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn("flex h-8 w-8 items-center justify-center rounded-md", color)}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-primary truncate">{data.label}</div>
          <div className="text-xs text-muted">{data.componentType}</div>
        </div>
      </div>

      {/* Content */}
      {children && <div className="mt-2 text-xs text-secondary">{children}</div>}
    </div>
  );
}
