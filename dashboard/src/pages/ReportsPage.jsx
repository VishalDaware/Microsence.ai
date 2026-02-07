import { useState, useEffect } from "react";
import { EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Chart3D from "../components/Chart3D";

const API_BASE_URL = "http://localhost:5000/api";

export default function ReportsPage() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/fields/list?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setFields(data.fields || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async (fieldId = null) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/report?userId=${user.id}${
          fieldId ? `&fieldId=${fieldId}` : ""
        }`
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

  const downloadReport = async (fieldId = null) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/report/download?userId=${user.id}${
          fieldId ? `&fieldId=${fieldId}` : ""
        }`
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soil-health-report-${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentFieldName =
    selectedField && fields.length > 0
      ? fields.find((f) => f.id === selectedField)?.name
      : "Overall";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">
          Generate and download soil health reports
        </p>
      </div>

      {/* REPORT SELECT */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Generate Report</h2>

        {/* OVERALL */}
        <div className="flex gap-3">
          <button
            onClick={() => generateReport()}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg"
          >
            <EyeIcon className="w-4 h-4" />
            Preview Overall
          </button>

          <button
            onClick={() => downloadReport()}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download Overall
          </button>
        </div>

        {/* FIELD REPORTS */}
        <div className="grid md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{field.name}</p>
                <p className="text-sm text-gray-500">
                  {field.readingCount} readings
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateReport(field.id)}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded"
                >
                  Preview
                </button>

                <button
                  onClick={() => downloadReport(field.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
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
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-2xl font-bold">
            {currentFieldName} Report Preview
          </h2>

          {/* SUMMARY */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded">
              <p>Total Readings: {reportData.totalReadings}</p>
              <p>Avg Moisture: {reportData.avgMoisture}%</p>
              <p>Avg Temperature: {reportData.avgTemperature}°C</p>
              <p>Avg pH: {reportData.avgPh}</p>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <p className="font-bold">
                Health Score: {reportData.healthScore}/100
              </p>
              <p className="text-sm">{reportData.healthAssessment}</p>
            </div>
          </div>

          {/* CHARTS */}
          {reportData.readings?.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
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
              <Chart3D
                data={reportData.readings.map((r) => ({ value: r.ph }))}
                title="pH"
              />
              <Chart3D
                data={reportData.readings.map((r) => ({ value: r.co2 }))}
                title="CO₂"
              />
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3">
            <button
              onClick={() => downloadReport(selectedField)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>

            <button
              onClick={() => setShowPreview(false)}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
