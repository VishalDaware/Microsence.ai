import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// Plugin to draw an optimal region band on Y axis
const optimalRegionPlugin = {
  id: "optimalRegion",
  beforeDatasetsDraw(chart) {
    const {
      ctx,
      chartArea,
      scales: { y },
      options,
    } = chart;

    if (!chartArea || !y) return;

    const pluginOpts = options?.plugins?.optimalRegion;
    const optimalMin = pluginOpts?.optimalMin;
    const optimalMax = pluginOpts?.optimalMax;

    if (
      typeof optimalMin !== "number" ||
      typeof optimalMax !== "number" ||
      optimalMin === optimalMax
    ) {
      return;
    }

    const { top, bottom, left, right } = chartArea;

    const yTop = y.getPixelForValue(optimalMax);
    const yBottom = y.getPixelForValue(optimalMin);

    ctx.save();
    ctx.fillStyle = "rgba(147, 218, 151, 0.16)";
    ctx.fillRect(left, yTop, right - left, yBottom - yTop);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  optimalRegionPlugin
);

const API_BASE_URL = "http://localhost:5000/api";

const primary = "#3E5F44";
const secondary = "#5E936C";
const accent = "#93DA97";
const bgLight = "#E8FFD7";
const warning = "#f59e0b";
const danger = "#ef4444";

// Optimal ranges for each parameter
const OPTIMAL_RANGES = {
  soilMoisture: { min: 40, max: 65, label: "Moisture (%)" },
  temperature: { min: 24, max: 28, label: "Temperature (°C)" },
  co2: { min: 400, max: 600, label: "CO₂ (ppm)" },
  nitrate: { min: 15, max: 25, label: "Nitrate (mg/L)" },
  ph: { min: 6.0, max: 6.5, label: "pH" },
};

export default function ChartsPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [fieldReadings, setFieldReadings] = useState({}); // {fieldId: latestReading}
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCompletedFarms();
    }
  }, [userId]);

  useEffect(() => {
    if (userId && selectedFarmId !== null) {
      fetchFieldReadings(selectedFarmId);
    }
  }, [selectedFarmId, userId]);

  // Fetch only COMPLETED farms
  const fetchCompletedFarms = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/farms?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        // Filter to show only completed farms
        const completedFarms = (data.farms || []).filter(farm => farm.completed);
        setFarms(completedFarms);
        
        if (completedFarms.length > 0) {
          setSelectedFarmId(completedFarms[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Error fetching farms:", err);
      setLoading(false);
    }
  };

  // Fetch latest reading for each field in the selected farm
  const fetchFieldReadings = async (farmId) => {
    if (!userId) return;
    setLoading(true);
    try {
      console.log("📊 Fetching field readings for farm:", farmId);
      const selectedFarm = farms.find(f => f.id === farmId);
      if (!selectedFarm || !selectedFarm.fields) {
        console.warn("❌ Farm not found or has no fields");
        setFieldReadings({});
        setLoading(false);
        return;
      }

      console.log(`🌾 Farm has ${selectedFarm.fields.length} fields:`, selectedFarm.fields.map(f => f.name));

      const readingsMap = {};
      
      // Fetch latest reading for each field
      for (const field of selectedFarm.fields) {
        try {
          console.log(`  → Fetching latest reading for field ${field.id} (${field.name})`);
          const res = await fetch(
            `${API_BASE_URL}/readings/latest?userId=${userId}&fieldId=${field.id}`
          );
          const data = await res.json();
          if (data.success && data.readings) {
            console.log(`    ✓ Got reading for ${field.name}:`, {
              moisture: data.readings.soilmoisture?.value,
              temp: data.readings.temperature?.value,
              co2: data.readings.co2?.value
            });
            readingsMap[field.id] = {
              ...data.readings,
              fieldName: field.name,
              fieldId: field.id
            };
          } else {
            console.warn(`    ⚠️ No readings found for ${field.name}`);
          }
        } catch (err) {
          console.error(`Error fetching reading for field ${field.id}:`, err);
        }
      }

      console.log(`📈 Total fields with readings: ${Object.keys(readingsMap).length}`);
      setFieldReadings(readingsMap);
    } catch (err) {
      console.error("Error fetching field readings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Build aggregated data across all fields for per-metric charts
  const fieldEntries = Object.entries(fieldReadings).sort((a, b) =>
    a[1].fieldName.localeCompare(b[1].fieldName)
  );

  const fieldNames = fieldEntries.map(([, reading]) => reading.fieldName);

  const moistureValues = fieldEntries.map(([, reading]) => {
    if (typeof reading.soilmoisture === "number") return reading.soilmoisture;
    if (reading.soilmoisture?.value)
      return parseFloat(reading.soilmoisture.value);
    return 0;
  });

  const temperatureValues = fieldEntries.map(([, reading]) => {
    if (typeof reading.temperature === "number") return reading.temperature;
    if (reading.temperature?.value)
      return parseFloat(reading.temperature.value);
    return 0;
  });

  const co2Values = fieldEntries.map(([, reading]) => {
    if (typeof reading.co2 === "number") return reading.co2;
    if (reading.co2?.value) return parseFloat(reading.co2.value);
    return 0;
  });

  const nitrateValues = fieldEntries.map(([, reading]) => {
    if (typeof reading.nitrate === "number") return reading.nitrate;
    if (reading.nitrate?.value) return parseFloat(reading.nitrate.value);
    return 0;
  });

  const phValues = fieldEntries.map(([, reading]) => {
    if (typeof reading.ph === "number") return reading.ph;
    if (reading.ph?.value) return parseFloat(reading.ph.value);
    return 0;
  });

  // Helper: score a single parameter 0–100 based on distance from optimal band
  const scoreParameter = (value, { min, max }) => {
    if (value == null || Number.isNaN(value)) return 0;

    const range = max - min || 1;

    // Inside optimal band → full score
    if (value >= min && value <= max) return 100;

    // Distance from nearest bound
    const diff = value < min ? min - value : value - max;

    // We penalize linearly until 2× the optimal width away, then clamp at 0
    const penaltyRatio = Math.min(diff / range, 2); // 0 → 2

    // At diff = range → 50, at diff >= 2*range → 0
    const score = 100 * (1 - 0.5 * penaltyRatio);
    return Math.max(0, Math.min(100, score));
  };

  // Overall soil health score: average of per-parameter scores (0–100)
  const overallHealthScores = fieldEntries.map(([, _reading], idx) => {
    const mScore = scoreParameter(moistureValues[idx], OPTIMAL_RANGES.soilMoisture);
    const tScore = scoreParameter(temperatureValues[idx], OPTIMAL_RANGES.temperature);
    const cScore = scoreParameter(co2Values[idx], OPTIMAL_RANGES.co2);
    const nScore = scoreParameter(nitrateValues[idx], OPTIMAL_RANGES.nitrate);
    const pScore = scoreParameter(phValues[idx], OPTIMAL_RANGES.ph);

    const avg = (mScore + tScore + cScore + nScore + pScore) / 5;
    return Math.round(avg);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8FFD7]">
        <div className="text-[#3E5F44]">Loading analytics...</div>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8FFD7] px-6 py-8">
        <div className="text-center py-20">
          <h1 className="text-3xl font-semibold text-[#3E5F44] mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-[#5E936C] mb-6">
            Mark farms as complete in the Dashboard to view final analysis charts.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              fetchCompletedFarms();
            }}
            className="px-6 py-2 bg-[#3E5F44] text-white rounded-xl hover:bg-[#5E936C] transition"
          >
            Refresh Farms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-8 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-[#3E5F44]">
          Farm Analysis Dashboard
        </h1>
        <p className="text-[#5E936C] mt-2">
          Final analysis of complete farms - Optimal range comparison
        </p>
      </div>

      {/* FARM SELECTOR */}
      {farms.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedFarmId || ""}
            onChange={(e) => setSelectedFarmId(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border border-[#93DA97] bg-white text-[#3E5F44] font-medium"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                ✓ {farm.name} (Completed)
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setLoading(true);
              fetchFieldReadings(selectedFarmId);
            }}
            className="px-4 py-2 bg-[#3E5F44] text-white rounded-xl hover:bg-[#5E936C] transition"
          >
            Refresh
          </button>
        </div>
      )}

      {/* FARM INFO */}
      {selectedFarmId && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4">
          <p className="text-green-800 font-semibold">
            ✓ Farm Complete - Final Analysis
          </p>
        </div>
      )}

      {/* GLOBAL CHARTS: per-parameter across all fields */}
      {fieldEntries.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-[#3E5F44]">
            Field Comparison Charts
          </h2>
          <p className="text-sm text-[#5E936C] max-w-2xl">
            Each chart shows all fields for a single parameter with the optimal range highlighted in light green.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ChartCard title="Soil Moisture across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "Moisture (%)",
                      data: moistureValues,
                      backgroundColor: secondary,
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                    optimalRegion: {
                      optimalMin: OPTIMAL_RANGES.soilMoisture.min,
                      optimalMax: OPTIMAL_RANGES.soilMoisture.max,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>

            <ChartCard title="Temperature across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "Temperature (°C)",
                      data: temperatureValues,
                      backgroundColor: secondary,
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                    optimalRegion: {
                      optimalMin: OPTIMAL_RANGES.temperature.min,
                      optimalMax: OPTIMAL_RANGES.temperature.max,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>

            <ChartCard title="CO₂ across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "CO₂ (ppm)",
                      data: co2Values,
                      backgroundColor: secondary,
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                    optimalRegion: {
                      optimalMin: OPTIMAL_RANGES.co2.min,
                      optimalMax: OPTIMAL_RANGES.co2.max,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>

            <ChartCard title="Nitrate across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "Nitrate (mg/L)",
                      data: nitrateValues,
                      backgroundColor: secondary,
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                    optimalRegion: {
                      optimalMin: OPTIMAL_RANGES.nitrate.min,
                      optimalMax: OPTIMAL_RANGES.nitrate.max,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>

            <ChartCard title="pH across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "pH",
                      data: phValues,
                      backgroundColor: secondary,
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                    optimalRegion: {
                      optimalMin: OPTIMAL_RANGES.ph.min,
                      optimalMax: OPTIMAL_RANGES.ph.max,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>

            <ChartCard title="Overall Soil Health across Fields">
              <Bar
                data={{
                  labels: fieldNames,
                  datasets: [
                    {
                      label: "Health score (%)",
                      data: overallHealthScores,
                      backgroundColor: fieldNames.map((_, idx) =>
                        overallHealthScores[idx] >= 80
                          ? "#16a34a"
                          : overallHealthScores[idx] >= 50
                          ? "#eab308"
                          : "#dc2626"
                      ),
                      borderColor: primary,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: { color: primary, font: { size: 11, weight: "600" } },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: primary, font: { size: 10 } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        color: primary,
                        font: { size: 10 },
                        callback: (val) => `${val}%`,
                      },
                      grid: { color: "rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              />
            </ChartCard>
          </div>
        </div>
      )}

      {/* FIELDS ANALYSIS CARDS (only show empty state; per-field section removed) */}
      <div className="space-y-12">
        {Object.entries(fieldReadings).length === 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-xl p-8 text-center">
            <p className="text-orange-800 font-semibold mb-4">
              ⚠️ No field readings available for this farm
            </p>
            <p className="text-orange-700 text-sm mb-4">
              Make sure sensor data has been generated before marking the farm as complete.
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetchFieldReadings(selectedFarmId);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#93DA97]/40 hover:shadow-md transition-all duration-300">
      <h2 className="text-lg font-semibold text-[#3E5F44] mb-4">
        {title}
      </h2>
      <div className="h-[280px]">
        {children}
      </div>
    </div>
  );
}
