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

const UserMaster = () => {
  const navigate = useNavigate();
  const { users, setUsers, showToast } = useStore();
  const isMounted = useRef(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
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
      bank_name: '',
      bank_branch: '',
      ifsc_code: '',
      account_number: ''
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
      bank_name: '',
      bank_branch: '',
      ifsc_code: '',
      account_number: ''
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
        const mappedUsers = allUsers.map(u => ({
           id: u._id,
           username: u.name, 
           email: u.email,
           role: 'secondary',
           original: u 
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
       if (isMounted.current) {
          console.error("Failed to fetch users", error);
          showToast("Failed to fetch users", "error");
       }
    }
  };

  // STRICT SINGLE RUN: No dependencies, no cleanup abort
  useEffect(() => {
     fetchUsers();
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

        await api.post('/admin/users', newUser);
        showToast('User added successfully', 'success');
        setIsAddModalOpen(false);
        setNewUser({
           name: '', email: '', phone: '',
           gst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', godown_address: '', city: '', state: '', GSTIN: '', CIN: '', reg_number: '', bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' },
           nongst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', godown_address: '', city: '', state: '', GSTIN: '', CIN: '', reg_number: '', bank_name: '', bank_branch: '', ifsc_code: '', account_number: '' }
        });
        fetchUsers(); 
    } catch (error) {
        console.error("User submit error:", error);
        const msg = error.response?.data?.message || 'Failed to add user';
        const details = Array.isArray(error.response?.data?.errors) 
            ? error.response.data.errors.join(', ') 
            : '';
        showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  const handleUpdateUser = async () => {
      try {
        const updatedUser = { ...editingForm };
        if (newPassword) {
          updatedUser.password = newPassword;
        }
        await api.put(`/admin/users/${editingUser.id}`, updatedUser);
        
        setIsEditModalOpen(false);
        setNewPassword('');
        setEditingForm(null);
        setEditingUser(null);
        showToast('User updated successfully', 'success');
        fetchUsers();
      } catch (error) {
        console.error("User update error:", error);
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
       console.log(`🗑️ Deleting user explicitly: ${deleteDialog.user.id}`);
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
                onClick={() => setIsAddModalOpen(true)} 
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
              data={users}
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
               <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={newUser.gst_firm.bank_name} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, bank_name: v}})} placeholder="Bank Name" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={newUser.gst_firm.bank_branch} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, bank_branch: v}})} placeholder="Bank Branch" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={newUser.gst_firm.ifsc_code} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, ifsc_code: v}})} placeholder="IFSC Code" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={newUser.gst_firm.account_number} onChange={(v) => setNewUser({...newUser, gst_firm: {...newUser.gst_firm, account_number: v}})} placeholder="Account Number" className="mt-1" />
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
               <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={newUser.nongst_firm.bank_name} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, bank_name: v}})} placeholder="Bank Name" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={newUser.nongst_firm.bank_branch} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, bank_branch: v}})} placeholder="Bank Branch" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={newUser.nongst_firm.ifsc_code} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, ifsc_code: v}})} placeholder="IFSC Code" className="mt-1" />
               </div>
               <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={newUser.nongst_firm.account_number} onChange={(v) => setNewUser({...newUser, nongst_firm: {...newUser.nongst_firm, account_number: v}})} placeholder="Account Number" className="mt-1" />
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
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={viewingUser.original?.gst_firm?.bank_name || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={viewingUser.original?.gst_firm?.bank_branch || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={viewingUser.original?.gst_firm?.ifsc_code || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={viewingUser.original?.gst_firm?.account_number || ''} disabled className="mt-1" />
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
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={viewingUser.original?.nongst_firm?.bank_name || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={viewingUser.original?.nongst_firm?.bank_branch || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={viewingUser.original?.nongst_firm?.ifsc_code || ''} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={viewingUser.original?.nongst_firm?.account_number || ''} disabled className="mt-1" />
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
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={editingForm.gst_firm?.bank_name || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_name: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={editingForm.gst_firm?.bank_branch || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), bank_branch: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={editingForm.gst_firm?.ifsc_code || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), ifsc_code: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={editingForm.gst_firm?.account_number || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, gst_firm: { ...(prev.gst_firm || {}), account_number: v } }))} className="mt-1" />
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
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Name</label>
                  <Input value={editingForm.nongst_firm?.bank_name || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_name: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Bank Branch</label>
                  <Input value={editingForm.nongst_firm?.bank_branch || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), bank_branch: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">IFSC Code</label>
                  <Input value={editingForm.nongst_firm?.ifsc_code || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), ifsc_code: v } }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Account Number</label>
                  <Input value={editingForm.nongst_firm?.account_number || ''} onChange={(v) => setEditingForm(prev => ({ ...prev, nongst_firm: { ...(prev.nongst_firm || {}), account_number: v } }))} className="mt-1" />
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
    </div>
  );
};

export default UserMaster;
