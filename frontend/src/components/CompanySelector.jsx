import React, { useState } from "react";
import { FaBuilding, FaChevronDown } from "react-icons/fa6";

const CompanySelector = () => {
  const [selectedCompany, setSelectedCompany] = useState("Motors (GST)");
  const [isOpen, setIsOpen] = useState(false);

  const companies = [
    { name: "Maa Auto", type: "Non-GST", color: "bg-blue-100 text-blue-800" },
    { name: "Motors", type: "GST", color: "bg-green-100 text-green-800" },
    { name: "Surat", type: "Bill Only", color: "bg-purple-100 text-purple-800" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm border border-neutral-300 bg-white text-neutral-800 rounded-md hover:bg-neutral-50"
      >
        <FaBuilding className="text-neutral-500" />
        <span>{selectedCompany}</span>
        <FaChevronDown className="text-xs text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-300 rounded-md shadow-lg z-50">
          {companies.map((company, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedCompany(`${company.name} (${company.type})`);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs md:text-sm text-left hover:bg-neutral-50"
            >
              <span className="text-neutral-800">{company.name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${company.color}`}>
                {company.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySelector;