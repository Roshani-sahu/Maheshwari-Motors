import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';

import { supplierAPI } from '../../services/api';
import useStore from '../../store';

const AddSupplier = () => {
  const { setLoading, showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ 
      name: '', 
      phone: '', 
      email: '', 
      address: '',
      city: '',
      state: '',
      gstin: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
      try {
          setLoading(true);
          const response = await supplierAPI.getAll();
          const suppliersData = response.data?.data?.data || [];
          setSuppliers(suppliersData);
      } catch (error) {
          console.error('Load error:', error);
          showToast('Failed to load suppliers', 'error');
          setSuppliers([]);
      } finally {
          setLoading(false);
      }
  };


  const columns = [
    { 
        key: '_id', 
        label: 'ID',
        render: (value) => <span className="text-xs sm:text-sm">{value?.slice(0, 8)}</span>
    },
    { 
        key: 'name', 
        label: 'Supplier Name',
        render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    { key: 'phone', label: 'Contact' },
    { key: 'email', label: 'Email' },

    { key: 'gstin', label: 'GSTIN' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, supplier) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSupplier(supplier);
              setFormData({
                  name: supplier.name || '',
                  phone: supplier.phone || '',
                  email: supplier.email || '',
                  address: supplier.address || '',
                  city: supplier.city || '',
                  state: supplier.state || '',
                  gstin: supplier.gstin || ''
              });
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={async () => {
              if (window.confirm(`Delete supplier "${supplier.name}"?`)) {
                try {
                    setLoading(true);
                    await supplierAPI.delete(supplier._id);
                    showToast('Supplier deleted', 'success');
                    await loadSuppliers();
                } catch (error) {
                    console.error('Delete error:', error);
                    showToast('Failed to delete', 'error');
                } finally {
                    setLoading(false);
                }
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

  const handleAdd = async () => {
      if (!formData.name) {
        showToast('Name is required', 'error');
        return;
      }
      
      try {
          setLoading(true);
          await supplierAPI.create(formData);
          showToast('Supplier added successfully', 'success');
          setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
          setIsAddModalOpen(false);
          await loadSuppliers();
      } catch (error) {
          console.error('Add error:', error);
          showToast(error.response?.data?.message || 'Failed to add supplier', 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleEdit = async () => {
      if (!formData.name || !editingSupplier) return;
      
      try {
          setLoading(true);
          await supplierAPI.update(editingSupplier._id, formData);
          showToast('Supplier updated successfully', 'success');
          setIsEditModalOpen(false);
          setEditingSupplier(null);
          setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
          await loadSuppliers();
      } catch (error) {
          console.error('Update error:', error);
          showToast('Failed to update supplier', 'error');
      } finally {
          setLoading(false);
      }

  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Master</h1>
          <p className="text-gray-600">Manage suppliers</p>
        </div>
        <Button onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
            setIsAddModalOpen(true);
        }} className="flex items-center gap-2">
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Supplier" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Phone)</label>
            <Input value={formData.phone} onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))} placeholder="Enter phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input value={formData.email} onChange={(v) => setFormData(prev => ({ ...prev, email: v }))} placeholder="Enter email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <Input value={formData.gstin} onChange={(v) => setFormData(prev => ({ ...prev, gstin: v }))} placeholder="Enter GSTIN" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={formData.address} onChange={(v) => setFormData(prev => ({ ...prev, address: v }))} placeholder="Enter address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input value={formData.city} onChange={(v) => setFormData(prev => ({ ...prev, city: v }))} placeholder="Enter city" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <Input value={formData.state} onChange={(v) => setFormData(prev => ({ ...prev, state: v }))} placeholder="Enter state" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAdd} disabled={!formData.name}>Add Supplier</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Phone)</label>
            <Input value={formData.phone} onChange={(v) => setFormData(prev => ({ ...prev, phone: v }))} placeholder="Enter phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input value={formData.email} onChange={(v) => setFormData(prev => ({ ...prev, email: v }))} placeholder="Enter email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <Input value={formData.gstin} onChange={(v) => setFormData(prev => ({ ...prev, gstin: v }))} placeholder="Enter GSTIN" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input value={formData.address} onChange={(v) => setFormData(prev => ({ ...prev, address: v }))} placeholder="Enter address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input value={formData.city} onChange={(v) => setFormData(prev => ({ ...prev, city: v }))} placeholder="Enter city" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <Input value={formData.state} onChange={(v) => setFormData(prev => ({ ...prev, state: v }))} placeholder="Enter state" />
            </div>
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
