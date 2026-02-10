import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';
import { accountAPI } from '../../services/api'; // Using accountAPI for parties
import useStore from '../../store';

const AddSupplier = () => {
  const { selectedFirm, setLoading, showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ 
      name: '', 
      phone_number: '', 
      email: '', 
      address: '', 
      gstin: '',
      type: 'supplier' // Fixed type
  });

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
        loadSuppliers();
    }
  }, [selectedFirm]);

  const loadSuppliers = async () => {
      setLoading(true);
      try {
          const firmId = selectedFirm._id || selectedFirm.id;
          const response = await accountAPI.getAll(firmId);
          // Filter only suppliers if endpoint returns mixed
          const allParties = response.data?.data?.data || [];
          setSuppliers(allParties.filter(p => p.type === 'supplier'));
      } catch (error) {
          showToast('Failed to load suppliers', 'error');
      } finally {
          setLoading(false);
      }
  };

  const columns = [
    { 
        key: '_id', 
        label: 'ID',
        render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    { 
        key: 'name', 
        label: 'Supplier Name',
        render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    { key: 'phone_number', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'gstin', label: 'GSTIN' }, // Added GSTIN
    {
      key: 'actions',
      label: 'Actions',
      render: (value, supplier) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingSupplier(supplier);
              setFormData({
                  name: supplier.name,
                  phone_number: supplier.phone_number || '',
                  email: supplier.email || '',
                  address: supplier.address || '',
                  gstin: supplier.gstin || '',
                  type: 'supplier'
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
                setLoading(true);
                try {
                    const firmId = selectedFirm._id || selectedFirm.id;
                    await accountAPI.delete(firmId, supplier._id);
                    showToast('Supplier deleted', 'success');
                    loadSuppliers();
                } catch (error) {
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
      if (!formData.name) return;
      setLoading(true);
      try {
          const firmId = selectedFirm._id || selectedFirm.id;
          await accountAPI.create(firmId, formData);
          showToast('Supplier added successfully', 'success');
          setFormData({ name: '', phone_number: '', email: '', address: '', gstin: '', type: 'supplier' });
          setIsAddModalOpen(false);
          loadSuppliers();
      } catch (error) {
          showToast('Failed to add supplier', 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleEdit = async () => {
      if (!formData.name || !editingSupplier) return;
      setLoading(true);
      try {
          const firmId = selectedFirm._id || selectedFirm.id;
          await accountAPI.update(firmId, editingSupplier._id, formData);
          showToast('Supplier updated successfully', 'success');
          setIsEditModalOpen(false);
          setEditingSupplier(null);
          setFormData({ name: '', phone_number: '', email: '', address: '', gstin: '', type: 'supplier' });
          loadSuppliers();
      } catch (error) {
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
            setFormData({ name: '', phone_number: '', email: '', address: '', gstin: '', type: 'supplier' });
            setIsAddModalOpen(true);
        }} className="flex items-center gap-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Phone)</label>
            <Input value={formData.phone_number} onChange={(v) => setFormData(prev => ({ ...prev, phone_number: v }))} placeholder="Enter phone" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <Input value={formData.name} onChange={(v) => setFormData(prev => ({ ...prev, name: v }))} placeholder="Enter name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Phone)</label>
            <Input value={formData.phone_number} onChange={(v) => setFormData(prev => ({ ...prev, phone_number: v }))} placeholder="Enter phone" />
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
