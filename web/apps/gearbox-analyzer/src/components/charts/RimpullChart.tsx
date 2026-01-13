
import dynamic from "next/dynamic";
import type { RimpullCurve } from "@/stores/simulation-store";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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

  // Convert to Plotly traces
  const traces: Plotly.Data[] = curves.map((curve) => ({
    x: curve.points.map((p) => p.velocity * 3.6), // Convert to km/h
    y: curve.points.map((p) => p.force / 1000), // Convert to kN
    type: "scatter",
    mode: "lines",
    name: curve.name,
    line: {
      color: curve.color,
      width: curve.name.includes("Resistance") ? 1.5 : 2.5,
      dash: curve.name.includes("Resistance") ? "dash" : "solid",
    },
    fill: curve.name.includes("Resistance") ? undefined : "tozeroy",
    fillcolor: curve.name.includes("Resistance")
      ? undefined
      : `${curve.color}15`,
  }));

  const layout: Partial<Plotly.Layout> = {
    title: "",
    autosize: true,
    margin: { t: 20, r: 40, b: 50, l: 60 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#888" },
    xaxis: {
      title: "Speed (km/h)",
      gridcolor: "#333",
      zerolinecolor: "#444",
      range: [0, 60],
    },
    yaxis: {
      title: "Tractive Force (kN)",
      gridcolor: "#333",
      zerolinecolor: "#444",
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
