
import { create } from "zustand";
import {
  type Node,
  type Edge,
  type XYPosition,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";

/**
 * Component types available in the palette.
 */
export type ComponentType =
  | "engine"
  | "motor"
  | "gearbox"
  | "planetary"
  | "battery"
  | "vehicle";

/**
 * Base node data shared by all component nodes.
 */
export interface BaseNodeData {
  label: string;
  componentType: ComponentType;
  params: Record<string, unknown>;
}

/**
 * Port definition for connection validation.
 */
export interface PortDefinition {
  id: string;
  type: "mechanical" | "electrical";
  position: "left" | "right" | "top" | "bottom";
}

/**
 * Validation result for the topology.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Preset configuration names.
 */
export type PresetName = "diesel-793d" | "ecvt-split";

interface DrivetrainState {
  nodes: Node<BaseNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Actions
  addNode: (type: ComponentType, position: XYPosition) => void;
  removeNode: (id: string) => void;
  updateNodeParams: (id: string, params: Record<string, unknown>) => void;
  setSelectedNode: (id: string | null) => void;
  onNodesChange: (changes: NodeChange<Node<BaseNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  validateTopology: () => ValidationResult;
  loadPreset: (name: PresetName) => void;
  clearAll: () => void;
}

// Default parameters for each component type
const DEFAULT_PARAMS: Record<ComponentType, Record<string, unknown>> = {
  engine: {
    rpmIdle: 700,
    rpmMax: 1800,
    pRated: 1801000,
    tPeak: 11220,
  },
  motor: {
    pMax: 200000,
    tMax: 3000,
    rpmMax: 6000,
    eta: 0.92,
  },
  gearbox: {
    ratios: [4.59, 2.95, 1.94, 1.40, 1.0, 0.74, 0.65],
    efficiencies: [0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97],
  },
  planetary: {
    zSun: 30,
    zRing: 90,
  },
  battery: {
    capacityKwh: 200,
    vNom: 700,
    pMaxDischarge: 1000000,
    pMaxCharge: 500000,
    socInit: 0.6,
  },
  vehicle: {
    mEmpty: 159350,
    mPayload: 190000,
    rWheel: 1.78,
    cR: 0.025,
    vMax: 15.0,
  },
};

// Counter for unique node IDs
let nodeIdCounter = 1;

export const useDrivetrainStore = create<DrivetrainState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  addNode: (type, position) => {
    const id = `${type}-${nodeIdCounter++}`;
    const newNode: Node<BaseNodeData> = {
      id,
      type: `${type}Node`,
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeIdCounter - 1}`,
        componentType: type,
        params: { ...DEFAULT_PARAMS[type] },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  updateNodeParams: (id, params) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, params: { ...node.data.params, ...params } } }
          : node
      ),
    }));
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }));
  },

  validateTopology: () => {
    const { nodes, edges } = get();
    const errors: string[] = [];

    // Check for at least one engine or motor
    const hasActuator = nodes.some(
      (n) => n.data.componentType === "engine" || n.data.componentType === "motor"
    );
    if (!hasActuator) {
      errors.push("Topology needs at least one engine or motor");
    }

    // Check for vehicle component
    const hasVehicle = nodes.some((n) => n.data.componentType === "vehicle");
    if (!hasVehicle) {
      errors.push("Topology needs a vehicle component");
    }

    // Check connectivity (simplified)
    if (nodes.length > 1 && edges.length < nodes.length - 1) {
      errors.push("Some components are not connected");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  loadPreset: (name) => {
    // Clear current state
    nodeIdCounter = 1;

    switch (name) {
      case "diesel-793d":
        set({
          nodes: [
            {
              id: "engine-1",
              type: "engineNode",
              position: { x: 100, y: 200 },
              data: {
                label: "CAT 3516E",
                componentType: "engine",
                params: DEFAULT_PARAMS.engine,
              },
            },
            {
              id: "gearbox-1",
              type: "gearboxNode",
              position: { x: 350, y: 200 },
              data: {
                label: "7-Speed Gearbox",
                componentType: "gearbox",
                params: DEFAULT_PARAMS.gearbox,
              },
            },
            {
              id: "vehicle-1",
              type: "vehicleNode",
              position: { x: 600, y: 200 },
              data: {
                label: "CAT 793D",
                componentType: "vehicle",
                params: DEFAULT_PARAMS.vehicle,
              },
            },
          ],
          edges: [
            {
              id: "e-engine-gearbox",
              source: "engine-1",
              target: "gearbox-1",
              sourceHandle: "shaft",
              targetHandle: "input",
              type: "mechanical",
            },
            {
              id: "e-gearbox-vehicle",
              source: "gearbox-1",
              target: "vehicle-1",
              sourceHandle: "output",
              targetHandle: "wheels",
              type: "mechanical",
            },
          ],
          selectedNodeId: null,
        });
        nodeIdCounter = 4;
        break;

      case "ecvt-split":
        set({
          nodes: [
            {
              id: "engine-1",
              type: "engineNode",
              position: { x: 50, y: 250 },
              data: {
                label: "CAT 3516E",
                componentType: "engine",
                params: DEFAULT_PARAMS.engine,
              },
            },
            {
              id: "motor-1",
              type: "motorNode",
              position: { x: 50, y: 80 },
              data: {
                label: "MG1",
                componentType: "motor",
                params: { ...DEFAULT_PARAMS.motor, pMax: 250000, tMax: 3500, rpmMax: 6000 },
              },
            },
            {
              id: "gearbox-mg1",
              type: "gearboxNode",
              position: { x: 200, y: 80 },
              data: {
                label: "MG1 Reduction",
                componentType: "gearbox",
                params: { ratios: [3.5], efficiencies: [0.97] },
              },
            },
            {
              id: "planetary-1",
              type: "planetaryNode",
              position: { x: 350, y: 165 },
              data: {
                label: "Planetary",
                componentType: "planetary",
                params: DEFAULT_PARAMS.planetary,
              },
            },
            {
              id: "gearbox-postring",
              type: "gearboxNode",
              position: { x: 500, y: 250 },
              data: {
                label: "Post-Ring",
                componentType: "gearbox",
                params: { ratios: [1.0], efficiencies: [0.98] },
              },
            },
            {
              id: "motor-2",
              type: "motorNode",
              position: { x: 650, y: 250 },
              data: {
                label: "MG2",
                componentType: "motor",
                params: { ...DEFAULT_PARAMS.motor, pMax: 500000, tMax: 5400, rpmMax: 4000, pBoost: 500000 },
              },
            },
            {
              id: "gearbox-1",
              type: "gearboxNode",
              position: { x: 800, y: 250 },
              data: {
                label: "2-Speed",
                componentType: "gearbox",
                params: { ratios: [3.0, 1.0], efficiencies: [0.97, 0.97] },
              },
            },
            {
              id: "gearbox-intermediate",
              type: "gearboxNode",
              position: { x: 950, y: 250 },
              data: {
                label: "Intermediate",
                componentType: "gearbox",
                params: { ratios: [2.85], efficiencies: [0.97] },
              },
            },
            {
              id: "gearbox-finaldrive",
              type: "gearboxNode",
              position: { x: 1100, y: 250 },
              data: {
                label: "Final Drive",
                componentType: "gearbox",
                params: { ratios: [10.83], efficiencies: [0.96] },
              },
            },
            {
              id: "battery-1",
              type: "batteryNode",
              position: { x: 350, y: 420 },
              data: {
                label: "Battery",
                componentType: "battery",
                params: DEFAULT_PARAMS.battery,
              },
            },
            {
              id: "vehicle-1",
              type: "vehicleNode",
              position: { x: 1250, y: 250 },
              data: {
                label: "CAT 793D",
                componentType: "vehicle",
                params: DEFAULT_PARAMS.vehicle,
              },
            },
          ],
          edges: [
            { id: "e1", source: "engine-1", target: "planetary-1", sourceHandle: "shaft", targetHandle: "carrier", type: "mechanical" },
            { id: "e2", source: "motor-1", target: "gearbox-mg1", sourceHandle: "shaft-out", targetHandle: "input", type: "mechanical" },
            { id: "e3", source: "gearbox-mg1", target: "planetary-1", sourceHandle: "output", targetHandle: "sun", type: "mechanical" },
            { id: "e4", source: "planetary-1", target: "gearbox-postring", sourceHandle: "ring", targetHandle: "input", type: "mechanical" },
            { id: "e5", source: "gearbox-postring", target: "motor-2", sourceHandle: "output", targetHandle: "shaft-in", type: "mechanical" },
            { id: "e6", source: "motor-2", target: "gearbox-1", sourceHandle: "shaft-out", targetHandle: "input", type: "mechanical" },
            { id: "e7", source: "gearbox-1", target: "gearbox-intermediate", sourceHandle: "output", targetHandle: "input", type: "mechanical" },
            { id: "e8", source: "gearbox-intermediate", target: "gearbox-finaldrive", sourceHandle: "output", targetHandle: "input", type: "mechanical" },
            { id: "e9", source: "gearbox-finaldrive", target: "vehicle-1", sourceHandle: "output", targetHandle: "wheels", type: "mechanical" },
            { id: "e10", source: "motor-1", target: "battery-1", sourceHandle: "electrical", targetHandle: "electrical", type: "electrical" },
            { id: "e11", source: "motor-2", target: "battery-1", sourceHandle: "electrical", targetHandle: "electrical", type: "electrical" },
          ],
          selectedNodeId: null,
        });
        nodeIdCounter = 12;
        break;
    }
  },

  clearAll: () => {
    nodeIdCounter = 1;
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },
}));
