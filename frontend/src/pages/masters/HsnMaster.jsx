import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const HsnMaster = () => {
  const { showToast } = useStore();
  const [hsns, setHsns] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHsn, setEditingHsn] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, hsn: null });
  const [formData, setFormData] = useState({ hsn_number: '', gst_percentage: '', description: '', is_active: true });

  useEffect(() => {
    fetchHsns();
  }, []);

  const fetchHsns = async () => {
    try {
      const response = await api.get('/hsns');
      setHsns(response.data.data || []);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch HSN codes', 'error');
    }
  };

  const columns = useMemo(() => [
    { key: 'hsn_number', label: 'HSN Number' },
    { key: 'gst_percentage', label: 'GST %', render: (value) => `${value}%` },
    { key: 'description', label: 'Description' },
    { 
      key: 'is_active', 
      label: 'Status', 
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], []);

  const actions = useMemo(() => [
    {
      label: <FaEdit size={14} />,
      onClick: (hsn) => {
        setEditingHsn(hsn);
        setFormData({ 
          hsn_number: hsn.hsn_number, 
          gst_percentage: hsn.gst_percentage,
          description: hsn.description || '',
          is_active: hsn.is_active !== false
        });
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-2'
    },
    {
      label: <FaTrash size={14} />,
      onClick: (hsn) => setDeleteDialog({ isOpen: true, hsn }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-2'
    }
  ], []);

  const handleAdd = async () => {
    if (!formData.hsn_number || !formData.gst_percentage) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await api.post('/hsns', formData);
      showToast('HSN added successfully', 'success');
      setIsAddModalOpen(false);
      setFormData({ hsn_number: '', gst_percentage: '', description: '', is_active: true });
      fetchHsns();
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to add HSN', 'error');
    }
  };

  const handleEdit = async () => {
    if (!formData.hsn_number || !formData.gst_percentage) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    try {
      await api.put(`/hsns/${editingHsn._id}`, formData);
      showToast('HSN updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingHsn(null);
      setFormData({ hsn_number: '', gst_percentage: '', description: '', is_active: true });
      fetchHsns();
    } catch (error) {
      console.error(error);
      showToast('Failed to update HSN', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hsns/${deleteDialog.hsn._id}`);
      showToast('HSN deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, hsn: null });
      fetchHsns();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete HSN', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HSN Master</h1>
          <p className="text-gray-600 text-sm">Manage HSN codes and GST percentages</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <FaPlus />
          Add HSN
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={hsns}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add HSN Code">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Number *</label>
            <Input
              value={formData.hsn_number}
              onChange={(v) => setFormData({ ...formData, hsn_number: v })}
              placeholder="e.g. 8708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.gst_percentage}
              onChange={(v) => setFormData({ ...formData, gst_percentage: v })}
              placeholder="e.g. 18"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                formData.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                  formData.is_active ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-xs text-gray-600 mt-1 block">{formData.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAdd}>Add HSN</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit HSN Code">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Number *</label>
            <Input
              value={formData.hsn_number}
              onChange={(v) => setFormData({ ...formData, hsn_number: v })}
              placeholder="e.g. 8708"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.gst_percentage}
              onChange={(v) => setFormData({ ...formData, gst_percentage: v })}
              placeholder="e.g. 18"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                formData.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                  formData.is_active ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-xs text-gray-600 mt-1 block">{formData.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleEdit}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, hsn: null })}
        onConfirm={handleDelete}
        itemName={deleteDialog.hsn?.hsn_number}
      />
    </div>
  );
};

export default HsnMaster;
