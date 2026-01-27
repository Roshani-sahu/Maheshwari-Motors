import React from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaUser,
  FaCalendarDays,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

const ChallanBillPosting = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Challan to Bill Posting</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Select pending challans to consolidate and generate a single bill.
          </p>
        </div>
        <button className="px-3 md:px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
          <FaPlus className="text-xs" />
          New Challan
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">
        {/* Challan List Section */}
        <div className="w-full lg:w-2/3 bg-white border border-neutral-200 rounded-lg">
          {/* Filters */}
          <div className="p-3 md:p-4 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label htmlFor="party-filter" className="block text-xs text-neutral-600 mb-1">
                Party
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                <input
                  type="text"
                  id="party-filter"
                  defaultValue="Creative Designs LLC"
                  className="w-full text-xs md:text-sm border border-neutral-300 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <label htmlFor="date-range-filter" className="block text-xs text-neutral-600 mb-1">
                Date Range
              </label>
              <div className="relative">
                <FaCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                <input
                  type="text"
                  id="date-range-filter"
                  defaultValue="01 Jan 2025 - 24 Jan 2025"
                  className="w-full text-xs md:text-sm border border-neutral-300 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>
            </div>
            <div className="flex items-end h-full">
              <button className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 h-[34px] flex items-center gap-2">
                <FaFilter className="text-xs" />
                Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm min-w-[600px]">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="p-2 md:p-4 text-left w-8">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                  </th>
                  <th className="p-2 md:p-4 text-left text-neutral-600">Challan No.</th>
                  <th className="p-2 md:p-4 text-left text-neutral-600">Date</th>
                  <th className="p-2 md:p-4 text-right text-neutral-600">Items</th>
                  <th className="p-2 md:p-4 text-right text-neutral-600">Amount</th>
                  <th className="p-2 md:p-4 text-center text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { checked: true, challan: "C-0054", date: "15 Jan 2025", items: "2", amount: "4,275.00", status: "Pending", disabled: false },
                  { checked: false, challan: "C-0058", date: "18 Jan 2025", items: "1", amount: "5,536.50", status: "Pending", disabled: false },
                  { checked: false, challan: "C-0049", date: "10 Jan 2025", items: "3", amount: "8,120.00", status: "Billed", disabled: true },
                  { checked: true, challan: "C-0061", date: "22 Jan 2025", items: "5", amount: "11,350.00", status: "Pending", disabled: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-neutral-200 hover:bg-neutral-50">
                    <td className="p-2 md:p-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                        defaultChecked={row.checked}
                        disabled={row.disabled}
                      />
                    </td>
                    <td className={`p-2 md:p-4 ${row.disabled ? 'text-neutral-400' : 'text-neutral-800'}`}>
                      {row.challan}
                    </td>
                    <td className={`p-2 md:p-4 ${row.disabled ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {row.date}
                    </td>
                    <td className={`p-2 md:p-4 text-right ${row.disabled ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {row.items}
                    </td>
                    <td className={`p-2 md:p-4 text-right ${row.disabled ? 'text-neutral-400' : 'text-neutral-900'}`}>
                      {row.amount}
                    </td>
                    <td className="p-2 md:p-4 text-center">
                      <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-800 rounded-full">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm text-neutral-600 gap-2">
            <span>Showing 1-4 of 12 pending challans</span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">
                <FaChevronLeft className="text-xs" />
              </button>
              <span className="px-2">Page 1 of 3</span>
              <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Posting Summary Section */}
        <div className="w-full lg:w-1/3 bg-white border border-neutral-200 rounded-lg lg:sticky lg:top-6">
          {/* Header */}
          <div className="p-3 md:p-4 border-b border-neutral-200">
            <h2 className="text-base md:text-lg text-neutral-900">Posting Summary</h2>
            <p className="text-xs md:text-sm text-neutral-500">3 challans selected</p>
          </div>

          {/* Details */}
          <div className="p-3 md:p-4 space-y-4">
            <div>
              <label htmlFor="bill-date" className="block text-xs text-neutral-600 mb-1">
                Bill Date
              </label>
              <input
                type="text"
                id="bill-date"
                defaultValue="24 Jan 2025"
                className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label htmlFor="bill-type" className="block text-xs text-neutral-600 mb-1">
                Bill Type
              </label>
              <div className="relative">
                <select
                  id="bill-type"
                  className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-800"
                >
                  <option>GST Bill</option>
                  <option>Non-GST Bill</option>
                </select>
                <FaChevronDown className="text-xs text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-xs md:text-sm pt-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Total Items</span>
                <span className="text-neutral-900">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Subtotal</span>
                <span className="text-neutral-900">₹21,161.50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Total Tax (Est.)</span>
                <span className="text-neutral-900">₹4,512.70</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-neutral-900 mt-2 pt-2">
                <span className="text-sm md:text-base text-neutral-900">Grand Total</span>
                <span className="text-sm md:text-base text-neutral-900">₹25,674.20</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 md:p-4 border-t border-neutral-200">
            <button className="w-full px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800">
              <Link to="/transactions">Generate & Post Bill</Link>
            </button>
            <button className="w-full mt-2 text-center text-xs md:text-sm text-neutral-600 hover:text-neutral-900">
              Preview Bill
            </button>
          </div>

          {/* Audit Trail */}
          <div className="p-3 md:p-4 border-t border-neutral-200">
            <h3 className="text-xs md:text-sm text-neutral-800 mb-2">Audit Trail</h3>
            <div className="text-xs text-neutral-500 space-y-1">
              <p>
                <span className="text-neutral-700">Last Billed:</span> C-0049 on 11 Jan 2025
              </p>
              <p>
                <span className="text-neutral-700">Last Viewed:</span> by Admin on 23 Jan 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanBillPosting;