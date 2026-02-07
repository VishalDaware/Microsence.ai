import {
  HomeIcon,
  CubeIcon,
  PhoneIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowRightCircleIcon,
  PowerIcon,
  DocumentChartBarIcon,
  MapPinIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed z-40 top-0 left-0 h-screen w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand + Close button */}
        <div className="flex items-center justify-between px-4 py-5 text-xl font-bold tracking-wide border-b border-b-2 border-slate-700">
          PLANT MONITOR
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded hover:bg-slate-700 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Nav links (no overflow here) */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink icon={<HomeIcon className="w-5 h-5" />} label="Dashboard" to="/" />
          <SidebarLink icon={<MapPinIcon className="w-5 h-5" />} label="Field Management" to="/fields" />
          <SidebarLink icon={<DocumentChartBarIcon className="w-5 h-5" />} label="Reports" to="/reports" />
          <SidebarLink icon={<ChartBarIcon className="w-5 h-5" />} label="Charts" to="/charts" />
          <SidebarLink icon={<CubeIcon className="w-5 h-5" />} label="Components" to="/components" />
          <SidebarLink icon={<TableCellsIcon className="w-5 h-5" />} label="Tables" to="/tables" />
          <SidebarLink icon={<PhoneIcon className="w-5 h-5" />} label="Contact" to="/contact" />
        </nav>

        {/* Promo section */}
        <div className="px-3 py-4 border-t border-slate-700 text-sm">
          <div className="bg-slate-700 rounded p-3">
            <p className="font-semibold flex items-center gap-2">
              Upgrade to Pro <ArrowRightCircleIcon className="w-4 h-4" />
            </p>
            <p className="text-slate-300">Advanced analytics, alerts, and automation.</p>
          </div>
        </div>

        {/* Logout button */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium">
            <PowerIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 hover:bg-slate-700"
    >
      <span className="text-slate-300 group-hover:text-white transition-colors duration-200">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
