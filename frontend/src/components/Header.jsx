import React from "react";
import {
  FaCar,
  FaChevronDown,
  FaRegCalendarAlt,
} from "react-icons/fa";

const Header = () => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-neutral-200">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100">
          <div className="w-6 h-6 flex items-center justify-center bg-neutral-200 rounded-full">
            <FaCar className="text-xs text-neutral-600" />
          </div>
          <span className="text-sm text-neutral-800">Motors GST</span>
          <FaChevronDown className="text-xs text-neutral-500" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <FaRegCalendarAlt className="text-neutral-500" />
          <span className="text-neutral-800">
            01 Apr 2025 - 31 Mar 2026
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-neutral-50">
            Add Purchase
          </button>
          <button className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800">
            Add Sale
          </button>
        </div>

        <div className="w-px h-6 bg-neutral-200" />

        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-100">
          <img
            src="https://api.dicebear.com/7.x/notionists/svg?seed=251"
            className="w-8 h-8 rounded-full border"
            alt="User"
          />
          <FaChevronDown className="text-xs text-neutral-500" />
        </button>
      </div>
    </header>
  );
};

export default Header;
