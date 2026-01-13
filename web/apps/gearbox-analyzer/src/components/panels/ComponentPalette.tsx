
import { Flame, Zap, Settings, Circle, Battery, Truck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDrivetrainStore, type ComponentType, type PresetName } from "@/stores/drivetrain-store";
import { cn } from "@/lib/utils";

const COMPONENT_ITEMS: {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { type: "engine", label: "Engine", icon: <Flame className="h-4 w-4" />, color: "bg-red-600" },
  { type: "motor", label: "Motor", icon: <Zap className="h-4 w-4" />, color: "bg-blue-600" },
  { type: "gearbox", label: "Gearbox", icon: <Settings className="h-4 w-4" />, color: "bg-purple-600" },
  { type: "planetary", label: "Planetary", icon: <Circle className="h-4 w-4" />, color: "bg-teal-600" },
  { type: "battery", label: "Battery", icon: <Battery className="h-4 w-4" />, color: "bg-amber-600" },
  { type: "vehicle", label: "Vehicle", icon: <Truck className="h-4 w-4" />, color: "bg-green-600" },
];

const PRESETS: { name: PresetName; label: string }[] = [
  { name: "diesel-793d", label: "CAT 793D Diesel" },
  { name: "ecvt-split", label: "eCVT Power Split" },
];

export function ComponentPalette() {
  const addNode = useDrivetrainStore((s) => s.addNode);
  const loadPreset = useDrivetrainStore((s) => s.loadPreset);
  const clearAll = useDrivetrainStore((s) => s.clearAll);

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-64 flex flex-col gap-4 p-4 bg-dark border-r border-subtle overflow-y-auto">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Components</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {COMPONENT_ITEMS.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border border-subtle cursor-grab",
                "hover:border-secondary hover:bg-surface/50 transition-all"
              )}
            >
              <div className={cn("p-2 rounded-md text-white", item.color)}>
                {item.icon}
              </div>
              <span className="text-xs text-secondary">{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Presets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => loadPreset(preset.name)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-destructive hover:text-destructive"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
