import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const UserMaster = () => {
  const { users, setUsers, addUser, updateUser, deleteUser } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [newPassword, setNewPassword] = useState('');

  // Initialize with sample data if empty
  useEffect(() => {
    if (users.length === 0) {
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@maheshwarimotors.com',
          password: 'admin123'
        },
        {
          id: 2,
          username: 'operator1',
          email: 'operator1@maheshwarimotors.com',
          password: 'op123'
        },
        {
          id: 3,
          username: 'clerk1',
          email: 'clerk1@maheshwarimotors.com',
          password: 'clerk123'
        }
      ]);
    }
  }, [users.length, setUsers]);

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const columns = [
    { 
      key: 'id', 
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
      key: 'password',
      label: 'Password',
      render: (value, row) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="font-mono text-xs sm:text-sm">
            {showPasswords[row.id] ? value : '••••••••'}
          </span>
          <button
            onClick={() => togglePasswordVisibility(row.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showPasswords[row.id] ? 
              <FaEyeSlash size={12} className="sm:size-4" /> : 
              <FaEye size={12} className="sm:size-4" />
            }
          </button>
        </div>
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
      onClick: (user) => setDeleteDialog({ isOpen: true, user }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleAddUser = () => {
    const user = {
      id: Date.now(),
      ...newUser
    };
    addUser(user);
    setNewUser({ username: '', email: '', password: '' });
    setIsAddModalOpen(false);
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
              <Button onClick={() => {
                const updatedUser = { ...editingUser };
                if (newPassword) {
                  updatedUser.password = newPassword;
                }
                updateUser(editingUser.id, updatedUser);
                setIsEditModalOpen(false);
                setNewPassword('');
              }} className="text-xs sm:text-sm py-1.5 sm:py-2">
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
        onConfirm={() => deleteUser(deleteDialog.user.id)}
        itemName={deleteDialog.user?.username}
      />
    </div>
  );
};

export default UserMaster;