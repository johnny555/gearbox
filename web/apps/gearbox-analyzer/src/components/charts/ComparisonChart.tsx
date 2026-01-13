import Plot from "react-plotly.js";
import type { ComparisonResult } from "@/stores/simulation-store";

interface ComparisonChartProps {
  results: ComparisonResult[];
  metric: "velocity" | "fuelRate" | "enginePower" | "motorPower";
}

const METRIC_CONFIG = {
  velocity: {
    label: "Velocity",
    unit: "km/h",
    transform: (v: number) => v * 3.6,
  },
  fuelRate: {
    label: "Fuel Rate",
    unit: "kg/h",
    transform: (v: number) => v * 3600,
  },
  enginePower: {
    label: "Engine Power",
    unit: "kW",
    transform: (v: number) => v / 1000,
  },
  motorPower: {
    label: "Motor Power",
    unit: "kW",
    transform: (v: number) => v / 1000,
  },
};

export function ComparisonChart({ results, metric }: ComparisonChartProps) {
  if (results.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        Run comparison to see results
      </div>
    );
  }

  const config = METRIC_CONFIG[metric];

  const traces: Plotly.Data[] = results
    .filter((r) => {
      if (metric === "velocity") return true;
      if (metric === "fuelRate") return r.result.fuelRate;
      if (metric === "enginePower") return r.result.enginePower;
      if (metric === "motorPower") return r.result.motorPower;
      return false;
    })
    .map((r) => {
      let yData: number[] = [];
      switch (metric) {
        case "velocity":
          yData = r.result.velocity;
          break;
        case "fuelRate":
          yData = r.result.fuelRate || [];
          break;
        case "enginePower":
          yData = r.result.enginePower || [];
          break;
        case "motorPower":
          yData = r.result.motorPower || [];
          break;
      }

      return {
        x: r.result.time,
        y: yData.map(config.transform),
        type: "scatter",
        mode: "lines",
        name: r.label,
        line: { color: r.color, width: 2 },
      };
    });

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { t: 30, r: 30, b: 60, l: 70 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#888" },
    xaxis: {
      title: {
        text: "Time (s)",
        font: { color: "#aaa", size: 12 },
        standoff: 10,
      },
      gridcolor: "#333",
      zerolinecolor: "#444",
      tickfont: { color: "#888" },
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
    },
    legend: {
      x: 0,
      y: 1,
      bgcolor: "rgba(0,0,0,0.5)",
    },
    showlegend: true,
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
