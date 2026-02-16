import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaMagnifyingGlass, FaPencil, FaFilter, FaSort, FaEye, FaTrashCan } from "react-icons/fa6";

import { accountAPI } from '../services/api';
import useStore from '../store';

const AccountMasterList = () => {
  const { showToast } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [selectedGSTType, setSelectedGSTType] = useState('All GST Types');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountAPI.getAll();
       const val = response.data?.data;
       const list = Array.isArray(val) ? val : (val?.data || []);
       
       setAccounts(list.map(p => ({
           id: p._id,
           name: p.name,
           group: 'N/A', // Not in backend model
           gstType: p.gstin ? 'Registered' : 'Unregistered',
           gstin: p.gstin || '-',
           mobile: p.phone || '-',
           balance: Math.abs(Number(p.balance) || 0).toFixed(2),
           balanceType: (p.balance || 0) >= 0 ? 'dr' : 'cr', // Assuming +ve is Dr (receivable) and -ve is Cr (payable) or vice versa. Standard accounting: Asset/Expense Dr +ve. Party Dr means they owe us.
           // However without specific logic from user, I'll assume +ve is Dr.
           originalBalance: p.balance || 0
       })));
    } catch (error) {
       console.error("Failed to fetch accounts", error);
       showToast('Failed to fetch accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.mobile.includes(searchTerm);
    // Group filtering not supported yet as backend doesn't have group
    const matchesGroup = selectedGroup === 'All Groups' || true; 
    const matchesGST = selectedGSTType === 'All GST Types' || 
                       (selectedGSTType === 'GST Regular' && account.gstType === 'Registered') ||
                       (selectedGSTType === 'Unregistered' && account.gstType === 'Unregistered');
                       
    return matchesSearch && matchesGroup && matchesGST;
  });

  const handleView = (accountName) => {
    // navigate/view logic
  };

  const handleEdit = (accountName) => {
    // navigate/edit logic
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
        try {
            await accountAPI.delete(id);
            showToast('Account deleted successfully', 'success');
            fetchAccounts();
        } catch (error) {
             showToast('Failed to delete account', 'error');
        }
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl text-neutral-900">Account Master</h1>
          <p className="text-xs md:text-sm text-neutral-500">
            Manage customer, vendor, and ledger accounts
          </p>
        </div>
        <Link to="/masters/add-account" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-neutral-900 text-white rounded-md hover:bg-neutral-800 flex items-center gap-2">
          <FaPlus />
          Add Account
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 md:p-4 border border-neutral-200 rounded-lg mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              placeholder="Search by name, GSTIN, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All Groups</option>
            {/* Groups are not yet in backend, keeping UI placeholders or could remove */}
            <option>Sundry Debtors</option>
            <option>Sundry Creditors</option>
            <option>Bank Accounts</option>
            <option>Cash Accounts</option>
          </select>
          <select 
            value={selectedGSTType}
            onChange={(e) => setSelectedGSTType(e.target.value)}
            className="px-3 py-1.5 text-xs md:text-sm border border-neutral-300 rounded-md"
          >
            <option>All GST Types</option>
            <option>GST Regular</option>
            {/* Composition not in backend logic yet, mapped to Registered? */}
            <option>Unregistered</option>
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
          {loading ? (
              <div className="p-8 text-center text-neutral-500">Loading accounts...</div>
          ) : (
          <table className="w-full text-xs md:text-sm min-w-[800px]">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-2 md:p-4 text-left">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Account Name
                    <FaSort className="text-neutral-400 text-xs" />
                  </div>
                </th>
                <th className="p-2 md:p-4 text-left">Group</th>
                <th className="p-2 md:p-4 text-left">GST Type</th>
                <th className="p-2 md:p-4 text-left">GSTIN</th>
                <th className="p-2 md:p-4 text-left">Mobile</th>
                <th className="p-2 md:p-4 text-right">Balance</th>
                <th className="p-2 md:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account, i) => (
                  <tr key={i} className="border-b hover:bg-neutral-50">
                    <td className="p-2 md:p-4 text-neutral-800">{account.name}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{account.group}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{account.gstType}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{account.gstin}</td>
                    <td className="p-2 md:p-4 text-neutral-600">{account.mobile}</td>
                    <td className={`p-2 md:p-4 text-right ${account.balanceType === 'dr' ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{account.balance}
                    </td>
                    <td className="p-2 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(account.name)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleEdit(account.name)}
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                          title="Edit"
                        >
                          <FaPencil className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id, account.name)}
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
                  <td colSpan="7" className="p-8 text-center text-neutral-500">
                    No accounts found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        
        <div className="p-3 border-t border-neutral-200 flex justify-between items-center text-xs md:text-sm text-neutral-600">
          <span>Showing {filteredAccounts.length} of {accounts.length} accounts</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Previous</button>
            <button className="px-2 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMasterList;