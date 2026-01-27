import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const linkBase =
    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition";

  return (
    <aside className="flex flex-col w-60 border-r border-neutral-200 bg-[#0F172A]">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 rounded-md">
            <i className="fa-solid fa-book-open text-white" />
          </div>
          <span className="text-lg text-[#CBD5E1]">ERP System</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-grow p-4">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900"
                }`
              }
            >
              <i className="fa-solid fa-house w-4 h-4" />
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink to="/masters" className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}>
              <i className="fa-solid fa-database w-4 h-4" />
              Masters
            </NavLink>
          </li>

          <li>
            <NavLink to="/transactions" className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}>
              <i className="fa-solid fa-right-left w-4 h-4" />
              Transactions
            </NavLink>
          </li>

          <li>
            <NavLink to="/reports" className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}>
              <i className="fa-solid fa-chart-pie w-4 h-4" />
              Universal Reports
            </NavLink>
          </li>

          <li>
            <NavLink to="/inventory-reports" className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}>
              <i className="fa-solid fa-chart-pie w-4 h-4" />
              Inventory Reports
            </NavLink>
          </li>

          <li>
            <NavLink to="/settings" className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}>
              <i className="fa-solid fa-sliders w-4 h-4" />
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full">
            <i className="fa-regular fa-circle-question text-neutral-600" />
          </div>
          <div>
            <p className="text-sm text-[#CBD5E1]">
              <NavLink to="/help">Help & Support</NavLink>
            </p>
            <p className="text-xs text-neutral-500">Get assistance</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
