import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';

const AddSupplier = () => {
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'ABC Suppliers', contact: '9876543210', email: 'abc@supplier.com', address: 'Mumbai' },
    { id: 2, name: 'XYZ Parts', contact: '9876543211', email: 'xyz@parts.com', address: 'Delhi' }
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', address: '' });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, supplier) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSupplier(supplier);
              setFormData(supplier);
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete supplier "${supplier.name}"?`)) {
                setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
        </div>
      )
    }
  ];

  const handleAdd = () => {
    setSuppliers(prev => [...prev, { id: Date.now(), ...formData }]);
    setFormData({ name: '', contact: '', email: '', address: '' });
    setIsAddModalOpen(false);
  };

  const handleEdit = () => {
    setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? formData : s));
    setIsEditModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', email: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
          <p className="text-gray-600">Manage suppliers</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <FaPlus />
          Add Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Supplier" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <Input value={formData.contact} onChange={(v) => setFormData(prev => ({ ...prev, contact: v }))} placeholder="Enter contact" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input value={formData.email} onChange={(v) => setFormData(prev => ({ ...prev, email: v }))} placeholder="Enter email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={formData.address} onChange={(v) => setFormData(prev => ({ ...prev, address: v }))} placeholder="Enter address" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAdd} disabled={!formData.name}>Add Supplier</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <Input value={formData.contact} onChange={(v) => setFormData(prev => ({ ...prev, contact: v }))} placeholder="Enter contact" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input value={formData.email} onChange={(v) => setFormData(prev => ({ ...prev, email: v }))} placeholder="Enter email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={formData.address} onChange={(v) => setFormData(prev => ({ ...prev, address: v }))} placeholder="Enter address" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleEdit} disabled={!formData.name}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddSupplier;
