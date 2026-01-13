import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDrivetrainStore, type ComponentType } from "@/stores/drivetrain-store";

interface ComponentEditModalProps {
  nodeId: string | null;
  onClose: () => void;
}

// Parameter definitions for each component type
// displayFactor: multiply stored value by this to get display value (e.g., m/s * 3.6 = km/h)
const PARAM_DEFINITIONS: Record<
  ComponentType,
  { key: string; label: string; unit: string; step?: number; displayFactor?: number }[]
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
    { key: "eta", label: "Efficiency", unit: "", step: 0.01 },
  ],
  gearbox: [], // Handled separately with gear ratio editor
  planetary: [
    { key: "zSun", label: "Sun Teeth", unit: "teeth" },
    { key: "zRing", label: "Ring Teeth", unit: "teeth" },
  ],
  battery: [
    { key: "capacityKwh", label: "Capacity", unit: "kWh" },
    { key: "vNom", label: "Nominal Voltage", unit: "V" },
    { key: "pMaxDischarge", label: "Max Discharge", unit: "W" },
    { key: "pMaxCharge", label: "Max Charge", unit: "W" },
    { key: "socInit", label: "Initial SOC", unit: "", step: 0.01 },
  ],
  vehicle: [
    { key: "mEmpty", label: "Empty Mass", unit: "kg" },
    { key: "mPayload", label: "Payload Mass", unit: "kg" },
    { key: "rWheel", label: "Wheel Radius", unit: "m", step: 0.01 },
    { key: "cR", label: "Rolling Coeff", unit: "", step: 0.001 },
    { key: "vMax", label: "Max Velocity", unit: "km/h", step: 1, displayFactor: 3.6 },
  ],
};

export function ComponentEditModal({ nodeId, onClose }: ComponentEditModalProps) {
  const nodes = useDrivetrainStore((s) => s.nodes);
  const updateNodeParams = useDrivetrainStore((s) => s.updateNodeParams);
  const updateNodeLabel = useDrivetrainStore((s) => s.updateNodeLabel);
  const removeNode = useDrivetrainStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === nodeId);
  const [localName, setLocalName] = useState("");
  const [localParams, setLocalParams] = useState<Record<string, unknown>>({});

  // Sync local state with node data
  useEffect(() => {
    if (node) {
      setLocalName(node.data.label);
      setLocalParams({ ...node.data.params });
    }
  }, [node]);

  if (!node) {
    return null;
  }

  const componentType = node.data.componentType;
  const paramDefs = PARAM_DEFINITIONS[componentType];

  const handleParamChange = (key: string, value: string, displayFactor?: number) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // If displayFactor is set, convert from display units to storage units
      const storedValue = displayFactor ? numValue / displayFactor : numValue;
      setLocalParams((prev) => ({ ...prev, [key]: storedValue }));
    }
  };

  const handleSave = () => {
    if (!nodeId) return;
    // Update node label
    updateNodeLabel(nodeId, localName);
    // Update params
    updateNodeParams(nodeId, localParams);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Delete "${node.data.label}"?`)) {
      removeNode(nodeId!);
      onClose();
    }
  };

  // Gear ratio handling for gearbox
  const ratios = (localParams.ratios as number[]) || [];
  const efficiencies = (localParams.efficiencies as number[]) || [];

  const handleAddGear = () => {
    const newRatios = [...ratios, 1.0];
    const newEfficiencies = [...efficiencies, 0.97];
    setLocalParams((prev) => ({
      ...prev,
      ratios: newRatios,
      efficiencies: newEfficiencies,
    }));
  };

  const handleRemoveGear = (index: number) => {
    if (ratios.length <= 1) return;
    const newRatios = ratios.filter((_, i) => i !== index);
    const newEfficiencies = efficiencies.filter((_, i) => i !== index);
    setLocalParams((prev) => ({
      ...prev,
      ratios: newRatios,
      efficiencies: newEfficiencies,
    }));
  };

  const handleRatioChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newRatios = [...ratios];
      newRatios[index] = numValue;
      setLocalParams((prev) => ({ ...prev, ratios: newRatios }));
    }
  };

  const handleEfficiencyChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 1) {
      const newEfficiencies = [...efficiencies];
      newEfficiencies[index] = numValue;
      setLocalParams((prev) => ({ ...prev, efficiencies: newEfficiencies }));
    }
  };

  return (
    <Dialog open={!!nodeId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  componentType === "engine"
                    ? "#dc2626"
                    : componentType === "motor"
                    ? "#2563eb"
                    : componentType === "gearbox"
                    ? "#9333ea"
                    : componentType === "planetary"
                    ? "#0d9488"
                    : componentType === "battery"
                    ? "#d97706"
                    : "#16a34a",
              }}
            />
            Edit {componentType.charAt(0).toUpperCase() + componentType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Editable Name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted">Name</Label>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Component name"
            />
          </div>

          <Separator />

          {/* Component-specific parameters */}
          {componentType === "gearbox" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted">Gear Ratios</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGear}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Gear
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ratios.map((ratio, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-surface rounded border border-subtle"
                  >
                    <span className="text-xs text-muted w-16">Gear {index + 1}</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={ratio}
                        onChange={(e) => handleRatioChange(index, e.target.value)}
                        step={0.01}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        value={efficiencies[index] || 0.97}
                        onChange={(e) => handleEfficiencyChange(index, e.target.value)}
                        step={0.01}
                        min={0}
                        max={1}
                        className="h-8 text-sm"
                        title="Efficiency"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveGear(index)}
                      disabled={ratios.length <= 1}
                      className="text-muted hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted">
                Ratio | Efficiency (0-1)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paramDefs.map((param) => (
                <div key={param.key} className="space-y-1">
                  <Label className="text-xs text-muted">
                    {param.label}
                    {param.unit && (
                      <span className="text-muted ml-1">({param.unit})</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={
                      param.displayFactor
                        ? ((localParams[param.key] as number) || 0) * param.displayFactor
                        : (localParams[param.key] as number) || 0
                    }
                    onChange={(e) => handleParamChange(param.key, e.target.value, param.displayFactor)}
                    step={param.step || 1}
                  />
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="accent" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
