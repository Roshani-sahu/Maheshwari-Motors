import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaFilter, FaEye, FaCheck, FaFileInvoiceDollar } from "react-icons/fa6";

const ChallanList = () => {
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchCustomer, setSearchCustomer] = useState('');

  const challans = [
    { no: "C-0061", date: "24 Jan 2025", company: "Motors", customer: "City Car Service", amount: "8,450.00", status: "Pending" },
    { no: "C-0060", date: "23 Jan 2025", company: "Maa Auto", customer: "Auto Parts Inc.", amount: "5,200.00", status: "Approved" },
    { no: "C-0059", date: "22 Jan 2025", company: "Motors", customer: "National Garage", amount: "12,300.00", status: "Posted" },
    { no: "C-0058", date: "21 Jan 2025", company: "Maa Auto", customer: "Speedy Spares", amount: "3,750.00", status: "Pending" },
    { no: "C-0057", date: "20 Jan 2025", company: "Surat", customer: "Tech Solutions", amount: "15,600.00", status: "Approved" },
    { no: "C-0056", date: "19 Jan 2025", company: "Motors", customer: "Quick Fix Garage", amount: "7,890.00", status: "Posted" },
  ];

  const filteredChallans = challans.filter(challan => {
    const matchesCompany = selectedCompany === 'All Companies' || challan.company === selectedCompany;
    const matchesStatus = selectedStatus === 'All Status' || challan.status === selectedStatus;
    const matchesCustomer = challan.customer.toLowerCase().includes(searchCustomer.toLowerCase());
    return matchesCompany && matchesStatus && matchesCustomer;
  });

  const handleApprove = (challanNo) => {
    console.log(`Approving challan: ${challanNo}`);
    // In real app, this would update the challan status
  };

  const handleFilter = () => {
    console.log('Applying filters:', { selectedCompany, selectedStatus, searchCustomer });
  };
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
          <select 
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          >
            <option>All Companies</option>
            <option>Maa Auto</option>
            <option>Motors</option>
            <option>Surat</option>
          </select>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Posted</option>
          </select>
          <input
            type="text"
            placeholder="Search customer..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <button 
            onClick={handleFilter}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2"
          >
            <FaFilter />
            Filter
          </button>
        </div>
        
        {/* Filter Summary */}
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCompany !== 'All Companies' && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Company: {selectedCompany}
            </span>
          )}
          {selectedStatus !== 'All Status' && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Status: {selectedStatus}
            </span>
          )}
          {searchCustomer && (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              Customer: {searchCustomer}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="p-3 md:p-4 border-b border-neutral-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm md:text-base text-neutral-900">Challan Records</h3>
            <p className="text-xs text-neutral-500">Showing {filteredChallans.length} of {challans.length} challans</p>
          </div>
        </div>
        
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
              {filteredChallans.length > 0 ? (
                filteredChallans.map((challan, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4 text-neutral-800 font-medium">{challan.no}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{challan.date}</td>
                    <td className="p-2 md:p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        challan.company === 'Motors' ? 'bg-green-100 text-green-800' :
                        challan.company === 'Maa Auto' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {challan.company}
                      </span>
                    </td>
                    <td className="p-2 md:p-4 text-neutral-600">{challan.customer}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-900 font-medium">₹{challan.amount}</td>
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
                          <button 
                            onClick={() => handleApprove(challan.no)}
                            className="p-1 text-blue-500 hover:text-blue-700" 
                            title="Approve"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                        )}
                        {challan.status === 'Approved' && (
                          <Link to="/generate-bill" className="p-1 text-green-500 hover:text-green-700" title="Post to Bill">
                            <FaFileInvoiceDollar className="text-xs" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-neutral-500">
                    No challans found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 md:p-4 border-t border-neutral-200 flex justify-between items-center text-xs md:text-sm text-neutral-600">
          <span>Showing {filteredChallans.length} results</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Previous</button>
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanList;