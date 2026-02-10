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
  FaChevronDown,
  FaChevronRight,
  FaUsers,
  FaReceipt,
  FaMoneyBillWave,
  FaEye,
  FaTags,
  FaList,
  FaUserPlus,
  FaUsersGear,
  FaBell,
  FaFileInvoice,
  FaClockRotateLeft as FaHistory,
  FaChartLine,
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaDownload,
  FaCalendarXmark
} from "react-icons/fa6";

const SidebarSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex h-full items-center justify-between px-3 py-2 text-sm text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900 rounded-md transition"
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
      <nav className="flex-1 p-4 overflow-y-auto pb-16" style={{msOverflowStyle: 'none', scrollbarWidth: 'none'}} onScroll={(e) => e.target.style.setProperty('--webkit-scrollbar', 'display: none')}>
        <ul className="space-y-1">
          {/* 1. Dashboard */}
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

          {/* 2. Masters */}
          <SidebarSection title="Masters" defaultOpen={true}>
            <NavLink
              to="/masters/firm-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaBuilding className="w-4 h-4" />
              Firm Master
            </NavLink>
            
            {/* <NavLink
              to="/masters/stock-alert-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaReceipt className="w-4 h-4" />
              Stock Alert Master
            </NavLink> */}
            
            {/* <NavLink
              to="/masters/item-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaReceipt className="w-4 h-4" />
              Inventory Master
            </NavLink> */}
            
            <NavLink
              to="/masters/user-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUsers className="w-4 h-4" />
              User Master
            </NavLink>
            
            <NavLink
              to="/masters/account-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaDatabase className="w-4 h-4" />
              Account Master
            </NavLink>
          </SidebarSection>

{/* 2. Masters */}
          <SidebarSection title="Inventory" defaultOpen={false}>
            <NavLink
              to="/inventory/item-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaBuilding className="w-4 h-4" />
              Item Management
            </NavLink>
            
            <NavLink
              to="/inventory/item-view"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaEye className="w-4 h-4" />
              Item View
            </NavLink>
            
            <NavLink
              to="/inventory/category-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaTags className="w-4 h-4" />
              Category Master
            </NavLink>
            
            <NavLink
              to="/inventory/view-category"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaList className="w-4 h-4" />
              View Category
            </NavLink>
            
            <NavLink
              to="/inventory/add-supplier"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUserPlus className="w-4 h-4" />
              Add Supplier
            </NavLink>
            
            <NavLink
              to="/inventory/view-all-supplier"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaUsersGear className="w-4 h-4" />
              View All Supplier
            </NavLink>
            
            <NavLink
              to="/inventory/stock-alert-master"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaBell className="w-4 h-4" />
              Stock Alert Master
            </NavLink>
            
           
          </SidebarSection>

          {/* 3. Transactions */}
          <SidebarSection title="Transactions" defaultOpen={true}>
            <NavLink
              to="/transactions/challan-list"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaListCheck className="w-4 h-4" />
              Challan List
            </NavLink>
            
            <NavLink
              to="/transactions/bill-list"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaFileInvoice className="w-4 h-4" />
              Bill List
            </NavLink>
            
            <NavLink
              to="/transactions/transaction-history"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaHistory className="w-4 h-4" />
              Transaction History
            </NavLink>
          </SidebarSection>

          {/* 4. Reports */}
          <SidebarSection title="Reports">
            <NavLink
              to="/reports"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartPie className="w-4 h-4" />
              Business Reports
            </NavLink>
            
            <NavLink
              to="/reports/gst-report"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaFileInvoiceDollar className="w-4 h-4" />
              GST Report
            </NavLink>
            <NavLink
              to="/reports/purchase-report"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaFileInvoiceDollar className="w-4 h-4" />
              Purchase Report
            </NavLink>
            <NavLink
              to="/reports/sales-report"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaChartLine className="w-4 h-4" />
              Sales Report
            </NavLink>
            <NavLink
              to="/reports/sales-return-report"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaArrowTrendDown className="w-4 h-4" />
              Sales Return Report
            </NavLink>
            <NavLink
              to="/reports/purchase-return-report"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaArrowTrendUp className="w-4 h-4" />
              Purchase Return Report
            </NavLink>
          </SidebarSection>

          {/* 5. Setup & Tools */}
          <SidebarSection title="Setup & Tools">
            <NavLink
              to="/setup/backup-restore"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaDownload className="w-4 h-4" />
              Backup / Restore
            </NavLink>
            
            <NavLink
              to="/setup/financial-year-close"
              onClick={onClose}
              className={`${linkBase} text-[#CBD5E1] hover:bg-neutral-100 hover:text-neutral-900`}
            >
              <FaCalendarXmark className="w-4 h-4" />
              Financial Year Close
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
              <span className="hover:text-white transition cursor-pointer">
                Help & Support
              </span>
            </p>
            <p className="text-xs text-neutral-500">Get assistance</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
