import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaMagnifyingGlass, FaPencil, FaFilter, FaEye, FaTrashCan } from "react-icons/fa6";

const ItemMaster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const items = [
    { name: "Engine Oil 5L", code: "EO-5L-001", hsn: "2710", unit: "Ltr", gst: "18", purchase: "450.00", sale: "550.00", stock: "15" },
    { name: "Air Filter A-21", code: "AF-A21-002", hsn: "8421", unit: "Pcs", gst: "18", purchase: "320.00", sale: "400.00", stock: "8" },
    { name: "Brake Pad Set", code: "BP-SET-003", hsn: "8708", unit: "Set", gst: "28", purchase: "1200.00", sale: "1500.00", stock: "2" },
    { name: "Spark Plug (4-pack)", code: "SP-4P-004", hsn: "8511", unit: "Pack", gst: "18", purchase: "180.00", sale: "220.00", stock: "50" },
    { name: "Coolant 1L", code: "CL-1L-005", hsn: "3820", unit: "Ltr", gst: "18", purchase: "250.00", sale: "300.00", stock: "25" },
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.hsn.includes(searchTerm);
    return matchesSearch;
  });

  const handleView = (itemName) => {
    alert(`Viewing details for: ${itemName}`);
  };

  const handleEdit = (itemName) => {
    alert(`Editing: ${itemName}`);
  };

  const handleDelete = (itemName) => {
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      alert(`Deleted: ${itemName}`);
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Item Master</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Manage inventory items, rates, and stock settings
          </p>
        </div>
        <Link to="/add-item" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          Add Item
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              placeholder="Search by name, code, HSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All Categories</option>
            <option>Auto Parts</option>
            <option>Electronics</option>
            <option>Hardware</option>
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
          <table className="w-full text-xs md:text-sm min-w-[900px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">Item Name</th>
                <th className="p-2 md:p-4 text-left">Code/Barcode</th>
                <th className="p-2 md:p-4 text-left">HSN</th>
                <th className="p-2 md:p-4 text-left">Unit</th>
                <th className="p-2 md:p-4 text-right">GST %</th>
                <th className="p-2 md:p-4 text-right">Purchase Rate</th>
                <th className="p-2 md:p-4 text-right">Sale Rate</th>
                <th className="p-2 md:p-4 text-right">Stock</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4 text-neutral-800">{item.name}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{item.code}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{item.hsn}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{item.unit}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-600">{item.gst}%</td>
                    <td className="p-2 md:p-4 text-right text-neutral-600">₹{item.purchase}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-900">₹{item.sale}</td>
                    <td className="p-2 md:p-4 text-right text-neutral-800">{item.stock}</td>
                    <td className="p-2 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(item.name)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleEdit(item.name)}
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                          title="Edit"
                        >
                          <FaPencil className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.name)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <FaTrashCan className="text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-neutral-500">
                    No items found matching your search criteria.
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

export default ItemMaster;