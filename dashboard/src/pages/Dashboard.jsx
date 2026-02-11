import { useState, useEffect } from "react";
import {
  CloudIcon,
  FireIcon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import MetricCard from "../components/MetricCard";
import RecommendationCard from "../components/RecommendationCard";
import MonitoringStatusCard from "../components/MonitoringStatusCard";

const API_BASE_URL = "http://localhost:5000/api";
const ML_SERVICE_URL = "http://localhost:5001/api";

const fallbackRecommendations = [
  "Increase irrigation — soil moisture is below optimal (target 55–65%).",
  "Maintain temperature between 24–28 °C for growth.",
  "Ventilation recommended — CO₂ above 600 ppm.",
  "Add nitrate supplement if levels drop below 15 mg/L.",
  "Adjust pH towards 6.0–6.5 for most plants.",
];

export default function Dashboard({ user }) {
  const [fields, setFields] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [mlRecommendations, setMlRecommendations] = useState([]);

  // ================= FETCH FIELDS =================
  const fetchFields = async () => {
    try {
      const farmRes = await fetch(`${API_BASE_URL}/farms`);
      const farmData = await farmRes.json();
      if (farmData.success && Array.isArray(farmData.farms)) {
        setFarms(farmData.farms);
        const farmToUse =
          selectedFarm ||
          (farmData.farms.length > 0 ? farmData.farms[0].id : null);
        setSelectedFarm(farmToUse);
        const fieldsList =
          farmData.farms.find((f) => f.id === farmToUse)?.fields || [];
        setFields(fieldsList);
        if (!selectedField && fieldsList.length > 0)
          setSelectedField(fieldsList[0].id);
      } else {
        setFarms([]);
        setFields([]);
        setSelectedField(null);
      }
    } catch (err) {
      console.error("Field fetch error:", err);
    }
  };

  // ================= FETCH LATEST =================
  const fetchLatest = async (fieldId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/latest${
          fieldId ? `?fieldId=${fieldId}` : ""
        }`
      );
      const data = await res.json();
      if (data.success) setMetrics(data.readings || {});
      else setMetrics({});
    } catch (err) {
      console.error("Latest fetch error:", err);
    }
  };

  // ================= GENERATE =================
  const generateData = async () => {
    setLoading(true);
    try {
      const body = selectedFarm ? { farmId: selectedFarm } : {};
      const res = await fetch(`${API_BASE_URL}/readings/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const assigned = data?.assignedFieldId || selectedField;
      if (data.success && assigned) {
        setSelectedField(assigned);
        await fetchLatest(assigned);
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedField) fetchLatest(selectedField);
  }, [selectedField]);

  const currentField = fields.find((f) => f.id === selectedField);

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-4 sm:px-6 lg:px-10 py-8 space-y-8 font-sans">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#3E5F44]">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#5E936C]">
            Real-time soil monitoring
          </p>
        </div>

        {/* DROPDOWNS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">

          {farms.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedFarm || ""}
                onChange={(e) => {
                  const farmId = parseInt(e.target.value);
                  setSelectedFarm(farmId);
                  const farm =
                    farms.find((x) => x.id === farmId) || { fields: [] };
                  setFields(farm.fields || []);
                  if (farm.fields?.length > 0)
                    setSelectedField(farm.fields[0].id);
                }}
                className="appearance-none w-full sm:w-56 px-4 py-2.5 rounded-xl 
                bg-white border border-[#93DA97]/50 
                text-[#3E5F44] font-medium 
                shadow-sm
                focus:outline-none focus:ring-2 focus:ring-[#5E936C]
                transition-all"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                    {farm.completed ? " (Completed)" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#5E936C]">
                ▼
              </div>
            </div>
          )}

          {fields.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedField || ""}
                onChange={(e) => setSelectedField(parseInt(e.target.value))}
                className="appearance-none w-full sm:w-44 px-4 py-2.5 rounded-xl 
                bg-white border border-[#93DA97]/50 
                text-[#3E5F44] font-medium 
                shadow-sm
                focus:outline-none focus:ring-2 focus:ring-[#5E936C]
                transition-all"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#5E936C]">
                ▼
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex flex-wrap gap-4">

        <button
          onClick={generateData}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-[#3E5F44] text-white 
          hover:bg-[#5E936C] transition-all duration-300 shadow-sm"
        >
          {loading ? "Generating..." : "Generate Data"}
        </button>

        <button
          onClick={() => fetchLatest(selectedField)}
          className="px-6 py-2.5 rounded-xl bg-[#5E936C] text-white 
          hover:bg-[#3E5F44] transition-all duration-300 shadow-sm"
        >
          Refresh
        </button>

        {selectedFarm && (
          <button
            onClick={async () => {
              if (!window.confirm("Mark this farm as completed?")) return;
              try {
                await fetch(
                  `${API_BASE_URL}/farms/${selectedFarm}/complete`,
                  { method: "POST" }
                );
                await fetchFields();
              } catch (err) {
                console.error("Complete farm error:", err);
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-[#93DA97] text-[#3E5F44] 
            hover:opacity-90 transition shadow-sm"
          >
            Mark Farm Complete
          </button>
        )}

        <button
          onClick={async () => {
            const name = window.prompt("New farm name");
            if (!name) return;
            try {
              await fetch(`${API_BASE_URL}/farms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              await fetchFields();
            } catch (err) {
              console.error("Create farm error:", err);
            }
          }}
          className="px-6 py-2.5 rounded-xl bg-[#93DA97] text-[#3E5F44] 
          hover:opacity-90 transition shadow-sm"
        >
          Add Farm
        </button>
      </div>

      {/* ================= FIELD INFO CARD ================= */}
      {currentField && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#93DA97]/40 flex items-center justify-between">

          <div>
            <p className="text-sm text-[#5E936C] font-medium">
              Current Field
            </p>
            <h3 className="text-lg font-semibold text-[#3E5F44]">
              {currentField.name}
            </h3>
          </div>

          <div className="w-12 h-12 rounded-xl bg-[#E8FFD7] flex items-center justify-center text-[#3E5F44] text-xl">
            🌱
          </div>
        </div>
      )}

      {/* ================= METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

        <MetricCard
          title="Moisture"
          value={`${metrics.soilmoisture?.value ?? "--"}%`}
          icon={<CloudIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="Temperature"
          value={`${metrics.temperature?.value ?? "--"}°C`}
          icon={<FireIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="CO₂"
          value={`${metrics.co2?.value ?? "--"} ppm`}
          icon={<ChartBarIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="Nitrate"
          value={`${metrics.nitrate?.value ?? "--"} mg/L`}
          icon={<BeakerIcon className="w-6 h-6" />}
        />

        <MetricCard
          title="pH"
          value={`${metrics.ph?.value ?? "--"}`}
          icon={<BoltIcon className="w-6 h-6" />}
        />
      </div>

      {/* ================= RECOMMENDATIONS ================= */}
     <RecommendationCard
  recommendations={
    mlRecommendations?.length > 0
      ? mlRecommendations
      : fallbackRecommendations
  }
  metrics={metrics}
/>

    </div>
  );
}
