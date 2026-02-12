import { useState, useEffect } from "react";
import {
  Bar,
  Radar,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
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
  Tooltip,
  Legend,
  Filler
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

  // Create comparison chart data (Current vs Optimal)
  const createComparisonChartData = (reading) => {
    if (!reading) return null;

    const keys = ["soilMoisture", "temperature", "co2", "nitrate", "ph"];
    const currentValues = [];
    const optimalMinValues = [];
    const optimalMaxValues = [];
    const labels = [];

    keys.forEach(key => {
      const optimal = OPTIMAL_RANGES[key];
      labels.push(optimal.label);
      currentValues.push(reading[key] || 0);
      optimalMinValues.push(optimal.min);
      optimalMaxValues.push(optimal.max);
    });

    return {
      labels,
      datasets: [
        {
          label: "Current Value",
          data: currentValues,
          backgroundColor: secondary,
          borderColor: primary,
          borderWidth: 2,
        },
        {
          label: "Optimal Min",
          data: optimalMinValues,
          backgroundColor: accent,
          opacity: 0.6,
        },
        {
          label: "Optimal Max",
          data: optimalMaxValues,
          backgroundColor: accent,
          opacity: 0.6,
        },
      ],
    };
  };

  // Create radar chart with optimal range overlay
  const createRadarData = (reading) => {
    if (!reading) return null;

    return {
      labels: ["Moisture (%)", "Temp (°C)", "CO₂ (ppm)", "Nitrate (mg/L)", "pH"],
      datasets: [
        {
          label: "Current Reading",
          data: [
            reading.soilMoisture,
            reading.temperature,
            reading.co2 / 10,
            reading.nitrate * 5,
            reading.ph * 20,
          ],
          borderColor: primary,
          backgroundColor: secondary + "55",
          borderWidth: 2,
        },
        {
          label: "Optimal Range (Avg)",
          data: [
            (OPTIMAL_RANGES.soilMoisture.min + OPTIMAL_RANGES.soilMoisture.max) / 2,
            (OPTIMAL_RANGES.temperature.min + OPTIMAL_RANGES.temperature.max) / 2,
            (OPTIMAL_RANGES.co2.min + OPTIMAL_RANGES.co2.max) / 2 / 10,
            (OPTIMAL_RANGES.nitrate.min + OPTIMAL_RANGES.nitrate.max) / 2 * 5,
            (OPTIMAL_RANGES.ph.min + OPTIMAL_RANGES.ph.max) / 2 * 20,
          ],
          borderColor: accent,
          backgroundColor: accent + "33",
          borderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: primary, font: { size: 12, weight: "600" } },
      },
    },
    scales: {
      x: { ticks: { color: primary } },
      y: { 
        ticks: { color: primary },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false },
        grid: { color: "rgba(0,0,0,0.08)" },
        pointLabels: { color: primary, font: { size: 12, weight: "600" } },
      },
    },
    plugins: {
      legend: { labels: { color: primary, font: { size: 12, weight: "600" } } },
    },
  };

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

      {/* FIELDS ANALYSIS CARDS */}
      <div className="space-y-12">
        {Object.entries(fieldReadings).length === 0 ? (
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
        ) : (
          Object.entries(fieldReadings)
            .sort((a, b) => a[1].fieldName.localeCompare(b[1].fieldName))
            .map(([fieldId, reading]) => {
              // Safely extract numeric values from reading object
              const getMoistureValue = () => {
                if (typeof reading.soilmoisture === 'number') return reading.soilmoisture;
                if (reading.soilmoisture?.value) return parseFloat(reading.soilmoisture.value);
                return 0;
              };
              const getTemperatureValue = () => {
                if (typeof reading.temperature === 'number') return reading.temperature;
                if (reading.temperature?.value) return parseFloat(reading.temperature.value);
                return 0;
              };
              const getCo2Value = () => {
                if (typeof reading.co2 === 'number') return reading.co2;
                if (reading.co2?.value) return parseFloat(reading.co2.value);
                return 0;
              };
              const getNitrateValue = () => {
                if (typeof reading.nitrate === 'number') return reading.nitrate;
                if (reading.nitrate?.value) return parseFloat(reading.nitrate.value);
                return 0;
              };
              const getPhValue = () => {
                if (typeof reading.ph === 'number') return reading.ph;
                if (reading.ph?.value) return parseFloat(reading.ph.value);
                return 0;
              };

              const moisture = getMoistureValue();
              const temperature = getTemperatureValue();
              const co2 = getCo2Value();
              const nitrate = getNitrateValue();
              const ph = getPhValue();

              return (
          <div key={fieldId} className="space-y-4">
            
            <h2 className="text-2xl font-semibold text-[#3E5F44]">
              Field: {reading.fieldName}
            </h2>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                ["Moisture", moisture + "%", OPTIMAL_RANGES.soilMoisture],
                ["Temperature", temperature + "°C", OPTIMAL_RANGES.temperature],
                ["CO₂", co2 + " ppm", OPTIMAL_RANGES.co2],
                ["Nitrate", nitrate + " mg/L", OPTIMAL_RANGES.nitrate],
                ["pH", ph.toFixed(1), OPTIMAL_RANGES.ph],
              ].map(([label, value, optimal]) => {
                const numValue = parseFloat(value);
                const isOptimal = numValue >= optimal.min && numValue <= optimal.max;
                
                return (
                  <div
                    key={label}
                    className={`rounded-xl p-4 shadow-sm border-2 transition ${
                      isOptimal
                        ? "bg-green-50 border-green-400"
                        : "bg-orange-50 border-orange-400"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isOptimal ? "text-green-700" : "text-orange-700"}`}>
                      {label}
                    </p>
                    <p className={`text-xl font-semibold ${isOptimal ? "text-green-900" : "text-orange-900"}`}>
                      {value}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Opt: {optimal.min}-{optimal.max}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              <ChartCard title="Parameter Comparison (Current vs Optimal)">
                <Bar
                  data={createComparisonChartData(reading)}
                  options={chartOptions}
                />
              </ChartCard>

              <ChartCard title="Overall Soil Health (Radar)">
                <Radar
                  data={createRadarData(reading)}
                  options={radarOptions}
                />
              </ChartCard>

            </div>

            {/* LAST UPDATE */}
            <div className="text-sm text-[#5E936C]">
              Last reading: {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : "N/A"}
            </div>

          </div>
            )})
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
