import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = "http://localhost:5000/api";

export default function FieldsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState(null);

  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [selectedFarmForField, setSelectedFarmForField] = useState(null);

  const [farmName, setFarmName] = useState("");
  const [fieldData, setFieldData] = useState({
    name: "",
    location: "",
  });

  // Get userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // ================= FETCH FARMS =================
  const fetchFarms = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/farms?userId=${userId}`);
      const data = await res.json();
      if (data.success) setFarms(data.farms || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load farms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFarms();
    }
  }, [userId]);

  // ================= CREATE FARM =================
  const handleCreateFarm = async (e) => {
    e.preventDefault();
    if (!farmName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: farmName, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Farm created successfully");
        setFarmName("");
        setShowFarmModal(false);
        fetchFarms();
      } else {
        setError("Failed to create farm");
      }
    } catch (err) {
      setError("Error creating farm");
    }
  };

  // ================= CREATE FIELD =================
  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!fieldData.name.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/farms/${selectedFarmForField}/fields`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldData),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSuccess("Field added successfully");
        setFieldData({ name: "", location: "" });
        setShowFieldModal(false);
        fetchFarms();
      } else {
        setError("Failed to add field");
      }
    } catch (err) {
      setError("Error adding field");
    }
  };

  // ================= DELETE FARM =================
  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm("Delete this farm permanently?")) return;

    try {
      await fetch(`${API_BASE_URL}/farms/${farmId}`, {
        method: "DELETE",
      });
      fetchFarms();
    } catch (err) {
      setError("Failed to delete farm");
    }
  };

  return (
    <div className="min-h-screen bg-[#E8FFD7] px-6 py-8 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-[#3E5F44]">
            Farm Management
          </h1>
          <p className="text-[#5E936C] mt-2">
            Manage farms and their monitoring lifecycle
          </p>
        </div>

        <button
          onClick={() => setShowFarmModal(true)}
          className="flex items-center gap-2 bg-[#3E5F44] text-white px-6 py-2 rounded-xl hover:bg-[#5E936C] transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Farm
        </button>
      </div>

      {/* FARMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {farms.map((farm) => (
          <div
            key={farm.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-[#93DA97]/40 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-[#3E5F44]">
                {farm.name}
              </h3>
              <button
                onClick={() => handleDeleteFarm(farm.id)}
                className="text-[#5E936C] hover:text-[#3E5F44]"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#5E936C] mb-3">
              Fields: {farm.fields?.length || 0}
            </p>

            {farm.fields?.length > 0 && (
              <ul className="text-sm text-[#3E5F44] space-y-1 mb-4">
                {farm.fields.slice(0, 3).map((fld) => (
                  <li key={fld.id}>• {fld.name}</li>
                ))}
              </ul>
            )}

            <button
              onClick={() => {
                setSelectedFarmForField(farm.id);
                setShowFieldModal(true);
              }}
              className="w-full bg-[#93DA97] text-[#3E5F44] py-2 rounded-xl hover:opacity-90 transition text-sm font-medium"
            >
              Add Field
            </button>
          </div>
        ))}
      </div>

      {/* ================= FARM MODAL ================= */}
      {showFarmModal && (
        <Modal onClose={() => setShowFarmModal(false)}>
          <form onSubmit={handleCreateFarm} className="space-y-5">
            <h2 className="text-xl font-semibold text-[#3E5F44]">
              Create New Farm
            </h2>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="Farm Name"
              className="w-full px-4 py-3 rounded-xl border border-[#93DA97]/50 focus:ring-2 focus:ring-[#5E936C]"
            />
            <button className="w-full bg-[#3E5F44] text-white py-3 rounded-xl hover:bg-[#5E936C] transition">
              Create Farm
            </button>
          </form>
        </Modal>
      )}

      {/* ================= FIELD MODAL ================= */}
      {showFieldModal && (
        <Modal onClose={() => setShowFieldModal(false)}>
          <form onSubmit={handleCreateField} className="space-y-5">
            <h2 className="text-xl font-semibold text-[#3E5F44]">
              Add Field
            </h2>
            <input
              type="text"
              placeholder="Field Name"
              value={fieldData.name}
              onChange={(e) =>
                setFieldData({ ...fieldData, name: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-[#93DA97]/50 focus:ring-2 focus:ring-[#5E936C]"
            />
            <input
              type="text"
              placeholder="Location"
              value={fieldData.location}
              onChange={(e) =>
                setFieldData({ ...fieldData, location: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-[#93DA97]/50 focus:ring-2 focus:ring-[#5E936C]"
            />
            <button className="w-full bg-[#3E5F44] text-white py-3 rounded-xl hover:bg-[#5E936C] transition">
              Add Field
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ================= REUSABLE MODAL =================
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5E936C] hover:text-[#3E5F44]"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
