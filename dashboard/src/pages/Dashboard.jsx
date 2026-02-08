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
// charts removed

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

  // ML state
  const [predictions, setPredictions] = useState(null);
  const [mlRecommendations, setMlRecommendations] = useState([]);
  // removed charts state

  // ===================== FETCH FIELDS =====================
  const fetchFields = async () => {
    try {
      // Fetch farms (includes fields)
      const farmRes = await fetch(`${API_BASE_URL}/farms`);
      const farmData = await farmRes.json();
      if (farmData.success && Array.isArray(farmData.farms)) {
        setFarms(farmData.farms);
        // if a farm is selected already keep it, else pick first
        const farmToUse = selectedFarm || (farmData.farms.length > 0 ? farmData.farms[0].id : null);
        setSelectedFarm(farmToUse);
        const fieldsList = farmData.farms.find((f) => f.id === farmToUse)?.fields || [];
        setFields(fieldsList);
        if (!selectedField && fieldsList.length > 0) setSelectedField(fieldsList[0].id);
      } else {
        setFarms([]);
        setFields([]);
        setSelectedField(null);
      }
    } catch (err) {
      console.error("Field fetch error:", err);
    }
  };

  // ===================== FETCH LATEST (and ML predictions) =====================
  const fetchLatest = async (fieldId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/latest${fieldId ? `?fieldId=${fieldId}` : ""}`
      );
      const data = await res.json();

      if (data.success) {
        setMetrics(data.readings || {});
      } else {
        setMetrics({});
      }

      // If backend returns the raw reading object, call ML service to get predictions & recommendations
      const raw = data.rawReading || null;
      if (raw) {
        try {
          const mlRes = await fetch(`${ML_SERVICE_URL}/ml/health`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              CO2_ppm: raw.co2,
              Nitrate_ppm: raw.nitrate,
              pH: raw.ph,
              Temp_C: raw.temperature,
              Moisture_pct: raw.soilMoisture,
            }),
          });

          const mlData = await mlRes.json();
          if (mlData.success) {
            setPredictions(mlData.predictions || null);
            setMlRecommendations(mlData.recommendations || []);
          } else {
            // ML returned no success (maybe no model loaded) -> clear ML results
            setPredictions(null);
            setMlRecommendations([]);
            console.warn("ML service responded without success:", mlData);
          }
        } catch (mlErr) {
          console.error("ML prediction error:", mlErr);
          setPredictions(null);
          setMlRecommendations([]);
        }
      } else {
        // no raw reading available -> clear ML info
        setPredictions(null);
        setMlRecommendations([]);
      }
    } catch (err) {
      console.error("Latest fetch error:", err);
    }
  };

  // ===================== GENERATE =====================
  const generateData = async () => {
    setLoading(true);
    try {
      const body = selectedFarm ? { farmId: selectedFarm } : {};
      const res = await fetch(`${API_BASE_URL}/readings/generate`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // backend may return assignedFieldId (round-robin); fall back to current selectedField
      const assigned = data?.assignedFieldId || selectedField;
      if (data.success) {
        if (assigned) {
          setSelectedField(assigned);
          await fetchLatest(assigned);
        } else {
          // no specific field returned -> refresh current
          await fetchLatest(selectedField);
        }
      } else {
        console.warn("Generate endpoint returned failure:", data);
      }
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== INITIAL LOAD =====================
  useEffect(() => {
    fetchFields();
  }, []);

  // fetch farm latest readings (one per field) when farm selected
  useEffect(() => {
    const fetchFarmLatest = async () => {
      if (!selectedFarm) return;
      try {
        const farm = farms.find((f) => f.id === selectedFarm);
        if (!farm || !farm.fields || farm.fields.length === 0) return;

        const latestPromises = farm.fields.map((fld) =>
          fetch(`${API_BASE_URL}/readings/latest?fieldId=${fld.id}`).then((r) => r.json()).then((d) => ({ fieldId: fld.id, fieldName: fld.name, data: d }))
        );

        const latest = await Promise.all(latestPromises);
        // build distribution for moisture levels using latest readings
        const low = latest.filter((l) => l.data?.readings?.soilmoisture?.value < 30).length;
        const ok = latest.filter((l) => l.data?.readings?.soilmoisture?.value >= 30 && l.data?.readings?.soilmoisture?.value <= 70).length;
        const high = latest.filter((l) => l.data?.readings?.soilmoisture?.value > 70).length;

        setFarmDistribution([
          { label: "Low (<30%)", value: low },
          { label: "Optimal (30-70%)", value: ok },
          { label: "High (>70%)", value: high },
        ]);
      } catch (err) {
        console.error("Farm latest fetch error:", err);
      }
    };

    fetchFarmLatest();
  }, [selectedFarm, farms]);

  // fetch timeline for selected field
  useEffect(() => {
    const fetchFieldTimeline = async () => {
      if (!selectedField) return;
      try {
        const res = await fetch(`${API_BASE_URL}/readings/all?fieldId=${selectedField}&limit=200`);
        const data = await res.json();
        if (data.success) {
          // prepare moisture timeline
          const timeline = data.readings.map((r) => ({ timestamp: r.timestamp, value: r.soilMoisture }));
          setFieldTimeline(timeline);
        }
      } catch (err) {
        console.error("Field timeline error:", err);
      }
    };
    fetchFieldTimeline();
  }, [selectedField]);

  // local UI states for charts
  const [farmDistribution, setFarmDistribution] = useState([]);
  const [fieldTimeline, setFieldTimeline] = useState([]);

  useEffect(() => {
    if (selectedField) {
      fetchLatest(selectedField);
    }
  }, [selectedField]);

  const currentField = fields.find((f) => f.id === selectedField);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-gray-600">Real-time soil monitoring</p>
        </div>

        <div className="flex items-center gap-3">
          {farms.length > 0 && (
            <select
              value={selectedFarm || ""}
              onChange={(e) => {
                const farmId = parseInt(e.target.value);
                setSelectedFarm(farmId);
                const farm = farms.find((x) => x.id === farmId) || { fields: [] };
                setFields(farm.fields || []);
                if (farm.fields && farm.fields.length > 0) setSelectedField(farm.fields[0].id);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}{farm.completed ? ' (Completed)' : ''}
                </option>
              ))}
            </select>
          )}

          {fields.length > 0 && (
            <select
              value={selectedField || ""}
              onChange={(e) => setSelectedField(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3">
        <button
          onClick={generateData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {loading ? "Generating..." : "Generate Data"}
        </button>

        <button
          onClick={() => fetchLatest(selectedField)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          Refresh
        </button>
        {selectedFarm && (
          <button
            onClick={async () => {
              if (!window.confirm('Mark this farm as completed? This will prevent further sampling.')) return;
              try {
                await fetch(`${API_BASE_URL}/farms/${selectedFarm}/complete`, { method: 'POST' });
                // refresh farms
                await fetchFields();
              } catch (err) {
                console.error('Complete farm error:', err);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Mark Farm Complete
          </button>
        )}

        <button
          onClick={async () => {
            const name = window.prompt('New farm name');
            if (!name) return;
            try {
              await fetch(`${API_BASE_URL}/farms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
              await fetchFields();
            } catch (err) {
              console.error('Create farm error:', err);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Add Farm
        </button>
      </div>

      {/* FIELD INFO */}
      {currentField && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <strong>Field:</strong> {currentField.name}
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* MONITORING */}
      <div className="grid md:grid-cols-2 gap-4">
        <MonitoringStatusCard label="Soil Sensor" status="OK" type="success" />
        <MonitoringStatusCard label="CO₂ Sensor" status="Stable" type="success" />
      </div>

      {/* CHARTS: farm distribution + field timeline */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Charts removed per request */}
        </div>

      {/* RECOMMENDATIONS */}
      <RecommendationCard
        recommendations={
          mlRecommendations && mlRecommendations.length > 0
            ? mlRecommendations
            : fallbackRecommendations
        }
      />
    </div>
  );
}