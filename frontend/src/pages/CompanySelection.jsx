     import React from "react";
import {
  FaBuildingUser,
  FaMagnifyingGlass,
  FaCar,
  FaLeaf,
  FaWarehouse,
  FaStar,
  FaRegStar,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

const CompanySelection = () => {
  return (
    <main className="w-full bg-neutral-50 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-lg mx-auto p-4">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          
          {/* Header */}
          <div className="p-6 border-b border-neutral-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                <FaBuildingUser className="text-2xl text-neutral-600" />
              </div>
              <h1 className="text-2xl text-neutral-900">Select Company</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Choose the company you want to work with for this session.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Search */}
            <div className="mb-4">
              <label className="sr-only">Search companies</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMagnifyingGlass className="text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search company..."
                  className="block w-full pl-10 pr-3 py-2 bg-white border border-neutral-300 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Company List */}
            <div className="space-y-3">
              
              {/* Active / Last Used */}
              <div className="group flex items-center p-4 border border-neutral-300 rounded-md cursor-pointer bg-neutral-50 ring-2 ring-neutral-900 hover:bg-neutral-50 hover:border-neutral-900">
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <FaCar className="text-neutral-600" />
                </div>
                <div className="flex-grow ml-4">
                  <p className="text-sm text-neutral-900">Motors GST</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      GST Registered
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-[#F1F5F9] text-neutral-700 rounded-full">
                      Last used
                    </span>
                  </div>
                </div>
                <FaStar className="text-neutral-800" />
              </div>

              {/* Company 2 */}
              <div className="group flex items-center p-4 border border-neutral-200 rounded-md cursor-pointer hover:bg-neutral-50 hover:border-neutral-900">
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <FaLeaf className="text-neutral-600" />
                </div>
                <div className="flex-grow ml-4">
                  <p className="text-sm text-neutral-900">Maa Non-GST</p>
                  <span className="text-xs text-neutral-500">
                    Non-GST / Unregistered
                  </span>
                </div>
                <FaRegStar className="text-neutral-400 group-hover:text-neutral-600" />
              </div>

              {/* Company 3 */}
              <div className="group flex items-center p-4 border border-neutral-200 rounded-md cursor-pointer hover:bg-neutral-50 hover:border-neutral-900">
                <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <FaWarehouse className="text-neutral-600" />
                </div>
                <div className="flex-grow ml-4">
                  <p className="text-sm text-neutral-900">
                    Surat GST without physical stock
                  </p>
                  <span className="text-xs text-neutral-500">
                    GST Registered / Virtual Stock
                  </span>
                </div>
                <FaRegStar className="text-neutral-400 group-hover:text-neutral-600" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
            <div className="flex flex-col space-y-3">
              <Link
                to="/dashboard"
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
              >
                Confirm Selection
              </Link>

              <button
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
              >
                Log Out
              </button>
            </div>

            {/* User */}
            <div className="mt-4 flex items-center justify-center">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=123"
                className="w-6 h-6 rounded-full mr-2 border border-neutral-200"
                alt="User Avatar"
              />
              <p className="text-xs text-neutral-500">
                Logged in as{" "}
                <span className="text-neutral-700">john.doe</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default CompanySelection;
