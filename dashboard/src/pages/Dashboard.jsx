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
  const [userId, setUserId] = useState(null);

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // Monitor recommendations state changes
  useEffect(() => {
    console.log("📊 mlRecommendations state updated:", {
      length: mlRecommendations?.length,
      data: mlRecommendations,
      isFallback: mlRecommendations?.length === 0
    });
  }, [mlRecommendations]);

  // ================= FETCH FIELDS =================
  const fetchFields = async () => {
    if (!userId) return;
    try {
      const farmRes = await fetch(`${API_BASE_URL}/farms?userId=${userId}`);
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

  // ================= FETCH RECOMMENDATIONS =================
  const fetchRecommendations = async (fieldId) => {
    if (!userId) {
      console.log("⚠️ Skipping recommendations fetch - no userId");
      return;
    }
    try {
      const url = `${API_BASE_URL}/readings/predict?userId=${userId}${
        fieldId ? `&fieldId=${fieldId}` : ""
      }`;
      console.log("📡 Fetching recommendations from:", url);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("📥 Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ Predict endpoint returned error:", res.status, errText);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        return;
      }
      
      console.log("✓ Raw predict response:", data);
      console.log("  - success:", data.success);
      console.log("  - has recommendations:", 'recommendations' in data);
      console.log("  - recommendations type:", typeof data.recommendations);
      console.log("  - recommendations isArray:", Array.isArray(data.recommendations));
      console.log("  - recommendations length:", data.recommendations?.length);
      console.log("  - recommendations value:", JSON.stringify(data.recommendations));

      if (data.success && data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        console.log("✨ SUCCESS! Setting recommendations (count: " + data.recommendations.length + ")");
        data.recommendations.forEach((r, i) => console.log(`    [${i}]: ${r}`));
        setMlRecommendations([...data.recommendations]);
        console.log("📊 State updated - recommendations should now display");
      } else {
        console.warn("⚠️ Invalid response or empty recommendations:", {
          success: data.success,
          hasRecommendations: 'recommendations' in data,
          isArray: Array.isArray(data.recommendations),
          length: data.recommendations?.length,
          recommendations: data.recommendations
        });
        setMlRecommendations([]);
      }
    } catch (err) {
      console.error("❌ Recommendations fetch error:", err);
      console.error("     Stack:", err.stack);
    }
  };

  // ================= FETCH LATEST =================
  const fetchLatest = async (fieldId) => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/latest?userId=${userId}${
          fieldId ? `&fieldId=${fieldId}` : ""
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
    if (!userId) return;
    setLoading(true);
    setMlRecommendations([]); // Clear old recommendations first
    try {
      const body = { userId, ...(selectedFarm && { farmId: selectedFarm }) };
      console.log("🔄 Generating data with:", body);
      const res = await fetch(`${API_BASE_URL}/readings/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("✓ Data generated:", data);
      
      const assigned = data?.assignedFieldId || selectedField;
      if (data.success && assigned) {
        console.log("📊 Updating field to:", assigned);
        setSelectedField(assigned);
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log("📈 Fetching latest metrics...");
        await fetchLatest(assigned);
        
        console.log("🎯 Fetching recommendations (this should populate ML data)...");
        await fetchRecommendations(assigned);
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFields();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedField && userId) {
      fetchLatest(selectedField);
      fetchRecommendations(selectedField);
    }
  }, [selectedField, userId]);

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
                    {farm.completed ? "✓" : "●"} {farm.name} {farm.completed ? "(Completed)" : "(Active)"}
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

        <button
          onClick={() => {
            console.log("🧪 TEST: Manually fetching recommendations for field:", selectedField);
            fetchRecommendations(selectedField);
          }}
          className="px-6 py-2.5 rounded-xl bg-[#93DA97] text-[#3E5F44] 
          hover:opacity-90 transition shadow-sm font-medium"
        >
          Test Recommendations
        </button>

        {selectedFarm && (
          <button
            onClick={async () => {
              const farm = farms.find(f => f.id === selectedFarm);
              if (farm?.completed) {
                alert("This farm is already completed.");
                return;
              }
              if (!window.confirm("Mark this farm as completed? This will freeze all data collection for this farm.")) return;
              try {
                const res = await fetch(
                  `${API_BASE_URL}/farms/${selectedFarm}/complete`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId })
                  }
                );
                const data = await res.json();
                if (data.success) {
                  alert("✅ Farm marked as complete! All data is now locked.");
                  await fetchFields();
                } else {
                  alert("❌ Error: " + data.error);
                }
              } catch (err) {
                console.error("Complete farm error:", err);
                alert("❌ Error marking farm complete: " + err.message);
              }
            }}
            className={`px-6 py-2.5 rounded-xl text-white transition shadow-sm ${
              farms.find(f => f.id === selectedFarm)?.completed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            disabled={farms.find(f => f.id === selectedFarm)?.completed}
          >
            {farms.find(f => f.id === selectedFarm)?.completed ? "✓ Farm Complete" : "Mark Farm Complete"}
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

      {/* ================= FARM & FIELD INFO CARD ================= */}
      {selectedFarm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#93DA97]/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5E936C] font-medium">
                Current Farm
              </p>
              <h3 className="text-lg font-semibold text-[#3E5F44]">
                {farms.find(f => f.id === selectedFarm)?.name}
              </h3>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
              farms.find(f => f.id === selectedFarm)?.completed
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {farms.find(f => f.id === selectedFarm)?.completed ? "✓ Completed" : "● Active"}
            </div>
          </div>

          {currentField && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div>
                <p className="text-sm text-[#5E936C] font-medium">
                  Current Field
                </p>
                <h4 className="text-base font-semibold text-[#3E5F44]">
                  {currentField.name}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#E8FFD7] flex items-center justify-center text-[#3E5F44] text-lg">
                🌱
              </div>
            </div>
          )}
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
     {(() => {
        const recsToPass = mlRecommendations?.length > 0 ? mlRecommendations : fallbackRecommendations;
        console.log("🎨 RecommendationCard rendering with:", {
          mlRecommendations: {
            length: mlRecommendations?.length,
            data: mlRecommendations,
            type: typeof mlRecommendations
          },
          fallbackLength: fallbackRecommendations.length,
          willUse: mlRecommendations?.length > 0 ? "ML" : "FALLBACK",
          recsToPass: {
            length: recsToPass?.length,
            first: recsToPass?.[0],
            type: typeof recsToPass
          }
        });
        return (
          <RecommendationCard
            recommendations={recsToPass}
            metrics={metrics}
          />
        );
      })()}


    </div>
  );
}
