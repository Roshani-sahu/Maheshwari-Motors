import React from "react";
import { Link } from "react-router-dom";
import {
  FaChevronDown,
  FaMagnifyingGlass,
  FaTrashCan,
  FaPlus,
} from "react-icons/fa6";

const SaleEntry = () => {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Sale Entry</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Create a new sale invoice for a customer.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-[#F1F5F9] rounded-lg">
          <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-md">
            Purchase
          </button>
          <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm text-neutral-900 bg-white shadow-sm rounded-md">
            Sale
          </button>
        </div>
      </div>

      {/* Voucher Form */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        {/* Header Details */}
        <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 border-b border-neutral-200">
          <div>
            <label htmlFor="party" className="block text-xs text-neutral-600 mb-1">
              Party
            </label>
            <div className="relative">
              <input
                type="text"
                id="party"
                defaultValue="Creative Designs LLC"
                className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800">
                <FaChevronDown className="text-xs" />
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-xs text-neutral-600 mb-1">
              Date
            </label>
            <input
              type="text"
              id="date"
              defaultValue="24 Jan 2025"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label htmlFor="bill-no" className="block text-xs text-neutral-600 mb-1">
              Bill No.
            </label>
            <input
              type="text"
              id="bill-no"
              defaultValue="S-00126"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 bg-neutral-100"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="challan-no" className="block text-xs text-neutral-600 mb-1">
              Challan Ref.
            </label>
            <input
              type="text"
              id="challan-no"
              placeholder="e.g. C-0054"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[1000px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left text-neutral-600 w-8">#</th>
                <th className="p-2 md:p-4 text-left text-neutral-600 w-2/5">Item</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">Qty</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">Rate</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">D%1</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">D%2</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">D( )</th>
                <th className="p-2 md:p-4 text-right text-neutral-600">Tax</th>
                <th className="p-2 md:p-4 text-right text-neutral-600 w-[150px]">Amount</th>
                <th className="p-1 md:p-2 text-center text-neutral-600 w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="p-2 md:p-4 text-neutral-500">1</td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="Engine Oil Filter"
                    className="w-full bg-transparent focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="10.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="450.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="5.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="0.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="0.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4 text-right text-neutral-600">18%</td>
                <td className="p-2 md:p-4 text-right text-neutral-900">4,275.00</td>
                <td className="p-1 md:p-2 text-center">
                  <button className="text-neutral-400 hover:text-neutral-600">
                    <FaTrashCan className="text-xs" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-2 md:p-4 text-neutral-500">2</td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="Spark Plug Set (4pcs)"
                    className="w-full bg-transparent focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="5.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="1200.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="5.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="2.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4">
                  <input
                    type="text"
                    defaultValue="50.00"
                    className="w-full bg-transparent text-right focus:outline-none focus:bg-neutral-100 rounded px-1 py-1 text-xs md:text-sm"
                  />
                </td>
                <td className="p-2 md:p-4 text-right text-neutral-600">28%</td>
                <td className="p-2 md:p-4 text-right text-neutral-900">5,536.50</td>
                <td className="p-1 md:p-2 text-center">
                  <button className="text-neutral-400 hover:text-neutral-600">
                    <FaTrashCan className="text-xs" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <td className="p-2 md:p-4 text-neutral-500">3</td>
                <td className="p-2 md:p-4">
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-1 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                    <input
                      type="text"
                      placeholder="Start typing or scan barcode..."
                      className="w-full bg-transparent focus:outline-none focus:bg-neutral-100 rounded pl-6 pr-1 py-1 text-xs md:text-sm"
                    />
                  </div>
                </td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-2 md:p-4"></td>
                <td className="p-1 md:p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add Item Actions */}
        <div className="p-2 md:p-3 border-b border-neutral-200">
          <button className="px-3 py-1 text-xs md:text-sm border border-dashed border-neutral-400 text-neutral-600 rounded-md hover:bg-neutral-100 hover:border-solid hover:border-neutral-600 flex items-center gap-2">
            <FaPlus className="text-xs" />
            Add Row
          </button>
          <span className="text-xs text-neutral-500 ml-4 hidden md:inline">
            Shortcut: Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded-md">Ctrl</kbd>
            +
            <kbd className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded-md">I</kbd>
            {" "}to create a new item.
          </span>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Remarks Section */}
          <div>
            <label htmlFor="remarks" className="block text-xs text-neutral-600 mb-1">
              Remarks
            </label>
            <textarea
              id="remarks"
              rows="4"
              className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              placeholder="Enter any notes here..."
            />
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="print-only"
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="print-only" className="ml-2 text-xs md:text-sm text-neutral-700">
                Print only
              </label>
            </div>
          </div>

          {/* Totals Panel */}
          <div className="space-y-2 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Subtotal</span>
              <span className="text-neutral-900">₹9,811.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">GST (18%)</span>
              <span className="text-neutral-900">₹769.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">GST (28%)</span>
              <span className="text-neutral-900">₹1,550.22</span>
            </div>
            <div className="flex justify-between items-center border-t border-neutral-200 pt-2">
              <span className="text-neutral-600">Round Off</span>
              <span className="text-neutral-900">+ 0.22</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-neutral-900 mt-2 pt-2">
              <span className="text-sm md:text-base text-neutral-900">Grand Total</span>
              <span className="text-sm md:text-base text-neutral-900">₹12,131.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-4 md:mt-6">
        <button className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
          Save as Draft
        </button>
        <button className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800">
          <Link to="/transactions">Save & Post</Link>
        </button>
      </div>
    </div>
  );
};

export default SaleEntry;