import { useState, useMemo } from "react";
import {
  CloudIcon,
  FireIcon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// Custom plugin to draw the optimal region as a light band
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

    const { top, bottom, left, right } = chartArea;

    const yTop = y.getPixelForValue(optimalMax);
    const yBottom = y.getPixelForValue(optimalMin);

    ctx.save();
    ctx.fillStyle = "rgba(147, 218, 151, 0.18)"; // soft green band
    ctx.fillRect(left, yTop, right - left, yBottom - yTop);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  optimalRegionPlugin
);

// Frontend representation of optimal ranges inferred from ml_service.py
const METRIC_CONFIG = {
  soilmoisture: {
    key: "soilmoisture",
    label: "Moisture (%)",
    shortLabel: "Moisture",
    unit: "%",
    optimalMin: 40,
    optimalMax: 70,
  },
  temperature: {
    key: "temperature",
    label: "Temperature (°C)",
    shortLabel: "Temp",
    unit: "°C",
    optimalMin: 15,
    optimalMax: 30,
  },
  co2: {
    key: "co2",
    label: "CO₂ (ppm)",
    shortLabel: "CO₂",
    unit: "ppm",
    optimalMin: 300,
    optimalMax: 800,
  },
  nitrate: {
    key: "nitrate",
    label: "Nitrate (ppm)",
    shortLabel: "Nitrate",
    unit: "ppm",
    optimalMin: 10,
    optimalMax: 30,
  },
  ph: {
    key: "ph",
    label: "pH",
    shortLabel: "pH",
    unit: "",
    optimalMin: 6.0,
    optimalMax: 7.5,
  },
};

export default function RecommendationCard({ recommendations, metrics }) {

  // Debug logging
  console.log("📋 RecommendationCard rendered with props:", {
    recommendationCount: recommendations?.length,
    recommendationType: typeof recommendations,
    isArray: Array.isArray(recommendations),
    recommendations: JSON.stringify(recommendations),
    metricsKeys: Object.keys(metrics || {})
  });

  if (recommendations && recommendations.length > 0) {
    console.log(`✨ RENDERING ${recommendations.length} ML RECOMMENDATIONS`);
    recommendations.forEach((rec, idx) => {
      console.log(`  [${idx}] ${rec}`);
    });
  } else {
    console.log(`⚠️ RENDERING FALLBACK - recommendations falsy or empty`);
    console.log(`  - recommendations: ${recommendations}`);
    console.log(`  - length: ${recommendations?.length}`);
  }

  // Extract numeric values safely
  const moisture = parseFloat(metrics?.soilmoisture?.value) || 0;
  const temperature = parseFloat(metrics?.temperature?.value) || 0;
  const co2 = parseFloat(metrics?.co2?.value) || 0;
  const nitrate = parseFloat(metrics?.nitrate?.value) || 0;
  const ph = parseFloat(metrics?.ph?.value) || 0;

  const [selectedMetricKey, setSelectedMetricKey] = useState("temperature");

  const metricValues = useMemo(
    () => ({
      soilmoisture: moisture,
      temperature,
      co2,
      nitrate,
      ph,
    }),
    [moisture, temperature, co2, nitrate, ph]
  );

  const selectedConfig =
    METRIC_CONFIG[selectedMetricKey] ?? METRIC_CONFIG.temperature;

  const currentValue = metricValues[selectedConfig.key] ?? 0;

  const chartData = {
    labels: ["Current"],
    datasets: [
      {
        label: selectedConfig.label,
        data: [currentValue],
        backgroundColor: "#5E936C",
        borderRadius: 10,
        borderSkipped: false,
      },
    ],
  };

  const suggestedMax = (() => {
    const base = selectedConfig.optimalMax || currentValue || 1;
    const maxVal = Math.max(base, currentValue);
    return maxVal * 1.2;
  })();

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#3E5F44",
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax,
        grid: {
          color: "rgba(62, 95, 68, 0.08)",
          drawBorder: false,
        },
        ticks: {
          color: "#3E5F44",
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#3E5F44",
        titleColor: "#E8FFD7",
        bodyColor: "#E8FFD7",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0;
            return `${selectedConfig.label}: ${v.toFixed(2)}${
              selectedConfig.unit ? ` ${selectedConfig.unit}` : ""
            }`;
          },
        },
      },
      optimalRegion: {
        optimalMin: selectedConfig.optimalMin,
        optimalMax: selectedConfig.optimalMax,
      },
    },
  };

  const icons = [
    <CloudIcon className="w-5 h-5 text-[#5E936C]" />,
    <FireIcon className="w-5 h-5 text-[#5E936C]" />,
    <ChartBarIcon className="w-5 h-5 text-[#5E936C]" />,
    <BeakerIcon className="w-5 h-5 text-[#5E936C]" />,
    <BoltIcon className="w-5 h-5 text-[#5E936C]" />,
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#93DA97]/40 
    hover:shadow-md transition-all duration-300">

      <div className="flex flex-col lg:flex-row gap-10">

        {/* LEFT SIDE */}
        <div className="flex-1">

          <h3 className="text-xl sm:text-2xl font-semibold text-[#3E5F44] mb-6">
            Recommendations
          </h3>

          <ul className="space-y-4">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, idx) => {
                console.log(`  [${idx}] ${rec}`);
                return (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-[#3E5F44] leading-relaxed font-medium"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E8FFD7] flex items-center justify-center shrink-0">
                      {icons[idx % icons.length]}
                    </div>
                    <span>{rec}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-[#5E936C] italic">No recommendations available</li>
            )}
          </ul>
        </div>

        {/* RIGHT SIDE - METRIC CHART WITH TOGGLE */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center">
          {/* metric toggle */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Object.keys(METRIC_CONFIG).map((key) => {
              const cfg = METRIC_CONFIG[key];
              const isActive = key === selectedMetricKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMetricKey(key)}
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border transition ${
                    isActive
                      ? "bg-[#5E936C] text-white border-[#5E936C] shadow-sm"
                      : "bg-white text-[#5E936C] border-[#93DA97] hover:bg-[#E8FFD7]"
                  }`}
                >
                  {cfg.shortLabel}
                </button>
              );
            })}
          </div>

          {/* chart + legend */}
          <div className="w-[280px] sm:w-[330px] h-[260px] sm:h-[300px]">
            <Bar data={chartData} options={barOptions} />
          </div>

          <div className="text-xs sm:text-sm text-[#3E5F44] bg-[#E8FFD7]/60 px-3 py-2 rounded-xl text-center max-w-xs">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="inline-block w-3 h-3 rounded-full bg-[rgba(147,218,151,0.5)] border border-[#5E936C]/30" />
              <span className="font-semibold">Optimal region</span>
            </div>
            <p>
              {selectedConfig.optimalMin} – {selectedConfig.optimalMax}
              {selectedConfig.unit ? ` ${selectedConfig.unit}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
