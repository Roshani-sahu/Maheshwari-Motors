import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBookOpen,
  FaHouse,
  FaDatabase,
  FaRightLeft,
  FaChartPie,
  FaSliders,
  FaCircleQuestion,
  FaBuilding,
  FaFileInvoiceDollar,
  FaListCheck,
  FaUserShield,
  FaClockRotateLeft,
  FaWallet,
  FaChevronDown,
  FaChevronRight,
  FaUsers,
  // FaBoxes,
  // FaMapMarkerAlt,
  // FaBarcode,
  FaReceipt,
  FaMoneyBillWave,
  // FaFileAlt
} from "react-icons/fa6";

const SidebarSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <FaChevronDown className="w-3 h-3" /> : <FaChevronRight className="w-3 h-3" />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onClose }) => {
  const linkBase =
    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition";

  return (
    <aside className="flex flex-col w-60 h-screen border-r border-neutral-200 bg-[#0F172A] relative">
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
      <nav className="flex-1 p-4 overflow-y-auto pb-20" style={{msOverflowStyle: 'none', scrollbarWidth: 'none'}} onScroll={(e) => e.target.style.setProperty('--webkit-scrollbar', 'display: none')}>
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

          {/* Masters Section */}
          <SidebarSection title="Masters" defaultOpen={true}>
            <NavLink
              to="/firm-setup"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaBuilding className="w-4 h-4" />
              Firm Setup
            </NavLink>
            
            <NavLink
              to="/account-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUsers className="w-4 h-4" />
              Account Master
            </NavLink>
            
            <NavLink
              to="/item-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUsers className="w-4 h-4" />
              Item Master
            </NavLink>
            
            <NavLink
              to="/masters"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaDatabase className="w-4 h-4" />
              General Masters
            </NavLink>
          </SidebarSection>

          {/* Transactions Section */}
          <SidebarSection title="Transactions" defaultOpen={true}>
            <NavLink
              to="/generate-challan"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaFileInvoiceDollar className="w-4 h-4" />
              Challan Entry
            </NavLink>
            
            <NavLink
              to="/challan-list"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaListCheck className="w-4 h-4" />
              Challan List
            </NavLink>
            
            <NavLink
              to="/challan-posting"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaReceipt className="w-4 h-4" />
              Challan → Bill
            </NavLink>
            
            <NavLink
              to="/sale-entry"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaMoneyBillWave className="w-4 h-4" />
              Sale Entry
            </NavLink>
            
            <NavLink
              to="/transactions"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaRightLeft className="w-4 h-4" />
              Purchase Entry
            </NavLink>
            
            <NavLink
              to="/payment-status"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaWallet className="w-4 h-4" />
              Payment Entry
            </NavLink>
          </SidebarSection>

          {/* Reports Section */}
          <SidebarSection title="Reports">
            <NavLink
              to="/universal-reports"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartPie className="w-4 h-4" />
              Business Reports
            </NavLink>
            
            <NavLink
              to="/inventory-reports"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartPie className="w-4 h-4" />
              Inventory Reports
            </NavLink>
          </SidebarSection>

          {/* Setup & Tools Section */}
          <SidebarSection title="Setup & Tools">
            <NavLink
              to="/user-rights"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUserShield className="w-4 h-4" />
              User Rights
            </NavLink>
            
            <NavLink
              to="/audit-logs"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaClockRotateLeft className="w-4 h-4" />
              Audit Logs
            </NavLink>
            
            <NavLink
              to="/settings"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaSliders className="w-4 h-4" />
              Settings
            </NavLink>
          </SidebarSection>
        </ul>
      </nav>

      {/* Footer - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 w-60 p-4 border-t border-neutral-200 bg-[#0F172A] z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full">
            <FaCircleQuestion className="text-neutral-600 text-sm" />
          </div>
          <div>
            <p className="text-sm text-[#CBD5E1]">
              <NavLink to="/help-support" onClick={onClose} className="hover:text-white transition">
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
