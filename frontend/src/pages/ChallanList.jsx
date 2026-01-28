import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaFilter, FaEye, FaCheck, FaFileInvoiceDollar } from "react-icons/fa6";

const ChallanList = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Challan List</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Track and manage delivery challans
          </p>
        </div>
        <Link to="/generate-challan" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          New Challan
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md">
            <option>All Companies</option>
            <option>Maa Auto</option>
            <option>Motors</option>
          </select>
          <select className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Posted</option>
          </select>
          <input
            type="text"
            placeholder="Search customer..."
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <button className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
            <FaFilter />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[700px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">Challan No.</th>
                <th className="p-2 md:p-4 text-left">Date</th>
                <th className="p-2 md:p-4 text-left">Company</th>
                <th className="p-2 md:p-4 text-left">Customer</th>
                <th className="p-2 md:p-4 text-right">Amount</th>
                <th className="p-2 md:p-4 text-center">Status</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: "C-0061", date: "24 Jan 2025", company: "Motors", customer: "City Car Service", amount: "8,450.00", status: "Pending" },
                { no: "C-0060", date: "23 Jan 2025", company: "Maa Auto", customer: "Auto Parts Inc.", amount: "5,200.00", status: "Approved" },
                { no: "C-0059", date: "22 Jan 2025", company: "Motors", customer: "National Garage", amount: "12,300.00", status: "Posted" },
                { no: "C-0058", date: "21 Jan 2025", company: "Maa Auto", customer: "Speedy Spares", amount: "3,750.00", status: "Pending" },
              ].map((challan, i) => (
                <tr key={i} className="border-b hover:bg-neutral-50">
                  <td className="p-2 md:p-4 text-neutral-800">{challan.no}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{challan.date}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{challan.company}</td>
                  <td className="p-2 md:p-4 text-neutral-600">{challan.customer}</td>
                  <td className="p-2 md:p-4 text-right text-neutral-900">₹{challan.amount}</td>
                  <td className="p-2 md:p-4 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      challan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      challan.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {challan.status}
                    </span>
                  </td>
                  <td className="p-2 md:p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 text-neutral-500 hover:text-neutral-900" title="View">
                        <FaEye className="text-xs" />
                      </button>
                      {challan.status === 'Pending' && (
                        <button className="p-1 text-blue-500 hover:text-blue-700" title="Approve">
                          <FaCheck className="text-xs" />
                        </button>
                      )}
                      {challan.status === 'Approved' && (
                        <Link to="/challan-posting" className="p-1 text-green-500 hover:text-green-700" title="Post to Bill">
                          <FaFileInvoiceDollar className="text-xs" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChallanList;