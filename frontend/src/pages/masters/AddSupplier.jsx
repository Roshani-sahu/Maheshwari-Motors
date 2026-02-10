import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const AddSupplier = () => {
  const { showToast } = useStore();
  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'ABC Suppliers', contact: '9876543210', email: 'abc@supplier.com', address: 'Mumbai' },
      { id: 2, name: 'XYZ Parts', contact: '9876543211', email: 'xyz@parts.com', address: 'Delhi' }
    ];
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', address: '' });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, supplier: null });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (supplier) => {
        setEditingSupplier(supplier);
        setFormData(supplier);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (supplier) => {
        setDeleteDialog({ isOpen: true, supplier });
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleAdd = () => {
    const newSuppliers = [...suppliers, { id: Date.now(), ...formData }];
    setSuppliers(newSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(newSuppliers));
    setFormData({ name: '', contact: '', email: '', address: '' });
    setIsAddModalOpen(false);
    showToast('Supplier added successfully', 'success');
  };

  const handleEdit = () => {
    const newSuppliers = suppliers.map(s => s.id === editingSupplier.id ? formData : s);
    setSuppliers(newSuppliers);
    localStorage.setItem('suppliers', JSON.stringify(newSuppliers));
    setIsEditModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: '', contact: '', email: '', address: '' });
    showToast('Supplier updated successfully', 'success');
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
        actions={actions}
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

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, supplier: null })}
        onConfirm={() => {
          const newSuppliers = suppliers.filter(s => s.id !== deleteDialog.supplier.id);
          setSuppliers(newSuppliers);
          localStorage.setItem('suppliers', JSON.stringify(newSuppliers));
          setDeleteDialog({ isOpen: false, supplier: null });
          showToast('Supplier deleted successfully', 'success');
        }}
        itemName={deleteDialog.supplier?.name}
      />
    </div>
  );
};

export default AddSupplier;
