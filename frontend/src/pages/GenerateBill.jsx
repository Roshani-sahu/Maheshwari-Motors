import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaFloppyDisk, FaEye, FaPrint } from "react-icons/fa6";
import PDFPreview from "../components/PDFPreview";

const GenerateBill = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);

  const challans = [
    { id: "C-0061", date: "24 Jan 2025", customer: "City Car Service", amount: "8,450.00", items: 3 },
    { id: "C-0060", date: "23 Jan 2025", customer: "City Car Service", amount: "5,200.00", items: 2 },
    { id: "C-0058", date: "21 Jan 2025", customer: "City Car Service", amount: "3,750.00", items: 1 },
  ];

  const handleChallanSelect = (challanId) => {
    setSelectedChallans(prev => 
      prev.includes(challanId) 
        ? prev.filter(id => id !== challanId)
        : [...prev, challanId]
    );
  };

  const totalAmount = challans
    .filter(c => selectedChallans.includes(c.id))
    .reduce((sum, c) => sum + parseFloat(c.amount.replace(',', '')), 0);

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Generate Bill</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Create bill from approved challans (Surat: Bill Only Mode available)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Challan Selection */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
          <div className="p-3 md:p-4 border-b">
            <h3 className="text-sm md:text-base text-neutral-900">Select Approved Challans</h3>
            <p className="text-xs text-neutral-500">Customer: City Car Service</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm min-w-[500px]">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="p-2 md:p-4 text-left w-8">
                    <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" />
                  </th>
                  <th className="p-2 md:p-4 text-left">Challan No.</th>
                  <th className="p-2 md:p-4 text-left">Date</th>
                  <th className="p-2 md:p-4 text-right">Items</th>
                  <th className="p-2 md:p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-neutral-300"
                        checked={selectedChallans.includes(challan.id)}
                        onChange={() => handleChallanSelect(challan.id)}
                      />
                    </td>
                    <td className="p-2 md:p-4 text-neutral-800">{challan.id}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{challan.date}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-600">{challan.items}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-900">₹{challan.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill Configuration */}
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="p-3 md:p-4 border-b">
            <h3 className="text-sm md:text-base text-neutral-900">Bill Configuration</h3>
          </div>

          <div className="p-3 md:p-4 space-y-4">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Company</label>
              <select className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800">
                <option>Motors (GST)</option>
                <option>Maa Auto (Non-GST)</option>
                <option>Surat (Bill Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">Bill Type</label>
              <select className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800">
                <option>GST Invoice</option>
                <option>Non-GST Invoice</option>
                <option>Bill of Supply</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">Bill Date</label>
              <input
                type="text"
                defaultValue="24 Jan 2025"
                className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-600 mb-1">Bill No.</label>
              <input
                type="text"
                defaultValue="INV-0159"
                className="w-full text-xs md:text-sm border border-neutral-300 rounded-md px-3 py-1.5 bg-neutral-100"
                readOnly
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 text-xs md:text-sm pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-neutral-600">Selected Challans</span>
                <span className="text-neutral-900">{selectedChallans.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="text-neutral-900">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">GST (18%)</span>
                <span className="text-neutral-900">₹{(totalAmount * 0.18).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm text-neutral-900">Total</span>
                <span className="text-sm text-neutral-900">₹{(totalAmount * 1.18).toLocaleString()}</span>
              </div>
            </div>

            {/* Stock Update Warning for Surat */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Surat company bills will not affect stock levels.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 md:p-4 border-t space-y-2">
            <button 
              onClick={() => setShowPreview(true)}
              className="w-full px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center justify-center gap-2"
            >
              <FaEye />
              Preview Bill
            </button>
            <button className="w-full px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center justify-center gap-2">
              <FaFloppyDisk />
              <Link to="/transactions">Generate Bill</Link>
            </button>
            <button className="w-full px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center justify-center gap-2">
              <FaPrint />
              Save & Print
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <PDFPreview 
          type="bill" 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  );
};

export default GenerateBill;