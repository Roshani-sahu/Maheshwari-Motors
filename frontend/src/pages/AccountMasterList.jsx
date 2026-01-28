import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaMagnifyingGlass, FaPencil, FaFilter, FaSort } from "react-icons/fa6";

const AccountMasterList = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Account Master</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Manage customer, vendor, and ledger accounts
          </p>
        </div>
        <Link to="/masters/add-account" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          Add Account
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              placeholder="Search by name, GSTIN, mobile..."
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <select className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md">
            <option>All Groups</option>
            <option>Sundry Debtors</option>
            <option>Sundry Creditors</option>
            <option>Bank Accounts</option>
            <option>Cash Accounts</option>
          </select>
          <select className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md">
            <option>All GST Types</option>
            <option>GST Regular</option>
            <option>Composition</option>
            <option>Unregistered</option>
          </select>
          <button className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
            <FaFilter />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Account Name
                    <FaSort className="text-neutral-400 text-xs" />
                  </div>
                </th>
                <th className="p-2 md:p-4 text-left">Group</th>
                <th className="p-2 md:p-4 text-left">GST Type</th>
                <th className="p-2 md:p-4 text-left">GSTIN</th>
                <th className="p-2 md:p-4 text-left">Mobile</th>
                <th className="p-2 md:p-4 text-right">Balance</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "City Car Service", group: "Sundry Debtors", gstType: "GST Regular", gstin: "24AAFCE1234F1Z5", mobile: "9876543210", balance: "8,450.00 Dr", balanceType: "dr" },
                { name: "Auto Parts Inc.", group: "Sundry Creditors", gstType: "GST Regular", gstin: "27BBFCE5678G2A6", mobile: "9876543211", balance: "25,000.00 Cr", balanceType: "cr" },
                { name: "National Garage", group: "Sundry Debtors", gstType: "Unregistered", gstin: "-", mobile: "9876543212", balance: "5,000.00 Dr", balanceType: "dr" },
                { name: "HDFC Bank", group: "Bank Accounts", gstType: "Not Applicable", gstin: "-", mobile: "-", balance: "2,50,000.00 Dr", balanceType: "dr" },
                { name: "Cash Account", group: "Cash Accounts", gstType: "Not Applicable", gstin: "-", mobile: "-", balance: "15,890.75 Dr", balanceType: "dr" },
                { name: "Speedy Spares Ltd.", group: "Sundry Creditors", gstType: "Composition", gstin: "29CCFCE9012H3B7", mobile: "9876543213", balance: "12,300.00 Cr", balanceType: "cr" },
              ].map((account, i) => (
                <tr key={i} className="border-b hover:bg-neutral-50">
                  <td className="p-2 md:p-4 text-neutral-800">{account.name}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{account.group}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{account.gstType}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{account.gstin}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{account.mobile}</td>
                  <td className={`p-2 md:p-4 text-right ${account.balanceType === 'dr' ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{account.balance}
                  </td>
                  <td className="p-2 md:p-4 text-center">
                    <button className="p-1 text-neutral-500 hover:text-neutral-900">
                      <FaPencil className="text-xs" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-neutral-200 flex justify-between items-center text-xs md:text-sm text-neutral-600">
          <span>Showing 1-6 of 42 accounts</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Previous</button>
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMasterList;