
import { useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import type { BaseNodeData } from "@/stores/drivetrain-store";
import { useSimulationStore, type SimResult, type RimpullCurve, type RimpullPoint, type OperatingCurve, type OperatingPoint, type DrivetrainMetadata } from "@/stores/simulation-store";

import {
  DrivetrainTopology,
  EngineComponent,
  MotorComponent,
  NSpeedGearboxComponent,
  FinalDriveComponent,
  PlanetaryGearComponent,
  BatteryComponent,
  VehicleComponent,
  DrivetrainSimulator,
  SpeedController,
  type SimulationConfig,
} from "drivetrain-sim";

/**
 * Port name mapping from React Flow handles to simulation library ports.
 */
const HANDLE_TO_PORT: Record<string, Record<string, string>> = {
  engine: { shaft: "shaft" },
  motor: { shaft: "shaft", "shaft-in": "shaft", "shaft-out": "shaft", electrical: "electrical" },
  gearbox: { input: "input", output: "output" },
  planetary: { sun: "sun", carrier: "carrier", ring: "ring" },
  battery: { electrical: "electrical" },
  vehicle: { wheels: "wheels" },
};

/**
 * Default inertia values used when params don't specify them.
 * These are fallbacks for backward compatibility with older saved configurations.
 */
const DEFAULT_INERTIAS = {
  engine: { jEngine: 25 },       // kg*m^2 - large diesel engine
  motor: { jRotor: 5 },          // kg*m^2 - industrial motor
  gearbox: { jInput: 5, jOutput: 10 },
  planetary: { jSun: 2, jCarrier: 50, jRing: 5 },
  vehicle: { jWheels: 500, cD: 0.9, aFrontal: 45.0 },
};

/**
 * Create a component instance from node data.
 * Uses parameters from the node data, falling back to defaults for missing values.
 */
function createComponent(
  nodeData: BaseNodeData
): import("drivetrain-sim").DrivetrainComponent | null {
  const { componentType, params } = nodeData;

  try {
    switch (componentType) {
      case "engine": {
        return new EngineComponent({
          // Use param if provided, otherwise use default
          jEngine: (params.jEngine as number) ?? DEFAULT_INERTIAS.engine.jEngine,
          rpmIdle: params.rpmIdle as number,
          rpmMax: params.rpmMax as number,
          pRated: params.pRated as number,
          tPeak: params.tPeak as number,
        });
      }

      case "motor": {
        return new MotorComponent({
          jRotor: (params.jRotor as number) ?? DEFAULT_INERTIAS.motor.jRotor,
          pMax: params.pMax as number,
          tMax: params.tMax as number,
          rpmMax: params.rpmMax as number,
          eta: params.eta as number,
        });
      }

      case "gearbox": {
        const ratios = params.ratios as number[];
        const efficiencies = params.efficiencies as number[];
        return new NSpeedGearboxComponent({
          ratios: ratios,
          efficiencies: efficiencies,
          jInput: (params.jInput as number) ?? DEFAULT_INERTIAS.gearbox.jInput,
          jOutput: (params.jOutput as number) ?? DEFAULT_INERTIAS.gearbox.jOutput,
        });
      }

      case "planetary": {
        return new PlanetaryGearComponent({
          zSun: params.zSun as number,
          zRing: params.zRing as number,
          jSun: (params.jSun as number) ?? DEFAULT_INERTIAS.planetary.jSun,
          jCarrier: (params.jCarrier as number) ?? DEFAULT_INERTIAS.planetary.jCarrier,
          jRing: (params.jRing as number) ?? DEFAULT_INERTIAS.planetary.jRing,
        });
      }

      case "battery": {
        return new BatteryComponent({
          capacityKwh: params.capacityKwh as number,
          vNom: params.vNom as number,
          pMaxDischarge: params.pMaxDischarge as number,
          pMaxCharge: params.pMaxCharge as number,
          socInit: params.socInit as number,
        });
      }

      case "vehicle": {
        return new VehicleComponent({
          mEmpty: params.mEmpty as number,
          mPayload: params.mPayload as number,
          rWheel: params.rWheel as number,
          cR: params.cR as number,
          // Use params if provided, otherwise use defaults
          rhoAir: 1.225, // Standard air density - rarely needs to change
          cD: (params.cD as number) ?? DEFAULT_INERTIAS.vehicle.cD,
          aFrontal: (params.aFrontal as number) ?? DEFAULT_INERTIAS.vehicle.aFrontal,
          jWheels: (params.jWheels as number) ?? DEFAULT_INERTIAS.vehicle.jWheels,
        });
      }

      default:
        console.warn(`Unknown component type: ${componentType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error creating ${componentType} component:`, error);
    return null;
  }
}

/**
 * Convert React Flow nodes and edges to a DrivetrainTopology.
 */
function buildTopology(
  nodes: Node<BaseNodeData>[],
  edges: Edge[]
): DrivetrainTopology {
  const topology = new DrivetrainTopology();

  // Add all components
  for (const node of nodes) {
    const component = createComponent(node.data);
    if (component) {
      topology.addComponent(node.id, component);
    }
  }

  // Add connections (only mechanical for now)
  for (const edge of edges) {
    if (edge.type === "electrical") {
      // Electrical connections are handled via bus
      continue;
    }

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) continue;

    const sourcePortMap = HANDLE_TO_PORT[sourceNode.data.componentType];
    const targetPortMap = HANDLE_TO_PORT[targetNode.data.componentType];

    if (!sourcePortMap || !targetPortMap) continue;

    const sourcePort = sourcePortMap[edge.sourceHandle || ""] || edge.sourceHandle;
    const targetPort = targetPortMap[edge.targetHandle || ""] || edge.targetHandle;

    if (sourcePort && targetPort) {
      try {
        topology.connect(edge.source, sourcePort, edge.target, targetPort);
      } catch (e) {
        console.warn(`Connection failed: ${edge.source}.${sourcePort} -> ${edge.target}.${targetPort}`, e);
      }
    }
  }

  // Set output to vehicle.wheels
  const vehicleNode = nodes.find((n) => n.data.componentType === "vehicle");
  if (vehicleNode) {
    topology.setOutput(vehicleNode.id, "wheels");
  }

  return topology;
}

/**
 * Result of computing drivetrain curves.
 */
interface DrivetrainCurves {
  rimpull: RimpullCurve[];
  operating: OperatingCurve[];
}

/**
 * Compute rimpull curves for the drivetrain.
 *
 * Detects topology type and calculates appropriately:
 * - Diesel: Engine → Gearbox → Vehicle (conventional)
 * - eCVT: Engine + Motors + Planetary → Gearbox → Vehicle
 */
function computeRimpull(
  nodes: Node<BaseNodeData>[],
  edges: Edge[]
): DrivetrainCurves {
  const rimpullCurves: RimpullCurve[] = [];
  const operatingCurves: OperatingCurve[] = [];

  // Find key components
  const engineNode = nodes.find((n) => n.data.componentType === "engine");
  const motorNodes = nodes.filter((n) => n.data.componentType === "motor");
  const planetaryNode = nodes.find((n) => n.data.componentType === "planetary");
  const gearboxNode = nodes.find((n) => n.data.componentType === "gearbox");
  const vehicleNode = nodes.find((n) => n.data.componentType === "vehicle");

  if (!vehicleNode) {
    return { rimpull: rimpullCurves, operating: operatingCurves };
  }

  const vehicleParams = vehicleNode.data.params;
  const rWheel = (vehicleParams.rWheel as number) || 1.78;
  const mTotal =
    ((vehicleParams.mEmpty as number) || 159350) +
    ((vehicleParams.mPayload as number) || 190000);
  const cR = (vehicleParams.cR as number) || 0.025;

  // Detect topology type
  const isECVT = planetaryNode && motorNodes.length >= 1;

  if (isECVT && engineNode) {
    // eCVT topology: Engine + Planetary + Motors
    const result = computeECVTRimpull(
      engineNode, motorNodes, planetaryNode!, gearboxNode, vehicleParams, rWheel, nodes, edges
    );
    rimpullCurves.push(...result.rimpull);
    operatingCurves.push(...result.operating);
  } else if (engineNode) {
    // Diesel topology: Engine → Gearbox → Vehicle
    rimpullCurves.push(...computeDieselRimpull(
      engineNode, gearboxNode, vehicleParams, rWheel
    ));
  } else if (motorNodes.length > 0) {
    // Pure electric: Motor → Gearbox → Vehicle
    rimpullCurves.push(...computeElectricRimpull(
      motorNodes, gearboxNode, vehicleParams, rWheel
    ));
  }

  // Add resistance curves
  addResistanceCurves(rimpullCurves, mTotal, cR);

  return { rimpull: rimpullCurves, operating: operatingCurves };
}

/**
 * Compute rimpull for conventional diesel drivetrain.
 */
function computeDieselRimpull(
  engineNode: Node<BaseNodeData>,
  gearboxNode: Node<BaseNodeData> | undefined,
  vehicleParams: Record<string, unknown>,
  rWheel: number
): RimpullCurve[] {
  const curves: RimpullCurve[] = [];
  const engineLabel = engineNode.data.label || "Engine";
  const engineParams = engineNode.data.params;

  // Engine parameters
  const tPeak = (engineParams.tPeak as number) || 11220;
  const pRated = (engineParams.pRated as number) || 1801000;
  const rpmIdle = (engineParams.rpmIdle as number) || 700;
  const rpmMax = (engineParams.rpmMax as number) || 1800;

  // Base speed where power limiting begins
  const omegaBase = pRated / tPeak;

  // Final drive ratio (hardcoded for CAT 793D)
  const finalDrive = 16.0;
  const efficiency = 0.92;

  // Get gear ratios
  const gearRatios = gearboxNode
    ? (gearboxNode.data.params.ratios as number[]) || [1.0]
    : [1.0];

  const gearColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6"
  ];

  for (let g = 0; g < gearRatios.length; g++) {
    const ratio = gearRatios[g];
    const points: RimpullPoint[] = [];
    const totalRatio = ratio * finalDrive;

    const vMin = (rpmIdle * Math.PI / 30) / totalRatio * rWheel;
    const vMax = (rpmMax * Math.PI / 30) / totalRatio * rWheel;

    const numPoints = 50;
    for (let i = 0; i <= numPoints; i++) {
      const velocity = vMin + (vMax - vMin) * (i / numPoints);
      const omegaWheel = velocity / rWheel;
      const omegaEngine = omegaWheel * totalRatio;

      let torque: number;
      if (omegaEngine <= omegaBase) {
        torque = tPeak;
      } else {
        torque = pRated / omegaEngine;
      }

      const force = (torque * totalRatio * efficiency) / rWheel;
      points.push({ velocity, force, gear: g + 1 });
    }

    curves.push({
      name: `Gear ${g + 1}: ${engineLabel} (${ratio.toFixed(2)}:1)`,
      points,
      color: gearColors[g % gearColors.length],
    });
  }

  return curves;
}

/**
 * Compute rimpull for eCVT (power-split hybrid) drivetrain.
 * Uses Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
 *
 * Matches the Python rimpull_detailed.py calculation.
 */
function computeECVTRimpull(
  engineNode: Node<BaseNodeData>,
  motorNodes: Node<BaseNodeData>[],
  planetaryNode: Node<BaseNodeData>,
  gearboxNode: Node<BaseNodeData> | undefined,
  vehicleParams: Record<string, unknown>,
  rWheel: number,
  allNodes?: Node<BaseNodeData>[],
  allEdges?: Edge[]
): DrivetrainCurves {
  const rimpullCurves: RimpullCurve[] = [];
  const operatingCurves: OperatingCurve[] = [];

  // Get component labels for curve naming
  const engineLabel = engineNode.data.label || "Engine";

  // Engine parameters
  const engineParams = engineNode.data.params;
  const rpmEngineOpt = 1200; // Optimal engine speed for max torque
  const tEngineMax = (engineParams.tPeak as number) || 11220;
  const pEngineRated = (engineParams.pRated as number) || 1801000;

  // Planetary ratio: ρ = Z_ring / Z_sun
  const planetaryParams = planetaryNode.data.params;
  const zSun = (planetaryParams.zSun as number) || 30;
  const zRing = (planetaryParams.zRing as number) || 90;
  const rho = zRing / zSun; // typically 3.0

  // Motor parameters (find MG1 and MG2)
  // MG1 is typically lower continuous power (reaction motor), MG2 is higher power (traction motor)
  const sortedMotors = [...motorNodes].sort((a, b) =>
    ((a.data.params.pMax as number) || 0) - ((b.data.params.pMax as number) || 0)
  );

  const mg1Node = sortedMotors[0];
  const mg2Node = sortedMotors[1] || sortedMotors[0];
  const mg1Label = mg1Node?.data.label || "MG1";
  const mg2Label = mg2Node?.data.label || "MG2";
  const mg1Params = mg1Node?.data.params || {};
  const mg2Params = mg2Node?.data.params || {};

  // MG1 parameters - use pBoost for peak power (matching Python)
  const pMG1Continuous = (mg1Params.pMax as number) || 250000;
  const pMG1Peak = (mg1Params.pBoost as number) || pMG1Continuous;
  const tMG1Max = (mg1Params.tMax as number) || 3500;
  const rpmMG1Max = (mg1Params.rpmMax as number) || 6000;

  // MG2 parameters
  const pMG2Continuous = (mg2Params.pMax as number) || 500000;
  const tMG2Max = (mg2Params.tMax as number) || 5400;
  const rpmMG2Max = (mg2Params.rpmMax as number) || 4000;

  // Find MG1 reduction ratio by looking for a gearbox connected to MG1
  let kMG1 = 1.0; // MG1 to sun reduction ratio
  let etaMG1Reduction = 0.97;
  if (allNodes && allEdges && mg1Node) {
    // Find gearbox connected to MG1's output
    const mg1Edges = allEdges.filter(e => e.source === mg1Node.id || e.target === mg1Node.id);
    for (const edge of mg1Edges) {
      const connectedNodeId = edge.source === mg1Node.id ? edge.target : edge.source;
      const connectedNode = allNodes.find(n => n.id === connectedNodeId);
      if (connectedNode?.data.componentType === "gearbox") {
        const gearboxParams = connectedNode.data.params;
        const ratios = gearboxParams.ratios as number[];
        if (ratios && ratios.length === 1) {
          kMG1 = ratios[0];
          const effs = gearboxParams.efficiencies as number[];
          etaMG1Reduction = effs?.[0] || 0.97;
          break;
        }
      }
    }
  }

  // Find output drivetrain gearboxes (from MG2/ring to vehicle)
  // Look for selectable gearboxes (multiple ratios) and fixed reductions (single ratio)
  const selectableGearboxes: { node: Node<BaseNodeData>; ratios: number[]; effs: number[] }[] = [];
  let fixedReductionRatio = 1.0;
  let fixedReductionEta = 1.0;

  if (allNodes && allEdges) {
    // Find all gearboxes
    const gearboxNodes = allNodes.filter(n => n.data.componentType === "gearbox");

    for (const gbNode of gearboxNodes) {
      // Skip the MG1 reduction gearbox
      const isMG1Reduction = allEdges.some(e =>
        (e.source === mg1Node?.id && e.target === gbNode.id) ||
        (e.target === mg1Node?.id && e.source === gbNode.id)
      );
      if (isMG1Reduction) continue;

      const ratios = gbNode.data.params.ratios as number[];
      const effs = gbNode.data.params.efficiencies as number[];

      // Skip if no ratios defined
      if (!ratios || !Array.isArray(ratios) || ratios.length === 0) {
        continue;
      }

      if (ratios.length > 1) {
        // This is a selectable gearbox (multi-speed)
        selectableGearboxes.push({
          node: gbNode,
          ratios: ratios,
          effs: effs || ratios.map(() => 0.97),
        });
      } else if (ratios.length === 1) {
        // Fixed reduction - multiply into total
        fixedReductionRatio *= ratios[0];
        fixedReductionEta *= effs?.[0] || 0.97;
      }
    }
  }

  // Generate all gear combinations
  // If we have multiple selectable gearboxes, compute cartesian product
  interface GearCombo {
    name: string;       // Short name like "L-H"
    gearStates: string; // Descriptive gear states like "Low - High"
    totalRatio: number;
    totalEta: number;
  }

  // Helper to get gear name
  const getGearName = (idx: number, totalGears: number): string => {
    if (totalGears === 2) {
      return idx === 0 ? "Low" : "High";
    }
    return `Gear ${idx + 1}`;
  };

  const getGearShort = (idx: number, totalGears: number): string => {
    if (totalGears === 2) {
      return idx === 0 ? "L" : "H";
    }
    return `${idx + 1}`;
  };

  let gearCombinations: GearCombo[] = [];

  if (selectableGearboxes.length === 0) {
    // No selectable gearboxes found - use fallback
    const fallbackRatios = gearboxNode
      ? (gearboxNode.data.params.ratios as number[]) || [3.0, 1.0]
      : [3.0, 1.0];
    gearCombinations = fallbackRatios.map((r, i) => ({
      name: getGearShort(i, fallbackRatios.length),
      gearStates: getGearName(i, fallbackRatios.length),
      totalRatio: r * fixedReductionRatio,
      totalEta: 0.97 * fixedReductionEta,
    }));
  } else if (selectableGearboxes.length === 1) {
    // Single selectable gearbox - simple case
    const gb = selectableGearboxes[0];
    gearCombinations = gb.ratios.map((r, i) => ({
      name: getGearShort(i, gb.ratios.length),
      gearStates: getGearName(i, gb.ratios.length),
      totalRatio: r * fixedReductionRatio,
      totalEta: (gb.effs[i] || 0.97) * fixedReductionEta,
    }));
  } else {
    // Multiple selectable gearboxes - compute cartesian product
    // Start with first gearbox
    let combos: { indices: number[]; ratio: number; eta: number }[] =
      selectableGearboxes[0].ratios.map((r, i) => ({
        indices: [i],
        ratio: r,
        eta: selectableGearboxes[0].effs[i] || 0.97,
      }));

    // Multiply with subsequent gearboxes
    for (let gbIdx = 1; gbIdx < selectableGearboxes.length; gbIdx++) {
      const gb = selectableGearboxes[gbIdx];
      const newCombos: { indices: number[]; ratio: number; eta: number }[] = [];
      for (const combo of combos) {
        for (let i = 0; i < gb.ratios.length; i++) {
          newCombos.push({
            indices: [...combo.indices, i],
            ratio: combo.ratio * gb.ratios[i],
            eta: combo.eta * (gb.effs[i] || 0.97),
          });
        }
      }
      combos = newCombos;
    }

    // Convert to GearCombo format
    gearCombinations = combos.map(c => {
      const shortNames = c.indices.map((idx, gbIdx) => {
        const gb = selectableGearboxes[gbIdx];
        return getGearShort(idx, gb.ratios.length);
      });
      const fullNames = c.indices.map((idx, gbIdx) => {
        const gb = selectableGearboxes[gbIdx];
        return getGearName(idx, gb.ratios.length);
      });
      return {
        name: shortNames.join("-"),
        gearStates: fullNames.join(" - "),
        totalRatio: c.ratio * fixedReductionRatio,
        totalEta: c.eta * fixedReductionEta,
      };
    });
  }

  // If no fixed reductions found, apply default hub/intermediate reduction
  // This is needed because eCVT systems always have final drive reductions
  // even if they're not explicitly modeled as separate gearboxes
  const DEFAULT_HUB_INTERMEDIATE = 2.85 * 10.83; // Intermediate * Hub from Python (~30.9:1)
  const DEFAULT_ETA = 0.97 * 0.96;

  if (fixedReductionRatio === 1.0) {
    console.log("No fixed reductions found, applying default hub/intermediate ratio");
    fixedReductionRatio = DEFAULT_HUB_INTERMEDIATE;
    fixedReductionEta = DEFAULT_ETA;
    // Recalculate combinations with defaults
    gearCombinations = gearCombinations.map(c => ({
      ...c,
      totalRatio: c.totalRatio * DEFAULT_HUB_INTERMEDIATE,
      totalEta: c.totalEta * DEFAULT_ETA,
    }));
  }

  // Sort by ratio descending (highest ratio = lowest speed = first gear)
  gearCombinations.sort((a, b) => b.totalRatio - a.totalRatio);

  // Debug logging
  console.log("eCVT Rimpull Calculation:", {
    selectableGearboxesCount: selectableGearboxes.length,
    selectableGearboxes: selectableGearboxes.map(gb => ({
      id: gb.node.id,
      label: gb.node.data.label,
      ratios: gb.ratios,
    })),
    fixedReductionRatio,
    fixedReductionEta,
    gearCombinations: gearCombinations.map(g => ({
      name: g.name,
      states: g.gearStates,
      ratio: g.totalRatio.toFixed(2),
      eta: g.totalEta.toFixed(3),
    })),
    motorParams: {
      mg1: { pMax: pMG1Continuous, pPeak: pMG1Peak, tMax: tMG1Max, rpmMax: rpmMG1Max, kReduction: kMG1 },
      mg2: { pMax: pMG2Continuous, tMax: tMG2Max, rpmMax: rpmMG2Max },
      engine: { tMax: tEngineMax, pRated: pEngineRated, rpmOpt: rpmEngineOpt },
    },
    planetaryRatio: rho,
    wheelRadius: rWheel,
  });

  // Safety check: ensure we have at least one gear combination
  if (gearCombinations.length === 0) {
    console.warn("No gear combinations found, using default");
    gearCombinations = [{
      name: "1",
      gearStates: "Default",
      totalRatio: fixedReductionRatio || 30.0,
      totalEta: fixedReductionEta || 0.9,
    }];
  }

  // Speed range (0 to 70 km/h)
  const numPoints = 300;
  const vMaxRange = 70 / 3.6; // 70 km/h in m/s

  // Color palette for multiple gears
  const gearColors = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  // Component color palettes
  const engineColors = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b"];
  const mg1Colors = ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];
  const mg2Colors = ["#22c55e", "#16a34a", "#15803d", "#166534"];

  // Show ALL gear options
  for (let g = 0; g < gearCombinations.length; g++) {
    const combo = gearCombinations[g];
    const kTotal = combo.totalRatio;
    const etaTotal = combo.totalEta;
    const rimpullPoints: RimpullPoint[] = [];
    const enginePoints: OperatingPoint[] = [];
    const mg1Points: OperatingPoint[] = [];
    const mg2Points: OperatingPoint[] = [];

    for (let i = 1; i <= numPoints; i++) {
      const velocity = (vMaxRange * i) / numPoints;

      // Ring/MG2 speed from vehicle speed
      const omegaWheel = velocity / rWheel;
      const omegaRing = omegaWheel * kTotal;
      const rpmRing = (omegaRing * 30) / Math.PI;
      const rpmMG2 = rpmRing; // MG2 is on ring

      // Check MG2 speed limit
      if (rpmMG2 > rpmMG2Max) {
        rimpullPoints.push({ velocity, force: 0, gear: g + 1 });
        continue;
      }

      // Engine speed (fixed at optimal for max torque)
      const omegaEngine = (rpmEngineOpt * Math.PI) / 30;

      // Sun speed from Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
      const omegaSun = (1 + rho) * omegaEngine - rho * omegaRing;
      const rpmSun = (omegaSun * 30) / Math.PI;

      // MG1 speed (with reduction gear): ω_MG1 = ω_sun / K_mg1
      const rpmMG1 = Math.abs(rpmSun) / kMG1;

      // Get MG1 max torque at this speed (using peak power)
      const omegaMG1 = (rpmMG1 * Math.PI) / 30;
      const omegaMG1BasePeak = pMG1Peak / tMG1Max;
      let tMG1Available: number;
      if (omegaMG1 <= omegaMG1BasePeak) {
        tMG1Available = tMG1Max;
      } else if (rpmMG1 <= rpmMG1Max) {
        tMG1Available = pMG1Peak / omegaMG1;
      } else {
        tMG1Available = 0;
      }

      // Get MG2 max torque at this speed
      const omegaMG2Base = pMG2Continuous / tMG2Max;
      let tMG2Available: number;
      if (omegaRing <= omegaMG2Base) {
        tMG2Available = tMG2Max;
      } else if (rpmMG2 <= rpmMG2Max) {
        tMG2Available = pMG2Continuous / omegaRing;
      } else {
        tMG2Available = 0;
      }

      // Sun torque = MG1 torque × K_mg1 × η_mg1
      const tSun = tMG1Available * kMG1 * etaMG1Reduction;

      // Engine torque limited by sun torque capacity
      // T_engine_max from MG1 = T_sun × (1+ρ)
      const tEngineFromMG1Limit = tSun * (1 + rho);
      const tEngineUsable = Math.min(tEngineMax, tEngineFromMG1Limit);

      // Ring torque from engine: T_ring_engine = ρ/(1+ρ) × T_engine
      const tRingFromEngine = (rho / (1 + rho)) * tEngineUsable;

      // Total ring torque
      const tRingTotal = tRingFromEngine + tMG2Available;

      // Wheel torque and rimpull
      const tWheel = tRingTotal * kTotal * etaTotal;
      const force = tWheel / rWheel;

      rimpullPoints.push({ velocity, force: Math.max(0, force), gear: g + 1 });

      // Collect operating points for each component
      const pEngine = tEngineUsable * omegaEngine;
      const pMG1 = tMG1Available * omegaMG1;
      const pMG2 = tMG2Available * omegaRing;

      enginePoints.push({
        velocity,
        rpm: rpmEngineOpt,
        torque: tEngineUsable,
        power: pEngine,
        gear: g + 1,
      });

      mg1Points.push({
        velocity,
        rpm: rpmMG1,
        torque: tMG1Available,
        power: pMG1,
        gear: g + 1,
      });

      mg2Points.push({
        velocity,
        rpm: rpmMG2,
        torque: tMG2Available,
        power: pMG2,
        gear: g + 1,
      });
    }

    // Create descriptive labels showing gear states and total ratio
    // For rimpull: show all components and gear states
    // For operating: show component name and gear states
    const gearStates = combo.gearStates;  // e.g., "Low - High" or "Gear 1"

    // Filter out any points with NaN or Infinity values
    const validRimpullPoints = rimpullPoints.filter(p =>
      isFinite(p.velocity) && isFinite(p.force) && !isNaN(p.velocity) && !isNaN(p.force)
    );
    const validEnginePoints = enginePoints.filter(p =>
      isFinite(p.velocity) && isFinite(p.rpm) && isFinite(p.torque) && isFinite(p.power)
    );
    const validMG1Points = mg1Points.filter(p =>
      isFinite(p.velocity) && isFinite(p.rpm) && isFinite(p.torque) && isFinite(p.power)
    );
    const validMG2Points = mg2Points.filter(p =>
      isFinite(p.velocity) && isFinite(p.rpm) && isFinite(p.torque) && isFinite(p.power)
    );

    // Debug: log if points were filtered out
    if (validRimpullPoints.length !== rimpullPoints.length) {
      console.warn(`Gear ${combo.name}: filtered ${rimpullPoints.length - validRimpullPoints.length} invalid rimpull points`);
    }

    // Rimpull label shows combined output
    const rimpullLabel = `${gearStates} (${kTotal.toFixed(0)}:1)`;

    rimpullCurves.push({
      name: rimpullLabel,
      points: validRimpullPoints,
      color: gearColors[g % gearColors.length],
    });

    // Operating curves show component + gear states
    // Only add curves if they have valid points
    if (validEnginePoints.length > 0) {
      operatingCurves.push({
        name: `${engineLabel} - ${gearStates}`,
        component: "engine",
        gear: combo.name,
        points: validEnginePoints,
        color: engineColors[g % engineColors.length],
      });
    }

    if (validMG1Points.length > 0) {
      operatingCurves.push({
        name: `${mg1Label} - ${gearStates}`,
        component: "mg1",
        gear: combo.name,
        points: validMG1Points,
        color: mg1Colors[g % mg1Colors.length],
      });
    }

    if (validMG2Points.length > 0) {
      operatingCurves.push({
        name: `${mg2Label} - ${gearStates}`,
        component: "mg2",
        gear: combo.name,
        points: validMG2Points,
        color: mg2Colors[g % mg2Colors.length],
      });
    }
  }

  return { rimpull: rimpullCurves, operating: operatingCurves };
}

/**
 * Compute rimpull for pure electric drivetrain.
 */
function computeElectricRimpull(
  motorNodes: Node<BaseNodeData>[],
  gearboxNode: Node<BaseNodeData> | undefined,
  vehicleParams: Record<string, unknown>,
  rWheel: number
): RimpullCurve[] {
  const curves: RimpullCurve[] = [];

  // Use the most powerful motor
  const motorNode = motorNodes.reduce((a, b) =>
    ((a.data.params.pMax as number) || 0) > ((b.data.params.pMax as number) || 0) ? a : b
  );
  const motorParams = motorNode.data.params;

  const pMax = (motorParams.pMax as number) || 350000;
  const tMax = (motorParams.tMax as number) || 3000;
  const rpmMax = (motorParams.rpmMax as number) || 6000;
  const eta = (motorParams.eta as number) || 0.92;

  const omegaBase = pMax / tMax;
  const finalDrive = 16.0;

  const gearRatios = gearboxNode
    ? (gearboxNode.data.params.ratios as number[]) || [1.0]
    : [1.0];

  const gearColors = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  for (let g = 0; g < gearRatios.length; g++) {
    const ratio = gearRatios[g];
    const totalRatio = ratio * finalDrive;
    const points: RimpullPoint[] = [];

    const vMax = (rpmMax * Math.PI / 30) / totalRatio * rWheel;
    const numPoints = 50;

    for (let i = 1; i <= numPoints; i++) {
      const velocity = (vMax * i) / numPoints;
      const omegaWheel = velocity / rWheel;
      const omegaMotor = omegaWheel * totalRatio;

      let torque: number;
      if (omegaMotor <= omegaBase) {
        torque = tMax;
      } else {
        torque = pMax / omegaMotor;
      }

      const force = (torque * totalRatio * eta) / rWheel;
      points.push({ velocity, force, gear: g + 1 });
    }

    curves.push({
      name: `Gear ${g + 1} (${ratio.toFixed(2)}:1)`,
      points,
      color: gearColors[g % gearColors.length],
    });
  }

  return curves;
}

/**
 * Add resistance curves (rolling + grade) to the curves array.
 */
function addResistanceCurves(
  curves: RimpullCurve[],
  mTotal: number,
  cR: number
): void {
  const g_accel = 9.81;
  const grades = [0, 0.05, 0.10, 0.15];
  const gradeColors = ["#555555", "#666666", "#888888", "#aaaaaa"];
  const maxSpeed = 60 / 3.6;

  for (let gi = 0; gi < grades.length; gi++) {
    const grade = grades[gi];
    const gradePoints: RimpullPoint[] = [];

    for (let i = 0; i <= 30; i++) {
      const v = (maxSpeed * i) / 30;
      const f_rolling = mTotal * g_accel * cR;
      const f_grade = mTotal * g_accel * Math.sin(Math.atan(grade));
      gradePoints.push({ velocity: v, force: f_rolling + f_grade });
    }

    const label = grade === 0
      ? "Rolling Resistance (0% grade)"
      : `Resistance (${(grade * 100).toFixed(0)}% grade)`;

    curves.push({
      name: label,
      points: gradePoints,
      color: gradeColors[gi],
    });
  }
}

/**
 * Hook for running drivetrain simulations.
 */
export function useSimulation() {
  const setStatus = useSimulationStore((s) => s.setStatus);
  const setProgress = useSimulationStore((s) => s.setProgress);
  const setResult = useSimulationStore((s) => s.setResult);
  const setRimpullCurves = useSimulationStore((s) => s.setRimpullCurves);
  const setError = useSimulationStore((s) => s.setError);
  const config = useSimulationStore((s) => s.config);

  const runSimulation = useCallback(
    async (nodes: Node<BaseNodeData>[], edges: Edge[]) => {
      console.log("useSimulation: runSimulation called");
      setStatus("running");
      setProgress(0);
      setError(null);

      try {
        // Build topology
        console.log("Building topology...");
        const topology = buildTopology(nodes, edges);
        console.log("Topology built:", topology.toString());

        // Compile drivetrain
        console.log("Compiling drivetrain...");
        const drivetrain = topology.build();
        console.log("Drivetrain compiled, states:", drivetrain.stateNames);

        // Create simulator
        console.log("Creating simulator...");
        const simulator = new DrivetrainSimulator(drivetrain);

        // Create controller
        console.log("Creating controller...");
        const controller = new SpeedController(drivetrain, 50000, 5000);
        controller.targetVelocity = config.targetVelocity;
        console.log("Target velocity:", config.targetVelocity);

        // Initial state
        const x0: Record<string, number> = {};
        for (const name of drivetrain.stateNames) {
          // Set appropriate initial values based on state type
          if (name.toLowerCase().includes("soc")) {
            // Battery SOC should start at initial value (default 80%)
            const batteryNode = nodes.find(n => n.data.componentType === "battery");
            const socInit = batteryNode?.data.params.socInit as number ?? 0.8;
            x0[name] = socInit;
          } else {
            // Other states (shaft speeds) start at zero
            x0[name] = 0;
          }
        }
        console.log("Initial state:", x0);

        // Simulation config
        const simConfig: SimulationConfig = {
          tStart: 0,
          tEnd: config.tEnd,
          dtOutput: config.dtOutput,
          method: "RK4",
          rtol: 1e-6,
          atol: 1e-8,
          maxStep: 0.01,
        };
        console.log("Simulation config:", simConfig);

        // Run simulation with progress
        console.log("Starting simulation...");
        const result = await simulator.simulateWithProgress(
          x0,
          controller,
          config.grade,
          simConfig,
          (progress) => {
            setProgress(progress);
          }
        );
        console.log("Simulation complete, points:", result.time.length);
        console.log("Available outputs:", Object.keys(result.outputs));
        console.log("Available states:", Object.keys(result.states));

        // Debug: show sample values from outputs
        for (const [key, values] of Object.entries(result.outputs)) {
          if (Array.isArray(values) && values.length > 0) {
            console.log(`  Output "${key}": first=${values[0]?.toFixed(4)}, last=${values[values.length-1]?.toFixed(4)}, max=${Math.max(...values).toFixed(4)}`);
          }
        }

        // Convert to UI format - try multiple possible key names
        const velocityKey = Object.keys(result.outputs).find(k =>
          k.toLowerCase().includes("velocity") || k.toLowerCase().includes("speed") || k === "v"
        );
        const fuelRateKey = Object.keys(result.outputs).find(k =>
          k.toLowerCase().includes("fuel") || k.toLowerCase().includes("mdot")
        );
        const enginePowerKey = Object.keys(result.outputs).find(k =>
          k.toLowerCase().includes("engine") && k.toLowerCase().includes("power") ||
          k.startsWith("P_engine") || k.startsWith("p_engine")
        );
        const motorPowerKey = Object.keys(result.outputs).find(k =>
          k.toLowerCase().includes("motor") && k.toLowerCase().includes("power") ||
          k.startsWith("P_motor") || k.startsWith("p_motor")
        );

        console.log("Matched keys:", { velocityKey, fuelRateKey, enginePowerKey, motorPowerKey });

        // Build drivetrain metadata for UI visibility
        const metadata: DrivetrainMetadata = {
          nMechanicalDofs: drivetrain.nMechanicalDofs,
          nInternalStates: drivetrain.nInternalStates,
          nTotalStates: drivetrain.nStates,
          stateNames: drivetrain.stateNames,
          controlNames: drivetrain.controlNames,
          components: Array.from(drivetrain.topology.components.keys()),
        };

        console.log("Drivetrain metadata:", {
          mechanicalDOFs: metadata.nMechanicalDofs,
          internalStates: metadata.nInternalStates,
          totalStates: metadata.nTotalStates,
          states: metadata.stateNames,
          controls: metadata.controlNames,
        });

        const simResult: SimResult = {
          time: result.time,
          velocity: velocityKey ? result.outputs[velocityKey] : [],
          grade: result.outputs.grade || new Array(result.time.length).fill(config.grade),
          fuelRate: fuelRateKey ? result.outputs[fuelRateKey] : undefined,
          enginePower: enginePowerKey ? result.outputs[enginePowerKey] : undefined,
          motorPower: motorPowerKey ? result.outputs[motorPowerKey] : undefined,
          metadata,
        };

        // Check for SOC in states
        for (const [key, values] of Object.entries(result.states)) {
          if (key.toLowerCase().includes("soc") || key.toLowerCase().includes("battery")) {
            console.log(`Found SOC state "${key}": first=${values[0]?.toFixed(4)}, last=${values[values.length-1]?.toFixed(4)}`);
            simResult.soc = values;
            break;
          }
        }

        // Debug: show final simResult data availability
        console.log("SimResult data:", {
          hasVelocity: simResult.velocity && simResult.velocity.length > 0,
          hasFuelRate: !!simResult.fuelRate,
          hasEnginePower: !!simResult.enginePower,
          hasMotorPower: !!simResult.motorPower,
          hasSOC: !!simResult.soc,
          metadata: simResult.metadata,
        });

        setResult(simResult);
        setStatus("completed");
      } catch (error) {
        console.error("Simulation failed:", error);
        setError(error instanceof Error ? error.message : "Simulation failed");
        setStatus("error");
      }
    },
    [config, setStatus, setProgress, setResult, setError]
  );

  const setOperatingCurves = useSimulationStore((s) => s.setOperatingCurves);

  const calculateRimpull = useCallback(
    (nodes: Node<BaseNodeData>[], edges: Edge[]) => {
      try {
        const result = computeRimpull(nodes, edges);
        setRimpullCurves(result.rimpull);
        setOperatingCurves(result.operating);
      } catch (error) {
        console.error("Rimpull calculation failed:", error);
      }
    },
    [setRimpullCurves, setOperatingCurves]
  );

  return {
    runSimulation,
    calculateRimpull,
  };
}
