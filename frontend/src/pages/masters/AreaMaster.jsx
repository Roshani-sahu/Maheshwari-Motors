import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry', 'Ladakh', 'Jammu and Kashmir'
];

const emptyForm = { city: '', state: '', pincode: '', phone: '', agent_id: '', transport_id: '' };

const AreaMaster = () => {
  const { showToast } = useStore();
  const [areas, setAreas] = useState([]);
  const [agents, setAgents] = useState([]);
  const [transports, setTransports] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [viewingArea, setViewingArea] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, area: null });
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const listFromResponse = (res) => {
    const payload = res?.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const normalizeArea = (a) => ({
    _id: a?._id,
    city: a?.city || '',
    state: a?.state || '',
    pincode: a?.pincode || '',
    phone: a?.phone || '',
    agent_id: typeof a?.agent_id === 'object' ? a.agent_id?._id : (a?.agent_id || ''),
    transport_id: typeof a?.transport_id === 'object' ? a.transport_id?._id : (a?.transport_id || '')
  });

  const fetchAll = async (signal) => {
    try {
      const [areasRes, agentsRes, transportsRes] = await Promise.all([
        api.get('/areas', { params: { page: 1, limit: 200 }, signal }),
        api.get('/agents', { params: { page: 1, limit: 200 }, signal }),
        api.get('/transports', { params: { page: 1, limit: 200 }, signal })
      ]);

      setAreas(listFromResponse(areasRes).map(normalizeArea));
      setAgents(listFromResponse(agentsRes));
      setTransports(listFromResponse(transportsRes));
    } catch (error) {
      if (error?.name !== 'CanceledError') {
        showToast('Failed to load area data', 'error');
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, []);

  const columns = useMemo(() => [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'phone', label: 'Phone' }
  ], []);

  const actions = useMemo(() => [
    {
      label: <FaEye size={14} />,
      onClick: (area) => { setViewingArea(area); setFormData({ ...area }); setIsViewModalOpen(true); },
      className: 'bg-gray-600 text-white hover:bg-gray-700 p-2'
    },
    {
      label: <FaEdit size={14} />,
      onClick: (area) => { setEditingArea(area); setFormData({ ...area }); setIsEditModalOpen(true); },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-2'
    },
    {
      label: <FaTrash size={14} />,
      onClick: (area) => setDeleteDialog({ isOpen: true, area }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-2'
    }
  ], []);

  const buildPayload = () => ({
    city: formData.city?.trim(),
    state: formData.state?.trim(),
    pincode: formData.pincode?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    agent_id: formData.agent_id || undefined,
    transport_id: formData.transport_id || undefined
  });

  const validate = () => {
    if (!formData.city?.trim() || !formData.state?.trim()) {
      showToast('City and state are required', 'error');
      return false;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      showToast('Phone number must be exactly 10 digits', 'error');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/areas', buildPayload());
      showToast('Area added successfully', 'success');
      setIsAddModalOpen(false);
      setFormData(emptyForm);
      fetchAll();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to add area';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingArea?._id || !validate() || submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/areas/${editingArea._id}`, buildPayload());
      showToast('Area updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingArea(null);
      setFormData(emptyForm);
      fetchAll();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update area';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog?.area?._id || submitting) return;
    setSubmitting(true);
    try {
      await api.delete(`/areas/${deleteDialog.area._id}`);
      showToast('Area deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, area: null });
      fetchAll();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete area', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (isView = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><Input value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} disabled={isView} /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={isView} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><Input value={formData.pincode} onChange={(v) => setFormData({ ...formData, pincode: v })} disabled={isView} /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><Input value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v.replace(/\D/g, '').slice(0, 10) })} disabled={isView} placeholder="10 digit number" /></div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <select value={formData.agent_id} onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })} disabled={isView} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Select Agent</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
          <select value={formData.transport_id} onChange={(e) => setFormData({ ...formData, transport_id: e.target.value })} disabled={isView} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Select Transport</option>
            {transports.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Area Master</h1><p className="text-gray-600 text-sm">Manage area information</p></div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2"><FaPlus />Add Area</Button>
      </div>

      <DataTable columns={columns} data={areas} actions={actions} searchable sortable pagination />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Area">{renderForm()}<div className="flex gap-3 pt-4"><Button onClick={handleAdd} disabled={submitting}>Add Area</Button><Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button></div></Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Area">{renderForm()}<div className="flex gap-3 pt-4"><Button onClick={handleEdit} disabled={submitting}>Save Changes</Button><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button></div></Modal>
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Area">{renderForm(true)}<div className="flex justify-end pt-4"><Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button></div></Modal>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, area: null })} onConfirm={handleDelete} itemName={deleteDialog.area?.city} />
    </div>
  );
};

export default AreaMaster;
