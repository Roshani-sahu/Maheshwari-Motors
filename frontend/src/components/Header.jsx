import React from "react";
import {
  FaChevronDown,
  FaRegCalendarAlt,
  FaBars,
} from "react-icons/fa";
import CompanySelector from "./CompanySelector";

const Header = ({ onMenuClick }) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 px-4 sm:px-6 py-2 sm:py-0 bg-white border-b border-neutral-200">
      {/* Top row on mobile, left section on desktop */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-neutral-100"
        >
          <FaBars className="text-neutral-700" />
        </button>

        <CompanySelector />

        {/* User avatar - moved to top right on mobile */}
        <button className="sm:hidden flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100">
          <img
            src="https://api.dicebear.com/7.x/notionists/svg?seed=251"
            className="w-8 h-8 rounded-full border"
            alt="User"
          />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm">
          <FaRegCalendarAlt className="text-neutral-500" />
          <span className="text-neutral-800 truncate">
            01 Apr 2025 - 31 Mar 2026
          </span>
        </div>
      </div>

      {/* Bottom row on mobile, right section on desktop */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0">
        <div className="lg:hidden  flex items-center gap-2 text-xs sm:text-sm">
          <FaRegCalendarAlt className="text-neutral-500" />
          <span className="text-neutral-800 truncate">
            01 Apr 2025 - 31 Mar 2026
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex gap-1 sm:gap-2">
            <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-md hover:bg-neutral-50">
              Purchase
            </button>
            <button className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800">
              Sale
            </button>
          </div>

          <div className="w-px h-6 bg-[#F1F5F9] hidden sm:block" />

          {/* User avatar - hidden on mobile, shown on desktop */}
          <button className="hidden sm:flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=251"
              className="w-8 h-8 rounded-full border"
              alt="User"
            />
            <FaChevronDown className="text-xs text-neutral-500" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
