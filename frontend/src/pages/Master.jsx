import React from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaChevronDown,
  FaFilter,
  FaLayerGroup,
  FaPlus,
  FaMagnifyingGlass,
  FaArrowUp,
  FaSort,
  FaPencil,
} from "react-icons/fa6";

const Master = () => {
  return (
    <>
      <div id="masters-header" className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Masters</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Manage all your master data from a unified workspace.
        </p>
      </div>

      <section
        id="masters-controls"
        className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div id="master-type-selector">
              <select className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
                <option>Account Master</option>
                <option>Item Master</option>
                <option>Company Master</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Link to="/account-master" className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
                Account Master
              </Link>
              <Link to="/item-master" className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
                Item Master
              </Link>
            </div>
          </div>
          <div id="master-actions">
            <button
              className="px-3 md:px-4 py-1.5 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2"
            >
              <FaPlus />
              <span>
                <Link to="/masters/add-account">Add New Account</Link>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section
        id="masters-table-container"
        className="bg-white border border-neutral-200 rounded-lg"
      >
        <div
          className="p-3 md:p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
        >
          <div>
            <h3 className="text-sm md:text-base text-neutral-900">Account Master List</h3>
            <p className="text-xs text-neutral-500 hidden md:block">
              Keyboard shortcuts:
              <kbd
                className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded mx-0.5"
              >
                J
              </kbd>
              Down,
              <kbd
                className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded mx-0.5"
              >
                K
              </kbd>
              Up,
              <kbd
                className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded mx-0.5"
              >
                E
              </kbd>
              Edit,
              <kbd
                className="px-1.5 py-0.5 text-xs border bg-neutral-100 rounded mx-0.5"
              >
                /
              </kbd>
              Find
            </p>
          </div>
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="Fast Find in Table..."
              className="w-full px-3 py-1 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-800 focus:border-transparent"
            />
            <FaMagnifyingGlass
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[600px]">
            <thead className="text-left text-xs text-neutral-500 bg-neutral-50">
              <tr>
                <th className="p-2 md:p-3 w-2/6">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Account Name
                    <FaArrowUp className="text-neutral-800" />
                  </div>
                </th>
                <th className="p-2 md:p-3 w-1/6">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Group <FaSort className="text-neutral-400" />
                  </div>
                </th>
                <th className="p-2 md:p-3 w-1/6">
                  <div className="flex items-center gap-1 cursor-pointer">
                    GST Type
                    <FaSort className="text-neutral-400" />
                  </div>
                </th>
                <th className="p-2 md:p-3 w-1/6 text-right">
                  <div
                    className="flex items-center justify-end gap-1 cursor-pointer"
                  >
                    Balance ( )
                    <FaSort className="text-neutral-400" />
                  </div>
                </th>
                <th className="p-2 md:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[
                ["City Car Service", "Sundry Debtors", "GST Regular", "8,450.00 Cr"],
                ["Auto Parts Inc.", "Sundry Creditors", "GST Regular", "25,000.00 Dr"],
                ["National Garage", "Sundry Debtors", "Unregistered", "5,000.00 Cr"],
                ["Office Rent", "Indirect Expenses", "Not Applicable", "15,000.00 Dr"],
                ["Speedy Spares Ltd.", "Sundry Creditors", "Composition", "0.00"],
                ["Walk-in Customer", "Sundry Debtors", "Unregistered", "1,200.00 Cr"],
                ["Bank of Baroda", "Bank Accounts", "Not Applicable", "2,50,000.00 Dr"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="p-2 md:p-3 text-neutral-800">{row[0]}</td>
                  <td className="p-2 md:p-3 text-neutral-600">{row[1]}</td>
                  <td className="p-2 md:p-3 text-neutral-600">{row[2]}</td>
                  <td className="p-2 md:p-3 text-right text-neutral-600">{row[3]}</td>
                  <td className="p-2 md:p-3 text-center">
                    <button
                      className="px-2 py-1 text-neutral-500 hover:text-neutral-900 hover:bg-[#F1F5F9] rounded-md text-xs"
                    >
                      <FaPencil className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          id="table-footer"
          className="p-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs md:text-sm gap-2"
        >
          <span className="text-neutral-600">Showing 1 to 7 of 42 entries</span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50"
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Master;
