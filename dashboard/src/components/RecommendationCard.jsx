// src/components/RecommendationCard.jsx
import {
  CloudIcon,
  FireIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  BoltIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RecommendationCard({ recommendations }) {
  const icons = [
    <CloudIcon className="w-6 h-6 text-blue-500" />,
    <FireIcon className="w-6 h-6 text-red-500" />,
    <ArrowTrendingDownIcon className="w-6 h-6 text-green-500" />,
    <BeakerIcon className="w-6 h-6 text-yellow-500" />,
    <BoltIcon className="w-6 h-6 text-purple-500" />,
    <SunIcon className="w-6 h-6 text-orange-500" />,
  ];

  // Dummy data for pie chart
  const pieData = {
    labels: ["Soil Moisture", "Temperature", "CO₂", "Nitrate", "pH", "Light"],
    datasets: [
      {
        data: [25, 20, 15, 10, 15, 15],
        backgroundColor: [
          "#3b82f6", // blue
          "#ef4444", // red
          "#22c55e", // green
          "#eab308", // yellow
          "#a855f7", // purple
          "#f97316", // orange
        ],
        borderWidth: 2,
        radius: "90%"
      },
    ],
  };

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,       // show legend again
      position: "left",    // move labels to the left side
      labels: {
        font: {
          size: 14,
          weight: "bold",
        },
        color: "#374151",  // slate-700
        boxWidth: 20,      // size of color box
        padding: 5,       // spacing between items
      },
    },
  },
  layout: {
    padding: 0,            // remove extra padding
  },
};



  return (
    <div className="bg-gradient-to-r from-slate-300 to-slate-300 rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300 flex flex-col lg:flex-row gap-8">
      {/* Left side: Recommendations */}
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          Recommendations
        </h3>
        <ul className="space-y-4">
          {recommendations.map((rec, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-lg text-slate-700 leading-relaxed font-medium hover:text-slate-900 transition-colors duration-200"
            >
              {icons[idx]}
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right side: Larger Pie chart */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[330px] h-[330px]"> {/* Increased size */}
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
    </div>
  );
}
