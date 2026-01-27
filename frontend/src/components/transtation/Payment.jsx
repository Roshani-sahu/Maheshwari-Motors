import React from "react";
import { Link } from "react-router-dom";
import {
  FaChevronDown,
  FaCalendar,
  FaFloppyDisk,
  FaPrint,
  FaArrowUp,
  FaCopy,
  FaUsers,
  FaBolt,
  FaHouse,
  FaHandshake,
  FaTruck,
  FaReceipt,
} from "react-icons/fa6";

const Payment = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Payment Entry</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Record and manage payment transactions with automatic ledger updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white p-2 border border-neutral-200 rounded-lg">
            <div className="flex items-center space-x-1">
              <button className="flex-1 px-3 md:px-4 py-2 text-xs md:text-sm text-neutral-600 hover:bg-neutral-100 rounded-md">
                <Link to="/receipt-payment">Receipt</Link>
              </button>
              <button className="flex-1 px-3 md:px-4 py-2 text-xs md:text-sm text-neutral-900 bg-neutral-100 rounded-md">
                <Link to="/payment">Payment</Link>
              </button>
            </div>
          </div>

          {/* Transaction Header */}
          <section className="bg-white p-4 md:p-6 border border-neutral-200 rounded-lg">
            <h3 className="text-sm md:text-base text-neutral-900 mb-4">Transaction Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-1">To Party / Vendor</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search vendor or supplier..."
                    className="w-full pl-3 pr-8 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-1">Transaction Date</label>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue="25 Jan 2025"
                    className="w-full pl-3 pr-8 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  <FaCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-1">Voucher Number</label>
                <input
                  type="text"
                  defaultValue="PY-0082"
                  className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-1">Amount</label>
                <input
                  type="text"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                />
              </div>
            </div>
          </section>

          {/* Payment Details */}
          <section className="bg-white p-4 md:p-6 border border-neutral-200 rounded-lg">
            <h3 className="text-sm md:text-base text-neutral-900 mb-4">Payment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-2">Payment From</label>
                <div className="flex items-center gap-4 md:gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment-account-type"
                      value="bank"
                      defaultChecked
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-800"
                    />
                    <span className="text-xs md:text-sm text-neutral-800">Bank</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment-account-type"
                      value="cash"
                      className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-800"
                    />
                    <span className="text-xs md:text-sm text-neutral-800">Cash</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm text-neutral-700 mb-1">Bank Account</label>
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
                      <option>HDFC Bank - Current A/c</option>
                      <option>ICICI Bank - Savings A/c</option>
                      <option>State Bank - Current A/c</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm text-neutral-700 mb-1">Payment Mode</label>
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
                      <option>Cheque</option>
                      <option>Cash</option>
                      <option>Transfer</option>
                      <option>NEFT/RTGS</option>
                      <option>UPI</option>
                      <option>Others</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm text-neutral-700 mb-1">Amount</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm text-neutral-700 mb-1">Reference No / Cheque No</label>
                  <input
                    type="text"
                    placeholder="Cheque or transaction ID"
                    className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm text-neutral-700 mb-1">Narration</label>
                <textarea
                  rows="3"
                  placeholder="Payment description or purpose..."
                  className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center justify-center gap-2">
              <FaFloppyDisk />
              <Link to="/transactions">Save</Link>
            </button>
            <button className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center justify-center gap-2">
              <FaPrint />
              Save & Print
            </button>
            <button className="w-full sm:w-auto px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-600 rounded-md hover:bg-neutral-50">
              Cancel
            </button>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* Recent Payments */}
          <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg">
            <h4 className="text-xs md:text-sm text-neutral-900 mb-3">Recent Payments</h4>
            <div className="space-y-3">
              {[
                { voucher: "PY-0081", amount: "15,000.00" },
                { voucher: "PY-0080", amount: "8,500.00" },
                { voucher: "PY-0079", amount: "22,400.00" },
                { voucher: "PY-0078", amount: "6,750.00" },
                { voucher: "PY-0077", amount: "11,200.00" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-50 cursor-pointer"
                >
                  <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-neutral-100 rounded-md">
                    <FaArrowUp className="text-xs text-neutral-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs text-neutral-800">{item.voucher}</p>
                    <p className="text-xs text-neutral-500">{item.amount}</p>
                  </div>
                  <button className="w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-neutral-600">
                    <FaCopy className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Templates */}
          <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg">
            <h4 className="text-xs md:text-sm text-neutral-900 mb-3">Payment Templates</h4>
            <div className="space-y-2">
              {[
                { icon: FaUsers, name: "Salary Payment" },
                { icon: FaBolt, name: "Utility Bills" },
                { icon: FaHouse, name: "Rent Payment" },
                { icon: FaHandshake, name: "Vendor Payment" },
                { icon: FaTruck, name: "Transport Payment" },
                { icon: FaReceipt, name: "Other Expenses" },
              ].map((template, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 p-2 text-left rounded-md hover:bg-neutral-50"
                >
                  <template.icon className="text-xs text-neutral-500" />
                  <span className="text-xs text-neutral-800">{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;