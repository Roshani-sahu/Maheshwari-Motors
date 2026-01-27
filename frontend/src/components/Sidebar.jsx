import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBookOpen,
  FaHouse,
  FaDatabase,
  FaRightLeft,
  FaChartPie,
  FaSliders,
  FaCircleQuestion,
} from "react-icons/fa6";

const Sidebar = ({ onClose }) => {
  const linkBase =
    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition";

  return (
    <aside className="flex flex-col w-60 h-screen border-r border-neutral-200 bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 rounded-md">
            <FaBookOpen className="text-white text-sm" />
          </div>
          <span className="text-lg text-[#CBD5E1]">ERP System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/dashboard"
               onClick={onClose}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900"
                }`
              }
            >
              <FaHouse className="w-4 h-4" />
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/masters"
               onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaDatabase className="w-4 h-4" />
              Masters
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/transactions"
               onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaRightLeft className="w-4 h-4" />
              Transactions
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/reports"
               onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartPie className="w-4 h-4" />
              Universal Reports
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/inventory-reports"
               onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartPie className="w-4 h-4" />
              Inventory Reports
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/settings"
               onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaSliders className="w-4 h-4" />
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full">
            <FaCircleQuestion className="text-neutral-600 text-sm" />
          </div>
          <div>
            <p className="text-sm text-[#CBD5E1]">
              <NavLink to="/help" onClick={onClose} className="hover:text-white transition">
                Help & Support
              </NavLink>
            </p>
            <p className="text-xs text-neutral-500">Get assistance</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
