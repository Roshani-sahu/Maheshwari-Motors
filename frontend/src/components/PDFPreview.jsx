import React from "react";
import { FaPrint, FaDownload, FaXmark } from "react-icons/fa6";

const PDFPreview = ({ type = "challan", onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg text-neutral-900">
            {type === "challan" ? "Challan Preview" : "Bill Preview"}
          </h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
              <FaDownload className="text-xs" />
              Download
            </button>
            <button className="px-3 py-1.5 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
              <FaPrint className="text-xs" />
              Print
            </button>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-900">
              <FaXmark />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          <div className="bg-white p-8 shadow-sm max-w-2xl mx-auto">
            {/* Company Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-neutral-900">
                {type === "challan" ? "DELIVERY CHALLAN" : "TAX INVOICE"}
              </h1>
              <p className="text-sm text-neutral-600">Motors GST</p>
              <p className="text-xs text-neutral-500">GSTIN: 24AAFCE1234F1Z5</p>
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p><strong>{type === "challan" ? "Challan No:" : "Invoice No:"}</strong> {type === "challan" ? "C-0061" : "INV-0158"}</p>
                <p><strong>Date:</strong> 24 Jan 2025</p>
                <p><strong>Customer:</strong> City Car Service</p>
              </div>
              <div className="text-right">
                <p><strong>GSTIN:</strong> 27AAFCE1234F1Z5</p>
                <p><strong>Address:</strong> 123 Main Street</p>
                <p><strong>City, State - 400001</strong></p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm border-collapse border border-neutral-300 mb-6">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="border border-neutral-300 p-2 text-left">Item</th>
                  <th className="border border-neutral-300 p-2 text-right">Qty</th>
                  <th className="border border-neutral-300 p-2 text-right">Rate</th>
                  <th className="border border-neutral-300 p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 p-2">Engine Oil 5L</td>
                  <td className="border border-neutral-300 p-2 text-right">10</td>
                  <td className="border border-neutral-300 p-2 text-right">550.00</td>
                  <td className="border border-neutral-300 p-2 text-right">5,500.00</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-2">Air Filter A-21</td>
                  <td className="border border-neutral-300 p-2 text-right">5</td>
                  <td className="border border-neutral-300 p-2 text-right">400.00</td>
                  <td className="border border-neutral-300 p-2 text-right">2,000.00</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            {type === "bill" && (
              <div className="text-right text-sm mb-6">
                <p>Subtotal: ₹7,500.00</p>
                <p>CGST (9%): ₹675.00</p>
                <p>SGST (9%): ₹675.00</p>
                <p className="font-bold border-t pt-2">Total: ₹8,850.00</p>
              </div>
            )}

            {type === "challan" && (
              <div className="text-right text-sm mb-6">
                <p className="font-bold">Total Quantity: 15 items</p>
                <p className="font-bold">Total Value: ₹7,500.00</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-neutral-500 mt-8">
              <p>Terms & Conditions:</p>
              <p>1. Goods once sold will not be taken back.</p>
              <p>2. Payment due within 30 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;