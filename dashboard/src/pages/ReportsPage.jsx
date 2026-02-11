import { useState, useEffect } from "react";
import {
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Chart3D from "../components/Chart3D";

const API_BASE_URL = "http://localhost:5000/api";

export default function ReportsPage() {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // ================= FETCH FARMS =================
  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/farms`);
      const data = await res.json();
      if (data.success) {
        setFarms(data.farms || []);
        if (data.farms.length > 0) {
          setSelectedFarm(data.farms[0].id);
          setFields(data.farms[0].fields || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const farm = farms.find((f) => f.id === selectedFarm);
    setFields(farm?.fields || []);
  }, [selectedFarm, farms]);

  // ================= GENERATE REPORT =================
  const generateReport = async (farmId = null, fieldId = null) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/report?userId=${user.id}${
          farmId ? `&farmId=${farmId}` : ""
        }${fieldId ? `&fieldId=${fieldId}` : ""}`
      );

      const data = await res.json();
      if (data.success) {
        setReportData(data);
        setSelectedField(fieldId);
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ================= DOWNLOAD REPORT =================
  const downloadReport = async (farmId = null, fieldId = null) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/report/download?userId=${user.id}${
          farmId ? `&farmId=${farmId}` : ""
        }${fieldId ? `&fieldId=${fieldId}` : ""}`
      );

      if (!res.ok) {
        console.error("PDF download failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soil-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-[#3E5F44]">
          Reports & Analytics
        </h1>
        <p className="text-[#5E936C] mt-2">
          Generate farm and field soil health reports
        </p>
      </div>

      {/* FARM SELECTOR */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#93DA97]/40 space-y-6">

        <div className="flex flex-col md:flex-row md:items-center gap-4">

          <select
            value={selectedFarm || ""}
            onChange={(e) => setSelectedFarm(parseInt(e.target.value))}
            className="px-4 py-2 rounded-xl border border-[#93DA97]/50 
            text-[#3E5F44] bg-white shadow-sm focus:ring-2 focus:ring-[#5E936C]"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              onClick={() => generateReport(selectedFarm)}
              className="flex items-center gap-2 bg-[#93DA97] text-[#3E5F44] px-4 py-2 rounded-xl"
            >
              <EyeIcon className="w-4 h-4" />
              Preview Farm
            </button>

            <button
              onClick={() => downloadReport(selectedFarm)}
              className="flex items-center gap-2 bg-[#3E5F44] text-white px-4 py-2 rounded-xl"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download Farm PDF
            </button>
          </div>
        </div>

        {/* FIELD REPORTS */}
        <div className="grid md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="border border-[#93DA97]/40 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-[#3E5F44]">
                  {field.name}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateReport(selectedFarm, field.id)}
                  className="bg-[#E8FFD7] text-[#3E5F44] px-3 py-1 rounded-lg text-sm"
                >
                  Preview
                </button>

                <button
                  onClick={() => downloadReport(selectedFarm, field.id)}
                  className="bg-[#5E936C] text-white px-3 py-1 rounded-lg text-sm"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW */}
      {showPreview && reportData && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#93DA97]/40 space-y-6">

          <h2 className="text-2xl font-semibold text-[#3E5F44]">
            Report Preview
          </h2>

          {/* SUMMARY CARDS */}
          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-[#E8FFD7] p-4 rounded-xl">
              <p>Total Readings</p>
              <p className="text-xl font-semibold">
                {reportData.totalReadings}
              </p>
            </div>

            <div className="bg-[#E8FFD7] p-4 rounded-xl">
              <p>Avg Moisture</p>
              <p className="text-xl font-semibold">
                {reportData.avgMoisture}%
              </p>
            </div>

            <div className="bg-[#E8FFD7] p-4 rounded-xl">
              <p>Health Score</p>
              <p className="text-xl font-semibold">
                {reportData.healthScore}/100
              </p>
            </div>
          </div>

          {/* CHARTS */}
          {reportData.readings?.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <Chart3D
                data={reportData.readings.map((r) => ({
                  value: r.soilMoisture,
                }))}
                title="Moisture"
              />
              <Chart3D
                data={reportData.readings.map((r) => ({
                  value: r.temperature,
                }))}
                title="Temperature"
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() =>
                downloadReport(selectedFarm, selectedField)
              }
              className="bg-[#3E5F44] text-white px-4 py-2 rounded-xl"
            >
              Download PDF
            </button>

            <button
              onClick={() => setShowPreview(false)}
              className="bg-[#93DA97] text-[#3E5F44] px-4 py-2 rounded-xl"
            >
              Close
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
