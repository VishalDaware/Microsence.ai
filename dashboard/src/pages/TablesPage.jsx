import { useEffect, useState } from "react";
import { Leaf } from "phosphor-react";

const API_BASE_URL = "http://localhost:5000/api";

const primary = "#3E5F44";

export default function TablesPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [fieldData, setFieldData] = useState([]);
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
      fetchFarms();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedFarmId && userId) fetchLatestReadings(selectedFarmId);
  }, [selectedFarmId, userId]);

  const fetchFarms = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/farms?userId=${userId}`);
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
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch all readings for the farm, then extract latest per field
      const res = await fetch(
        `${API_BASE_URL}/readings/all?farmId=${farmId}&userId=${userId}&limit=1000`
      );
      const data = await res.json();
      if (data.success) {
        // Transform readings: get latest reading per field
        const latestByField = {};
        data.readings.forEach((reading) => {
          const fieldId = reading.fieldId;
          if (!latestByField[fieldId] || reading.timestamp > latestByField[fieldId].timestamp) {
            latestByField[fieldId] = reading;
          }
        });

        // Convert to array format for table
        const tableData = Object.values(latestByField).map((reading) => ({
          fieldName: reading.field?.name || `Field ${reading.fieldId}`,
          soilMoisture: reading.soilMoisture || 0,
          temperature: reading.temperature || 0,
          co2: reading.co2 || 0,
          nitrate: reading.nitrate || 0,
          ph: reading.ph || 0,
          timestamp: reading.timestamp || null,
        }));

        setFieldData(tableData);
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

  const co2Status = (val) =>
    val < 300 ? "Low" : val > 800 ? "High" : "Optimal";

  const nitrateStatus = (val) =>
    val < 10 ? "Low" : val > 30 ? "High" : "Optimal";

  const phStatus = (val) =>
    val < 6 ? "Low" : val > 7.5 ? "High" : "Optimal";

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
          Monitoring Data Table
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

      {/* SINGLE CONSOLIDATED TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#93DA97]/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#93DA97]/40 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#3E5F44]">
            Latest sensor readings per field
          </h2>
          <p className="text-xs text-[#5E936C]">
            Values compared against recommended ranges
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#E8FFD7]">
              <tr>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Field
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Moisture (%)
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Moisture status
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Temp (°C)
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Temp status
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  CO₂ (ppm)
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  CO₂ status
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Nitrate (mg/L)
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Nitrate status
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  pH
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  pH status
                </th>
                <th className="px-4 py-3 text-left text-[#3E5F44] font-semibold">
                  Last updated
                </th>
              </tr>
            </thead>

            <tbody>
              {fieldData.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-6 text-center text-[#5E936C]"
                  >
                    No readings available for this farm yet.
                  </td>
                </tr>
              ) : (
                fieldData.map((row, idx) => {
                  const mStatus = moistureStatus(row.soilMoisture);
                  const tStatus = tempStatus(row.temperature);
                  const cStatus = co2Status(row.co2);
                  const nStatus = nitrateStatus(row.nitrate);
                  const pStatus = phStatus(row.ph);

                  const statusClass = (status) =>
                    status === "Optimal"
                      ? "bg-green-100 text-green-700"
                      : status === "High"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700";

                  const formatDate = (ts) =>
                    ts ? new Date(ts).toLocaleString() : "N/A";

                  return (
                    <tr
                      key={idx}
                      className="border-t hover:bg-[#E8FFD7]/40 transition"
                    >
                      <td className="px-4 py-3 text-[#3E5F44] font-medium whitespace-nowrap">
                        {row.fieldName}
                      </td>
                      <td className="px-4 py-3 text-[#3E5F44]">
                        {row.soilMoisture.toFixed
                          ? row.soilMoisture.toFixed(1)
                          : row.soilMoisture}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            mStatus
                          )}`}
                        >
                          {mStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#3E5F44]">
                        {row.temperature.toFixed
                          ? row.temperature.toFixed(1)
                          : row.temperature}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            tStatus
                          )}`}
                        >
                          {tStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#3E5F44]">
                        {row.co2}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            cStatus
                          )}`}
                        >
                          {cStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#3E5F44]">
                        {row.nitrate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            nStatus
                          )}`}
                        >
                          {nStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#3E5F44]">
                        {row.ph.toFixed ? row.ph.toFixed(1) : row.ph}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass(
                            pStatus
                          )}`}
                        >
                          {pStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5E936C] whitespace-nowrap">
                        {formatDate(row.timestamp)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
