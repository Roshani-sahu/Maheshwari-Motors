import React, { useState } from "react";
import { FaBuilding, FaChevronDown } from "react-icons/fa";
import useStore from '../store';

const CompanySelector = () => {
  const { selectedFirm, firms, setFirm, user, setRole } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to determine if user is admin
  const isAdmin = user?.type === 'main' || !!user?.admin;

  const handleAdminSelect = () => {
    setRole('admin');
    setFirm(null); // No specific firm selected for Admin Dashboard
    setIsOpen(false);
  };

  const handleFirmSelect = (firm) => {
    setFirm(firm);
    // 1 = GST, 0 = Non-GST. Adjust if backend uses different values
    const role = (firm.firmType === 1 || firm.type === 'GST') ? 'gst' : 'nongst';
    setRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <FaBuilding className="text-neutral-500" />
          <span className="truncate max-w-[150px]">
            {!selectedFirm ? 'Admin Dashboard' : `${selectedFirm.name}`}
          </span>
        </div>
        <FaChevronDown className="text-xs text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-300 rounded-md shadow-lg py-1">
          {/* Admin Option */}
          {isAdmin && (
            <button
              onClick={handleAdminSelect}
              className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-neutral-50 ${
                !selectedFirm ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
              }`}
            >
              <span className="font-medium">Admin Dashboard</span>
            </button>
          )}

          {/* Divider */}
          {isAdmin && firms.length > 0 && <div className="border-t border-gray-100 my-1"></div>}

          {/* Firm Options */}
          {firms.map((firm) => (
            <button
              key={firm._id || firm.id}
              onClick={() => handleFirmSelect(firm)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-neutral-50 ${
                (selectedFirm?._id || selectedFirm?.id) === (firm._id || firm.id) ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
              }`}
            >
              <span className="truncate">{firm.name}</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase border ${
                 (firm.firmType === 1 || firm.type === 'GST') 
                 ? 'bg-purple-100 text-purple-700 border-purple-200' 
                 : 'bg-orange-100 text-orange-700 border-orange-200'
              }`}>
                {(firm.firmType === 1 || firm.type === 'GST') ? 'GST' : 'Non-GST'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySelector;