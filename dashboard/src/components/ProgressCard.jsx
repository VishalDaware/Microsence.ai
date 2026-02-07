export default function ProgressCard({ label, percent, color }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-semibold text-slate-800">{label}</h4>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold text-white ${color}`}
        >
          {percent}%
        </span>
      </div>

      {/* Gradient Progress Bar */}
      <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-4 ${color} bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
