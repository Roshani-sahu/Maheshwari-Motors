import React, { useState } from 'react';
import { FaPlus, FaEdit, FaKey, FaUserShield } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input, Select } from '../../components/ui';

const UserMaster = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'admin',
      type: 'MAIN',
      assignedFirms: ['Maa Auto', 'Motors Division'],
      isActive: true
    },
    {
      id: 2,
      username: 'operator1',
      type: 'SECONDARY',
      assignedFirms: ['Maa Auto'],
      isActive: true
    },
    {
      id: 3,
      username: 'clerk1',
      type: 'SECONDARY',
      assignedFirms: ['Surat Branch'],
      isActive: false
    }
  ]);

  const [firms] = useState([
    { id: 1, name: 'Maa Auto' },
    { id: 2, name: 'Motors Division' },
    { id: 3, name: 'Surat Branch' }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    type: 'SECONDARY',
    assignedFirms: []
  });

  const columns = [
    { key: 'username', label: 'Username' },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'MAIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'assignedFirms',
      label: 'Assigned Firms',
      render: (value) => value.join(', ')
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: 'Reset Password',
      onClick: (user) => console.log('Reset password for:', user.username),
      className: 'bg-orange-600 text-white hover:bg-orange-700'
    }
  ];

  const handleAddUser = () => {
    const user = {
      id: users.length + 1,
      ...newUser,
      isActive: true
    };
    setUsers(prev => [...prev, user]);
    setNewUser({ username: '', password: '', type: 'SECONDARY', assignedFirms: [] });
    setIsAddModalOpen(false);
  };

  const handleFirmToggle = (firmName, isAssigning = true) => {
    const target = isAssigning ? newUser : editingUser;
    const setter = isAssigning ? setNewUser : setEditingUser;
    
    setter(prev => ({
      ...prev,
      assignedFirms: prev.assignedFirms.includes(firmName)
        ? prev.assignedFirms.filter(f => f !== firmName)
        : [...prev.assignedFirms, firmName]
    }));
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              type="password"
              value={newUser.password}
              onChange={(value) => setNewUser(prev => ({ ...prev, password: value }))}
              placeholder="Enter password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
            <Select
              value={newUser.type}
              onChange={(value) => setNewUser(prev => ({ ...prev, type: value }))}
            >
              <option value="MAIN">MAIN</option>
              <option value="SECONDARY">SECONDARY</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Firms</label>
            <div className="space-y-2">
              {firms.map(firm => (
                <label key={firm.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newUser.assignedFirms.includes(firm.name)}
                    onChange={() => handleFirmToggle(firm.name, true)}
                    className="rounded"
                  />
                  <span className="text-sm">{firm.name}</span>
                </label>
              ))}
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <Select
                value={editingUser.type}
                onChange={(value) => setEditingUser(prev => ({ ...prev, type: value }))}
              >
                <option value="MAIN">MAIN</option>
                <option value="SECONDARY">SECONDARY</option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Firms</label>
              <div className="space-y-2">
                {firms.map(firm => (
                  <label key={firm.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingUser.assignedFirms.includes(firm.name)}
                      onChange={() => handleFirmToggle(firm.name, false)}
                      className="rounded"
                    />
                    <span className="text-sm">{firm.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={() => {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
                setIsEditModalOpen(false);
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