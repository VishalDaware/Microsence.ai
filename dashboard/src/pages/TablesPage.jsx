import { CloudIcon, FireIcon, BeakerIcon, SunIcon, } from "@heroicons/react/24/solid";
import { Leaf } from "phosphor-react"

export default function TablesPage() {
  // Dummy datasets
  const soilData = [
    { field: "Field A", moisture: "45%", status: "Optimal" },
    { field: "Field B", moisture: "30%", status: "Low" },
    { field: "Field C", moisture: "60%", status: "High" },
    { field: "Field D", moisture: "50%", status: "Optimal" },
  ];

  const tempData = [
    { field: "Field A", temp: "28°C", status: "Normal" },
    { field: "Field B", temp: "34°C", status: "High" },
    { field: "Field C", temp: "22°C", status: "Low" },
    { field: "Field D", temp: "26°C", status: "Normal" },
  ];

  const nutrientData = [
    { field: "Field A", nitrate: "12 mg/L", ph: "6.5" },
    { field: "Field B", nitrate: "8 mg/L", ph: "5.8" },
    { field: "Field C", nitrate: "15 mg/L", ph: "7.0" },
    { field: "Field D", nitrate: "10 mg/L", ph: "6.2" },
  ];

  const lightData = [
    { field: "Field A", lux: "1200", status: "Bright" },
    { field: "Field B", lux: "800", status: "Moderate" },
    { field: "Field C", lux: "400", status: "Low" },
    { field: "Field D", lux: "1500", status: "Bright" },
  ];

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-8 flex items-center gap-2">
       <Leaf size={35} color="#22c55e" weight="fill" />
        Plant Monitoring Data Tables
      </h1>

      {/* Responsive colorful grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
        
        {/* Soil Moisture */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-blue-200">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 font-semibold">
            <CloudIcon className="w-5 h-5" />
            Soil Moisture
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Moisture</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {soilData.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-blue-50 hover:bg-blue-100">
                  <td className="px-4 py-2 font-medium">{row.field}</td>
                  <td className="px-4 py-2">{row.moisture}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold 
                      ${row.status === "Optimal" ? "bg-green-100 text-green-700" : 
                        row.status === "Low" ? "bg-red-100 text-red-700" : 
                        "bg-yellow-100 text-yellow-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Temperature */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-red-200">
         <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 font-semibold">
            <FireIcon className="w-5 h-5" />
            Temperature
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Temp</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {tempData.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-red-50 hover:bg-red-100">
                  <td className="px-4 py-2 font-medium">{row.field}</td>
                  <td className="px-4 py-2">{row.temp}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold 
                      ${row.status === "Normal" ? "bg-green-100 text-green-700" : 
                        row.status === "High" ? "bg-red-100 text-red-700" : 
                        "bg-yellow-100 text-yellow-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nutrients */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-yellow-200">
         <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 font-semibold">
            <BeakerIcon className="w-5 h-5" />
            Nutrients
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Nitrate</th>
                <th className="px-4 py-2">pH</th>
              </tr>
            </thead>
            <tbody>
              {nutrientData.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-yellow-50 hover:bg-yellow-100">
                  <td className="px-4 py-2 font-medium">{row.field}</td>
                  <td className="px-4 py-2">{row.nitrate}</td>
                  <td className="px-4 py-2">{row.ph}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Light Levels */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-indigo-200">
           <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 font-semibold">
            <SunIcon className="w-5 h-5" />
            Light Levels
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-4 py-2">Field</th>
                <th className="px-4 py-2">Lux</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {lightData.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-indigo-50 hover:bg-indigo-100">
                  <td className="px-4 py-2 font-medium">{row.field}</td>
                  <td className="px-4 py-2">{row.lux}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold 
                      ${row.status === "Bright" ? "bg-blue-100 text-blue-700" : 
                        row.status === "Moderate" ? "bg-yellow-100 text-yellow-700" : 
                        "bg-red-100 text-red-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
