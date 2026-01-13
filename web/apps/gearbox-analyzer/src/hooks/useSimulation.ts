
import { useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import type { BaseNodeData } from "@/stores/drivetrain-store";
import { useSimulationStore, type SimResult, type RimpullCurve, type RimpullPoint } from "@/stores/simulation-store";

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
 * Create a component instance from node data.
 */
function createComponent(
  nodeData: BaseNodeData
): import("drivetrain-sim").DrivetrainComponent | null {
  const { componentType, params } = nodeData;

  try {
    switch (componentType) {
      case "engine": {
        return new EngineComponent({
          jEngine: 200,
          rpmIdle: params.rpmIdle as number,
          rpmMax: params.rpmMax as number,
          pRated: params.pRated as number,
          tPeak: params.tPeak as number,
        });
      }

      case "motor": {
        return new MotorComponent({
          jRotor: 10,
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
          jInput: 50,
          jOutput: 100,
        });
      }

      case "planetary": {
        return new PlanetaryGearComponent({
          zSun: params.zSun as number,
          zRing: params.zRing as number,
          jSun: 5,
          jCarrier: 150,
          jRing: 10,
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
          rhoAir: 1.225,
          cD: 0.8,
          aFrontal: 50,
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
 * Compute rimpull curves for the drivetrain.
 *
 * Detects topology type and calculates appropriately:
 * - Diesel: Engine → Gearbox → Vehicle (conventional)
 * - eCVT: Engine + Motors + Planetary → Gearbox → Vehicle
 */
function computeRimpull(
  nodes: Node<BaseNodeData>[],
  edges: Edge[]
): RimpullCurve[] {
  const curves: RimpullCurve[] = [];

  // Find key components
  const engineNode = nodes.find((n) => n.data.componentType === "engine");
  const motorNodes = nodes.filter((n) => n.data.componentType === "motor");
  const planetaryNode = nodes.find((n) => n.data.componentType === "planetary");
  const gearboxNode = nodes.find((n) => n.data.componentType === "gearbox");
  const vehicleNode = nodes.find((n) => n.data.componentType === "vehicle");

  if (!vehicleNode) {
    return curves;
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
    curves.push(...computeECVTRimpull(
      engineNode, motorNodes, planetaryNode!, gearboxNode, vehicleParams, rWheel
    ));
  } else if (engineNode) {
    // Diesel topology: Engine → Gearbox → Vehicle
    curves.push(...computeDieselRimpull(
      engineNode, gearboxNode, vehicleParams, rWheel
    ));
  } else if (motorNodes.length > 0) {
    // Pure electric: Motor → Gearbox → Vehicle
    curves.push(...computeElectricRimpull(
      motorNodes, gearboxNode, vehicleParams, rWheel
    ));
  }

  // Add resistance curves
  addResistanceCurves(curves, mTotal, cR);

  return curves;
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
      name: `Gear ${g + 1} (${ratio.toFixed(2)}:1)`,
      points,
      color: gearColors[g % gearColors.length],
    });
  }

  return curves;
}

/**
 * Compute rimpull for eCVT (power-split hybrid) drivetrain.
 * Uses Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
 */
function computeECVTRimpull(
  engineNode: Node<BaseNodeData>,
  motorNodes: Node<BaseNodeData>[],
  planetaryNode: Node<BaseNodeData>,
  gearboxNode: Node<BaseNodeData> | undefined,
  vehicleParams: Record<string, unknown>,
  rWheel: number
): RimpullCurve[] {
  const curves: RimpullCurve[] = [];

  // Engine parameters
  const engineParams = engineNode.data.params;
  const rpmEngineMin = (engineParams.rpmIdle as number) || 700;
  const rpmEngineMax = (engineParams.rpmMax as number) || 1800;
  const tEngineMax = (engineParams.tPeak as number) || 11220;

  // Planetary ratio: ρ = Z_ring / Z_sun
  const planetaryParams = planetaryNode.data.params;
  const zSun = (planetaryParams.zSun as number) || 30;
  const zRing = (planetaryParams.zRing as number) || 90;
  const rho = zRing / zSun; // typically 3.0

  // Motor parameters (find MG1 and MG2)
  // MG1 is typically lower power (reaction motor), MG2 is higher power (traction motor)
  const sortedMotors = [...motorNodes].sort((a, b) =>
    ((a.data.params.pMax as number) || 0) - ((b.data.params.pMax as number) || 0)
  );

  const mg1Params = sortedMotors[0]?.data.params || {};
  const mg2Params = sortedMotors[1]?.data.params || sortedMotors[0]?.data.params || {};

  const pMG1Max = (mg1Params.pMax as number) || 200000;
  const tMG1Max = (mg1Params.tMax as number) || 3000;
  const rpmMG1Max = (mg1Params.rpmMax as number) || 6000;

  const pMG2Max = (mg2Params.pMax as number) || 350000;
  const tMG2Max = (mg2Params.tMax as number) || 2000;
  const rpmMG2Max = (mg2Params.rpmMax as number) || 6000;
  const pMG2Boost = (mg2Params.pBoost as number) || pMG2Max;

  // Gearbox ratios (2-speed for eCVT)
  const gearRatios = gearboxNode
    ? (gearboxNode.data.params.ratios as number[]) || [5.0, 0.67]
    : [5.0, 0.67];
  const gearEfficiencies = gearboxNode
    ? (gearboxNode.data.params.efficiencies as number[]) || [0.97, 0.97]
    : [0.97, 0.97];

  // Final drive (typically included in gearbox total ratio for eCVT)
  const finalDrive = 16.0;

  // Speed range (0 to 60 km/h)
  const numPoints = 200;
  const vMax = 60 / 3.6; // 60 km/h in m/s

  const gearColors = ["#3b82f6", "#ef4444"]; // Blue for low, red for high

  for (let g = 0; g < Math.min(gearRatios.length, 2); g++) {
    const gearRatio = gearRatios[g];
    const eta = gearEfficiencies[g] || 0.97;
    const kTotal = gearRatio * finalDrive;
    const points: RimpullPoint[] = [];

    for (let i = 1; i <= numPoints; i++) {
      const velocity = (vMax * i) / numPoints;

      // Ring speed from vehicle speed (ring connects to gearbox input)
      const omegaRing = (velocity / rWheel) * kTotal;
      const rpmRing = (omegaRing * 30) / Math.PI;

      // Check MG2 speed limit (MG2 is on ring)
      if (rpmRing > rpmMG2Max) {
        points.push({ velocity, force: 0, gear: g + 1 });
        continue;
      }

      // Optimal engine speed (near peak torque, ~1200 rpm)
      let rpmEngine = 1200;
      let omegaEngine = (rpmEngine * Math.PI) / 30;

      // MG1 speed from Willis equation: ω_sun = (1+ρ)·ω_carrier - ρ·ω_ring
      // Engine is on carrier, MG1 is on sun
      let omegaMG1 = (1 + rho) * omegaEngine - rho * omegaRing;
      let rpmMG1 = (omegaMG1 * 30) / Math.PI;

      // Check MG1 speed limits and adjust engine speed if needed
      if (Math.abs(rpmMG1) > rpmMG1Max) {
        // Limit MG1 speed and recalculate engine speed
        const omegaMG1Limit = (rpmMG1 > 0 ? rpmMG1Max : -rpmMG1Max) * Math.PI / 30;
        omegaEngine = (omegaMG1Limit + rho * omegaRing) / (1 + rho);
        rpmEngine = (omegaEngine * 30) / Math.PI;
        omegaMG1 = omegaMG1Limit;
        rpmMG1 = (omegaMG1 * 30) / Math.PI;
      }

      // Clamp engine to valid range
      rpmEngine = Math.max(rpmEngineMin, Math.min(rpmEngineMax, rpmEngine));
      omegaEngine = (rpmEngine * Math.PI) / 30;
      omegaMG1 = (1 + rho) * omegaEngine - rho * omegaRing;
      rpmMG1 = (omegaMG1 * 30) / Math.PI;

      // Get max torques
      // Engine max torque (could be power-limited)
      const omegaBase = (1801000) / tEngineMax; // power/torque
      let tEngineAvail = omegaEngine <= omegaBase
        ? tEngineMax
        : 1801000 / omegaEngine;

      // MG1 max torque (power-limited at high speed)
      const omegaMG1Base = pMG1Max / tMG1Max;
      const tMG1MaxAtSpeed = Math.abs(omegaMG1) <= omegaMG1Base
        ? tMG1Max
        : pMG1Max / Math.abs(omegaMG1);

      // MG2 max torque (with boost)
      const omegaMG2Base = pMG2Boost / tMG2Max;
      const tMG2MaxAtSpeed = omegaRing <= omegaMG2Base
        ? tMG2Max
        : pMG2Boost / omegaRing;

      // MG1 must react engine torque: T_MG1 = -T_engine / (1+ρ)
      // So max engine torque is limited by MG1 capacity
      const tEngineLimited = Math.min(tEngineAvail, (1 + rho) * tMG1MaxAtSpeed);

      // MG1 reaction torque
      const tMG1 = -tEngineLimited / (1 + rho);

      // Ring torque from engine path (through planetary)
      // T_ring_from_engine = -ρ × T_MG1 = ρ/(1+ρ) × T_engine
      const tRingFromEngine = -rho * tMG1;

      // Total ring torque = engine contribution + MG2 contribution
      const tRingTotal = tRingFromEngine + tMG2MaxAtSpeed;

      // Wheel torque and rimpull
      const tWheel = tRingTotal * kTotal * eta;
      const force = tWheel / rWheel;

      points.push({ velocity, force: Math.max(0, force), gear: g + 1 });
    }

    const gearName = g === 0 ? "Low Gear" : "High Gear";
    curves.push({
      name: `${gearName} (${gearRatio.toFixed(2)}:1)`,
      points,
      color: gearColors[g],
    });
  }

  return curves;
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

  const gearColors = ["#3b82f6", "#22c55e", "#f97316"];

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

        // Initial state (zero velocities)
        const x0: Record<string, number> = {};
        for (const name of drivetrain.stateNames) {
          x0[name] = 0;
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

        // Convert to UI format
        const simResult: SimResult = {
          time: result.time,
          velocity: result.outputs.velocity || [],
          grade: result.outputs.grade || new Array(result.time.length).fill(config.grade),
          fuelRate: result.outputs.fuel_rate,
          enginePower: Object.entries(result.outputs)
            .find(([k]) => k.startsWith("P_engine"))?.[1],
          motorPower: Object.entries(result.outputs)
            .find(([k]) => k.startsWith("P_motor"))?.[1],
        };

        // Check for SOC in states
        for (const [key, values] of Object.entries(result.states)) {
          if (key.toLowerCase().includes("soc") || key.toLowerCase().includes("battery")) {
            simResult.soc = values;
            break;
          }
        }

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

  const calculateRimpull = useCallback(
    (nodes: Node<BaseNodeData>[], edges: Edge[]) => {
      try {
        const curves = computeRimpull(nodes, edges);
        setRimpullCurves(curves);
      } catch (error) {
        console.error("Rimpull calculation failed:", error);
      }
    },
    [setRimpullCurves]
  );

  return {
    runSimulation,
    calculateRimpull,
  };
}
