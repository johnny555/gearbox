import Plot from "react-plotly.js";

interface SimulationChartProps {
  time: number[];
  data: number[];
  label: string;
  unit: string;
  color: string;
}

export function SimulationChart({
  time,
  data,
  label,
  unit,
  color,
}: SimulationChartProps) {
  // Handle empty data gracefully
  if (!data || data.length === 0 || !time || time.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        No data available
      </div>
    );
  }

  const traces: Plotly.Data[] = [
    {
      x: time,
      y: data,
      type: "scatter",
      mode: "lines",
      name: `${label} (${unit})`,
      line: { color, width: 2 },
    },
  ];

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { t: 20, r: 40, b: 60, l: 70 },
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
        text: `${label} (${unit})`,
        font: { color: "#aaa", size: 12 },
        standoff: 10,
      },
      tickfont: { color: "#888" },
      gridcolor: "#333",
      zerolinecolor: "#444",
    },
    showlegend: false,
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
