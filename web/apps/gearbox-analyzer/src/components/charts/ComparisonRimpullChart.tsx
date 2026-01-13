import Plot from "react-plotly.js";
import type { ComparisonResult, RimpullCurve, RimpullPoint } from "@/stores/simulation-store";

interface ComparisonRimpullChartProps {
  results: ComparisonResult[];
}

/**
 * Interpolate force at a given velocity from a curve's points.
 */
function interpolateForce(points: RimpullPoint[], velocity: number): number {
  if (points.length === 0) return 0;

  // Find surrounding points
  let left = 0;
  let right = points.length - 1;

  // Check bounds
  if (velocity <= points[0].velocity) return points[0].force;
  if (velocity >= points[right].velocity) return points[right].force;

  // Binary search for surrounding points
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].velocity <= velocity && points[i + 1].velocity >= velocity) {
      left = i;
      right = i + 1;
      break;
    }
  }

  // Linear interpolation
  const v0 = points[left].velocity;
  const v1 = points[right].velocity;
  const f0 = points[left].force;
  const f1 = points[right].force;

  if (v1 === v0) return f0;

  const t = (velocity - v0) / (v1 - v0);
  return f0 + t * (f1 - f0);
}

/**
 * Compute the envelope (max force) across all gear curves at each velocity.
 */
function computeEnvelope(
  gearCurves: RimpullCurve[],
  velocities: number[]
): number[] {
  return velocities.map((v) => {
    let maxForce = 0;
    for (const curve of gearCurves) {
      const force = interpolateForce(curve.points, v);
      maxForce = Math.max(maxForce, force);
    }
    return maxForce;
  });
}

export function ComparisonRimpullChart({ results }: ComparisonRimpullChartProps) {
  if (results.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted">
        Run comparison to see rimpull curves
      </div>
    );
  }

  const traces: Plotly.Data[] = [];

  // Common velocity grid (0 to 60 km/h in m/s)
  const numPoints = 200;
  const maxSpeedMs = 60 / 3.6;
  const commonVelocities: number[] = [];
  for (let i = 0; i <= numPoints; i++) {
    commonVelocities.push((maxSpeedMs * i) / numPoints);
  }

  // Add rimpull curves from each preset (only gear curves, not resistance)
  for (const r of results) {
    const gearCurves = r.rimpullCurves.filter(
      (c) => !c.name.includes("Resistance") && !c.name.includes("Rolling")
    );

    // Compute envelope by interpolating all curves to common velocity grid
    if (gearCurves.length > 0) {
      const envelopeForces = computeEnvelope(gearCurves, commonVelocities);

      traces.push({
        x: commonVelocities.map((v) => v * 3.6),
        y: envelopeForces.map((f) => f / 1000),
        type: "scatter",
        mode: "lines",
        name: r.label,
        line: { color: r.color, width: 3 },
        fill: "tozeroy",
        fillcolor: `${r.color}20`,
      });
    }
  }

  // Add resistance curves (from first result, since they should be the same)
  if (results.length > 0) {
    const resistanceCurves = results[0].rimpullCurves.filter(
      (c) => c.name.includes("Resistance") || c.name.includes("Rolling")
    );

    for (const curve of resistanceCurves) {
      traces.push({
        x: curve.points.map((p) => p.velocity * 3.6),
        y: curve.points.map((p) => p.force / 1000),
        type: "scatter",
        mode: "lines",
        name: curve.name,
        line: {
          color: curve.color,
          width: 1.5,
          dash: "dash",
        },
      });
    }
  }

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { t: 30, r: 30, b: 50, l: 60 },
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
