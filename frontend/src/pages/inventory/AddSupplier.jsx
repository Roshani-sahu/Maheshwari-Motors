import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const emptyForm = { name: '', contact: '', email: '', address: '', city: '', state: '', gstin: '' };

const AddSupplier = () => {
  const { showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, supplier: null });
  const [submitting, setSubmitting] = useState(false);

  const normalizeList = (res) => {
    const payload = res?.data?.data;
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    return list.map((s) => ({
      id: s._id,
      name: s.name || '',
      contact: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      gstin: s.gstin || ''
    }));
  };

  const fetchSuppliers = async (signal) => {
    try {
      const response = await api.get('/contacts', {
        params: { page: 1, limit: 200, type: 'supplier' },
        signal
      });
      setSuppliers(normalizeList(response));
    } catch (error) {
      if (error?.name !== 'CanceledError') {
        showToast('Failed to fetch suppliers', 'error');
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSuppliers(controller.signal);
    return () => controller.abort();
  }, []);

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'gstin', label: 'GSTIN' }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (supplier) => {
        setEditingSupplier(supplier);
        setFormData({ ...supplier });
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (supplier) => setDeleteDialog({ isOpen: true, supplier }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const buildPayload = () => ({
    name: formData.name?.trim(),
    type: 'supplier',
    phone: formData.contact?.trim() || undefined,
    email: formData.email?.trim() || undefined,
    address: formData.address?.trim() || undefined,
    city: formData.city?.trim() || undefined,
    state: formData.state?.trim() || undefined,
    gstin: formData.gstin?.trim().toUpperCase() || undefined,
    is_gst: formData.gstin?.trim() ? 1 : 0
  });

  const handleAdd = async () => {
    if (!formData.name?.trim() || submitting) {
      showToast('Supplier name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/contacts', buildPayload());
      showToast('Supplier added successfully', 'success');
      setFormData(emptyForm);
      setIsAddModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to add supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingSupplier?.id || submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/contacts/${editingSupplier.id}`, buildPayload());
      showToast('Supplier updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingSupplier(null);
      setFormData(emptyForm);
      fetchSuppliers();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog?.supplier?.id || submitting) return;
    setSubmitting(true);
    try {
      await api.delete(`/contacts/${deleteDialog.supplier.id}`);
      showToast('Supplier deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, supplier: null });
      fetchSuppliers();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete supplier', 'error');
    } finally {
      setSubmitting(false);
    }
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

      <DataTable columns={columns} data={suppliers} actions={actions} searchable sortable pagination />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Supplier" size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label><Input value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><Input value={formData.contact} onChange={(v) => setFormData((p) => ({ ...p, contact: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><Input value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><Input value={formData.address} onChange={(v) => setFormData((p) => ({ ...p, address: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><Input value={formData.city} onChange={(v) => setFormData((p) => ({ ...p, city: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><Input value={formData.state} onChange={(v) => setFormData((p) => ({ ...p, state: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><Input value={formData.gstin} onChange={(v) => setFormData((p) => ({ ...p, gstin: v }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAdd} disabled={submitting || !formData.name?.trim()}>Add Supplier</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier" size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label><Input value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><Input value={formData.contact} onChange={(v) => setFormData((p) => ({ ...p, contact: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><Input value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><Input value={formData.address} onChange={(v) => setFormData((p) => ({ ...p, address: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><Input value={formData.city} onChange={(v) => setFormData((p) => ({ ...p, city: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><Input value={formData.state} onChange={(v) => setFormData((p) => ({ ...p, state: v }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><Input value={formData.gstin} onChange={(v) => setFormData((p) => ({ ...p, gstin: v }))} /></div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleEdit} disabled={submitting || !formData.name?.trim()}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, supplier: null })} onConfirm={handleDelete} itemName={deleteDialog.supplier?.name} />
    </div>
  );
};

export default AddSupplier;
