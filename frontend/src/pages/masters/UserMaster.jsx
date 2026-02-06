import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const UserMaster = () => {
  const { users, setUsers, addUser, updateUser, deleteUser } = useStore();
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
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'password',
      label: 'Password',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {showPasswords[row.id] ? value : '••••••••'}
          </span>
          <button
            onClick={() => togglePasswordVisibility(row.id)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showPasswords[row.id] ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      )
    }
  ];

  const actions = [
    {
      label: <FaEdit size={14} />,
      onClick: (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: <FaTrash size={14} />,
      onClick: (user) => {
        if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
          deleteUser(user.id);
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Master</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <FaPlus />
          Add User
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add User" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={newUser.username}
              onChange={(value) => setNewUser(prev => ({ ...prev, username: value }))}
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={newUser.email}
              onChange={(value) => setNewUser(prev => ({ ...prev, email: value }))}
              placeholder="Enter email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(value) => setNewUser(prev => ({ ...prev, password: value }))}
              placeholder="Enter password"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddUser}>Add User</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit User" size="md">
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <Input value={editingUser.username} disabled className="bg-gray-50" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={editingUser.email}
                onChange={(value) => setEditingUser(prev => ({ ...prev, email: value }))}
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(value) => setNewPassword(value)}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                const updatedUser = { ...editingUser };
                if (newPassword) {
                  updatedUser.password = newPassword;
                }
                updateUser(editingUser.id, updatedUser);
                setIsEditModalOpen(false);
                setNewPassword('');
              }}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserMaster;