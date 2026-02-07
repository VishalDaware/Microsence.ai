import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

export default function MonitoringStatusCard({ label, status, type }) {
  const isOk = type === "success";
  const icon = isOk ? (
    <CheckCircleIcon className="w-7 h-7 text-green-500 animate-bounce" />
  ) : (
    <ExclamationTriangleIcon className="w-7 h-7 text-red-500 animate-bounce" />
  );

  const badgeColor = isOk ? "bg-green-500" : "bg-red-500";

  return (
    <div className="bg-white border border-slate-500 rounded-xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow duration-300">
      {/* Left side: label + subtitle */}
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h4 className="text-lg font-bold text-slate-800">{label}</h4>
          <p className="text-sm text-slate-500">Monitoring status</p>
        </div>
      </div>

      {/* Right side: blinking status badge */}
      <span
        className={`px-4 py-1 rounded-full text-sm font-semibold text-white ${badgeColor} animate-pulse`}
      >
        {status}
      </span>
    </div>
  );
}
