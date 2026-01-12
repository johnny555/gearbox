"use client";

import { useEffect } from "react";
import { Play, Square, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDrivetrainStore } from "@/stores/drivetrain-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useSimulation } from "@/hooks/useSimulation";
import { SimulationChart } from "@/components/charts/SimulationChart";
import { RimpullChart } from "@/components/charts/RimpullChart";

export function SimulationPanel() {
  const nodes = useDrivetrainStore((s) => s.nodes);
  const edges = useDrivetrainStore((s) => s.edges);
  const validateTopology = useDrivetrainStore((s) => s.validateTopology);

  const config = useSimulationStore((s) => s.config);
  const setConfig = useSimulationStore((s) => s.setConfig);
  const status = useSimulationStore((s) => s.status);
  const progress = useSimulationStore((s) => s.progress);
  const result = useSimulationStore((s) => s.result);
  const error = useSimulationStore((s) => s.error);
  const rimpullCurves = useSimulationStore((s) => s.rimpullCurves);
  const reset = useSimulationStore((s) => s.reset);

  const { runSimulation, calculateRimpull } = useSimulation();

  // Calculate rimpull when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0) {
      calculateRimpull(nodes, edges);
    }
  }, [nodes, edges, calculateRimpull]);

  const handleRunSimulation = async () => {
    console.log("Run simulation clicked, nodes:", nodes.length, "edges:", edges.length);

    if (nodes.length === 0) {
      alert("No components in the topology. Load a preset or add components first.");
      return;
    }

    const validation = validateTopology();
    console.log("Validation result:", validation);

    if (!validation.isValid) {
      alert("Invalid topology:\n" + validation.errors.join("\n"));
      return;
    }

    try {
      console.log("Starting simulation...");
      await runSimulation(nodes, edges);
      console.log("Simulation completed");
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Simulation failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleStop = () => {
    reset();
  };

  return (
    <div className="h-64 bg-dark border-t border-subtle p-4 overflow-hidden">
      <Tabs defaultValue="config" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="rimpull">Rimpull</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {status === "running" && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <div className="h-2 w-32 bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span>{Math.round(progress * 100)}%</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span>Error</span>
              </div>
            )}

            {status !== "running" ? (
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={handleRunSimulation}
              >
                <Play className="h-4 w-4 mr-1" />
                Run Simulation
              </Button>
            ) : (
              <Button type="button" variant="destructive" size="sm" onClick={handleStop}>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Running...
              </Button>
            )}

            <Button type="button" variant="outline" size="sm" onClick={reset} disabled={status === "running"}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="config" className="flex-1 overflow-auto">
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Duration (s)</Label>
              <Input
                type="number"
                value={config.tEnd}
                onChange={(e) =>
                  setConfig({ tEnd: parseFloat(e.target.value) || 60 })
                }
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target Speed (km/h)</Label>
              <Input
                type="number"
                value={(config.targetVelocity * 3.6).toFixed(1)}
                onChange={(e) =>
                  setConfig({
                    targetVelocity: (parseFloat(e.target.value) || 0) / 3.6,
                  })
                }
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grade (%)</Label>
              <Input
                type="number"
                value={(config.grade * 100).toFixed(1)}
                onChange={(e) =>
                  setConfig({ grade: (parseFloat(e.target.value) || 0) / 100 })
                }
                step={0.5}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payload (%)</Label>
              <Input
                type="number"
                value={(config.payloadFraction * 100).toFixed(0)}
                onChange={(e) =>
                  setConfig({
                    payloadFraction: (parseFloat(e.target.value) || 100) / 100,
                  })
                }
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Output Step (s)</Label>
              <Input
                type="number"
                value={config.dtOutput}
                onChange={(e) =>
                  setConfig({ dtOutput: parseFloat(e.target.value) || 0.1 })
                }
                step={0.05}
                className="h-8"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <span className="font-semibold">Simulation Error:</span> {error}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="flex-1 overflow-hidden">
          {result ? (
            <SimulationChart
              time={result.time}
              velocity={result.velocity}
              grade={result.grade}
              fuelRate={result.fuelRate}
              enginePower={result.enginePower}
              motorPower={result.motorPower}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted">
              {status === "running"
                ? "Simulation in progress..."
                : "Run a simulation to see results"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rimpull" className="flex-1 overflow-hidden">
          <RimpullChart curves={rimpullCurves} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
