import {
  BellIcon,
  EnvelopeIcon,
  Bars3Icon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggleSidebar, user, onLogout }) {
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState("Field 1");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      console.log("Data refreshed for:", selectedField);
    }, 1500);
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <header className="w-full bg-white border-b border-b-2 border-blue-300 shadow px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left: mobile toggle + field dropdown */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded hover:bg-slate-100 transition-colors"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="w-7 h-7 text-slate-700" />
        </button>

        <div className="relative">
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="appearance-none bg-gradient-to-r from-blue-50 to-blue-100 text-slate-700 
                       rounded-lg px-4 py-2 text-sm shadow focus:outline-none focus:ring-2 
                       focus:ring-blue-400 hover:shadow-md transition-all cursor-pointer"
          >
            <option>Field 1</option>
            <option>Field 2</option>
            <option>Field 3</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            ▼
          </span>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg 
                     font-semibold text-sm shadow hover:bg-blue-600 cursor-pointer active:scale-[0.98] transition-all"
        >
          <ArrowPathIcon
            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Center: Terms & FAQ */}
      <div className="hidden md:flex items-center gap-6">
        <button className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
          Terms & Conditions
        </button>
        <button className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
          FAQ
        </button>
        <button className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
          About Application
        </button>
      </div>

      {/* Right: icons + user profile */}
      <div className="flex items-center gap-5">
        <IconButton ariaLabel="Notifications">
          <BellIcon className="w-6 h-6 text-slate-600" />
        </IconButton>
        <IconButton ariaLabel="Messages">
          <EnvelopeIcon className="w-6 h-6 text-slate-600" />
        </IconButton>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors"
          >
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
              className="w-9 h-9 rounded-full ring-2 ring-slate-200"
            />
            <span className="text-slate-700 font-semibold text-sm hidden sm:inline">
              {user?.name || "User"}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, ariaLabel }) {
  return (
    <button
      aria-label={ariaLabel}
      className="p-2 rounded hover:bg-slate-100 transition-colors"
    >
      {children}
    </button>
  );
}
