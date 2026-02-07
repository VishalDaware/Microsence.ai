import { useEffect, useRef, useId } from "react";

export default function Chart3D({ data = [], title = "3D Visualization" }) {
  const chartRef = useRef(null);
  const uniqueId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!window.Plotly) {
      const script = document.createElement("script");
      script.src = "https://cdn.plot.ly/plotly-latest.min.js";
      script.onload = renderChart;
      document.body.appendChild(script);
    } else {
      renderChart();
    }
  }, [data]);

  const renderChart = () => {
    if (!chartRef.current) return;

    if (!data || data.length === 0) {
      window.Plotly.react(
        chartRef.current,
        [
          {
            x: [0],
            y: [0],
            z: [0],
            type: "scatter3d",
            mode: "markers",
            name: "No Data",
          },
        ],
        { title },
        { responsive: true }
      );
      return;
    }

    // REAL analytical mapping
    const x = data.map((_, i) => i); // timeline
    const y = data.map((d) => Number(d.value) || 0); // actual value
    const z = y.map((v) => Math.log(v + 1)); // intensity (trend, not fake)

    const trace = {
      x,
      y,
      z,
      type: "scatter3d",
      mode: "lines+markers",
      name: title,
      line: {
        width: 3,
      },
      marker: {
        size: 5,
        color: y,
        colorscale: "Turbo",
        showscale: true,
        colorbar: {
          title: "Value",
        },
      },
    };

    const layout = {
      title: {
        text: title,
        font: { size: 18 },
      },
      scene: {
        xaxis: { title: "Time" },
        yaxis: { title: "Value" },
        zaxis: { title: "Trend Intensity" },
        camera: {
          eye: { x: 1.6, y: 1.6, z: 1.3 },
        },
      },
      margin: { l: 0, r: 0, t: 40, b: 0 },
      hovermode: "closest",
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    };

    window.Plotly.react(chartRef.current, [trace], layout, config);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-3">
      <div
        ref={chartRef}
        id={`chart-${uniqueId}`}
        style={{ width: "100%", height: "420px" }}
      />
    </div>
  );
}
