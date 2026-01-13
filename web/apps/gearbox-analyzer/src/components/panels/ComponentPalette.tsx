import { useState } from "react";
import {
  Flame,
  Zap,
  Settings,
  Circle,
  Battery,
  Truck,
  ChevronDown,
  ChevronRight,
  Cog,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDrivetrainStore, type ComponentType, type PresetName } from "@/stores/drivetrain-store";
import { cn } from "@/lib/utils";

interface ComponentItem {
  id: string;
  type: ComponentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultLabel?: string;
  params?: Record<string, unknown>;
}

interface Category {
  name: string;
  items: ComponentItem[];
}

const CATEGORIES: Category[] = [
  {
    name: "Engines",
    items: [
      {
        id: "engine-generic",
        type: "engine",
        label: "Engine",
        description: "Generic ICE",
        icon: <Flame className="h-4 w-4" />,
        color: "bg-red-600",
      },
      {
        id: "engine-3516e",
        type: "engine",
        label: "CAT 3516E",
        description: "1.8 MW, 11,220 Nm",
        icon: <Flame className="h-4 w-4" />,
        color: "bg-red-700",
        defaultLabel: "CAT 3516E",
        params: {
          rpmIdle: 700,
          rpmMax: 1800,
          pRated: 1801000,
          tPeak: 11220,
        },
      },
      {
        id: "engine-3516c",
        type: "engine",
        label: "CAT 3516C",
        description: "1.4 MW, 8,677 Nm",
        icon: <Flame className="h-4 w-4" />,
        color: "bg-red-700",
        defaultLabel: "CAT 3516C",
        params: {
          rpmIdle: 700,
          rpmMax: 1800,
          pRated: 1417000,
          tPeak: 8677,
        },
      },
    ],
  },
  {
    name: "Motors",
    items: [
      {
        id: "motor-generic",
        type: "motor",
        label: "Motor",
        description: "Generic electric motor",
        icon: <Zap className="h-4 w-4" />,
        color: "bg-blue-600",
      },
      {
        id: "motor-mg1",
        type: "motor",
        label: "MG1 (Reaction)",
        description: "250 kW, 3,500 Nm",
        icon: <Zap className="h-4 w-4" />,
        color: "bg-blue-700",
        defaultLabel: "MG1",
        params: {
          pMax: 250000,
          tMax: 3500,
          rpmMax: 6000,
          eta: 0.92,
        },
      },
      {
        id: "motor-mg2",
        type: "motor",
        label: "MG2 (Traction)",
        description: "500 kW, 5,400 Nm",
        icon: <Zap className="h-4 w-4" />,
        color: "bg-blue-700",
        defaultLabel: "MG2",
        params: {
          pMax: 500000,
          pBoost: 500000,
          tMax: 5400,
          rpmMax: 4000,
          eta: 0.92,
        },
      },
    ],
  },
  {
    name: "Energy Storage",
    items: [
      {
        id: "battery-generic",
        type: "battery",
        label: "Battery Pack",
        description: "200 kWh, 700V",
        icon: <Battery className="h-4 w-4" />,
        color: "bg-amber-600",
      },
    ],
  },
  {
    name: "Transmissions",
    items: [
      {
        id: "gearbox-generic",
        type: "gearbox",
        label: "Gearbox",
        description: "Multi-speed transmission",
        icon: <Settings className="h-4 w-4" />,
        color: "bg-purple-600",
      },
      {
        id: "planetary-generic",
        type: "planetary",
        label: "Planetary",
        description: "Sun/carrier/ring gear set",
        icon: <Circle className="h-4 w-4" />,
        color: "bg-teal-600",
      },
    ],
  },
  {
    name: "Vehicles",
    items: [
      {
        id: "vehicle-generic",
        type: "vehicle",
        label: "Vehicle",
        description: "Generic mining truck",
        icon: <Truck className="h-4 w-4" />,
        color: "bg-green-600",
      },
      {
        id: "vehicle-793d",
        type: "vehicle",
        label: "CAT 793D",
        description: "227t payload, 1.78m wheel",
        icon: <Truck className="h-4 w-4" />,
        color: "bg-green-700",
        defaultLabel: "CAT 793D",
        params: {
          mEmpty: 159350,
          mPayload: 227000,
          rWheel: 1.78,
          cR: 0.025,
          vMax: 15.0,
        },
      },
      {
        id: "vehicle-789d",
        type: "vehicle",
        label: "CAT 789D",
        description: "181t payload, 1.60m wheel",
        icon: <Truck className="h-4 w-4" />,
        color: "bg-green-700",
        defaultLabel: "CAT 789D",
        params: {
          mEmpty: 143000,
          mPayload: 181000,
          rWheel: 1.60,
          cR: 0.025,
          vMax: 15.6,
        },
      },
    ],
  },
];

const PRESETS: { name: PresetName; label: string; description: string }[] = [
  { name: "diesel-793d", label: "CAT 793D", description: "7-speed diesel" },
  { name: "diesel-789d", label: "CAT 789D", description: "6-speed diesel" },
  { name: "ecvt-split", label: "eCVT Split", description: "Hybrid power-split" },
  { name: "ecvt-detailed", label: "eCVT Detailed", description: "Matches Python sim" },
];

export function ComponentPalette() {
  const loadPreset = useDrivetrainStore((s) => s.loadPreset);
  const clearAll = useDrivetrainStore((s) => s.clearAll);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.name))
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: ComponentItem) => {
    // Store all the component data in the drag event
    const dragData = {
      type: item.type,
      label: item.defaultLabel,
      params: item.params,
    };
    e.dataTransfer.setData("application/reactflow", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-72 flex flex-col gap-3 p-4 bg-dark border-r border-subtle overflow-y-auto">
      {/* Components Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CATEGORIES.map((category) => (
            <div key={category.name}>
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center gap-2 py-1.5 text-xs font-medium text-muted hover:text-primary transition-colors"
              >
                {expandedCategories.has(category.name) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {category.name}
              </button>

              {/* Category Items */}
              {expandedCategories.has(category.name) && (
                <div className="ml-2 space-y-1">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border border-subtle cursor-grab",
                        "hover:border-secondary hover:bg-surface/50 transition-all"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-md text-white", item.color)}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary">
                          {item.label}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Start Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2"
              onClick={() => loadPreset(preset.name)}
            >
              <div className="text-left">
                <div className="font-medium">{preset.label}</div>
                <div className="text-xs text-muted">{preset.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Clear Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={clearAll}
      >
        Clear Canvas
      </Button>
    </div>
  );
}
