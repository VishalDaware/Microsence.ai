function getStatusAndColor(title, numericValue) {
  let status = "Optimal";
  let bgColor = "bg-[#E8FFD7]";
  let textColor = "text-[#3E5F44]";

  const val =
    typeof numericValue === "string"
      ? parseFloat(numericValue)
      : numericValue;

  if (isNaN(val)) return { status, bgColor, textColor };

  if (title.includes("Moisture")) {
    if (val < 40) {
      status = "Low";
      bgColor = "bg-[#93DA97]/30";
      textColor = "text-[#3E5F44]";
    } else if (val > 65) {
      status = "High";
      bgColor = "bg-[#5E936C]/30";
      textColor = "text-[#3E5F44]";
    }
  } else if (title.includes("Temperature")) {
    if (val < 15) {
      status = "Low";
      bgColor = "bg-[#93DA97]/30";
      textColor = "text-[#3E5F44]";
    } else if (val > 30) {
      status = "High";
      bgColor = "bg-[#5E936C]/30";
      textColor = "text-[#3E5F44]";
    }
  } else if (title.includes("CO₂")) {
    if (val < 300) {
      status = "Low";
      bgColor = "bg-[#93DA97]/30";
      textColor = "text-[#3E5F44]";
    } else if (val > 800) {
      status = "High";
      bgColor = "bg-[#5E936C]/30";
      textColor = "text-[#3E5F44]";
    }
  } else if (title.includes("Nitrate")) {
    if (val < 10) {
      status = "Low";
      bgColor = "bg-[#93DA97]/30";
      textColor = "text-[#3E5F44]";
    } else if (val > 30) {
      status = "High";
      bgColor = "bg-[#5E936C]/30";
      textColor = "text-[#3E5F44]";
    }
  } else if (title.includes("pH")) {
    if (val < 6.0) {
      status = "Low";
      bgColor = "bg-[#93DA97]/30";
      textColor = "text-[#3E5F44]";
    } else if (val > 7.5) {
      status = "High";
      bgColor = "bg-[#5E936C]/30";
      textColor = "text-[#3E5F44]";
    }
  }

  return { status, bgColor, textColor };
}

export default function MetricCard({ title, value, icon }) {
  const { status, bgColor, textColor } = getStatusAndColor(title, value);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#93DA97]/40 
    hover:shadow-md transition-all duration-300">

      <div className="flex items-start justify-between">

        {/* LEFT CONTENT */}
        <div className="flex flex-col space-y-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#5E936C]">
            {title}
          </p>

          <h3 className="text-2xl sm:text-3xl font-semibold text-[#3E5F44]">
            {value}
          </h3>

          {/* STATUS BADGE */}
          <span
            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${bgColor} ${textColor}`}
          >
            {status}
          </span>
        </div>

        {/* ICON */}
        <div className="flex items-center justify-center w-12 h-12 rounded-xl 
        bg-[#E8FFD7] text-[#3E5F44] shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
