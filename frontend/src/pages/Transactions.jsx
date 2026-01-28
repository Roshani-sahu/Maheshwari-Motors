import React from "react";
import { Link } from "react-router-dom";
import {
  FaMagnifyingGlass,
  FaFileInvoiceDollar,
  FaReceipt,
  FaFileCirclePlus,
  FaTruckFast,
  FaFileLines,
  FaArrowUp,
  FaArrowDown,
  FaArrowRight,
  FaArrowLeft,
  FaRightLeft,
  FaChevronRight,
} from "react-icons/fa6";

const Transactions = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Transaction Entry</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Create, manage, and track all your financial transactions from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Transaction Type Selector */}
          <div className="bg-white p-2 border border-neutral-200 rounded-lg">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <button className="flex-1 px-3 py-1.5 text-xs md:text-sm text-neutral-900 bg-neutral-100 rounded-md whitespace-nowrap">
                Purchase/Sale
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 rounded-md whitespace-nowrap">
                <Link to="/receipt-payment">Receipt/Payment</Link>
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 rounded-md whitespace-nowrap">
                Journal
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 rounded-md whitespace-nowrap">
                Challan/Return
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 rounded-md whitespace-nowrap">
                Opening Balance
              </button>
            </div>
          </div>

          {/* Quick Actions Section */}
          <section className="bg-white p-4 md:p-6 border border-neutral-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200 pb-3 mb-4 gap-3">
              <h3 className="text-sm md:text-base text-neutral-900">Quick Actions</h3>
              <div className="relative w-full sm:w-64">
                <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search actions (e.g. 'Create Sale')"
                  className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Link
                to="/sale-entry"
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 rounded-lg group-hover:bg-[#F1F5F9]">
                  <FaFileInvoiceDollar className="text-neutral-600 text-sm md:text-base" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-neutral-900">Create Sale Invoice</p>
                  <p className="text-xs text-neutral-500">Bill goods or services to a customer.</p>
                </div>
              </Link>
              <Link
                to="/purchase-entry"
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 rounded-lg group-hover:bg-[#F1F5F9]">
                  <FaReceipt className="text-neutral-600 text-sm md:text-base" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-neutral-900">Create Purchase Bill</p>
                  <p className="text-xs text-neutral-500">Record a bill from a vendor.</p>
                </div>
              </Link>
              <Link
                to="/quotation"
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 rounded-lg group-hover:bg-[#F1F5F9]">
                  <FaFileCirclePlus className="text-neutral-600 text-sm md:text-base" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-neutral-900">Create Quotation</p>
                  <p className="text-xs text-neutral-500">Send an estimate to a client.</p>
                </div>
              </Link>
              <Link
                to="/challan-posting"
                className="group flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center bg-neutral-100 rounded-lg group-hover:bg-[#F1F5F9]">
                  <FaTruckFast className="text-neutral-600 text-sm md:text-base" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-neutral-900">Create Delivery Challan</p>
                  <p className="text-xs text-neutral-500">Track goods sent to a customer.</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Templates Section */}
          <section className="bg-white p-4 md:p-6 border border-neutral-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200 pb-3 mb-4 gap-3">
              <h3 className="text-sm md:text-base text-neutral-900">Transaction Templates</h3>
              <button className="px-3 py-1 text-xs border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
                Manage Templates
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: "Monthly Rent Payment", type: "Journal Voucher" },
                { name: "Standard Supply Purchase", type: "Purchase Bill" },
                { name: "Salary Disbursement", type: "Bank Payment" },
              ].map((template, i) => (
                <Link
                  key={i}
                  to="#"
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  <div className="flex items-center gap-3">
                    <FaFileLines className="text-neutral-500" />
                    <span className="text-xs md:text-sm text-neutral-800">{template.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{template.type}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Entries Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 md:p-6 border border-neutral-200 rounded-lg h-full">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-sm md:text-base text-neutral-900">Last Entries</h3>
              <Link to="#" className="text-xs md:text-sm text-neutral-600 hover:text-neutral-900">
                View All
              </Link>
            </div>
            <ul className="space-y-3 md:space-y-4">
              {[
                { icon: FaArrowUp, title: "Sale #S-00125", subtitle: "To: Creative Designs LLC", amount: "15,450.00", date: "23 Jan 2025" },
                { icon: FaArrowDown, title: "Purchase #P-0089", subtitle: "From: Auto Parts Inc.", amount: "8,200.00", date: "22 Jan 2025" },
                { icon: FaArrowRight, title: "Bank Payment #BP-045", subtitle: "To: Office Supplies Co.", amount: "2,100.00", date: "22 Jan 2025" },
                { icon: FaArrowLeft, title: "Cash Receipt #CR-112", subtitle: "From: Walk-in Customer", amount: "5,000.00", date: "21 Jan 2025" },
                { icon: FaArrowUp, title: "Sale #S-00124", subtitle: "To: Tech Solutions", amount: "32,700.00", date: "20 Jan 2025" },
                { icon: FaRightLeft, title: "Journal #JV-018", subtitle: "Depreciation Entry", amount: "12,000.00", date: "19 Jan 2025" },
              ].map((entry, i) => (
                <li key={i} className="flex items-center gap-3 md:gap-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 flex items-center justify-center bg-neutral-100 rounded-md">
                    <entry.icon className="text-neutral-600 text-xs md:text-sm" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs md:text-sm text-neutral-800 truncate">{entry.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{entry.subtitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs md:text-sm text-neutral-900">{entry.amount}</p>
                    <p className="text-xs text-neutral-500">{entry.date}</p>
                  </div>
                  <button className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md flex-shrink-0">
                    <FaChevronRight className="text-xs" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;