import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const AreaMaster = () => {
  const { showToast } = useStore();
  const [areas, setAreas] = useState([]);
  const [agents, setAgents] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [viewingArea, setViewingArea] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, area: null });
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    pincode: '',
    phone: '',
    whatsapp: '',
    agent: '',
    transporter: ''
  });

  useEffect(() => {
    fetchAreas();
    fetchAgents();
    fetchTransporters();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await api.get('/areas');
      setAreas(response.data.data || []);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch areas', 'error');
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get('/agents');
      const data = response.data.data;
      setAgents(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transports');
      const data = response.data.data;
      setTransporters(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error(error);
    }
  };

  const columns = useMemo(() => [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'phone', label: 'Phone' }
  ], []);

  const actions = useMemo(() => [
    {
      label: <FaEye size={14} />,
      onClick: (area) => {
        setViewingArea(area);
        setIsViewModalOpen(true);
      },
      className: 'bg-gray-600 text-white hover:bg-gray-700 p-2'
    },
    {
      label: <FaEdit size={14} />,
      onClick: (area) => {
        setEditingArea(area);
        setFormData({
          city: area.city || '',
          state: area.state || '',
          pincode: area.pincode || '',
          phone: area.phone || '',
          whatsapp: area.whatsapp || '',
          agent: area.agent || '',
          transporter: area.transporter || ''
        });
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-2'
    },
    {
      label: <FaTrash size={14} />,
      onClick: (area) => setDeleteDialog({ isOpen: true, area }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-2'
    }
  ], []);

  const handleAdd = async () => {
    if (!formData.city || !formData.state) {
      showToast('Please fill required fields', 'error');
      return;
    }
    try {
      await api.post('/areas', formData);
      showToast('Area added successfully', 'success');
      setIsAddModalOpen(false);
      setFormData({ city: '', state: '', pincode: '', phone: '', whatsapp: '', agent: '', transporter: '' });
      fetchAreas();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to add area', 'error');
    }
  };

  const handleEdit = async () => {
    if (!formData.city || !formData.state) {
      showToast('Please fill required fields', 'error');
      return;
    }
    try {
      await api.put(`/areas/${editingArea._id}`, formData);
      showToast('Area updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingArea(null);
      setFormData({ city: '', state: '', pincode: '', phone: '', whatsapp: '', agent: '', transporter: '' });
      fetchAreas();
    } catch (error) {
      console.error(error);
      showToast('Failed to update area', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/areas/${deleteDialog.area._id}`);
      showToast('Area deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, area: null });
      fetchAreas();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete area', 'error');
    }
  };

  const renderForm = (isView = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <Input
            value={formData.city}
            onChange={(v) => setFormData({ ...formData, city: v })}
            placeholder="Enter city"
            disabled={isView}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <select
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <Input
            value={formData.pincode}
            onChange={(v) => setFormData({ ...formData, pincode: v })}
            placeholder="Enter pincode"
            disabled={isView}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <Input
            value={formData.phone}
            onChange={(v) => setFormData({ ...formData, phone: v })}
            placeholder="Enter phone"
            disabled={isView}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
          <Input
            value={formData.whatsapp}
            onChange={(v) => setFormData({ ...formData, whatsapp: v })}
            placeholder="Enter whatsapp"
            disabled={isView}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <select
            value={formData.agent}
            onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select Agent</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transporter</label>
          <select
            value={formData.transporter}
            onChange={(e) => setFormData({ ...formData, transporter: e.target.value })}
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select Transporter</option>
            {transporters.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Area Master</h1>
          <p className="text-gray-600 text-sm">Manage area information</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <FaPlus />
          Add Area
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={areas}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Area">
        {renderForm()}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleAdd}>Add Area</Button>
          <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Area">
        {renderForm()}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleEdit}>Save Changes</Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Area">
        {viewingArea && (
          <>
            {(() => {
              setFormData({
                city: viewingArea.city || '',
                state: viewingArea.state || '',
                pincode: viewingArea.pincode || '',
                phone: viewingArea.phone || '',
                whatsapp: viewingArea.whatsapp || '',
                agent: viewingArea.agent || '',
                transporter: viewingArea.transporter || ''
              });
              return renderForm(true);
            })()}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </>
        )}
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, area: null })}
        onConfirm={handleDelete}
        itemName={deleteDialog.area?.city}
      />
    </div>
  );
};

export default AreaMaster;
