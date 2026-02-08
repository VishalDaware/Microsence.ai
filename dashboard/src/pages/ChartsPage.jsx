import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  Line,
  Bar,
  Radar,
  Doughnut,
  Bubble,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE_URL = "http://localhost:5000/api";

// Professional color scheme
const colors = {
  blue: "rgb(59, 130, 246)",
  red: "rgb(239, 68, 68)",
  green: "rgb(34, 197, 94)",
  yellow: "rgb(234, 179, 8)",
  purple: "rgb(168, 85, 247)",
  cyan: "rgb(34, 211, 238)",
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        font: { size: 13, weight: "bold" },
        color: "#374151",
        padding: 15,
        boxWidth: 12,
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleFont: { size: 14, weight: "bold" },
      bodyFont: { size: 12 },
      padding: 12,
      borderRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        drawBorder: false,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: { size: 11 },
        color: "#6B7280",
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: { size: 11 },
        color: "#6B7280",
      },
    },
  },
};

export default function ChartsPage() {
  const [readingsData, setReadingsData] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [loading, setLoading] = useState(true);

  // Farms and selection
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  // Fetch farms on mount and initial readings
  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    fetchData(selectedFarmId);
  }, [selectedFarmId]);

  const fetchFarms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/farms`);
      const data = await res.json();
      if (data.success) {
        setFarms(data.farms || []);
        if ((data.farms || []).length > 0) {
          setSelectedFarmId((prev) => prev ?? data.farms[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
    }
  };

  const fetchData = async (farmId = null) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/readings/all?limit=20`;
      if (farmId) url += `&farmId=${farmId}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('Fetched readings:', { farmId, url, data });
      if (data.success) {
        setReadingsData(data.readings || []);
      }

      let latestUrl = `${API_BASE_URL}/readings/latest`;
      if (farmId) latestUrl += `?farmId=${farmId}`;
      const latestRes = await fetch(latestUrl);
      const latestData = await latestRes.json();
      console.log('Fetched latest:', { farmId, latestUrl, latestData });
      if (latestData.success) {
        setLatestReading(latestData.rawReading);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for line chart - Soil Moisture Trend
  const moistureData = {
    labels: readingsData
      .slice()
      .reverse()
      .map((_, i) => `Reading ${i + 1}`),
    datasets: [
      {
        label: "Soil Moisture (%)",
        data: readingsData.slice().reverse().map((r) => r.soilMoisture),
        borderColor: colors.blue,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: colors.blue,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
    ],
  };

  // Prepare data for bar chart - Temperature Readings
  const temperatureData = {
    labels: readingsData
      .slice()
      .reverse()
      .map((_, i) => `Reading ${i + 1}`),
    datasets: [
      {
        label: "Temperature (°C)",
        data: readingsData.slice().reverse().map((r) => r.temperature),
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(239, 68, 68, 0.7)",
          "rgba(239, 68, 68, 0.6)",
          "rgba(239, 68, 68, 0.5)",
          "rgba(239, 68, 68, 0.4)",
        ],
        borderColor: colors.red,
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: colors.red,
      },
    ],
  };

  // Prepare data for current sensor readings - Radar
  const sensorComparisonData = {
    labels: ["Soil Moisture", "Temperature", "CO₂", "Nitrate", "pH"],
    datasets: [
      {
        label: "Current Reading",
        data: latestReading
          ? [
              (latestReading.soilMoisture / 80) * 100,
              (latestReading.temperature / 35) * 100,
              (latestReading.co2 / 1000) * 100,
              (latestReading.nitrate / 30) * 100,
              (latestReading.ph / 7.5) * 100,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: "rgba(59, 130, 246, 0.25)",
        borderColor: colors.blue,
        borderWidth: 2,
        pointBackgroundColor: colors.blue,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Optimal Range (100%)",
        data: [100, 100, 100, 100, 100],
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: colors.green,
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: colors.green,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  // Prepare data for gas levels - Bubble/Doughnut
  const gasLevelData = {
    labels: ["CO₂ Level", "Nitrate Level", "pH Level"],
    datasets: [
      {
        label: "Sensor Readings",
        data: latestReading
          ? [latestReading.co2, latestReading.nitrate * 30, latestReading.ph * 100]
          : [0, 0, 0],
        backgroundColor: [
          "rgba(34, 211, 238, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(234, 179, 8, 0.8)",
        ],
        borderColor: [colors.cyan, colors.purple, colors.yellow],
        borderWidth: 3,
      },
    ],
  };

  // Prepare data for environmental conditions - Stacked Bar
  const environmentalData = {
    labels: ["Soil Moisture", "Temperature", "CO₂", "Nitrate", "pH"],
    datasets: [
      {
        label: "Current Value",
        data: latestReading
          ? [
              latestReading.soilMoisture,
              latestReading.temperature,
              (latestReading.co2 / 10) * 1.5, // Scale for visibility
              latestReading.nitrate * 2,
              latestReading.ph * 10,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: colors.blue,
        borderColor: colors.blue,
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Optimal Min",
        data: [20, 15, 30, 5, 5.5 * 10],
        backgroundColor: "rgba(34, 197, 94, 0.3)",
        borderColor: colors.green,
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Optimal Max",
        data: [80, 35, 100, 30, 7.5 * 10],
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        borderColor: colors.red,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const radarChartOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: true,
        },
        ticks: {
          font: { size: 11 },
          color: "#6B7280",
          stepSize: 20,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyan-400" />
          Advanced Analytics & Visualization
        </h1>
        <p className="text-slate-300 text-lg">
          Professional sensor data analysis with real-time metrics
        </p>
      </div>

      {/* Quick Stats */}
      {latestReading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-4 text-white shadow-lg border border-blue-400">
            <p className="text-sm opacity-90">Soil Moisture</p>
            <p className="text-2xl font-bold">{latestReading.soilMoisture}%</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-4 text-white shadow-lg border border-red-400">
            <p className="text-sm opacity-90">Temperature</p>
            <p className="text-2xl font-bold">{latestReading.temperature}°C</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg p-4 text-white shadow-lg border border-cyan-400">
            <p className="text-sm opacity-90">CO₂ Level</p>
            <p className="text-2xl font-bold">{latestReading.co2} ppm</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 text-white shadow-lg border border-purple-400">
            <p className="text-sm opacity-90">Nitrate</p>
            <p className="text-2xl font-bold">{latestReading.nitrate} mg/L</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-4 text-white shadow-lg border border-yellow-400">
            <p className="text-sm opacity-90">pH Level</p>
            <p className="text-2xl font-bold">{latestReading.ph.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Farm selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-slate-300">Select Farm:</label>
        <select
          className="bg-slate-800 text-white rounded-md p-2"
          value={selectedFarmId ?? ""}
          onChange={(e) => setSelectedFarmId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Farms</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2"
          onClick={() => fetchData(selectedFarmId)}
        >
          Refresh
        </button>
      </div>

      {/* Charts Grid */}
      {selectedFarmId ? (
        // Render multi-field charts for the selected farm
        (() => {
          const farm = farms.find((x) => x.id === selectedFarmId) || null;
          const fields = farm?.fields || [];

          if (fields.length === 0) {
            return <div className="text-slate-300">No fields in selected farm.</div>;
          }

          // Color palette for fields
          const fieldColors = [
            "rgb(59, 130, 246)",   // blue
            "rgb(239, 68, 68)",    // red
            "rgb(34, 197, 94)",    // green
            "rgb(234, 179, 8)",    // yellow
            "rgb(168, 85, 247)",   // purple
            "rgb(34, 211, 238)",   // cyan
          ];

          // Prepare data for Soil Moisture Chart (all fields)
          const moistureDataMultiField = {
            labels: readingsData.length > 0 
              ? readingsData.slice().reverse().map((_, i) => `Reading ${i + 1}`)
              : [],
            datasets: fields.map((field, idx) => {
              const fieldReadings = readingsData
                .filter((r) => r.fieldId === field.id)
                .slice()
                .reverse();
              return {
                label: `${field.name} - Soil Moisture (%)`,
                data: fieldReadings.map((r) => r.soilMoisture),
                borderColor: fieldColors[idx % fieldColors.length],
                backgroundColor: fieldColors[idx % fieldColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
              };
            }),
          };

          // Prepare data for Temperature Chart (all fields)
          const temperatureDataMultiField = {
            labels: readingsData.length > 0 
              ? readingsData.slice().reverse().map((_, i) => `Reading ${i + 1}`)
              : [],
            datasets: fields.map((field, idx) => {
              const fieldReadings = readingsData
                .filter((r) => r.fieldId === field.id)
                .slice()
                .reverse();
              return {
                label: `${field.name} - Temperature (°C)`,
                data: fieldReadings.map((r) => r.temperature),
                borderColor: fieldColors[idx % fieldColors.length],
                backgroundColor: fieldColors[idx % fieldColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
              };
            }),
          };

          // Prepare data for CO2 Chart (all fields)
          const co2DataMultiField = {
            labels: readingsData.length > 0 
              ? readingsData.slice().reverse().map((_, i) => `Reading ${i + 1}`)
              : [],
            datasets: fields.map((field, idx) => {
              const fieldReadings = readingsData
                .filter((r) => r.fieldId === field.id)
                .slice()
                .reverse();
              return {
                label: `${field.name} - CO₂ (ppm)`,
                data: fieldReadings.map((r) => r.co2),
                borderColor: fieldColors[idx % fieldColors.length],
                backgroundColor: fieldColors[idx % fieldColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
              };
            }),
          };

          // Prepare data for Nitrate Chart (all fields)
          const nitrateDataMultiField = {
            labels: readingsData.length > 0 
              ? readingsData.slice().reverse().map((_, i) => `Reading ${i + 1}`)
              : [],
            datasets: fields.map((field, idx) => {
              const fieldReadings = readingsData
                .filter((r) => r.fieldId === field.id)
                .slice()
                .reverse();
              return {
                label: `${field.name} - Nitrate (mg/L)`,
                data: fieldReadings.map((r) => r.nitrate),
                borderColor: fieldColors[idx % fieldColors.length],
                backgroundColor: fieldColors[idx % fieldColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
              };
            }),
          };

          // Prepare data for pH Chart (all fields)
          const phDataMultiField = {
            labels: readingsData.length > 0 
              ? readingsData.slice().reverse().map((_, i) => `Reading ${i + 1}`)
              : [],
            datasets: fields.map((field, idx) => {
              const fieldReadings = readingsData
                .filter((r) => r.fieldId === field.id)
                .slice()
                .reverse();
              return {
                label: `${field.name} - pH`,
                data: fieldReadings.map((r) => r.ph),
                borderColor: fieldColors[idx % fieldColors.length],
                backgroundColor: fieldColors[idx % fieldColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
              };
            }),
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Soil Moisture Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PresentationChartLineIcon className="w-6 h-6 text-blue-400" />
                  Soil Moisture Trend
                </h2>
                <div style={{ height: "300px" }}>
                  {readingsData.length > 0 ? (
                    <Line data={moistureDataMultiField} options={chartOptions} />
                  ) : (
                    <p className="text-slate-300">No data to display</p>
                  )}
                </div>
              </div>

              {/* Temperature Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-red-500 transition-colors">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-red-400" />
                  Temperature Trend
                </h2>
                <div style={{ height: "300px" }}>
                  {readingsData.length > 0 ? (
                    <Line data={temperatureDataMultiField} options={chartOptions} />
                  ) : (
                    <p className="text-slate-300">No data to display</p>
                  )}
                </div>
              </div>

              {/* CO2 Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-cyan-500 transition-colors">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PresentationChartLineIcon className="w-6 h-6 text-cyan-400" />
                  CO₂ Levels
                </h2>
                <div style={{ height: "300px" }}>
                  {readingsData.length > 0 ? (
                    <Line data={co2DataMultiField} options={chartOptions} />
                  ) : (
                    <p className="text-slate-300">No data to display</p>
                  )}
                </div>
              </div>

              {/* Nitrate Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-purple-500 transition-colors">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-purple-400" />
                  Nitrate Levels
                </h2>
                <div style={{ height: "300px" }}>
                  {readingsData.length > 0 ? (
                    <Line data={nitrateDataMultiField} options={chartOptions} />
                  ) : (
                    <p className="text-slate-300">No data to display</p>
                  )}
                </div>
              </div>

              {/* pH Chart */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-yellow-500 transition-colors lg:col-span-2">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PresentationChartLineIcon className="w-6 h-6 text-yellow-400" />
                  pH Levels
                </h2>
                <div style={{ height: "300px" }}>
                  {readingsData.length > 0 ? (
                    <Line data={phDataMultiField} options={chartOptions} />
                  ) : (
                    <p className="text-slate-300">No data to display</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        // Fallback: show farm-agnostic charts (original layout)
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Soil Moisture Trend - Line Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PresentationChartLineIcon className="w-6 h-6 text-blue-400" />
              Soil Moisture Trend
            </h2>
            <div style={{ height: "300px" }}>
              <Line
                data={moistureData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    filler: { propagate: true },
                  },
                }}
              />
            </div>
          </div>

          {/* Temperature Distribution - Bar Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-red-500 transition-colors">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-red-400" />
              Temperature Readings
            </h2>
            <div style={{ height: "300px" }}>
              <Bar data={temperatureData} options={chartOptions} />
            </div>
          </div>

          {/* Sensor Comparison - Radar Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-purple-500 transition-colors">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartPieIcon className="w-6 h-6 text-purple-400" />
              Sensor Health Comparison
            </h2>
            <div style={{ height: "300px" }}>
              <Radar data={sensorComparisonData} options={radarChartOptions} />
            </div>
          </div>

          {/* Gas Levels Distribution - Doughnut Chart */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-cyan-500 transition-colors">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartPieIcon className="w-6 h-6 text-cyan-400" />
              Gas & Nutrient Levels
            </h2>
            <div style={{ height: "300px" }}>
              <Doughnut
                data={gasLevelData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Environmental Conditions - Stacked Bar */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700 hover:border-green-500 transition-colors lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-green-400" />
              Environmental Conditions Overview
            </h2>
            <div style={{ height: "300px" }}>
              <Bar
                data={environmentalData}
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    x: {
                      ...chartOptions.scales.x,
                      stacked: false,
                    },
                    y: {
                      ...chartOptions.scales.y,
                      stacked: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Info */}
      <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-4 border border-blue-500 text-slate-300">
        <p className="text-sm">
          📊 Showing {readingsData.length} readings • Last update:{" "}
          {latestReading
            ? new Date(latestReading.timestamp).toLocaleString()
            : "N/A"}
        </p>
      </div>
    </div>
  );
}
