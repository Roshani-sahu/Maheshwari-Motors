import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';
import { userAPI } from '../../services/api';
import useStore from '../../store';

const UserMaster = () => {
  const { users, setUsers } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const { setLoading, showToast } = useStore();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      setUsers(response.data?.data?.data || []);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const columns = [
    { 
      key: '_id', 
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    { 
      key: 'username', 
      label: 'Username',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    {
      key: 'password', // Backend likely doesn't return password usually, but assuming it's managed or hidden
      label: 'Access',
      render: (value, row) => (
        <span className="text-xs text-gray-500">Managed by Admin</span>
      )
    }
  ];

  const actions = [
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
      onClick: async (user) => {
        if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
          setLoading(true);
          try {
            await userAPI.delete(user._id);
            showToast('User deleted successfully', 'success');
            loadUsers();
          } catch (error) {
            showToast('Failed to delete user', 'error');
          } finally {
            setLoading(false);
          }
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleAddUser = async () => {
    setLoading(true);
    try {
      await userAPI.create(newUser);
      showToast('User created successfully', 'success');
      setNewUser({ username: '', email: '', password: '' });
      setIsAddModalOpen(false);
      loadUsers();
    } catch (error) {
      showToast('Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage system users and permissions</p>
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
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
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

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add User" size="sm md:md">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={newUser.username}
              onChange={(value) => setNewUser(prev => ({ ...prev, username: value }))}
              placeholder="Enter username"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(value) => setNewUser(prev => ({ ...prev, email: value }))}
              placeholder="Enter email"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(value) => setNewUser(prev => ({ ...prev, password: value }))}
              placeholder="Enter password"
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button onClick={handleAddUser} className="text-xs sm:text-sm py-1.5 sm:py-2">Add User</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User" size="sm md:md">
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
              <Button onClick={async () => {
                setLoading(true);
                try {
                  const updatedUser = { ...editingUser };
                  if (newPassword) {
                    updatedUser.password = newPassword;
                  }
                  await userAPI.update(editingUser._id || editingUser.id, updatedUser); // Using userAPI directly since no store action for API update
                  showToast('User updated successfully', 'success');
                  setIsEditModalOpen(false);
                  setNewPassword('');
                  loadUsers();
                } catch (error) {
                  showToast('Failed to update user', 'error');
                } finally {
                  setLoading(false);
                }
              }} className="text-xs sm:text-sm py-1.5 sm:py-2">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserMaster;