import { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BarChart3, Download, Upload, Save, Pencil } from "lucide-react";

import { useDrivetrainStore, type ComponentType } from "@/stores/drivetrain-store";
import { nodeTypes } from "@/components/nodes";
import { ComponentPalette } from "@/components/panels/ComponentPalette";
import { ComponentEditModal } from "@/components/modals/ComponentEditModal";
import { ReferencesPanel } from "@/components/panels/ReferencesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const defaultEdgeOptions = {
  style: { strokeWidth: 2 },
  animated: false,
};

export function DesignPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const nodes = useDrivetrainStore((s) => s.nodes);
  const edges = useDrivetrainStore((s) => s.edges);
  const drivetrainName = useDrivetrainStore((s) => s.name);
  const setDrivetrainName = useDrivetrainStore((s) => s.setName);
  const [editingTitle, setEditingTitle] = useState(drivetrainName);
  const onNodesChange = useDrivetrainStore((s) => s.onNodesChange);
  const onEdgesChange = useDrivetrainStore((s) => s.onEdgesChange);
  const addNode = useDrivetrainStore((s) => s.addNode);
  const addEdge_ = useDrivetrainStore((s) => s.addEdge);
  const setSelectedNode = useDrivetrainStore((s) => s.setSelectedNode);
  const selectedNodeId = useDrivetrainStore((s) => s.selectedNodeId);
  const exportDrivetrain = useDrivetrainStore((s) => s.exportDrivetrain);
  const importDrivetrain = useDrivetrainStore((s) => s.importDrivetrain);
  const saveDrivetrain = useDrivetrainStore((s) => s.saveDrivetrain);

  const onConnect = useCallback(
    (connection: Connection) => {
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
          strokeWidth: 3,
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

      const dataStr = event.dataTransfer.getData("application/reactflow");
      if (!dataStr) return;

      // Parse the drag data (now JSON with type, label, params)
      let dragData: { type: ComponentType; label?: string; params?: Record<string, unknown> };
      try {
        dragData = JSON.parse(dataStr);
      } catch {
        // Fallback for old format (just type string)
        dragData = { type: dataStr as ComponentType };
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 70,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      addNode(dragData.type, position, dragData.label, dragData.params);
    },
    [addNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const handleExport = () => {
    const json = exportDrivetrain();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drivetrain.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      importDrivetrain(json);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSave = () => {
    if (saveName.trim() && nodes.length > 0) {
      saveDrivetrain(saveName.trim());
      setSaveName("");
      setSaveDialogOpen(false);
    }
  };

  // Sync editing title with store value when it changes externally
  useEffect(() => {
    setEditingTitle(drivetrainName);
  }, [drivetrainName]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setDrivetrainName(trimmed);
    } else {
      setEditingTitle(drivetrainName);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditingTitle(drivetrainName);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="h-14 flex items-center px-4 border-b border-subtle bg-dark">
        {/* Left section */}
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-lg font-semibold text-primary">Gearbox Analyzer</h1>
            <span className="text-sm text-muted">Drivetrain Design</span>
          </div>
          <ReferencesPanel />
        </div>

        {/* Center section - Editable title */}
        <div className="flex items-center justify-center gap-2 flex-1">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-center text-lg font-medium max-w-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 text-lg font-medium text-primary hover:text-accent transition-colors"
            >
              {drivetrainName || "Untitled Drivetrain"}
              <Pencil className="h-4 w-4 opacity-50" />
            </button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={nodes.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Drivetrain</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Enter drivetrain name..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="accent"
            onClick={() => navigate("/simulation")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Prepare To Run Sim
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Component Palette */}
        <ComponentPalette />

        {/* Center - React Flow canvas */}
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
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
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
            <Controls className="!bg-surface !border-subtle [&>button]:!bg-surface [&>button]:!border-subtle [&>button]:!text-primary [&>button:hover]:!bg-subtle [&>button>svg]:!fill-gray-300" />
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
      </div>

      {/* Component Edit Modal */}
      <ComponentEditModal
        nodeId={selectedNodeId}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
