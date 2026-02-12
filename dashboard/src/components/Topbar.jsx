import {
  Bars3Icon,
  BellIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onToggleSidebar, user, onLogout, notifications = [], onRemoveNotification, sentMails = [] }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMails, setShowMails] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const firstLetter = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  const notificationCount = notifications.length;
  const mailCount = sentMails.length;

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
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMails(false);
            }}
            className="relative p-2 rounded-lg hover:bg-[#E8FFD7] transition"
            aria-label="Notifications"
          >
            <BellIcon className="w-6 h-6 text-[#5E936C]" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg border border-[#93DA97]/40 z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 px-4 py-3 border-b border-[#93DA97]/30 bg-[#E8FFD7]">
                <p className="text-sm font-semibold text-[#3E5F44]">
                  Notifications ({notificationCount})
                </p>
              </div>
              <div className="py-2">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-[#E8FFD7] transition border-b border-[#93DA97]/20 flex justify-between items-start gap-2 group">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#3E5F44]">{notif.title}</p>
                        <p className="text-xs text-[#5E936C] mt-1">{notif.message}</p>
                        <p className="text-xs text-[#93DA97] mt-1">{notif.timestamp}</p>
                      </div>
                      <button
                        onClick={() => onRemoveNotification && onRemoveNotification(notif.id)}
                        className="p-1 rounded hover:bg-red-100 transition opacity-0 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <XMarkIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[#5E936C] text-sm">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Messages/Mail */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMails(!showMails);
              setShowNotifications(false);
            }}
            className="relative p-2 rounded-lg hover:bg-[#E8FFD7] transition"
            aria-label="Messages"
          >
            <EnvelopeIcon className="w-6 h-6 text-[#5E936C]" />
            {mailCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                {mailCount}
              </span>
            )}
          </button>

          {/* Mail Dropdown */}
          {showMails && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg border border-[#93DA97]/40 z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 px-4 py-3 border-b border-[#93DA97]/30 bg-[#E8FFD7]">
                <p className="text-sm font-semibold text-[#3E5F44]">
                  Sent Mails ({mailCount})
                </p>
              </div>
              <div className="py-2">
                {sentMails.length > 0 ? (
                  sentMails.map((mail, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-[#E8FFD7] transition border-b border-[#93DA97]/20">
                      <p className="text-xs font-semibold text-[#3E5F44]">{mail.name}</p>
                      <p className="text-xs text-[#5E936C] mt-1 truncate">{mail.email}</p>
                      <p className="text-xs text-[#93DA97] mt-2 line-clamp-2">{mail.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{mail.timestamp}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[#5E936C] text-sm">
                    No sent mails
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowMails(false);
            }}
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
