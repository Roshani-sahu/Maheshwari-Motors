import React from "react";
import { Link } from "react-router-dom";
import { FaFloppyDisk, FaArrowLeft } from "react-icons/fa6";

const AddItem = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Link to="/item-master" className="text-neutral-600 hover:text-neutral-900">
          <FaArrowLeft />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Add Item</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Create new inventory item with rates and stock settings
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Item Name</label>
            <input
              type="text"
              placeholder="Enter item name"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Item Code/Barcode</label>
            <input
              type="text"
              placeholder="Auto-generated or scan"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">HSN Code</label>
            <input
              type="text"
              placeholder="4-8 digit HSN"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Unit</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>Pcs</option>
              <option>Ltr</option>
              <option>Kg</option>
              <option>Set</option>
              <option>Pack</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">GST Rate (%)</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>0</option>
              <option>5</option>
              <option>12</option>
              <option>18</option>
              <option>28</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Category</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>Auto Parts</option>
              <option>Electronics</option>
              <option>Hardware</option>
              <option>Consumables</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Purchase Rate</label>
            <input
              type="text"
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Sale Rate</label>
            <input
              type="text"
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Opening Stock</label>
            <input
              type="text"
              placeholder="0"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Reorder Level</label>
            <input
              type="text"
              placeholder="Minimum stock level"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
            <FaFloppyDisk />
            <Link to="/item-master">Save Item</Link>
          </button>
          <Link to="/item-master" className="px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddItem;