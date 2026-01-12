"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { useDrivetrainStore, type ComponentType } from "@/stores/drivetrain-store";

// Parameter definitions for each component type
const PARAM_DEFS: Record<
  ComponentType,
  Array<{ key: string; label: string; unit?: string; step?: number }>
> = {
  engine: [
    { key: "rpmIdle", label: "Idle RPM", unit: "rpm" },
    { key: "rpmMax", label: "Max RPM", unit: "rpm" },
    { key: "pRated", label: "Rated Power", unit: "W" },
    { key: "tPeak", label: "Peak Torque", unit: "N·m" },
  ],
  motor: [
    { key: "pMax", label: "Max Power", unit: "W" },
    { key: "pBoost", label: "Boost Power", unit: "W" },
    { key: "tMax", label: "Max Torque", unit: "N·m" },
    { key: "rpmMax", label: "Max RPM", unit: "rpm" },
    { key: "eta", label: "Efficiency", step: 0.01 },
  ],
  gearbox: [
    { key: "ratios", label: "Ratios (comma-sep)" },
  ],
  planetary: [
    { key: "zSun", label: "Sun Teeth" },
    { key: "zRing", label: "Ring Teeth" },
  ],
  battery: [
    { key: "capacityKwh", label: "Capacity", unit: "kWh" },
    { key: "vNom", label: "Voltage", unit: "V" },
    { key: "pMaxDischarge", label: "Max Discharge", unit: "W" },
    { key: "pMaxCharge", label: "Max Charge", unit: "W" },
    { key: "socInit", label: "Initial SOC", step: 0.01 },
  ],
  vehicle: [
    { key: "mEmpty", label: "Empty Mass", unit: "kg" },
    { key: "mPayload", label: "Payload", unit: "kg" },
    { key: "rWheel", label: "Wheel Radius", unit: "m", step: 0.01 },
    { key: "cR", label: "Rolling Coeff", step: 0.001 },
    { key: "vMax", label: "Max Speed", unit: "m/s" },
  ],
};

export function PropertiesPanel() {
  const nodes = useDrivetrainStore((s) => s.nodes);
  const selectedNodeId = useDrivetrainStore((s) => s.selectedNodeId);
  const updateNodeParams = useDrivetrainStore((s) => s.updateNodeParams);
  const removeNode = useDrivetrainStore((s) => s.removeNode);
  const setSelectedNode = useDrivetrainStore((s) => s.setSelectedNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-72 p-4 bg-dark border-l border-subtle">
        <Card>
          <CardContent className="py-8 text-center text-muted">
            Select a component to edit its properties
          </CardContent>
        </Card>
      </div>
    );
  }

  const componentType = selectedNode.data.componentType;
  const params = selectedNode.data.params;
  const paramDefs = PARAM_DEFS[componentType] ?? [];

  const handleChange = (key: string, value: string) => {
    let parsedValue: unknown = value;

    // Special handling for ratios array
    if (key === "ratios") {
      parsedValue = value.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        parsedValue = num;
      }
    }

    updateNodeParams(selectedNode.id, { [key]: parsedValue });
  };

  const handleDelete = () => {
    removeNode(selectedNode.id);
    setSelectedNode(null);
  };

  return (
    <div className="w-72 flex flex-col gap-4 p-4 bg-dark border-l border-subtle overflow-y-auto">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{selectedNode.data.label}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardTitle>
          <p className="text-xs text-muted capitalize">{componentType}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />
          {paramDefs.map((def) => {
            const value = params[def.key];
            const displayValue = Array.isArray(value)
              ? value.join(", ")
              : String(value ?? "");

            return (
              <div key={def.key} className="space-y-1">
                <Label htmlFor={def.key} className="text-xs">
                  {def.label}
                  {def.unit && <span className="text-muted ml-1">({def.unit})</span>}
                </Label>
                <Input
                  id={def.key}
                  value={displayValue}
                  onChange={(e) => handleChange(def.key, e.target.value)}
                  step={def.step}
                  className="h-8 text-sm"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
