import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  RotateCcw,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Download,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDrivetrainStore } from "@/stores/drivetrain-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useSimulation } from "@/hooks/useSimulation";
import { SimulationChart } from "@/components/charts/SimulationChart";
import { RimpullChart } from "@/components/charts/RimpullChart";
import { OperatingChart } from "@/components/charts/OperatingChart";

export function SimulationPage() {
  const navigate = useNavigate();

  const nodes = useDrivetrainStore((s) => s.nodes);
  const edges = useDrivetrainStore((s) => s.edges);
  const drivetrainName = useDrivetrainStore((s) => s.name);
  const setName = useDrivetrainStore((s) => s.setName);

  const config = useSimulationStore((s) => s.config);
  const setConfig = useSimulationStore((s) => s.setConfig);
  const status = useSimulationStore((s) => s.status);
  const progress = useSimulationStore((s) => s.progress);
  const result = useSimulationStore((s) => s.result);
  const error = useSimulationStore((s) => s.error);
  const rimpullCurves = useSimulationStore((s) => s.rimpullCurves);
  const operatingCurves = useSimulationStore((s) => s.operatingCurves);
  const reset = useSimulationStore((s) => s.reset);

  const { runSimulation, calculateRimpull } = useSimulation();

  // Plot visibility toggles
  const [visiblePlots, setVisiblePlots] = useState({
    rimpull: true,
    componentRpm: true,
    componentTorque: true,
    componentPower: true,
    velocity: true,
    power: true,
    fuelRate: true,
    soc: true,
  });

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(drivetrainName);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update editing title when drivetrain name changes
  useEffect(() => {
    setEditingTitle(drivetrainName);
  }, [drivetrainName]);

  const handleTitleSubmit = () => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setName(trimmed);
    } else {
      setEditingTitle(drivetrainName);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setEditingTitle(drivetrainName);
      setIsEditingTitle(false);
    }
  };

  // Calculate rimpull when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0) {
      calculateRimpull(nodes, edges);
    }
  }, [nodes, edges, calculateRimpull]);

  const handleRunSimulation = async () => {
    if (nodes.length === 0) {
      return;
    }
    await runSimulation(nodes, edges);
  };

  const handleExportResults = () => {
    if (!result) return;

    const csvRows: string[] = [];
    // Header
    const headers = ["Time (s)", "Velocity (km/h)"];
    if (result.fuelRate) headers.push("Fuel Rate (kg/h)");
    if (result.enginePower) headers.push("Engine Power (kW)");
    if (result.motorPower) headers.push("Motor Power (kW)");
    if (result.soc) headers.push("SOC (%)");
    csvRows.push(headers.join(","));

    // Data rows
    for (let i = 0; i < result.time.length; i++) {
      const row: (string | number)[] = [];
      row.push(result.time[i].toFixed(2));
      row.push((result.velocity[i] * 3.6).toFixed(2));
      if (result.fuelRate) row.push((result.fuelRate[i] * 3600).toFixed(2));
      if (result.enginePower) row.push((result.enginePower[i] / 1000).toFixed(2));
      if (result.motorPower) row.push((result.motorPower[i] / 1000).toFixed(2));
      if (result.soc) row.push((result.soc[i] * 100).toFixed(2));
      csvRows.push(row.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${drivetrainName.replace(/\s+/g, "_")}_simulation.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePlot = (key: keyof typeof visiblePlots) => {
    setVisiblePlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if drivetrain is empty
  if (nodes.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-black">
        <header className="h-14 flex items-center px-4 border-b border-subtle bg-dark">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/design")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Design
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center text-muted">
          <div className="text-center">
            <p className="text-lg mb-2">No drivetrain loaded</p>
            <p className="text-sm mb-4">
              Go back to the Design page to create or load a drivetrain
            </p>
            <Button variant="accent" onClick={() => navigate("/design")}>
              Go to Design
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-subtle bg-dark">
        {/* Left: Navigation */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/design")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Design
          </Button>
          <span className="text-sm text-muted">
            {nodes.length} components
          </span>
        </div>

        {/* Center: Editable Title */}
        <div className="flex-1 flex justify-center">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-semibold text-primary bg-transparent border-b-2 border-accent outline-none text-center max-w-md"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-accent transition-colors group"
            >
              {drivetrainName}
              <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-1 justify-end">
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

          {error && (
            <div className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            variant="accent"
            onClick={handleRunSimulation}
            disabled={status === "running"}
          >
            {status === "running" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={status === "running"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Configuration */}
        <div className="w-72 border-r border-subtle bg-dark p-4 overflow-auto">
          {/* Simulation Config */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-primary mb-4">Simulation Config</h3>
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
                  onChange={(e) =>
                    setConfig({ targetVelocity: (parseFloat(e.target.value) || 0) / 3.6 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Grade (%)</Label>
                <Input
                  type="number"
                  value={(config.grade * 100).toFixed(1)}
                  onChange={(e) =>
                    setConfig({ grade: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Payload (%)</Label>
                <Input
                  type="number"
                  value={(config.payloadFraction * 100).toFixed(0)}
                  onChange={(e) =>
                    setConfig({ payloadFraction: (parseFloat(e.target.value) || 100) / 100 })
                  }
                />
              </div>
            </div>
          </div>

          {/* Plot Toggles */}
          <div className="mb-6 pt-4 border-t border-subtle">
            <h3 className="text-sm font-medium text-primary mb-3">Visible Plots</h3>
            <div className="space-y-2">
              {Object.entries(visiblePlots).map(([key, visible]) => {
                const labels: Record<string, string> = {
                  rimpull: "Rimpull Curves",
                  componentRpm: "Component RPM",
                  componentTorque: "Component Torque",
                  componentPower: "Component Power",
                  velocity: "Velocity vs Time",
                  power: "Engine Power",
                  fuelRate: "Fuel Rate",
                  soc: "Battery SOC",
                };
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => togglePlot(key as keyof typeof visiblePlots)}
                      className="rounded border-subtle"
                    />
                    <span className="text-muted">{labels[key] || key}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Export */}
          {result && (
            <div className="pt-4 border-t border-subtle">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleExportResults}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results (CSV)
              </Button>
            </div>
          )}
        </div>

        {/* Right: Charts */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Rimpull Chart - Always show if we have curves */}
            {visiblePlots.rimpull && rimpullCurves.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Rimpull Curves
                </h3>
                <div className="h-80">
                  <RimpullChart curves={rimpullCurves} />
                </div>
              </div>
            )}

            {/* Component RPM vs Speed */}
            {visiblePlots.componentRpm && operatingCurves.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Component RPM vs Speed
                </h3>
                <div className="h-80">
                  <OperatingChart curves={operatingCurves} metric="rpm" />
                </div>
              </div>
            )}

            {/* Component Torque vs Speed */}
            {visiblePlots.componentTorque && operatingCurves.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Component Torque vs Speed
                </h3>
                <div className="h-80">
                  <OperatingChart curves={operatingCurves} metric="torque" />
                </div>
              </div>
            )}

            {/* Component Power vs Speed */}
            {visiblePlots.componentPower && operatingCurves.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Component Power vs Speed
                </h3>
                <div className="h-80">
                  <OperatingChart curves={operatingCurves} metric="power" />
                </div>
              </div>
            )}

            {/* Summary Statistics - Show if we have results */}
            {result && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-4">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted">Max Speed</div>
                    <div className="text-primary font-medium">
                      {(Math.max(...result.velocity) * 3.6).toFixed(1)} km/h
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Sim Duration</div>
                    <div className="text-primary font-medium">
                      {result.time[result.time.length - 1].toFixed(1)} s
                    </div>
                  </div>
                  {result.fuelRate && (
                    <div>
                      <div className="text-muted">Avg Fuel Rate</div>
                      <div className="text-primary font-medium">
                        {(
                          (result.fuelRate.reduce((a, b) => a + b, 0) /
                            result.fuelRate.length) *
                          3600
                        ).toFixed(1)}{" "}
                        kg/h
                      </div>
                    </div>
                  )}
                  {result.enginePower && (
                    <div>
                      <div className="text-muted">Peak Power</div>
                      <div className="text-primary font-medium">
                        {(Math.max(...result.enginePower) / 1000).toFixed(0)} kW
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Velocity Chart */}
            {visiblePlots.velocity && result && result.velocity && result.velocity.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Velocity vs Time
                </h3>
                <div className="h-64">
                  <SimulationChart
                    time={result.time}
                    data={result.velocity.map((v) => v * 3.6)}
                    label="Velocity"
                    unit="km/h"
                    color="#3b82f6"
                  />
                </div>
              </div>
            )}

            {/* Power Chart */}
            {visiblePlots.power && result?.enginePower && result.enginePower.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Engine Power vs Time
                </h3>
                <div className="h-64">
                  <SimulationChart
                    time={result.time}
                    data={result.enginePower.map((p) => p / 1000)}
                    label="Power"
                    unit="kW"
                    color="#ef4444"
                  />
                </div>
              </div>
            )}

            {/* Fuel Rate Chart */}
            {visiblePlots.fuelRate && result?.fuelRate && result.fuelRate.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Fuel Rate vs Time
                </h3>
                <div className="h-64">
                  <SimulationChart
                    time={result.time}
                    data={result.fuelRate.map((f) => f * 3600)}
                    label="Fuel Rate"
                    unit="kg/h"
                    color="#f59e0b"
                  />
                </div>
              </div>
            )}

            {/* SOC Chart */}
            {visiblePlots.soc && result?.soc && result.soc.length > 0 && (
              <div className="bg-surface rounded-lg border border-subtle p-4">
                <h3 className="text-sm font-medium text-primary mb-2">
                  State of Charge vs Time
                </h3>
                <div className="h-64">
                  <SimulationChart
                    time={result.time}
                    data={result.soc.map((s) => s * 100)}
                    label="SOC"
                    unit="%"
                    color="#22c55e"
                  />
                </div>
              </div>
            )}

            {/* No simulation run yet message */}
            {!result && rimpullCurves.length === 0 && (
              <div className="h-64 flex items-center justify-center text-muted">
                <div className="text-center">
                  <p className="text-lg mb-2">No data yet</p>
                  <p className="text-sm">
                    Click "Run Simulation" to generate results
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
