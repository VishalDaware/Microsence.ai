import {
  CloudIcon,
  FireIcon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RecommendationCard({ recommendations, metrics }) {

  // Extract numeric values safely
  const moisture = parseFloat(metrics?.soilmoisture?.value) || 0;
  const temperature = parseFloat(metrics?.temperature?.value) || 0;
  const co2 = parseFloat(metrics?.co2?.value) || 0;
  const nitrate = parseFloat(metrics?.nitrate?.value) || 0;
  const ph = parseFloat(metrics?.ph?.value) || 0;

  const pieData = {
    labels: ["Moisture", "Temperature", "CO₂", "Nitrate", "pH"],
    datasets: [
      {
        data: [moisture, temperature, co2, nitrate, ph],
        backgroundColor: [
          "#3E5F44",
          "#5E936C",
          "#93DA97",
          "#5E936C",
          "#3E5F44",
        ],
        borderColor: "#E8FFD7",
        borderWidth: 3,
        hoverOffset: 12,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#3E5F44",
          font: {
            size: 13,
            weight: "600",
          },
          padding: 20,
          boxWidth: 14,
        },
      },
      tooltip: {
        backgroundColor: "#3E5F44",
        titleColor: "#E8FFD7",
        bodyColor: "#E8FFD7",
        padding: 12,
        cornerRadius: 8,
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
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[#3E5F44] leading-relaxed font-medium"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8FFD7] flex items-center justify-center shrink-0">
                  {icons[idx % icons.length]}
                </div>
                <span className="text-sm sm:text-base">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE - PIE CHART */}
        <div className="flex-1 flex items-center justify-center">

          <div className="w-[280px] sm:w-[330px] h-[280px] sm:h-[330px]">
            <Pie data={pieData} options={pieOptions} />
          </div>

        </div>
      </div>
    </div>
  );
}
