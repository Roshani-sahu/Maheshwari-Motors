import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import { adminAPI, authAPI } from '../../services/api';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
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
      city: '',
      state: ''
    },
    nongst_firm: {
      username: '',
      password: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: ''
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

  const fetchUsers = useCallback(async (signal) => {
    try {
      let allUsers = [];
      let page = 1;
      let hasMore = true;

      while(hasMore) {
          const response = await adminAPI.getUsers({ page, limit: 100, signal });
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
          if (page > 50) break;
      }

      const mappedUsers = allUsers.map(u => ({
         id: u._id,
         username: u.name, 
         email: u.email,
         role: 'secondary',
         original: u 
      }));
      setUsers(mappedUsers);
    } catch (error) {
       if (error.name !== 'CanceledError' && !error.message?.includes('canceled')) {
          console.error("Failed to fetch users", error);
          showToast("Failed to fetch users", "error");
       }
    }
  }, [setUsers, showToast]);

  useEffect(() => {
     const controller = new AbortController();
     fetchUsers(controller.signal);
     return () => controller.abort();
  }, [fetchUsers]);

  const handleLogout = async () => {
    try {
        await authAPI.logout();
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
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (user) => {
        setEditingUser(user);
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

        await adminAPI.createUser(newUser);
        showToast('User added successfully', 'success');
        setIsAddModalOpen(false);
        setNewUser({
           name: '', email: '', phone: '',
           gst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', city: '', state: '' },
           nongst_firm: { username: '', password: '', name: '', phone: '', email: '', address: '', city: '', state: '' }
        });
        fetchUsers(); 
    } catch (error) {
        console.error(error);
        showToast(error.response?.data?.message || 'Failed to add user', 'error');
    }
  };

  const handleUpdateUser = async () => {
      try {
        const updatedUser = { ...editingUser };
        if (newPassword) {
          updatedUser.password = newPassword;
        }
        await adminAPI.updateUser(editingUser.id, updatedUser);
        
        setIsEditModalOpen(false);
        setNewPassword('');
        showToast('User updated successfully', 'success');
        fetchUsers(); 
      } catch (error) {
        console.error(error);
        showToast('Failed to update user', 'error');
      }
  };

  const handleConfirmDelete = useCallback(async () => {
    // 🛡️ Safety Block: Ensure we have a valid intention to delete
    if (!deleteDialog.isOpen || !deleteDialog.user || !deleteDialog.user.id) {
       console.warn("🚫 Blocked: Invalid delete confirmation state."); 
       return;
    }

    try {
       console.log(`🗑️ Deleting user: ${deleteDialog.user.id}`);
       await adminAPI.deleteUser(deleteDialog.user.id);
       showToast('User deleted successfully', 'success');
       setDeleteDialog({ isOpen: false, user: null });
       fetchUsers();
    } catch (error) {
       console.error(error);
       showToast('Failed to delete user', 'error');
    }
  }, [deleteDialog, showToast, fetchUsers]);

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
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <FaPlus className="text-sm sm:text-base" />
              Add User
            </Button>
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
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User" size="sm">
        {editingUser && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Username</label>
              <Input 
                value={editingUser.username} 
                disabled 
                className="bg-gray-50 text-xs sm:text-sm py-1.5 sm:py-2"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={editingUser.email}
                onChange={(value) => setEditingUser(prev => ({ ...prev, email: value }))}
                placeholder="Enter email"
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reset Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(value) => setNewPassword(value)}
                placeholder="Enter new password"
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button onClick={handleUpdateUser} className="text-xs sm:text-sm py-1.5 sm:py-2">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
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