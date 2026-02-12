import { useState, useEffect, useRef } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

const API_BASE_URL = "http://localhost:5000/api";

// Same optimal ranges used in ChartsPage
const OPTIMAL_RANGES = {
  soilMoisture: { min: 40, max: 65, label: "Moisture (%)" },
  temperature: { min: 24, max: 28, label: "Temperature (°C)" },
  co2: { min: 400, max: 600, label: "CO₂ (ppm)" },
  nitrate: { min: 15, max: 25, label: "Nitrate (mg/L)" },
  ph: { min: 6.0, max: 6.5, label: "pH" },
};

// Same plugin used in ChartsPage to shade optimal band
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

    const { left, right } = chartArea;
    const yTop = y.getPixelForValue(optimalMax);
    const yBottom = y.getPixelForValue(optimalMin);

    ctx.save();
    ctx.fillStyle = "rgba(147, 218, 151, 0.16)";
    ctx.fillRect(left, yTop, right - left, yBottom - yTop);
    ctx.restore();
  },
};

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, optimalRegionPlugin);

export default function ReportsPage({ onNotification }) {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [fieldData, setFieldData] = useState([]); // latest per-field readings for charts + table
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  // Refs for chart canvases
  const chartRefs = {
    moisture: useRef(null),
    temperature: useRef(null),
    co2: useRef(null),
    nitrate: useRef(null),
    ph: useRef(null),
    health: useRef(null),
  };

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // ================= GENERATE NOTIFICATIONS FOR LOW VALUES =================
  const generateNotifications = (data) => {
    if (!onNotification || !data) return;

    // Check for low values and create notifications
    const THRESHOLDS = {
      soilMoisture: { min: 40, warning: 'Soil moisture is low' },
      temperature: { min: 24, warning: 'Temperature is below optimal' },
      co2: { min: 400, warning: 'CO₂ level is low' },
      nitrate: { min: 15, warning: 'Nitrate level is low' },
      ph: { min: 6.0, warning: 'pH level is low' },
    };

    (data || []).forEach((field) => {
      if (field.soilMoisture && field.soilMoisture < THRESHOLDS.soilMoisture.min) {
        onNotification('⚠️ Low Soil Moisture', `${field.fieldName}: ${field.soilMoisture}% (optimal: 40-65%)`);
      }
      if (field.temperature && field.temperature < THRESHOLDS.temperature.min) {
        onNotification('🌡️ Low Temperature', `${field.fieldName}: ${field.temperature}°C (optimal: 24-28°C)`);
      }
      if (field.co2 && field.co2 < THRESHOLDS.co2.min) {
        onNotification('💨 Low CO₂ Level', `${field.fieldName}: ${field.co2}ppm (optimal: 400-600ppm)`);
      }
      if (field.nitrate && field.nitrate < THRESHOLDS.nitrate.min) {
        onNotification('🌱 Low Nitrate', `${field.fieldName}: ${field.nitrate}mg/L (optimal: 15-25mg/L)`);
      }
      if (field.ph && field.ph < THRESHOLDS.ph.min) {
        onNotification('📊 Low pH', `${field.fieldName}: ${field.ph} (optimal: 6.0-6.5)`);
      }
    });
  };

  // ================= FETCH FARMS =================
  useEffect(() => {
    if (user?.id) {
      fetchFarms();
    }
  }, [user?.id]);

  const fetchFarms = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/farms?userId=${user.id}`);
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

  // Helper: fetch latest reading per field (same logic as TablesPage)
  const fetchLatestByField = async (farmId) => {
    if (!user?.id || !farmId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/all?farmId=${farmId}&userId=${user.id}&limit=1000`
      );
      const data = await res.json();
      if (data.success) {
        const latestByField = {};
        (data.readings || []).forEach((reading) => {
          const fieldId = reading.fieldId;
          if (
            !latestByField[fieldId] ||
            reading.timestamp > latestByField[fieldId].timestamp
          ) {
            latestByField[fieldId] = reading;
          }
        });

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
        
        // Generate notifications for low values
        generateNotifications(tableData);
      } else {
        setFieldData([]);
      }
    } catch (err) {
      console.error("Error fetching latest field readings for report:", err);
      setFieldData([]);
    }
  };

  // ================= GENERATE REPORT =================
  const generateReport = async (farmId = null, fieldId = null) => {
    const targetFarmId = farmId || selectedFarm;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/readings/report?userId=${user.id}${
          targetFarmId ? `&farmId=${targetFarmId}` : ""
        }${fieldId ? `&fieldId=${fieldId}` : ""}`
      );

      const data = await res.json();
      if (data.success) {
        setReportData(data);
        setSelectedField(fieldId);
        await fetchLatestByField(targetFarmId);
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ================= DOWNLOAD REPORT (Server-side PDF generation) =================
  const downloadPreviewPdf = async () => {
    if (!reportData || !selectedFarm) return;

    try {
      setLoading(true);
      
      // Capture chart images
      const chartImages = {};
      const chartKeys = ['moisture', 'temperature', 'co2', 'nitrate', 'ph', 'health'];
      
      for (const key of chartKeys) {
        const canvas = chartRefs[key].current?.canvas;
        if (canvas) {
          chartImages[key] = canvas.toDataURL('image/png');
        }
      }

      // Prepare data for server-side PDF generation
      const pdfPayload = {
        userId: user?.id,
        farmId: selectedFarm,
        reportData: reportData,
        farmName: currentFarm?.name || 'Selected Farm',
        userName: user?.name || user?.fullName || user?.email || 'Current user',
        fieldData: fieldData,
        chartImages: chartImages, // Add chart images
      };

      // Request PDF from backend
      const response = await fetch(`${API_BASE_URL}/reports/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Get PDF blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soil-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF from server:', err);
      alert('Unable to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentFarm = farms.find((f) => f.id === selectedFarm) || null;

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
          </div>
        </div>

      </div>

      {/* PREVIEW */}
      {showPreview && reportData && (
        <div
          ref={previewRef}
          className="bg-white rounded-2xl p-6 shadow-sm border border-[#93DA97]/40"
        >
          {/* mimic PDF page */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / meta */}
            <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#5E936C]">
                  Soil health report
                </p>
                <h2 className="text-2xl font-semibold text-[#3E5F44]">
                  {currentFarm?.name || "Selected Farm"}
                </h2>
              </div>
              <div className="text-xs text-right text-[#5E936C] space-y-1">
                <p>
                  Farmer:{" "}
                  <span className="font-semibold text-[#3E5F44]">
                    {user?.name || user?.fullName || user?.email || "Current user"}
                  </span>
                </p>
                <p>
                  Date:{" "}
                  <span className="font-medium text-[#3E5F44]">
                    {new Date().toLocaleDateString()}
                  </span>
                </p>
                {currentFarm && (
                  <p>
                    Fields:{" "}
                    <span className="font-medium text-[#3E5F44]">
                      {currentFarm.fields?.map((f) => f.name).join(", ") ||
                        "N/A"}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#E8FFD7] p-4 rounded-xl">
                <p className="text-xs text-[#5E936C] uppercase tracking-wide">
                  Total readings
                </p>
                <p className="text-xl font-semibold text-[#3E5F44]">
                  {reportData.totalReadings ? reportData.totalReadings - 1 : "--"}
                </p>
              </div>

              <div className="bg-[#E8FFD7] p-4 rounded-xl">
                <p className="text-xs text-[#5E936C] uppercase tracking-wide">
                  Avg moisture
                </p>
                <p className="text-xl font-semibold text-[#3E5F44]">
                  {reportData.avgMoisture != null
                    ? `${reportData.avgMoisture}%`
                    : "--"}
                </p>
              </div>

              <div className="bg-[#E8FFD7] p-4 rounded-xl">
                <p className="text-xs text-[#5E936C] uppercase tracking-wide">
                  Health score
                </p>
                <p className="text-xl font-semibold text-[#3E5F44]">
                  {reportData.healthScore != null
                    ? `${reportData.healthScore}/100`
                    : "--"}
                </p>
              </div>
            </div>

            {/* FIELD LIST / NUMERIC OVERVIEW */}
            {currentFarm?.fields?.length > 0 && (
              <div className="border border-[#93DA97]/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-[#E8FFD7] border-b border-[#93DA97]/40">
                  <p className="text-sm font-semibold text-[#3E5F44]">
                    Fields overview
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5FFEC]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFarm.fields.map((f) => (
                        <tr key={f.id} className="border-t border-[#93DA97]/30">
                          <td className="px-3 py-2 text-[#3E5F44] font-medium">
                            {f.name}
                          </td>
                          <td className="px-3 py-2 text-[#5E936C]">
                            Latest numeric details and charts are included in the
                            attached PDF export.
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FIELD READINGS TABLE (all fields, latest values) */}
            {fieldData.length > 0 && (
              <div className="border border-[#93DA97]/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-[#E8FFD7] border-b border-[#93DA97]/40">
                  <p className="text-sm font-semibold text-[#3E5F44]">
                    Field readings table
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5FFEC]">
                      <tr>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Moisture (%)
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Temp (°C)
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          CO₂ (ppm)
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Nitrate (mg/L)
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          pH
                        </th>
                        <th className="px-3 py-2 text-left text-[#3E5F44] font-semibold">
                          Last updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldData.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-[#93DA97]/30"
                        >
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.fieldName}
                          </td>
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.soilMoisture}
                          </td>
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.temperature}
                          </td>
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.co2}
                          </td>
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.nitrate}
                          </td>
                          <td className="px-3 py-2 text-[#3E5F44]">
                            {row.ph}
                          </td>
                          <td className="px-3 py-2 text-[#5E936C] whitespace-nowrap">
                            {row.timestamp
                              ? new Date(row.timestamp).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FIELD COMPARISON CHARTS (same style as ChartsPage) */}
            {fieldData.length > 0 && (() => {
              const fieldNames = fieldData.map((r) => r.fieldName);
              const moistureValues = fieldData.map((r) => r.soilMoisture);
              const temperatureValues = fieldData.map((r) => r.temperature);
              const co2Values = fieldData.map((r) => r.co2);
              const nitrateValues = fieldData.map((r) => r.nitrate);
              const phValues = fieldData.map((r) => r.ph);

              const scoreParameter = (value, { min, max }) => {
                if (value == null || Number.isNaN(value)) return 0;
                const range = max - min || 1;
                if (value >= min && value <= max) return 100;
                const diff = value < min ? min - value : value - max;
                const penaltyRatio = Math.min(diff / range, 2);
                const score = 100 * (1 - 0.5 * penaltyRatio);
                return Math.max(0, Math.min(100, score));
              };

              const overallHealthScores = fieldData.map((_, idx) => {
                const mScore = scoreParameter(
                  moistureValues[idx],
                  OPTIMAL_RANGES.soilMoisture
                );
                const tScore = scoreParameter(
                  temperatureValues[idx],
                  OPTIMAL_RANGES.temperature
                );
                const cScore = scoreParameter(
                  co2Values[idx],
                  OPTIMAL_RANGES.co2
                );
                const nScore = scoreParameter(
                  nitrateValues[idx],
                  OPTIMAL_RANGES.nitrate
                );
                const pScore = scoreParameter(phValues[idx], OPTIMAL_RANGES.ph);
                return Math.round(
                  (mScore + tScore + cScore + nScore + pScore) / 5
                );
              });

              const primary = "#3E5F44";
              const secondary = "#5E936C";

              const makeBarOpts = (optimalKey) => ({
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                  legend: {
                    labels: {
                      color: primary,
                      font: { size: 11, weight: "600" },
                    },
                  },
                  optimalRegion: optimalKey
                    ? {
                        optimalMin: OPTIMAL_RANGES[optimalKey].min,
                        optimalMax: OPTIMAL_RANGES[optimalKey].max,
                      }
                    : undefined,
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
              });

              return (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#3E5F44]">
                    Field comparison charts
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        Soil Moisture across Fields
                      </p>
                      <Bar
                        ref={chartRefs.moisture}
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
                        options={makeBarOpts("soilMoisture")}
                      />
                    </div>

                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        Temperature across Fields
                      </p>
                      <Bar
                        ref={chartRefs.temperature}
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
                        options={makeBarOpts("temperature")}
                      />
                    </div>

                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        CO₂ across Fields
                      </p>
                      <Bar
                        ref={chartRefs.co2}
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
                        options={makeBarOpts("co2")}
                      />
                    </div>

                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        Nitrate across Fields
                      </p>
                      <Bar
                        ref={chartRefs.nitrate}
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
                        options={makeBarOpts("nitrate")}
                      />
                    </div>

                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        pH across Fields
                      </p>
                      <Bar
                        ref={chartRefs.ph}
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
                        options={makeBarOpts("ph")}
                      />
                    </div>

                    <div className="bg-[#F5FFEC] rounded-xl p-3 h-[220px]">
                      <p className="text-xs font-semibold text-[#3E5F44] mb-2">
                        Overall Soil Health across Fields
                      </p>
                      <Bar
                        ref={chartRefs.health}
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
                          animation: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: primary,
                                font: { size: 11, weight: "600" },
                              },
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
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Close */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={downloadPreviewPdf}
                className="bg-[#3E5F44] text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-[#93DA97] text-[#3E5F44] px-4 py-2 rounded-xl text-sm font-medium"
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
