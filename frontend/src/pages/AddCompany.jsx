import React from "react";
import { Link } from "react-router-dom";
import { FaFloppyDisk, FaArrowLeft } from "react-icons/fa";

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Firm Name</label>
            <input
              type="text"
              placeholder="e.g. Maa Auto, Motors, Surat"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Short Name</label>
            <input
              type="text"
              placeholder="Short name"
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
          
          <div className="md:col-span-3">
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Address</label>
            <textarea
              rows="3"
              placeholder="Complete address"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">City</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>Select City</option>
              <option>Surat</option>
              <option>Mumbai</option>
              <option>Ahmedabad</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Pincode</label>
            <input
              type="text"
              placeholder="6 digit pincode"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">State</label>
            <select className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800">
              <option>Select State</option>
              <option>Gujarat</option>
              <option>Maharashtra</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Phone No</label>
            <input
              type="text"
              placeholder="Phone number"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Mobile No</label>
            <input
              type="text"
              placeholder="Mobile number"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          
          <div>
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Fax No</label>
            <input
              type="text"
              placeholder="Fax number"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm text-neutral-700 mb-1">Signature</label>
            <input
              type="text"
              placeholder="Authorized signature"
              className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
        </div>
        
        {/* Other Details Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Other Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">GSTIN</label>
              <input
                type="text"
                placeholder="15 digit GSTIN"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">CIN No</label>
              <input
                type="text"
                placeholder="Corporate Identity Number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Regi. No</label>
              <input
                type="text"
                placeholder="Registration number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Tin Cst No</label>
              <input
                type="text"
                placeholder="TIN CST number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Ecc No</label>
              <input
                type="text"
                placeholder="ECC number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Range No</label>
              <input
                type="text"
                placeholder="Range number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Division No</label>
              <input
                type="text"
                placeholder="Division number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Pan No</label>
              <input
                type="text"
                placeholder="10 digit PAN"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Rule</label>
              <input
                type="text"
                placeholder="Rule"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Godown Add.</label>
              <textarea
                rows="2"
                placeholder="Godown address"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="Bank name"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">Bank Ac No.</label>
              <input
                type="text"
                placeholder="Bank account number"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-neutral-700 mb-1">IFSCode</label>
              <input
                type="text"
                placeholder="IFSC code"
                className="w-full px-3 py-2 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>
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