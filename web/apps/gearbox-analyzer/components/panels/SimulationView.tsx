"use client";

import { useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, AlertCircle, Loader2, X, GitCompare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDrivetrainStore, type PresetName } from "@/stores/drivetrain-store";
import {
  useSimulationStore,
  PRESET_COLORS,
  PRESET_LABELS,
  type ComparisonResult,
} from "@/stores/simulation-store";
import { useSimulation } from "@/hooks/useSimulation";
import { SimulationChart } from "@/components/charts/SimulationChart";
import { RimpullChart } from "@/components/charts/RimpullChart";
import { ComparisonChart } from "@/components/charts/ComparisonChart";
import { ComparisonRimpullChart } from "@/components/charts/ComparisonRimpullChart";

interface SimulationViewProps {
  onClose: () => void;
}

const ALL_PRESETS: PresetName[] = ["diesel-793d", "ecvt-split"];

export function SimulationView({ onClose }: SimulationViewProps) {
  const nodes = useDrivetrainStore((s) => s.nodes);
  const edges = useDrivetrainStore((s) => s.edges);
  const validateTopology = useDrivetrainStore((s) => s.validateTopology);
  const loadPreset = useDrivetrainStore((s) => s.loadPreset);

  const config = useSimulationStore((s) => s.config);
  const setConfig = useSimulationStore((s) => s.setConfig);
  const status = useSimulationStore((s) => s.status);
  const progress = useSimulationStore((s) => s.progress);
  const result = useSimulationStore((s) => s.result);
  const error = useSimulationStore((s) => s.error);
  const rimpullCurves = useSimulationStore((s) => s.rimpullCurves);
  const reset = useSimulationStore((s) => s.reset);

  // Comparison state
  const comparisonResults = useSimulationStore((s) => s.comparisonResults);
  const addComparisonResult = useSimulationStore((s) => s.addComparisonResult);
  const clearComparisonResults = useSimulationStore((s) => s.clearComparisonResults);
  const runningPreset = useSimulationStore((s) => s.runningPreset);
  const setRunningPreset = useSimulationStore((s) => s.setRunningPreset);

  const [isComparing, setIsComparing] = useState(false);
  const [completedPresets, setCompletedPresets] = useState<PresetName[]>([]);

  const { runSimulation, calculateRimpull } = useSimulation();

  // Calculate rimpull when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0) {
      calculateRimpull(nodes, edges);
    }
  }, [nodes, edges, calculateRimpull]);

  const handleRunSimulation = async () => {
    if (nodes.length === 0) {
      alert("No components in the topology. Load a preset or add components first.");
      return;
    }

    const validation = validateTopology();
    if (!validation.isValid) {
      alert("Invalid topology:\n" + validation.errors.join("\n"));
      return;
    }

    try {
      await runSimulation(nodes, edges);
    } catch (err) {
      console.error("Simulation error:", err);
      alert("Simulation failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const runComparisonForPreset = useCallback(
    async (preset: PresetName): Promise<ComparisonResult | null> => {
      try {
        // Load the preset
        loadPreset(preset);

        // Wait a tick for state to update
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Get the new nodes/edges from store
        const state = useDrivetrainStore.getState();
        const presetNodes = state.nodes;
        const presetEdges = state.edges;

        if (presetNodes.length === 0) {
          console.error(`No nodes for preset ${preset}`);
          return null;
        }

        // Calculate rimpull for this preset
        calculateRimpull(presetNodes, presetEdges);
        const presetRimpull = useSimulationStore.getState().rimpullCurves;

        // Run simulation
        await runSimulation(presetNodes, presetEdges);

        // Get result
        const simResult = useSimulationStore.getState().result;
        if (!simResult) {
          console.error(`No result for preset ${preset}`);
          return null;
        }

        return {
          preset,
          label: PRESET_LABELS[preset],
          color: PRESET_COLORS[preset],
          result: simResult,
          rimpullCurves: presetRimpull,
        };
      } catch (err) {
        console.error(`Error running ${preset}:`, err);
        return null;
      }
    },
    [loadPreset, runSimulation, calculateRimpull]
  );

  const handleRunComparison = async () => {
    setIsComparing(true);
    setCompletedPresets([]);
    clearComparisonResults();

    for (const preset of ALL_PRESETS) {
      setRunningPreset(preset);

      const result = await runComparisonForPreset(preset);
      if (result) {
        addComparisonResult(result);
        setCompletedPresets((prev) => [...prev, preset]);
      }
    }

    setRunningPreset(null);
    setIsComparing(false);
  };

  const handleClearComparison = () => {
    clearComparisonResults();
    setCompletedPresets([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-subtle bg-dark">
        <h2 className="text-lg font-semibold text-primary">Simulation & Analysis</h2>

        <div className="flex items-center gap-4">
          {/* Simulation Controls */}
          <div className="flex items-center gap-3">
            {status === "running" && !isComparing && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <div className="h-2 w-40 bg-subtle rounded-full overflow-hidden">
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

            {status !== "running" && !isComparing ? (
              <Button type="button" variant="accent" size="sm" onClick={handleRunSimulation}>
                <Play className="h-4 w-4 mr-1" />
                Run Current
              </Button>
            ) : !isComparing ? (
              <Button type="button" variant="destructive" size="sm" onClick={reset}>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Running...
              </Button>
            ) : null}

            <Button
              type="button"
              variant={isComparing ? "destructive" : "default"}
              size="sm"
              onClick={handleRunComparison}
              disabled={isComparing}
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4 mr-1" />
                  Compare All
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                handleClearComparison();
              }}
              disabled={status === "running" || isComparing}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-8 bg-subtle" />

          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Configuration */}
        <div className="w-72 border-r border-subtle bg-dark p-4 overflow-auto">
          <h3 className="text-sm font-medium text-primary mb-4">Configuration</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Duration (s)</Label>
              <Input
                type="number"
                value={config.tEnd}
                onChange={(e) => setConfig({ tEnd: parseFloat(e.target.value) || 60 })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Target Speed (km/h)</Label>
              <Input
                type="number"
                value={(config.targetVelocity * 3.6).toFixed(1)}
                onChange={(e) => setConfig({ targetVelocity: (parseFloat(e.target.value) || 0) / 3.6 })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Grade (%)</Label>
              <Input
                type="number"
                value={(config.grade * 100).toFixed(1)}
                onChange={(e) => setConfig({ grade: (parseFloat(e.target.value) || 0) / 100 })}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Payload (%)</Label>
              <Input
                type="number"
                value={(config.payloadFraction * 100).toFixed(0)}
                onChange={(e) => setConfig({ payloadFraction: (parseFloat(e.target.value) || 100) / 100 })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Output Step (s)</Label>
              <Input
                type="number"
                value={config.dtOutput}
                onChange={(e) => setConfig({ dtOutput: parseFloat(e.target.value) || 0.1 })}
                step={0.05}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Comparison Progress */}
          {(isComparing || comparisonResults.length > 0) && (
            <div className="mt-6 pt-4 border-t border-subtle">
              <h3 className="text-sm font-medium text-primary mb-3">Comparison Status</h3>
              <div className="space-y-2">
                {ALL_PRESETS.map((preset) => {
                  const isRunning = runningPreset === preset;
                  const isComplete = completedPresets.includes(preset);
                  const hasResult = comparisonResults.some((r) => r.preset === preset);

                  return (
                    <div
                      key={preset}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PRESET_COLORS[preset] }}
                      />
                      <span className="flex-1 text-muted">{PRESET_LABELS[preset]}</span>
                      {isRunning && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
                      {hasResult && <Check className="h-3 w-3 text-green-500" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {result && !isComparing && comparisonResults.length === 0 && (
            <div className="mt-6 pt-4 border-t border-subtle">
              <h3 className="text-sm font-medium text-primary mb-3">Results Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Final Speed:</span>
                  <span className="text-primary">
                    {(result.velocity[result.velocity.length - 1] * 3.6).toFixed(1)} km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Max Speed:</span>
                  <span className="text-primary">
                    {(Math.max(...result.velocity) * 3.6).toFixed(1)} km/h
                  </span>
                </div>
                {result.fuelRate && (
                  <div className="flex justify-between">
                    <span className="text-muted">Avg Fuel Rate:</span>
                    <span className="text-primary">
                      {((result.fuelRate.reduce((a, b) => a + b, 0) / result.fuelRate.length) * 3600).toFixed(1)} kg/h
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Sim Duration:</span>
                  <span className="text-primary">{result.time.length} points</span>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Summary */}
          {comparisonResults.length > 0 && (
            <div className="mt-6 pt-4 border-t border-subtle">
              <h3 className="text-sm font-medium text-primary mb-3">Comparison Summary</h3>
              <div className="space-y-3">
                {comparisonResults.map((r) => (
                  <div key={r.preset} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="font-medium text-primary">{r.label}</span>
                    </div>
                    <div className="pl-4 space-y-1 text-muted">
                      <div className="flex justify-between">
                        <span>Max Speed:</span>
                        <span>{(Math.max(...r.result.velocity) * 3.6).toFixed(1)} km/h</span>
                      </div>
                      {r.result.fuelRate && (
                        <div className="flex justify-between">
                          <span>Avg Fuel:</span>
                          <span>
                            {((r.result.fuelRate.reduce((a, b) => a + b, 0) / r.result.fuelRate.length) * 3600).toFixed(1)} kg/h
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Charts */}
        <div className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="comparison" className="h-full flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="results">Current Topology</TabsTrigger>
              <TabsTrigger value="rimpull">Rimpull (Current)</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="flex-1">
              <div className="h-full grid grid-rows-2 gap-4">
                <div className="bg-surface rounded-lg border border-subtle p-4">
                  <h3 className="text-sm font-medium text-primary mb-2">Velocity Comparison</h3>
                  <div className="h-[calc(100%-2rem)]">
                    <ComparisonChart results={comparisonResults} metric="velocity" />
                  </div>
                </div>
                <div className="bg-surface rounded-lg border border-subtle p-4">
                  <h3 className="text-sm font-medium text-primary mb-2">Rimpull Comparison</h3>
                  <div className="h-[calc(100%-2rem)]">
                    <ComparisonRimpullChart results={comparisonResults} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="flex-1">
              <div className="h-full bg-surface rounded-lg border border-subtle p-4">
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
                    {status === "running" ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        <span>Simulation in progress...</span>
                      </div>
                    ) : (
                      <span>Run a simulation to see results</span>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rimpull" className="flex-1">
              <div className="h-full bg-surface rounded-lg border border-subtle p-4">
                <RimpullChart curves={rimpullCurves} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
