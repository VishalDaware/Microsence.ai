import { useState, useEffect } from "react";
import {
  Line,
  Radar,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

export default function ChartsPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [readingsData, setReadingsData] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [loading, setLoading] = useState(true);

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
        if (data.farms.length > 0) {
          setSelectedFarmId(data.farms[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async (farmId = null) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/readings/all?limit=20`;
      if (farmId) url += `&farmId=${farmId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setReadingsData(data.readings || []);

      let latestUrl = `${API_BASE_URL}/readings/latest`;
      if (farmId) latestUrl += `?farmId=${farmId}`;

      const latestRes = await fetch(latestUrl);
      const latestData = await latestRes.json();
      if (latestData.success) setLatestReading(latestData.rawReading);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const labels = readingsData.map((_, i) => `#${i + 1}`);

  const createLineDataset = (label, key, color) => ({
    labels,
    datasets: [
      {
        label,
        data: readingsData.map((r) => r[key]),
        borderColor: color,
        backgroundColor: color + "33",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
    ],
  });

  const radarData = {
    labels: ["Moisture", "Temp", "CO₂", "Nitrate", "pH"],
    datasets: [
      {
        label: "Current",
        data: latestReading
          ? [
              latestReading.soilMoisture,
              latestReading.temperature,
              latestReading.co2 / 10,
              latestReading.nitrate * 2,
              latestReading.ph * 10,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: secondary + "55",
        borderColor: primary,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: primary,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: primary },
      },
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
        pointLabels: {
          color: primary,
          font: { size: 12, weight: "600" },
        },
      },
    },
    plugins: {
      legend: {
        labels: { color: primary },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8FFD7]">
        <div className="text-[#3E5F44]">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-8 space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-[#3E5F44]">
          Analytics Dashboard
        </h1>
        <p className="text-[#5E936C] mt-2">
          Real-time farm sensor visualization
        </p>
      </div>

      {/* FARM SELECTOR */}
      <div className="flex items-center gap-4">
        <select
          value={selectedFarmId || ""}
          onChange={(e) => setSelectedFarmId(Number(e.target.value))}
          className="px-4 py-2 rounded-xl border border-[#93DA97] bg-white text-[#3E5F44]"
        >
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => fetchData(selectedFarmId)}
          className="px-4 py-2 bg-[#3E5F44] text-white rounded-xl hover:bg-[#5E936C] transition"
        >
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      {latestReading && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Moisture", latestReading.soilMoisture + "%"],
            ["Temp", latestReading.temperature + "°C"],
            ["CO₂", latestReading.co2 + " ppm"],
            ["Nitrate", latestReading.nitrate + " mg/L"],
            ["pH", latestReading.ph.toFixed(1)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-white rounded-xl p-4 shadow-sm border border-[#93DA97]/40"
            >
              <p className="text-sm text-[#5E936C]">{label}</p>
              <p className="text-xl font-semibold text-[#3E5F44]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* CHART GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        <ChartCard title="Soil Moisture Trend">
          <Line
            data={createLineDataset("Moisture", "soilMoisture", primary)}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Temperature Trend">
          <Line
            data={createLineDataset("Temperature", "temperature", secondary)}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="CO₂ Trend">
          <Line
            data={createLineDataset("CO₂", "co2", accent)}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Nitrate & pH Trend">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Nitrate",
                  data: readingsData.map((r) => r.nitrate),
                  borderColor: primary,
                  tension: 0.4,
                },
                {
                  label: "pH",
                  data: readingsData.map((r) => r.ph),
                  borderColor: secondary,
                  tension: 0.4,
                },
              ],
            }}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Sensor Balance">
          <Radar data={radarData} options={radarOptions} />
        </ChartCard>

      </div>

      {/* FOOTER INFO */}
      <div className="text-sm text-[#5E936C]">
        Showing {readingsData.length} readings • Last update:{" "}
        {latestReading
          ? new Date(latestReading.timestamp).toLocaleString()
          : "N/A"}
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
