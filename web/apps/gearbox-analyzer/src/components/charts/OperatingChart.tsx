import Plot from "react-plotly.js";
import type { OperatingCurve } from "@/stores/simulation-store";

interface OperatingChartProps {
  curves: OperatingCurve[];
  metric: "rpm" | "torque" | "power";
  component?: "engine" | "mg1" | "mg2" | "all";
}

const METRIC_CONFIG = {
  rpm: {
    label: "RPM",
    unit: "rpm",
    getter: (p: OperatingCurve["points"][0]) => p.rpm,
  },
  torque: {
    label: "Torque",
    unit: "N·m",
    getter: (p: OperatingCurve["points"][0]) => p.torque,
  },
  power: {
    label: "Power",
    unit: "kW",
    getter: (p: OperatingCurve["points"][0]) => p.power / 1000,
  },
};

export function OperatingChart({ curves, metric, component = "all" }: OperatingChartProps) {
  // Filter curves by component if specified
  const filteredCurves = component === "all"
    ? curves
    : curves.filter((c) => c.component === component);

  if (filteredCurves.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        No operating data available
      </div>
    );
  }

  const config = METRIC_CONFIG[metric];

  // Line dash styles for different gears
  const dashStyles: Plotly.Dash[] = ["solid", "dash", "dot", "dashdot", "longdash", "longdashdot"];

  // Track gear indices per component to assign different styles
  const gearIndexByComponent: Record<string, number> = {};

  // Convert to Plotly traces with defensive checks
  const traces: Plotly.Data[] = filteredCurves
    .filter((curve) => curve.points && curve.points.length > 0)
    .map((curve) => {
      // Get gear index for this component to determine dash style
      const componentKey = curve.component;
      if (!(componentKey in gearIndexByComponent)) {
        gearIndexByComponent[componentKey] = 0;
      }
      const gearIndex = gearIndexByComponent[componentKey];
      gearIndexByComponent[componentKey]++;

      return {
        x: curve.points.map((p) => p.velocity * 3.6), // Convert to km/h
        y: curve.points.map((p) => config.getter(p)),
        type: "scatter",
        mode: "lines",
        name: curve.name || `Curve ${gearIndex + 1}`,
        line: {
          color: curve.color || "#3b82f6",
          width: 2,
          dash: dashStyles[gearIndex % dashStyles.length],
        },
      };
    });

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { t: 20, r: 40, b: 60, l: 70 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#888" },
    xaxis: {
      title: {
        text: "Speed (km/h)",
        font: { color: "#aaa", size: 12 },
        standoff: 10,
      },
      gridcolor: "#333",
      zerolinecolor: "#444",
      tickfont: { color: "#888" },
      range: [0, 70],
    },
    yaxis: {
      title: {
        text: `${config.label} (${config.unit})`,
        font: { color: "#aaa", size: 12 },
        standoff: 10,
      },
      gridcolor: "#333",
      zerolinecolor: "#444",
      tickfont: { color: "#888" },
      range: [0, null],
    },
    legend: {
      x: 1,
      xanchor: "right",
      y: 1,
      bgcolor: "rgba(0,0,0,0.5)",
    },
    showlegend: true,
    hovermode: "closest",
  };

  const plotConfig: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <div className="w-full h-full min-h-[180px]">
      <Plot
        data={traces}
        layout={layout}
        config={plotConfig}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
