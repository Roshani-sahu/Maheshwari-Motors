import React from "react";
import {
  FaFileExport,
  FaPrint,
  FaSort,
  FaCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";

const InventoryReports = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl text-neutral-900">Inventory Reports</h1>
          <p className="text-sm text-neutral-500">
            View and analyze stock levels, valuation, and reorder points.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-neutral-200 p-1 rounded-lg mb-4">
        <button className="px-4 py-1.5 text-sm bg-white text-neutral-900 rounded-md shadow-sm flex-1 text-center">
          Stock Summary
        </button>
        <button className="px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md flex-1 text-center">
          Dead Stock
        </button>
        <button className="px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md flex-1 text-center">
          Reorder Level
        </button>
        <button className="px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md flex-1 text-center">
          Valuation
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Total Stock Value</p>
          <p className="text-2xl text-neutral-900">1,245,890.50</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Items Below Reorder</p>
          <p className="text-2xl text-neutral-900">42</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Dead Stock Value</p>
          <p className="text-2xl text-neutral-900">87,340.00</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-500">Total Stock Qty</p>
          <p className="text-2xl text-neutral-900">18,560 Units</p>
        </div>
      </div>

      <div className="bg-white p-4 border border-neutral-200 rounded-lg mb-4">
        <div className="flex justify-between items-end">
          <div className="flex items-end gap-4">
            <div>
              <label htmlFor="warehouse" className="text-xs text-neutral-600">
                Godown / Warehouse
              </label>
              <select
                id="warehouse"
                className="w-48 mt-1 text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              >
                <option>All Warehouses</option>
                <option>Main Godown</option>
                <option>Surat Branch</option>
              </select>
            </div>
            <div>
              <label htmlFor="item-group" className="text-xs text-neutral-600">
                Item Group
              </label>
              <select
                id="item-group"
                className="w-48 mt-1 text-sm border border-neutral-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              >
                <option>All Groups</option>
                <option>Electronics</option>
                <option>Hardware</option>
              </select>
            </div>
            <div className="flex items-center pb-1">
              <input
                type="checkbox"
                id="min-max-breach"
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label
                htmlFor="min-max-breach"
                className="ml-2 text-sm text-neutral-800"
              >
                Show Min/Max Breach Only
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
              <FaFileExport className="text-xs" />
              Export
            </button>
            <button className="px-3 py-1.5 text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 flex items-center gap-2">
              <FaPrint className="text-xs" />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2 text-left text-neutral-600">
                  <button className="flex items-center gap-1 group">
                    Item Name
                    <FaSort className="text-neutral-400 group-hover:text-neutral-600" />
                  </button>
                </th>
                <th className="px-4 py-2 text-left text-neutral-600">
                  Item Code
                </th>
                <th className="px-4 py-2 text-left text-neutral-600">Group</th>
                <th className="px-4 py-2 text-right text-neutral-600">
                  Stock Qty
                </th>
                <th className="px-4 py-2 text-right text-neutral-600">
                  Reorder Lvl
                </th>
                <th className="px-4 py-2 text-right text-neutral-600">
                  Purchase Rate
                </th>
                <th className="px-4 py-2 text-right text-neutral-600">
                  Valuation
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: "1TB NVMe SSD Gen4",
                  code: "SSD-G4-1TB",
                  group: "Storage",
                  stock: "15 Units",
                  reorder: 20,
                  belowReorder: true,
                  rate: "4,500.00",
                  valuation: "67,500.00",
                },
                {
                  name: "Wireless Keyboard & Mouse Combo",
                  code: "WKM-COMBO-01",
                  group: "Peripherals",
                  stock: "55 Units",
                  reorder: 50,
                  belowReorder: false,
                  rate: "1,200.00",
                  valuation: "66,000.00",
                },
                {
                  name: '27" 4K IPS Monitor',
                  code: "MON-4K-27-IPS",
                  group: "Displays",
                  stock: "8 Units",
                  reorder: 10,
                  belowReorder: true,
                  rate: "22,000.00",
                  valuation: "176,000.00",
                },
                {
                  name: "CAT6 Ethernet Cable (10m)",
                  code: "ETH-C6-10M",
                  group: "Cables",
                  stock: "250 Units",
                  reorder: 100,
                  belowReorder: false,
                  rate: "150.00",
                  valuation: "37,500.00",
                },
                {
                  name: "Standard Power Cord",
                  code: "PWR-STD-EU",
                  group: "Cables",
                  stock: "120 Units",
                  reorder: 150,
                  belowReorder: false,
                  rate: "80.00",
                  valuation: "9,600.00",
                },
                {
                  name: "USB-C Hub (7-in-1)",
                  code: "HUB-USBC-71",
                  group: "Adapters",
                  stock: "30 Units",
                  reorder: 30,
                  belowReorder: false,
                  rate: "2,100.00",
                  valuation: "63,000.00",
                },
              ].map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2 text-neutral-900">{item.name}</td>
                  <td className="px-4 py-2 text-neutral-600">{item.code}</td>
                  <td className="px-4 py-2 text-neutral-600">{item.group}</td>
                  <td className="px-4 py-2 text-right text-neutral-800">
                    {item.stock}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-800">
                    <div className="flex items-center justify-end gap-2">
                      {item.reorder}
                      {item.belowReorder && (
                        <FaCircle
                          className="text-neutral-500 text-[8px]"
                          title="Below Reorder Level"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-600">
                    {item.rate}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-900">
                    {item.valuation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex justify-between items-center text-sm text-neutral-600">
          <span>Showing 1-6 of 128 items</span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">
              <FaChevronLeft className="text-xs" />
            </button>
            <span className="px-2">Page 1 of 22</span>
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;