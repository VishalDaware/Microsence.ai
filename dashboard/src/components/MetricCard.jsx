function getStatusAndColor(title, numericValue) {
  let status = "Optimal";
  let bgColor = "bg-green-100";
  let textColor = "text-green-700";
  
  // Remove units and convert to number
  const val = typeof numericValue === 'string' 
    ? parseFloat(numericValue) 
    : numericValue;

  if (isNaN(val)) return { status, bgColor, textColor };

  // Define ranges for each metric
  if (title.includes("Soil Moisture")) {
    if (val < 40) {
      status = "Low";
      bgColor = "bg-orange-100";
      textColor = "text-orange-700";
    } else if (val > 65) {
      status = "High";
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    }
  } else if (title.includes("Temperature")) {
    if (val < 15) {
      status = "Low";
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
    } else if (val > 30) {
      status = "High";
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    }
  } else if (title.includes("CO₂")) {
    if (val < 300) {
      status = "Low";
      bgColor = "bg-blue-100";
      textColor = "text-blue-700";
    } else if (val > 800) {
      status = "High";
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    }
  } else if (title.includes("Nitrate")) {
    if (val < 10) {
      status = "Low";
      bgColor = "bg-orange-100";
      textColor = "text-orange-700";
    } else if (val > 30) {
      status = "High";
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    }
  } else if (title.includes("pH")) {
    if (val < 6.0) {
      status = "Low";
      bgColor = "bg-orange-100";
      textColor = "text-orange-700";
    } else if (val > 7.5) {
      status = "High";
      bgColor = "bg-red-100";
      textColor = "text-red-700";
    }
  }

  return { status, bgColor, textColor };
}

export default function MetricCard({ title, value, icon, color }) {
  const { status, bgColor, textColor } = getStatusAndColor(title, value);

  return (
    <div
      className={`rounded-xl p-6 shadow-md hover:shadow-lg transition-transform duration-300 hover:scale-[1.02] ${color} relative`}
    >
      <div className="flex items-center justify-between">
        {/* Left side: value in front of title */}
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            {title}
          </h4>
        </div>

        {/* Right side: icon + status tag */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-inner">
            {icon}
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${bgColor} ${textColor}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
