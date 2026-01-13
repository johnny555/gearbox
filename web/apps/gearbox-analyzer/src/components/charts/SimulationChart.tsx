
import dynamic from "next/dynamic";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SimulationChartProps {
  time: number[];
  velocity: number[];
  grade?: number[];
  fuelRate?: number[];
  enginePower?: number[];
  motorPower?: number[];
}

export function SimulationChart({
  time,
  velocity,
  grade,
  fuelRate,
  enginePower,
  motorPower,
}: SimulationChartProps) {
  // Convert velocity to km/h
  const velocityKmh = velocity.map((v) => v * 3.6);

  // Build traces
  const traces: Plotly.Data[] = [
    {
      x: time,
      y: velocityKmh,
      type: "scatter",
      mode: "lines",
      name: "Velocity (km/h)",
      line: { color: "#22c55e", width: 2 },
      yaxis: "y",
    },
  ];

  // Add engine power if available
  if (enginePower && enginePower.some((p) => p !== 0)) {
    const powerKw = enginePower.map((p) => p / 1000);
    traces.push({
      x: time,
      y: powerKw,
      type: "scatter",
      mode: "lines",
      name: "Engine Power (kW)",
      line: { color: "#f97316", width: 2 },
      yaxis: "y2",
    });
  }

  // Add motor power if available
  if (motorPower && motorPower.some((p) => p !== 0)) {
    const powerKw = motorPower.map((p) => p / 1000);
    traces.push({
      x: time,
      y: powerKw,
      type: "scatter",
      mode: "lines",
      name: "Motor Power (kW)",
      line: { color: "#3b82f6", width: 2, dash: "dash" },
      yaxis: "y2",
    });
  }

  // Add fuel rate if available
  if (fuelRate && fuelRate.some((f) => f !== 0)) {
    const fuelKgH = fuelRate.map((f) => f * 3600);
    traces.push({
      x: time,
      y: fuelKgH,
      type: "scatter",
      mode: "lines",
      name: "Fuel Rate (kg/h)",
      line: { color: "#ef4444", width: 1.5, dash: "dot" },
      yaxis: "y3",
    });
  }

  const layout: Partial<Plotly.Layout> = {
    title: "",
    autosize: true,
    margin: { t: 20, r: 80, b: 50, l: 60 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#888" },
    xaxis: {
      title: "Time (s)",
      gridcolor: "#333",
      zerolinecolor: "#444",
    },
    yaxis: {
      title: "Velocity (km/h)",
      titlefont: { color: "#22c55e" },
      tickfont: { color: "#22c55e" },
      gridcolor: "#333",
      zerolinecolor: "#444",
      side: "left",
    },
    yaxis2: {
      title: "Power (kW)",
      titlefont: { color: "#f97316" },
      tickfont: { color: "#f97316" },
      overlaying: "y",
      side: "right",
      showgrid: false,
    },
    yaxis3: {
      title: "Fuel (kg/h)",
      titlefont: { color: "#ef4444" },
      tickfont: { color: "#ef4444" },
      overlaying: "y",
      side: "right",
      position: 0.95,
      showgrid: false,
    },
    legend: {
      x: 0,
      y: 1.1,
      orientation: "h",
      bgcolor: "transparent",
    },
    showlegend: true,
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
