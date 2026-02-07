export default function ComponentsPage() {
  const components = [
    {
      name: "Soil Moisture Sensor",
      image: "https://imgs.search.brave.com/19G6eLNm3BKrqZoWlxxEQBMQx6kQmFMjuKxO5heYBkc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zaGFy/dmllbGVjdHJvbmlj/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjAvMDIvU29p/bC1Nb2lzdHVyZS1T/ZW5zb3ItTW9kdWxl/LmpwZw",
      status: "Fine",
    },
    {
      name: "Temperature Sensor (DS18B20)",
      image: "https://imgs.search.brave.com/vryohPzOaePSCKyPrQdL_XykpMxWU8dOPfGCGUQC7uo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NDFzc2VGczV1R0wu/anBn",
      status: "Needs Maintenance",
    },
    {
      name: "pH Sensor",
      image: "https://imgs.search.brave.com/wHIMUFpZ8PaGiR7sMqAZJMKey1A6DdHrJxZ6KQdb8aU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTEyT1JPakFINUwu/anBn",
      status: "Fine",
    },
    {
      name: "NPK Sensor",
      image: "https://imgs.search.brave.com/eLk7-a5Bsp87A29DIf54Us-QwECEyNGCOOVEYnXbnhU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTF3TDNRKzNDYUwu/anBn",
      status: "Fine",
    },
    {
      name: "Water Pump",
      image: "https://imgs.search.brave.com/bQ5zolHnx-iFJamFt5oChpRGEEmUM2TE7HKkADc8hXE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzEtNmFOdjRTK0wu/anBn",
      status: "Not Working",
    },
  ];

  // Helper to style status
  const getStatusStyle = (status) => {
    switch (status) {
      case "Fine":
        return "bg-green-100 text-green-700";
      case "Needs Maintenance":
        return "bg-yellow-100 text-yellow-700";
      case "Not Working":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">IoT Components</h1>
      <p className="text-slate-600 mb-8">
        Monitor the IoT components used in the soil health monitoring system and check their working state.
      </p>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((comp, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col items-center"
          >
            <img
              src={comp.image}
              alt={comp.name}
              className="w-32 h-32 object-cover rounded-md mb-4"
            />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {comp.name}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                comp.status
              )}`}
            >
              {comp.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
