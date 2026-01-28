import React from "react";
import { Link } from "react-router-dom";
import { FaFloppyDisk, FaArrowLeft } from "react-icons/fa6";

const AddCompany = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Link to="/dashboard" className="text-neutral-600 hover:text-neutral-900">
          <FaArrowLeft />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Add Company</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Create a new company entity (Maa Auto, Motors, or Surat)
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Company Name</label>
            <input
              type="text"
              placeholder="e.g. Maa Auto, Motors, Surat"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Company Type</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>GST Registered</option>
              <option>Non-GST</option>
              <option>Bill Only (No Stock)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="15 digit GSTIN"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">PAN</label>
            <input
              type="text"
              placeholder="10 digit PAN"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Address</label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
            <FaFloppyDisk />
            <Link to="/dashboard">Save Company</Link>
          </button>
          <Link to="/dashboard" className="px-4 py-2 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddCompany;