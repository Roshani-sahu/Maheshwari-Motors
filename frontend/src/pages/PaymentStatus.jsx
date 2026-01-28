import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaFilter, FaEye, FaRupeeSign, FaFileExport } from "react-icons/fa6";

const PaymentStatus = () => {
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [searchCustomer, setSearchCustomer] = useState('');

  const payments = [
    { invoice: "INV-0158", customer: "City Car Service", date: "22 Jan 2025", amount: "17,700.00", paid: "17,700.00", balance: "0.00", status: "Paid" },
    { invoice: "INV-0157", customer: "Auto Parts Inc.", date: "20 Jan 2025", amount: "25,000.00", paid: "15,000.00", balance: "10,000.00", status: "Partially Paid" },
    { invoice: "INV-0156", customer: "National Garage", date: "18 Jan 2025", amount: "12,300.00", paid: "0.00", balance: "12,300.00", status: "Unpaid" },
    { invoice: "INV-0155", customer: "Speedy Spares", date: "15 Jan 2025", amount: "8,450.00", paid: "0.00", balance: "8,450.00", status: "Overdue" },
    { invoice: "INV-0154", customer: "Tech Solutions", date: "12 Jan 2025", amount: "32,700.00", paid: "20,000.00", balance: "12,700.00", status: "Partially Paid" },
  ];

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = selectedStatus === 'All Status' || payment.status === selectedStatus;
    const matchesCustomer = payment.customer.toLowerCase().includes(searchCustomer.toLowerCase());
    return matchesStatus && matchesCustomer;
  });

  const handleView = (invoice) => {
    alert(`Viewing payment details for: ${invoice}`);
  };

  const handleRecordPayment = (invoice) => {
    alert(`Recording payment for: ${invoice}`);
  };

  const handleExport = () => {
    alert('Exporting payment status report...');
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Payment Status</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Track payment status and outstanding amounts
          </p>
        </div>
        <Link to="/payment" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          New Payment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-3 md:p-4">
          <p className="text-xs text-neutral-500">Total Outstanding</p>
          <p className="text-lg md:text-2xl font-bold text-red-600">₹1,25,430.50</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-3 md:p-4">
          <p className="text-xs text-neutral-500">Received Today</p>
          <p className="text-lg md:text-2xl font-bold text-green-600">₹45,200.00</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-3 md:p-4">
          <p className="text-xs text-neutral-500">Overdue Amount</p>
          <p className="text-lg md:text-2xl font-bold text-orange-600">₹32,100.00</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All Status</option>
            <option>Paid</option>
            <option>Unpaid</option>
            <option>Partially Paid</option>
            <option>Overdue</option>
          </select>
          <input
            type="text"
            placeholder="Search customer..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />
          <button 
            onClick={handleExport}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2"
          >
            <FaFileExport />
            Export
          </button>
        </div>
      </div>

      {/* Payment Status Table */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">Invoice No.</th>
                <th className="p-2 md:p-4 text-left">Customer</th>
                <th className="p-2 md:p-4 text-left">Date</th>
                <th className="p-2 md:p-4 text-right">Invoice Amount</th>
                <th className="p-2 md:p-4 text-right">Paid Amount</th>
                <th className="p-2 md:p-4 text-right">Balance</th>
                <th className="p-2 md:p-4 text-center">Status</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4 text-neutral-800">{payment.invoice}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{payment.customer}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{payment.date}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-900">₹{payment.amount}</td>
                    <td className="p-2 md:p-4 text-right text-green-600">₹{payment.paid}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-900">₹{payment.balance}</td>
                    <td className="p-2 md:p-4 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-2 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleView(payment.invoice)}
                          className="p-1 text-neutral-500 hover:text-neutral-900" 
                          title="View"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        {payment.status !== 'Paid' && (
                          <button 
                            onClick={() => handleRecordPayment(payment.invoice)}
                            className="p-1 text-green-500 hover:text-green-700" 
                            title="Record Payment"
                          >
                            <FaRupeeSign className="text-xs" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-neutral-500">
                    No payments found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;