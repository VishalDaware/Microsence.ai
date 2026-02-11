import {
  Bars3Icon,
  BellIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggleSidebar, user, onLogout }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const firstLetter = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="w-full bg-white border-b border-[#93DA97]/40 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">

      {/* LEFT: Sidebar Toggle (Mobile) */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-[#E8FFD7] transition"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Bars3Icon className="w-6 h-6 text-[#3E5F44]" />
      </button>

      {/* RIGHT: Icons + Profile */}
      <div className="flex items-center gap-6 ml-auto">

        {/* Notifications */}
        <IconButton ariaLabel="Notifications">
          <BellIcon className="w-6 h-6 text-[#5E936C]" />
        </IconButton>

        {/* Messages */}
        <IconButton ariaLabel="Messages">
          <EnvelopeIcon className="w-6 h-6 text-[#5E936C]" />
        </IconButton>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:bg-[#E8FFD7] px-3 py-2 rounded-xl transition"
          >
            {/* Letter Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#3E5F44] text-[#E8FFD7] 
            flex items-center justify-center font-semibold text-lg shadow-sm">
              {firstLetter}
            </div>

            <span className="text-[#3E5F44] font-semibold text-sm hidden sm:inline">
              {user?.name || "User"}
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-lg border border-[#93DA97]/40 py-3 z-50">

              <div className="px-4 pb-3 border-b border-[#93DA97]/30">
                <p className="text-sm font-semibold text-[#3E5F44]">
                  {user?.name}
                </p>
                <p className="text-xs text-[#5E936C]">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 
                text-[#3E5F44] hover:bg-[#E8FFD7] transition text-sm font-medium"
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
      className="p-2 rounded-lg hover:bg-[#E8FFD7] transition"
    >
      {children}
    </button>
  );
}
