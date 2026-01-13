import Plot from "react-plotly.js";
import type { RimpullCurve } from "@/stores/simulation-store";

interface RimpullChartProps {
  curves: RimpullCurve[];
}

export function RimpullChart({ curves }: RimpullChartProps) {
  if (curves.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        No rimpull data available
      </div>
    );
  }

  // Line dash styles for different gear configurations
  const gearDashStyles: Plotly.Dash[] = ["solid", "dash", "dot", "dashdot", "longdash", "longdashdot"];

  // Separate gear curves from resistance curves
  const gearCurves = curves.filter((c) => !c.name?.includes("Resistance"));
  const resistanceCurves = curves.filter((c) => c.name?.includes("Resistance"));

  // Convert to Plotly traces with defensive checks
  const traces: Plotly.Data[] = [
    // Gear curves with different dash styles
    ...gearCurves
      .filter((curve) => curve.points && curve.points.length > 0)
      .map((curve, idx) => ({
        x: curve.points.map((p) => p.velocity * 3.6), // Convert to km/h
        y: curve.points.map((p) => p.force / 1000), // Convert to kN
        type: "scatter" as const,
        mode: "lines" as const,
        name: curve.name || `Gear ${idx + 1}`,
        line: {
          color: curve.color || "#3b82f6",
          width: 2.5,
          dash: gearDashStyles[idx % gearDashStyles.length],
        },
        fill: "tozeroy" as const,
        fillcolor: `${curve.color || "#3b82f6"}15`,
      })),
    // Resistance curves (always thin dashed gray)
    ...resistanceCurves
      .filter((curve) => curve.points && curve.points.length > 0)
      .map((curve) => ({
        x: curve.points.map((p) => p.velocity * 3.6),
        y: curve.points.map((p) => p.force / 1000),
        type: "scatter" as const,
        mode: "lines" as const,
        name: curve.name || "Resistance",
        line: {
          color: curve.color || "#888888",
          width: 1.5,
          dash: "dash" as const,
        },
      })),
  ];

  const layout: Partial<Plotly.Layout> = {
    title: "",
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
      range: [0, 60],
    },
    yaxis: {
      title: {
        text: "Tractive Force (kN)",
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

  const config: Partial<Plotly.Config> = {
    displayModeBar: false,
    responsive: true,
  };

  return (
    <div className="w-full h-full min-h-[180px]">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
