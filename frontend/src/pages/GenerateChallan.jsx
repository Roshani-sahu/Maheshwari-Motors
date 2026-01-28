import React from "react";
import { Link } from "react-router-dom";
import { FaFloppyDisk, FaPlus, FaTrashCan, FaMagnifyingGlass } from "react-icons/fa6";

const GenerateChallan = () => {
  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Generate Challan</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Create delivery challan (stock will be updated immediately)
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg">
        {/* Header */}
        <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 border-b">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Company</label>
            <select className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>Maa Auto (Non-GST)</option>
              <option>Motors (GST)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Customer</label>
            <input
              type="text"
              placeholder="Select customer"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Date</label>
            <input
              type="text"
              defaultValue="24 Jan 2025"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Challan No.</label>
            <input
              type="text"
              defaultValue="C-0062"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 bg-neutral-100"
              readOnly
            />
          </div>
        </div>

        {/* Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left w-8">#</th>
                <th className="p-2 md:p-4 text-left w-2/5">Item</th>
                <th className="p-2 md:p-4 text-right">Qty</th>
                <th className="p-2 md:p-4 text-right">Rate</th>
                <th className="p-2 md:p-4 text-right">Amount</th>
                <th className="p-1 md:p-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 md:p-4 text-neutral-500">1</td>
                <td className="p-2 md:p-4">
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Search item or scan barcode..."
                      className="w-full bg-transparent focus:outline-none focus:bg-neutral-100 rounded pl-6 pr-1 py-1 text-xs md:text-sm"
                    />
                  </div>
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4 text-right text-neutral-900">0.00</td>
                <td className="p-1 md:p-2 text-center">
                  <button className="text-neutral-400 hover:text-neutral-600">
                    <FaTrashCan className="text-xs" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-2 md:p-3 border-b">
          <button className="px-3 py-1 text-xs md:text-sm border border-dashed border-neutral-400 text-neutral-600 rounded-md hover:bg-neutral-100 flex items-center gap-2">
            <FaPlus className="text-xs" />
            Add Item
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 flex justify-between items-center">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Remarks</label>
            <input
              type="text"
              placeholder="Delivery notes..."
              className="w-64 text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div className="text-right">
            <p className="text-sm md:text-base text-neutral-900">Total: ₹0.00</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 md:mt-6">
        <button className="px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaFloppyDisk />
          <Link to="/challan-list">Save Challan</Link>
        </button>
        <Link to="/transactions" className="px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default GenerateChallan;