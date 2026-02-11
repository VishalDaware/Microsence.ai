import { useEffect, useState } from "react";
import {
  CloudIcon,
  FireIcon,
  BeakerIcon,
  SunIcon,
} from "@heroicons/react/24/solid";
import { Leaf } from "phosphor-react";

const API_BASE_URL = "http://localhost:5000/api";

const primary = "#3E5F44";
const secondary = "#5E936C";
const accent = "#93DA97";
const bgLight = "#E8FFD7";

export default function TablesPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [fieldData, setFieldData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarmId) fetchLatestReadings(selectedFarmId);
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

  const fetchLatestReadings = async (farmId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/latest-all?farmId=${farmId}`
      );
      const data = await res.json();
      if (data.success) {
        setFieldData(data.readings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const moistureStatus = (val) =>
    val < 40 ? "Low" : val > 65 ? "High" : "Optimal";

  const tempStatus = (val) =>
    val < 15 ? "Low" : val > 30 ? "High" : "Normal";

  const lightStatus = (val) =>
    val < 500 ? "Low" : val > 1200 ? "Bright" : "Moderate";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E8FFD7]">
        <div className="text-[#3E5F44]">Loading table data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold text-[#3E5F44] flex items-center gap-2">
          <Leaf size={32} weight="fill" color={primary} />
          Monitoring Data Tables
        </h1>

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
      </div>

      {/* TABLE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* SOIL MOISTURE */}
        <DataTable
          title="Soil Moisture"
          icon={<CloudIcon className="w-5 h-5 text-white" />}
          color="bg-[#3E5F44]"
          headers={["Field", "Moisture", "Status"]}
          rows={fieldData.map((row) => [
            row.fieldName,
            row.soilMoisture + "%",
            moistureStatus(row.soilMoisture),
          ])}
        />

        {/* TEMPERATURE */}
        <DataTable
          title="Temperature"
          icon={<FireIcon className="w-5 h-5 text-white" />}
          color="bg-[#5E936C]"
          headers={["Field", "Temp", "Status"]}
          rows={fieldData.map((row) => [
            row.fieldName,
            row.temperature + "°C",
            tempStatus(row.temperature),
          ])}
        />

        {/* NUTRIENTS */}
        <DataTable
          title="Nutrients"
          icon={<BeakerIcon className="w-5 h-5 text-white" />}
          color="bg-[#93DA97]"
          headers={["Field", "Nitrate", "pH"]}
          rows={fieldData.map((row) => [
            row.fieldName,
            row.nitrate + " mg/L",
            row.ph.toFixed(1),
          ])}
        />

        {/* LIGHT */}
        <DataTable
          title="Light Levels"
          icon={<SunIcon className="w-5 h-5 text-white" />}
          color="bg-[#3E5F44]"
          headers={["Field", "Lux", "Status"]}
          rows={fieldData.map((row) => [
            row.fieldName,
            row.lux || "N/A",
            lightStatus(row.lux || 0),
          ])}
        />

      </div>
    </div>
  );
}

/* ---------- Reusable Table Component ---------- */

function DataTable({ title, icon, color, headers, rows }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#93DA97]/40 overflow-hidden">
      
      <div className={`flex items-center gap-2 px-4 py-3 text-white font-semibold ${color}`}>
        {icon}
        {title}
      </div>

      <table className="w-full text-sm">
        <thead className="bg-[#E8FFD7]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-t hover:bg-[#E8FFD7]/50 transition"
            >
              {row.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-[#3E5F44]">
                  {typeof cell === "string" &&
                  (cell === "Optimal" ||
                    cell === "Normal") ? (
                    <StatusBadge text={cell} type="good" />
                  ) : cell === "Low" ? (
                    <StatusBadge text="Low" type="low" />
                  ) : cell === "High" ? (
                    <StatusBadge text="High" type="high" />
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ text, type }) {
  const styles =
    type === "good"
      ? "bg-green-100 text-green-700"
      : type === "high"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {text}
    </span>
  );
}
