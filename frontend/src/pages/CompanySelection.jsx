import React, { useState, useEffect } from "react";
import {
  FaBuildingUser,
  FaMagnifyingGlass,
  FaCar,
  FaLeaf,
  FaWarehouse,
  FaStar,
  FaRegStar,
} from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import useStore from '../store';
import { firmAPI } from '../services/api';

const CompanySelection = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { firms, selectedFirm, setFirm, setFirms, showToast, setLoading, user } = useStore();

  useEffect(() => {
    loadFirms();
  }, []);

  const loadFirms = async () => {
    setLoading(true);
    try {
      const response = await firmAPI.getAll();
      setFirms(response.data);
      // Set default selection to last used or first firm
      if (response.data.length > 0) {
        const lastUsed = response.data.find(f => f.isLastUsed) || response.data[0];
        setSelectedCompany(lastUsed.name);
      }
    } catch (error) {
      showToast('Failed to load firms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = firms.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (companyName) => {
    setSelectedCompany(companyName);
  };

  const handleConfirmSelection = () => {
    const selected = firms.find(f => f.name === selectedCompany);
    if (selected) {
      setFirm(selected);
      showToast(`Switched to ${selected.name}`, 'success');
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white border border-neutral-300 rounded-md text-sm placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Company List */}
            <div className="space-y-3">
              {filteredCompanies.map((company) => {
                const getIcon = (type) => {
                  switch (type) {
                    case 'GST': return FaCar;
                    case 'NON_GST': return FaLeaf;
                    case 'BILL_ONLY': return FaWarehouse;
                    default: return FaBuildingUser;
                  }
                };
                const Icon = getIcon(company.type);
                const isSelected = selectedCompany === company.name;
                
                return (
                  <div 
                    key={company.id}
                    onClick={() => handleCompanySelect(company.name)}
                    className={`group flex items-center p-4 border rounded-md cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900' 
                        : 'border-neutral-200 hover:bg-neutral-50 hover:border-neutral-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                      <Icon className="text-neutral-600" />
                    </div>
                    <div className="flex-grow ml-4">
                      <p className="text-sm text-neutral-900">{company.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {company.type === 'GST' ? 'GST Registered' : 
                           company.type === 'NON_GST' ? 'Non-GST / Unregistered' :
                           'GST Registered / Virtual Stock'}
                        </span>
                        {company.isLastUsed && (
                          <span className="px-2 py-0.5 text-xs bg-[#F1F5F9] text-neutral-700 rounded-full">
                            Last used
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected ? (
                      <FaStar className="text-neutral-800" />
                    ) : (
                      <FaRegStar className="text-neutral-400 group-hover:text-neutral-600" />
                    )}
                  </div>
                );
              })}
              
              {filteredCompanies.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-neutral-500">No companies found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedCompany}
                className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 ${
                  selectedCompany 
                    ? 'bg-neutral-900 hover:bg-neutral-800' 
                    : 'bg-neutral-400 cursor-not-allowed'
                }`}
              >
                Confirm Selection
              </button>

              <button
                onClick={handleLogout}
                type="button"
                className="w-full flex justify-center py-2 px-4 border border-neutral-300 rounded-md shadow-sm text-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900"
              >
                Log Out
              </button>
            </div>

            {/* Selected Company Info */}
            {selectedCompany && (
              <div className="mt-4 p-3 bg-white border border-neutral-200 rounded-md">
                <p className="text-xs text-neutral-600 mb-1">Selected Company:</p>
                <p className="text-sm font-medium text-neutral-900">{selectedCompany}</p>
                <p className="text-xs text-neutral-500">
                  {firms.find(c => c.name === selectedCompany)?.address || 'No description available'}
                </p>
              </div>
            )}

            {/* User */}
            <div className="mt-4 flex items-center justify-center">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=123"
                className="w-6 h-6 rounded-full mr-2 border border-neutral-200"
                alt="User Avatar"
              />
              <p className="text-xs text-neutral-500">
                Logged in as{" "}
                <span className="text-neutral-700">{user?.email || 'admin@maheshwarimotors.com'}</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default CompanySelection;
