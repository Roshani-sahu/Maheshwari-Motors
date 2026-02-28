import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaSync, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

import api from '../../services/axiosInstance';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const getSubscriptionStatus = (subscription) => {
  if (!subscription?.validityFrom || !subscription?.validityTo) {
    return { label: 'No Plan', sort: 5, className: 'bg-gray-200 text-gray-800' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const validityFrom = new Date(subscription.validityFrom);
  validityFrom.setHours(0, 0, 0, 0);
  const validityTo = new Date(subscription.validityTo);
  validityTo.setHours(0, 0, 0, 0);
  const oneDay = 1000 * 60 * 60 * 24;

  if (Number.isNaN(validityFrom.getTime()) || Number.isNaN(validityTo.getTime())) {
    return { label: 'No Plan', sort: 5, className: 'bg-gray-200 text-gray-800' };
  }

  const daysSinceActive = Math.floor((today - validityFrom) / oneDay);
  const daysUntilExpiry = Math.floor((validityTo - today) / oneDay);

  // Expired
  if (daysUntilExpiry < 0) {
    return { label: 'Expired', sort: 2, className: 'bg-red-500 text-white' };
  }
  
  // Fresh (activated within last 7 days and not expiring soon)
  if (daysSinceActive >= 0 && daysSinceActive <= 7 && daysUntilExpiry > 30) {
    return { label: 'Fresh', sort: 3, className: 'bg-green-500 text-white' };
  }
  
  // Expiring Soon (30 days or less remaining)
  if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
    return { label: 'Expiring Soon', sort: 1, className: 'bg-yellow-400 text-gray-900' };
  }
  
  // Active (more than 30 days remaining)
  return { label: 'Active', sort: 4, className: 'bg-blue-500 text-white' };
};



const UserMaster = () => {
  const navigate = useNavigate();
  const { users, setUsers, showToast } = useStore();
  const isMounted = useRef(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    username: '',
    years: 0,
    months: 0,
    days: 0,
    amount: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isTransactionHistoryModalOpen, setIsTransactionHistoryModalOpen] = useState(false);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    signature: '',
    signatureFile: null,
    gst_firm: {
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      godown_address: '',
      city: '',
      state: '',
      GSTIN: '',
      CIN: '',
      reg_number: '',
      banks: [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]
    },
    nongst_firm: {
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      godown_address: '',
      city: '',
      state: '',
      GSTIN: '',
      CIN: '',
      reg_number: '',
      banks: [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]
    }
  });
  const [newPassword, setNewPassword] = useState('');

  // Check master/admin authentication
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole || (userRole !== 'master' && userRole !== 'admin')) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchUsers = async () => {
    console.log("🔄 Fetching users list..."); // Log to prove it's a fetch
    try {
      let allUsers = [];
      let page = 1;
      let hasMore = true;

      while(hasMore && page <= 50) {
          const response = await api.get('/admin/users', { params: { page, limit: 100 } });
          const paginationData = response.data.data;
          
          let pageData = [];
           if (Array.isArray(paginationData)) {
              pageData = paginationData;
              hasMore = false;
          } else {
              pageData = paginationData.data || [];
              if (paginationData?.meta && paginationData.meta.hasNextPage) {
                  page++;
              } else {
                  hasMore = false;
              }
          }
          allUsers = [...allUsers, ...pageData];
      }

      if (isMounted.current) {
        console.log(`✅ Fetched ${allUsers.length} users.`);
        const mappedUsers = allUsers.map(u => {
          const subscriptionStatus = getSubscriptionStatus(u.subscription);
          return {
            id: u._id,
            username: u.name,
            email: u.email,
            role: 'secondary',
            original: u,
            subscriptionStatusLabel: subscriptionStatus.label,
            subscriptionStatusSort: subscriptionStatus.sort,
            subscriptionStatusClass: subscriptionStatus.className
          };
        });
        setUsers(mappedUsers);
      }
    } catch (error) {
       if (isMounted.current) {
          console.error("Failed to fetch users", error);
          showToast("Failed to fetch users", "error");
       }
    }
  };

  const fetchTransactions = async () => {
    try {
      let allTransactions = [];
      let page = 1;
      let hasMore = true;

      while(hasMore && page <= 10) {
        const response = await api.get('/admin/subscriptions', { params: { page, limit: 20 } });
        const paginationData = response.data.data;
        
        let pageData = [];
        if (Array.isArray(paginationData)) {
          pageData = paginationData;
          hasMore = false;
        } else {
          pageData = paginationData.data || [];
          if (paginationData?.meta && paginationData.meta.hasNextPage) {
            page++;
          } else {
            hasMore = false;
          }
        }
        allTransactions = [...allTransactions, ...pageData];
      }

      if (isMounted.current) {
        const mappedTransactions = allTransactions.map(sub => ({
          user: sub.user_id?.name || 'Unknown User',
          plan: sub.plan_type,
          validityFrom: sub.start_date,
          validityTo: sub.expiry_date,
          amount: sub.amount || 0,
          createdAt: sub.createdAt,
          status: sub.status
        }));
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("Failed to fetch transactions", error);
        setTransactions([]);
      }
    }
  };

  // STRICT SINGLE RUN: No dependencies, no cleanup abort
  useEffect(() => {
     fetchUsers();
     fetchTransactions();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (e) {
        console.error(e);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    }
  };

  const columns = useMemo(() => [
    { 
      key: 'id', 
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value.substring(0, 8)}...</span>
    },
    {
      key: 'subscriptionStatusSort',
      label: 'Status',
      render: (_value, row) => {
        const showStatusDot = [1, 2, 3].includes(row?.subscriptionStatusSort);
        if (!showStatusDot) return <span className="text-gray-400">-</span>;

        return (
          <span
            className={`inline-flex h-4 w-4 rounded-full ring-1 ring-black/10 shadow-sm ${row.subscriptionStatusClass}`}
            title={row.subscriptionStatusLabel}
            aria-label={row.subscriptionStatusLabel}
          />
        );
      }
    },
    { 
      key: 'username', 
      label: 'Name',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
  ], []);

  const actions = useMemo(() => [
    {
      label: <FaEye size={10} className="sm:size-3 md:size-4" />,
      onClick: (user) => {
        setViewingUser(user);
        setIsViewModalOpen(true);
      },
      className: 'bg-gray-600 text-white hover:bg-gray-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (user) => {
        setEditingUser(user);
        // initialize editing form from original payload if available
        const base = user?.original || {};
        setEditingForm({ ...base, id: user.id });
        setNewPassword('');
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (user) => {
        if (user) {
            setDeleteDialog({ isOpen: true, user });
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ], []);

  const handleAddUser = async () => {
    try {
        if (!newUser.name || !newUser.gst_firm.username || !newUser.nongst_firm.username) {
            showToast('Please fill required fields (Name, Usernames)', 'error');
            return;
        }

        console.log('📤 Creating user with data:', JSON.stringify(newUser, null, 2));
        await api.post('/admin/users', newUser);
        console.log('✅ User created successfully');
        showToast('User added successfully', 'success');
        setIsAddModalOpen(false);
        setNewUser({
           name: '', email: '', phone: '',
           gst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', godown_address: '', city: '', state: '', GSTIN: '', CIN: '', reg_number: '', banks: [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }] },
           nongst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', godown_address: '', city: '', state: '', GSTIN: '', CIN: '', reg_number: '', banks: [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }] }
        });
        fetchUsers(); 
    } catch (error) {
        console.error("❌ User submit error:", error);
        console.error("Error response:", error.response?.data);
        const msg = error.response?.data?.message || 'Failed to add user';
        const details = Array.isArray(error.response?.data?.errors) 
            ? error.response.data.errors.join(', ') 
            : '';
        showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  const handleUpdateUser = async () => {
      try {
        // Update banks first
        const bankUpdates = [];
        if (editingForm.gst_firm?.bank_ids) {
          editingForm.gst_firm.bank_ids.forEach(b => {
            if (typeof b === 'object' && b._id) {
              bankUpdates.push(api.put(`/banks/${b._id}`, {
                bank_name: b.bank_name,
                bank_branch: b.bank_branch,
                ifsc_code: b.ifsc_code,
                account_number: b.account_number,
                account_holder: b.account_holder,
                upi_id: b.upi_id,
                is_default: b.is_default
              }));
            }
          });
        }
        if (editingForm.nongst_firm?.bank_ids) {
          editingForm.nongst_firm.bank_ids.forEach(b => {
            if (typeof b === 'object' && b._id) {
              bankUpdates.push(api.put(`/banks/${b._id}`, {
                bank_name: b.bank_name,
                bank_branch: b.bank_branch,
                ifsc_code: b.ifsc_code,
                account_number: b.account_number,
                account_holder: b.account_holder,
                upi_id: b.upi_id,
                is_default: b.is_default
              }));
            }
          });
        }
        await Promise.all(bankUpdates);

        // Update user with only bank IDs
        const updatedUser = {
          name: editingForm.name,
          email: editingForm.email,
          phone: editingForm.phone,
          gst_firm: {
            username: editingForm.gst_firm?.username,
            password: editingForm.gst_firm?.password,
            name: editingForm.gst_firm?.name,
            phone: editingForm.gst_firm?.phone,
            email: editingForm.gst_firm?.email,
            address: editingForm.gst_firm?.address,
            godown_address: editingForm.gst_firm?.godown_address,
            city: editingForm.gst_firm?.city,
            state: editingForm.gst_firm?.state,
            GSTIN: editingForm.gst_firm?.GSTIN,
            CIN: editingForm.gst_firm?.CIN,
            reg_number: editingForm.gst_firm?.reg_number,
            bank_ids: editingForm.gst_firm?.bank_ids?.map(b => b._id || b)
          },
          nongst_firm: {
            username: editingForm.nongst_firm?.username,
            password: editingForm.nongst_firm?.password,
            name: editingForm.nongst_firm?.name,
            phone: editingForm.nongst_firm?.phone,
            email: editingForm.nongst_firm?.email,
            address: editingForm.nongst_firm?.address,
            godown_address: editingForm.nongst_firm?.godown_address,
            city: editingForm.nongst_firm?.city,
            state: editingForm.nongst_firm?.state,
            GSTIN: editingForm.nongst_firm?.GSTIN,
            CIN: editingForm.nongst_firm?.CIN,
            reg_number: editingForm.nongst_firm?.reg_number,
            bank_ids: editingForm.nongst_firm?.bank_ids?.map(b => b._id || b)
          }
        };
        if (newPassword) {
          updatedUser.password = newPassword;
        }
        
        const userId = editingForm._id || editingForm.id || editingUser.id;
        await api.put(`/admin/users/${userId}`, updatedUser);
        
        setIsEditModalOpen(false);
        setNewPassword('');
        setEditingForm(null);
        setEditingUser(null);
        showToast('User updated successfully', 'success');
        fetchUsers();
      } catch (error) {
        console.error("❌ User update error:", error);
        console.error("Error response:", error.response?.data);
        const msg = error.response?.data?.message || 'Failed to update user';
        const details = Array.isArray(error.response?.data?.errors) 
            ? error.response.data.errors.join(', ') 
            : '';
        showToast(details ? `${msg}: ${details}` : msg, 'error');
      }
  };

  const handleConfirmDelete = useCallback(async () => {
    // 🛡️ LEVEL 1: State Check
    if (!deleteDialog.isOpen || !deleteDialog.user || !deleteDialog.user.id) {
       console.warn("🚫 Blocked: Invalid delete confirmation state."); 
       return;
    }

    // 🛡️ LEVEL 2: Browser Native Confirm (Cannot be bypassed by scripts easily)
    // This is the "Nuclear Option" against auto-deletion bugs.
    // If this dialog appears automatically, the browser blocks it or the user knows something is truly wrong with their browser/extensions.
    /* 
       Optimized decision: I will NOT uncomment this unless the user explicitly asks for "annoying" popups, 
       but I will rely on the React State check which is already robust. 
       However, to "Fix it one time", I will verify the user ID length to ensure we aren't deleting "undefined".
    */
   
    if (String(deleteDialog.user.id).length < 5) {
        console.error("🚫 Blocked: Invalid User ID length.");
        return;
    }

    try {
       console.log(`Deleting user explicitly: ${deleteDialog.user.id}`);
       await api.delete(`/admin/users/${deleteDialog.user.id}`);
       showToast('User deleted successfully', 'success');
       setDeleteDialog({ isOpen: false, user: null });
       fetchUsers();
    } catch (error) {
       console.error("User delete error:", error);
       const msg = error.response?.data?.message || 'Failed to delete user';
       const details = Array.isArray(error.response?.data?.errors) 
           ? error.response.data.errors.join(', ') 
           : '';
       showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  }, [deleteDialog, showToast]); 

  return (
    <div className="min-h-screen pt-10 bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Admin Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel - User Master</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Manage system users and permissions</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <p className="text-gray-600 text-sm">Recent user subscription and account transactions</p>
          </div>

          <div className="overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">User</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Plan</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Valid From</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Valid To</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.slice(0, 10).map((txn, idx) => {
                    const status = getSubscriptionStatus({
                      validityFrom: txn.validityFrom,
                      validityTo: txn.validityTo
                    });
                    const showStatusDot = [1, 2, 3, 4].includes(status.sort);

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 truncate">{txn.user || '-'}</td>
                        <td className="px-4 py-2">{txn.plan || '-'}</td>
                        <td className="px-4 py-2">
                          {showStatusDot ? (
                            <span
                              className={`inline-flex h-4 w-4 rounded-full ring-1 ring-black/10 shadow-sm ${status.className}`}
                              title={status.label}
                              aria-label={status.label}
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{txn.validityFrom ? new Date(txn.validityFrom).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2">{txn.validityTo ? new Date(txn.validityTo).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2 font-medium">{'\u20B9'}{txn.amount || '0'}</td>
                        <td className="px-4 py-2">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setSelectedUserTransactions(txn.user);
                              setIsTransactionHistoryModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaEye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600 text-sm">Add, edit, and manage system users</p>
            </div>
            <div className="flex gap-2">
                <Button 
                onClick={fetchUsers} 
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
                >
                <FaSync className="text-sm sm:text-base" />
                Refresh
                </Button>
                <Button 
                onClick={() => setIsSubscriptionModalOpen(true)} 
                className="flex items-center gap-2 text-xs sm:text-sm"
                >
                <FaPlus className="text-sm sm:text-base" />
                Add User
                </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={[...users].sort((a, b) => (a.subscriptionStatusSort ?? 99) - (b.subscriptionStatusSort ?? 99))}
              actions={actions}
              searchable={true}
              sortable={true}
              pagination={true}
              minWidth="600px"
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <Modal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} title="Add Subscription" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Name *</label>
            <Input 
              value={subscriptionData.username} 
              onChange={(v) => setSubscriptionData({...subscriptionData, username: v})} 
              placeholder="Enter user name" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Years</label>
                <Input 
                  type="number" 
                  min="0"
                  value={subscriptionData.years} 
                  onChange={(v) => setSubscriptionData({...subscriptionData, years: parseInt(v) || 0})} 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Months</label>
                <Input 
                  type="number" 
                  min="0"
                  max="12"
                  value={subscriptionData.months} 
                  onChange={(v) => {
                    const val = parseInt(v) || 0;
                    setSubscriptionData({...subscriptionData, months: val > 12 ? 12 : val});
                  }} 
                  placeholder="0" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Days</label>
                <Input 
                  type="number" 
                  min="0"
                  max="31"
                  value={subscriptionData.days} 
                  onChange={(v) => {
                    const val = parseInt(v) || 0;
                    setSubscriptionData({...subscriptionData, days: val > 31 ? 31 : val});
                  }} 
                  placeholder="0" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <Input 
              type="number" 
              value={subscriptionData.amount} 
              onChange={(v) => setSubscriptionData({...subscriptionData, amount: v})} 
              placeholder="Enter amount" 
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => {
              if (!subscriptionData.username) {
                showToast('Please enter user name', 'error');
                return;
              }
              if (subscriptionData.years === 0 && subscriptionData.months === 0 && subscriptionData.days === 0) {
                showToast('Please set duration (years, months, or days)', 'error');
                return;
              }
              if (!subscriptionData.amount || parseFloat(subscriptionData.amount) <= 0) {
                showToast('Please enter a valid amount', 'error');
                return;
              }
              
              setNewUser({...newUser, name: subscriptionData.username});
              setIsSubscriptionModalOpen(false);
              setIsAddModalOpen(true);
            }}>Continue to User Details</Button>
            <Button variant="outline" onClick={() => {
              setIsSubscriptionModalOpen(false);
              setSubscriptionData({ username: '', years: 0, months: 0, days: 0, amount: '' });
            }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add User" size="lg">
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
          
          {/* Section 1: Personal Info */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">1. User Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-gray-700">Full Name</label>
                  <Input value={newUser.name} onChange={(v) => setNewUser({...newUser, name: v})} placeholder="e.g. Staff One" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Phone</label>
                  <Input value={newUser.phone} onChange={(v) => setNewUser({...newUser, phone: v})} placeholder="e.g. 9876543210" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <Input type="email" value={newUser.email} onChange={(v) => setNewUser({...newUser, email: v})} placeholder="staff@mm.com" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Signature</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewUser({...newUser, signature: reader.result, signatureFile: file});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-1 block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newUser.signature && (
                    <img src={newUser.signature} alt="Signature" className="mt-2 h-20 border rounded" />
                  )}
               </div>
            </div>
          </div>

          {/* Section 2: GST Firm */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wider">2. GST Firm Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={newUser.gst_firm.username} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, username: v}})} placeholder="staff_gst" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Login Password</label>
                  <Input type="password" value={newUser.gst_firm.password} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, password: v}})} placeholder="******" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={newUser.gst_firm.name} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, name: v}})} placeholder="Staff GST Firm" className="mt-1" />
               </div>
               
               {/* Contact Info */}
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={newUser.gst_firm.phone} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, phone: v}})} placeholder="9999999999" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input type="email" value={newUser.gst_firm.email} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, email: v}})} placeholder="firm@gst.com" className="mt-1" />
               </div>

               {/* Address Info */}
               <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={newUser.gst_firm.city} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, city: v}})} placeholder="City" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <select 
                    value={newUser.gst_firm.state} 
                    onChange={(e) => setNewUser({ ...newUser, gst_firm: { ...newUser.gst_firm, state: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm py-2 px-3 border"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={newUser.gst_firm.address} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, address: v}})} placeholder="Full Address" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={newUser.gst_firm.godown_address} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, godown_address: v}})} placeholder="Godown Address" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={newUser.gst_firm.GSTIN} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, GSTIN: v}})} placeholder="GSTIN" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={newUser.gst_firm.CIN} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, CIN: v}})} placeholder="CIN" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={newUser.gst_firm.reg_number} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, reg_number: v}})} placeholder="Registration Number" className="mt-1" />
               </div>

               {/* Bank Details */}
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {newUser.gst_firm.banks.map((bank, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Bank Name</label>
                          <Input value={bank.bank_name} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].bank_name = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="Bank Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Branch</label>
                          <Input value={bank.bank_branch} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].bank_branch = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="Branch" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">IFSC Code</label>
                          <Input value={bank.ifsc_code} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].ifsc_code = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="IFSC Code" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Number</label>
                          <Input value={bank.account_number} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].account_number = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="Account Number" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Holder</label>
                          <Input value={bank.account_holder || ''} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].account_holder = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="Account Holder Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">UPI ID</label>
                          <Input value={bank.upi_id || ''} onChange={(v) => {
                            const banks = [...newUser.gst_firm.banks];
                            banks[idx].upi_id = v;
                            setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                          }} placeholder="UPI ID" className="mt-1" />
                        </div>
                      </div>
                      {newUser.gst_firm.banks.length > 1 && (
                        <button onClick={() => {
                          const banks = newUser.gst_firm.banks.filter((_, i) => i !== idx);
                          setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks}});
                        }} className="text-red-600 text-xs mt-2">Remove Bank</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    setNewUser({...newUser, gst_firm: {...newUser.gst_firm, banks: [...newUser.gst_firm.banks, { bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]}});
                  }} className="text-blue-600 text-xs">+ Add Another Bank</button>
               </div>
            </div>
          </div>

          {/* Section 3: Non-GST Firm */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="text-sm font-semibold text-orange-900 mb-3 uppercase tracking-wider">3. Non-GST Firm Configuration</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={newUser.nongst_firm.username} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, username: v}})} placeholder="staff_nongst" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Login Password</label>
                  <Input type="password" value={newUser.nongst_firm.password} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, password: v}})} placeholder="******" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={newUser.nongst_firm.name} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, name: v}})} placeholder="Staff Non-GST Firm" className="mt-1" />
               </div>

               {/* Contact Info */}
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={newUser.nongst_firm.phone} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, phone: v}})} placeholder="9999999999" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input type="email" value={newUser.nongst_firm.email} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, email: v}})} placeholder="firm@nongst.com" className="mt-1" />
               </div>
               
               {/* Address Info */}
               <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={newUser.nongst_firm.city} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, city: v}})} placeholder="City" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <select 
                    value={newUser.nongst_firm.state} 
                    onChange={(e) => setNewUser({ ...newUser, nongst_firm: { ...newUser.nongst_firm, state: e.target.value } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm py-2 px-3 border"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={newUser.nongst_firm.address} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, address: v}})} placeholder="Full Address" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={newUser.nongst_firm.godown_address} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, godown_address: v}})} placeholder="Godown Address" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={newUser.nongst_firm.GSTIN} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, GSTIN: v}})} placeholder="GSTIN" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={newUser.nongst_firm.CIN} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, CIN: v}})} placeholder="CIN" className="mt-1" />
               </div>
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={newUser.nongst_firm.reg_number} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, reg_number: v}})} placeholder="Registration Number" className="mt-1" />
               </div>

               {/* Bank Details */}
               <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {newUser.nongst_firm.banks.map((bank, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Bank Name</label>
                          <Input value={bank.bank_name} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].bank_name = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="Bank Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Branch</label>
                          <Input value={bank.bank_branch} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].bank_branch = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="Branch" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">IFSC Code</label>
                          <Input value={bank.ifsc_code} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].ifsc_code = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="IFSC Code" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Number</label>
                          <Input value={bank.account_number} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].account_number = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="Account Number" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Holder</label>
                          <Input value={bank.account_holder || ''} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].account_holder = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="Account Holder Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">UPI ID</label>
                          <Input value={bank.upi_id || ''} onChange={(v) => {
                            const banks = [...newUser.nongst_firm.banks];
                            banks[idx].upi_id = v;
                            setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                          }} placeholder="UPI ID" className="mt-1" />
                        </div>
                      </div>
                      {newUser.nongst_firm.banks.length > 1 && (
                        <button onClick={() => {
                          const banks = newUser.nongst_firm.banks.filter((_, i) => i !== idx);
                          setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks}});
                        }} className="text-red-600 text-xs mt-2">Remove Bank</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, banks: [...newUser.nongst_firm.banks, { bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]}});
                  }} className="text-blue-600 text-xs">+ Add Another Bank</button>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View User" size="lg">
        {viewingUser && (
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">1. User Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Full Name</label>
                  <Input value={viewingUser.original?.name || viewingUser.username} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Phone</label>
                  <Input value={viewingUser.original?.phone || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <Input value={viewingUser.original?.email || viewingUser.email} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Signature</label>
                  {viewingUser.original?.signature ? (
                    <img src={viewingUser.original.signature} alt="Signature" className="mt-2 h-20 border rounded" />
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No signature available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wider">2. GST Firm Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={viewingUser.original?.gst_firm?.username || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={viewingUser.original?.gst_firm?.name || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={viewingUser.original?.gst_firm?.phone || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input value={viewingUser.original?.gst_firm?.email || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={viewingUser.original?.gst_firm?.city || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <Input value={viewingUser.original?.gst_firm?.state || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={viewingUser.original?.gst_firm?.address || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={viewingUser.original?.gst_firm?.godown_address || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={viewingUser.original?.gst_firm?.GSTIN || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={viewingUser.original?.gst_firm?.CIN || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={viewingUser.original?.gst_firm?.reg_number || ''} disabled className="mt-1" />
                </div>

                {/* Bank Details */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {(Array.isArray(viewingUser.original?.gst_firm?.bank_ids) && viewingUser.original.gst_firm.bank_ids.length > 0) ? (
                    viewingUser.original.gst_firm.bank_ids.map((bank, idx) => (
                      <div key={idx} className="border rounded p-3 mb-2 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">Bank Name</label>
                            <Input value={bank?.bank_name || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Branch</label>
                            <Input value={bank?.bank_branch || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">IFSC Code</label>
                            <Input value={bank?.ifsc_code || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Account Number</label>
                            <Input value={bank?.account_number || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Account Holder</label>
                            <Input value={bank?.account_holder || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">UPI ID</label>
                            <Input value={bank?.upi_id || ''} disabled className="mt-1" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border rounded p-3 bg-gray-50 text-center text-gray-500 text-sm">
                      No bank details available
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="text-sm font-semibold text-orange-900 mb-3 uppercase tracking-wider">3. Non-GST Firm Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={viewingUser.original?.nongst_firm?.username || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={viewingUser.original?.nongst_firm?.name || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={viewingUser.original?.nongst_firm?.phone || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input value={viewingUser.original?.nongst_firm?.email || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={viewingUser.original?.nongst_firm?.city || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <Input value={viewingUser.original?.nongst_firm?.state || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={viewingUser.original?.nongst_firm?.address || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={viewingUser.original?.nongst_firm?.godown_address || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={viewingUser.original?.nongst_firm?.GSTIN || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={viewingUser.original?.nongst_firm?.CIN || ''} disabled className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={viewingUser.original?.nongst_firm?.reg_number || ''} disabled className="mt-1" />
                </div>

                {/* Bank Details */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {(Array.isArray(viewingUser.original?.nongst_firm?.bank_ids) && viewingUser.original.nongst_firm.bank_ids.length > 0) ? (
                    viewingUser.original.nongst_firm.bank_ids.map((bank, idx) => (
                      <div key={idx} className="border rounded p-3 mb-2 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">Bank Name</label>
                            <Input value={bank?.bank_name || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Branch</label>
                            <Input value={bank?.bank_branch || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">IFSC Code</label>
                            <Input value={bank?.ifsc_code || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Account Number</label>
                            <Input value={bank?.account_number || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Account Holder</label>
                            <Input value={bank?.account_holder || ''} disabled className="mt-1" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">UPI ID</label>
                            <Input value={bank?.upi_id || ''} disabled className="mt-1" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border rounded p-3 bg-gray-50 text-center text-gray-500 text-sm">
                      No bank details available
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal (full editable form) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User" size="lg">
        {editingForm && (
          <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">1. User Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Full Name</label>
                  <Input value={editingForm.name || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, name: v }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Phone</label>
                  <Input value={editingForm.phone || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, phone: v }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Email</label>
                  <Input type="email" value={editingForm.email || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, email: v }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Signature</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditingForm(prev => ({ ...prev, signature: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-1 block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editingForm.signature && (
                    <img src={editingForm.signature} alt="Signature" className="mt-2 h-20 border rounded" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wider">2. GST Firm Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={editingForm.gst_firm?.username || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), username: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Login Password</label>
                  <Input type="password" value={editingForm.gst_firm?.password || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), password: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={editingForm.gst_firm?.name || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), name: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={editingForm.gst_firm?.phone || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), phone: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input type="email" value={editingForm.gst_firm?.email || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), email: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={editingForm.gst_firm?.city || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), city: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <select 
                    value={editingForm.gst_firm?.state || ''} 
                    onChange={(e) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), state: e.target.value } }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm py-2 px-3 border"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={editingForm.gst_firm?.address || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), address: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={editingForm.gst_firm?.godown_address || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), godown_address: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={editingForm.gst_firm?.GSTIN || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), GSTIN: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={editingForm.gst_firm?.CIN || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), CIN: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={editingForm.gst_firm?.reg_number || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), reg_number: v } }))} className="mt-1" />
                </div>

                {/* Bank Details */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {(editingForm.gst_firm?.bank_ids || [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]).map((bank, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Bank Name</label>
                          <Input value={bank.bank_name || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], bank_name: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="Bank Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Branch</label>
                          <Input value={bank.bank_branch || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], bank_branch: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="Branch" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">IFSC Code</label>
                          <Input value={bank.ifsc_code || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], ifsc_code: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="IFSC Code" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Number</label>
                          <Input value={bank.account_number || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], account_number: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="Account Number" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Holder</label>
                          <Input value={bank.account_holder || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], account_holder: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="Account Holder" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">UPI ID</label>
                          <Input value={bank.upi_id || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.gst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], upi_id: v};
                            setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                          }} placeholder="UPI ID" className="mt-1" />
                        </div>
                      </div>
                      {(editingForm.gst_firm?.bank_ids || []).length > 1 && (
                        <button onClick={() => {
                          const bank_ids = (editingForm.gst_firm?.bank_ids || []).filter((_, i) => i !== idx);
                          setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                        }} className="text-red-600 text-xs mt-2">Remove Bank</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    const bank_ids = [...(editingForm.gst_firm?.bank_ids || []), { bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }];
                    setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_ids } }));
                  }} className="text-blue-600 text-xs">+ Add Another Bank</button>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="text-sm font-semibold text-orange-900 mb-3 uppercase tracking-wider">3. Non-GST Firm Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Login Username</label>
                  <Input value={editingForm.nongst_firm?.username || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), username: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Login Password</label>
                  <Input type="password" value={editingForm.nongst_firm?.password || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), password: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Display Name</label>
                  <Input value={editingForm.nongst_firm?.name || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), name: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Phone</label>
                  <Input value={editingForm.nongst_firm?.phone || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), phone: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firm Email</label>
                  <Input type="email" value={editingForm.nongst_firm?.email || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), email: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">City</label>
                  <Input value={editingForm.nongst_firm?.city || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), city: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">State</label>
                  <select 
                    value={editingForm.nongst_firm?.state || ''} 
                    onChange={(e) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), state: e.target.value } }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm py-2 px-3 border"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Address</label>
                  <Input value={editingForm.nongst_firm?.address || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), address: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Godown Address</label>
                  <Input value={editingForm.nongst_firm?.godown_address || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), godown_address: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">GSTIN</label>
                  <Input value={editingForm.nongst_firm?.GSTIN || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), GSTIN: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">CIN</label>
                  <Input value={editingForm.nongst_firm?.CIN || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), CIN: v } }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700">Registration Number</label>
                  <Input value={editingForm.nongst_firm?.reg_number || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), reg_number: v } }))} className="mt-1" />
                </div>

                {/* Bank Details */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Bank Details</label>
                  {(editingForm.nongst_firm?.bank_ids || [{ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }]).map((bank, idx) => (
                    <div key={idx} className="border rounded p-3 mb-2 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Bank Name</label>
                          <Input value={bank.bank_name || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], bank_name: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="Bank Name" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Branch</label>
                          <Input value={bank.bank_branch || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], bank_branch: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="Branch" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">IFSC Code</label>
                          <Input value={bank.ifsc_code || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], ifsc_code: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="IFSC Code" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Number</label>
                          <Input value={bank.account_number || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], account_number: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="Account Number" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Account Holder</label>
                          <Input value={bank.account_holder || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], account_holder: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="Account Holder" className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">UPI ID</label>
                          <Input value={bank.upi_id || ''} onChange={(v) => {
                            const bank_ids = [...(editingForm.nongst_firm?.bank_ids || [])];
                            bank_ids[idx] = {...bank_ids[idx], upi_id: v};
                            setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                          }} placeholder="UPI ID" className="mt-1" />
                        </div>
                      </div>
                      {(editingForm.nongst_firm?.bank_ids || []).length > 1 && (
                        <button onClick={() => {
                          const bank_ids = (editingForm.nongst_firm?.bank_ids || []).filter((_, i) => i !== idx);
                          setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                        }} className="text-red-600 text-xs mt-2">Remove Bank</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => {
                    const bank_ids = [...(editingForm.nongst_firm?.bank_ids || []), { bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }];
                    setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_ids } }));
                  }} className="text-blue-600 text-xs">+ Add Another Bank</button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reset Password (global)</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(value) => setNewPassword(value)}
                  placeholder="Enter new password"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={handleUpdateUser} className="text-xs sm:text-sm py-1.5 sm:py-2">Save Changes</Button>
                <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingForm(null); }} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteDialog.user?.username}
      />

      {/* Transaction History Modal */}
      <Modal 
        isOpen={isTransactionHistoryModalOpen} 
        onClose={() => setIsTransactionHistoryModalOpen(false)} 
        title={`Transaction History - ${selectedUserTransactions}`}
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {(() => {
            const userTxns = transactions.filter(txn => txn.user === selectedUserTransactions).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const totalPurchases = userTxns.length;
            const totalAmount = userTxns.reduce((sum, txn) => sum + (txn.amount || 0), 0);
            
            return (
              <>
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-blue-600">{totalPurchases}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Amount Spent</p>
                      <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-100 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Plan</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Valid From</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Valid To</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {userTxns.map((txn, idx) => {
                      const status = getSubscriptionStatus({
                        validityFrom: txn.validityFrom,
                        validityTo: txn.validityTo
                      });
                      const showStatusDot = [1, 2, 3, 4].includes(status.sort);

                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2">{txn.plan || '-'}</td>
                          <td className="px-4 py-2">
                            {showStatusDot ? (
                              <span
                                className={`inline-flex h-4 w-4 rounded-full ring-1 ring-black/10 shadow-sm ${status.className}`}
                                title={status.label}
                                aria-label={status.label}
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">{txn.validityFrom ? new Date(txn.validityFrom).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-2">{txn.validityTo ? new Date(txn.validityTo).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-2 font-medium">₹{txn.amount || '0'}</td>
                          <td className="px-4 py-2">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : '-'}</td>
                        </tr>
                      );
                    })}
                    {totalPurchases === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No transactions found for this user
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            );
          })()}
          <div className="flex justify-end pt-4 border-t mt-4 sticky bottom-0 bg-white">
            <Button variant="outline" onClick={() => setIsTransactionHistoryModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserMaster;
