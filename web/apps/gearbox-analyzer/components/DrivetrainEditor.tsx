"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Connection,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BarChart3 } from "lucide-react";

import { useDrivetrainStore, type ComponentType } from "@/stores/drivetrain-store";
import { nodeTypes } from "@/components/nodes";
import { ComponentPalette } from "@/components/panels/ComponentPalette";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { SimulationPanel } from "@/components/panels/SimulationPanel";
import { SimulationView } from "@/components/panels/SimulationView";
import { Button } from "@/components/ui/button";

// Custom edge styles
const edgeTypes = {};

const defaultEdgeOptions = {
  style: { strokeWidth: 2 },
  animated: false,
};

export function DrivetrainEditor() {
  const [showSimulationView, setShowSimulationView] = useState(false);

  const nodes = useDrivetrainStore((s) => s.nodes);
  const edges = useDrivetrainStore((s) => s.edges);
  const onNodesChange = useDrivetrainStore((s) => s.onNodesChange);
  const onEdgesChange = useDrivetrainStore((s) => s.onEdgesChange);
  const addNode = useDrivetrainStore((s) => s.addNode);
  const addEdge_ = useDrivetrainStore((s) => s.addEdge);
  const setSelectedNode = useDrivetrainStore((s) => s.setSelectedNode);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Determine edge type based on handle names
      const edgeType =
        connection.sourceHandle?.includes("electrical") ||
        connection.targetHandle?.includes("electrical")
          ? "electrical"
          : "mechanical";

      const newEdge: Edge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        style: {
          stroke: edgeType === "mechanical" ? "#10b981" : "#f59e0b",
          strokeWidth: 2,
        },
        animated: edgeType === "electrical",
      };

      addEdge_(newEdge);
    },
    [addEdge_]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as ComponentType;
      if (!type) return;

      // Get position from drop coordinates
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 70,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-subtle bg-dark">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-primary">Gearbox Analyzer</h1>
          <span className="ml-4 text-sm text-muted">
            Visual Drivetrain Simulation Tool
          </span>
        </div>

        <Button
          type="button"
          variant="accent"
          onClick={() => setShowSimulationView(true)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Open Simulation
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Component Palette */}
        <ComponentPalette />

        {/* Center - React Flow canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              proOptions={{ hideAttribution: true }}
              className="bg-black"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#2a2a2a"
              />
              <Controls className="bg-surface border-subtle [&>button]:bg-surface [&>button]:border-subtle [&>button]:text-primary [&>button:hover]:bg-subtle" />
              <MiniMap
                className="!bg-surface"
                nodeColor={(node) => {
                  switch (node.data?.componentType) {
                    case "engine":
                      return "#dc2626";
                    case "motor":
                      return "#2563eb";
                    case "gearbox":
                      return "#9333ea";
                    case "planetary":
                      return "#0d9488";
                    case "battery":
                      return "#d97706";
                    case "vehicle":
                      return "#16a34a";
                    default:
                      return "#6b7280";
                  }
                }}
              />
            </ReactFlow>
          </div>

          {/* Bottom panel - Simulation */}
          <SimulationPanel />
        </div>

        {/* Right sidebar - Properties */}
        <PropertiesPanel />
      </div>

      {/* Full-screen Simulation View */}
      {showSimulationView && (
        <SimulationView onClose={() => setShowSimulationView(false)} />
      )}
    </div>
  );
}
