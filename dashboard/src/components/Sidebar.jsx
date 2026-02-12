import {
  HomeIcon,
  CubeIcon,
  PhoneIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed z-40 top-0 left-0 h-screen w-64 bg-[#3E5F44] 
        text-[#E8FFD7] flex flex-col transform 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-6 text-lg font-semibold tracking-wide border-b border-[#5E936C]/40">
          PLANT MONITOR
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-[#5E936C]/40 transition"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5 text-[#E8FFD7]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">

          <SidebarLink
            icon={<HomeIcon className="w-5 h-5" />}
            label="Dashboard"
            to="/"
            active={location.pathname === "/"}
          />

          <SidebarLink
            icon={<MapPinIcon className="w-5 h-5" />}
            label="Farm Management"
            to="/fields"
            active={location.pathname === "/fields"}
          />

          <SidebarLink
            icon={<DocumentChartBarIcon className="w-5 h-5" />}
            label="Reports"
            to="/reports"
            active={location.pathname === "/reports"}
          />

          <SidebarLink
            icon={<ChartBarIcon className="w-5 h-5" />}
            label="Charts"
            to="/charts"
            active={location.pathname === "/charts"}
          />

          <SidebarLink
            icon={<TableCellsIcon className="w-5 h-5" />}
            label="Tables"
            to="/tables"
            active={location.pathname === "/tables"}
          />

          <SidebarLink
            icon={<PhoneIcon className="w-5 h-5" />}
            label="Contact"
            to="/contact"
            active={location.pathname === "/contact"}
          />
        </nav>
      </aside>
    </>
  );
}

function SidebarLink({ icon, label, to, active }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
      ${
        active
          ? "bg-[#5E936C] text-white shadow-sm"
          : "text-[#E8FFD7]/80 hover:bg-[#5E936C]/40 hover:text-white"
      }`}
    >
      <span
        className={`transition-colors ${
          active ? "text-white" : "text-[#93DA97]"
        }`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
