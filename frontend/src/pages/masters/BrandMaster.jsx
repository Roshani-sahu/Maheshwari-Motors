import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const defaultDiscount = { normal: 0, special: 0 };

const BrandMaster = () => {
  const { showToast } = useStore();
  const [brands, setBrands] = useState([]);
  const [hsns, setHsns] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedHsn, setSelectedHsn] = useState('');
  const [discount1, setDiscount1] = useState(defaultDiscount);
  const [discount2, setDiscount2] = useState(defaultDiscount);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, brand: null });
  const [submitting, setSubmitting] = useState(false);

  const listFromResponse = (res) => {
    const payload = res?.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchData = async (signal) => {
    try {
      const [brandRes, hsnRes] = await Promise.all([
        api.get('/brands', { params: { page: 1, limit: 200 }, signal }),
        api.get('/hsn', { params: { page: 1, limit: 200 }, signal })
      ]);

      const hsnList = listFromResponse(hsnRes).filter((h) => h?.is_active !== false).map((h) => ({
        _id: h._id,
        hsn_number: h.hsn_code,
        gst_percentage: Number(h.gst_rate || 0)
      }));
      setHsns(hsnList);

      const brandList = listFromResponse(brandRes).map((b) => ({
        id: b._id,
        name: b.brand_name || b.name || '',
        hsn_id: typeof b.hsn_id === 'object' ? b.hsn_id?._id : (b.hsn_id || ''),
        discount1: b.discount1 || { ...defaultDiscount },
        discount2: b.discount2 || { ...defaultDiscount }
      }));
      setBrands(brandList);
    } catch (error) {
      if (error?.name !== 'CanceledError') {
        showToast('Failed to load brands', 'error');
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  const columns = [
    { key: 'id', label: 'Brand ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
    { key: 'name', label: 'Brand Name' },
    {
      key: 'hsn_id',
      label: 'HSN Code',
      render: (value) => {
        const hsn = hsns.find((h) => h._id === value);
        return <span className="text-sm">{hsn ? `${hsn.hsn_number} (${hsn.gst_percentage}%)` : '-'}</span>;
      }
    },
    {
      key: 'discount1',
      label: 'GST Discount',
      render: (value) => `${value?.normal || 0}% + ${value?.special || 0}%`
    },
    {
      key: 'discount2',
      label: 'Non-GST Discount',
      render: (value) => `${value?.normal || 0}% + ${value?.special || 0}%`
    }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (brand) => {
        setEditingBrand(brand);
        setNewBrandName(brand.name);
        setSelectedHsn(brand.hsn_id || '');
        setDiscount1(brand.discount1 || defaultDiscount);
        setDiscount2(brand.discount2 || defaultDiscount);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (brand) => setDeleteDialog({ isOpen: true, brand }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const buildPayload = () => ({
    brand_name: newBrandName?.trim(),
    hsn_id: selectedHsn || undefined,
    discount1: {
      normal: Number(discount1.normal || 0),
      special: Number(discount1.special || 0)
    },
    discount2: {
      normal: Number(discount2.normal || 0),
      special: Number(discount2.special || 0)
    }
  });

  const validate = () => {
    if (!newBrandName?.trim()) {
      showToast('Brand name is required', 'error');
      return false;
    }

    const allValues = [discount1.normal, discount1.special, discount2.normal, discount2.special].map((n) => Number(n));
    if (allValues.some((n) => Number.isNaN(n) || n < 0 || n > 100)) {
      showToast('Discount values must be between 0 and 100', 'error');
      return false;
    }

    return true;
  };

  const handleAddBrand = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/brands', buildPayload());
      showToast('Brand added successfully', 'success');
      setNewBrandName('');
      setSelectedHsn('');
      setDiscount1(defaultDiscount);
      setDiscount2(defaultDiscount);
      setIsAddModalOpen(false);
      fetchData();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to add brand', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBrand = async () => {
    if (!editingBrand?.id || !validate() || submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/brands/${editingBrand.id}`, buildPayload());
      showToast('Brand updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingBrand(null);
      setNewBrandName('');
      setSelectedHsn('');
      setDiscount1(defaultDiscount);
      setDiscount2(defaultDiscount);
      fetchData();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update brand', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteDialog?.brand?.id || submitting) return;
    setSubmitting(true);
    try {
      await api.delete(`/brands/${deleteDialog.brand.id}`);
      showToast('Brand deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, brand: null });
      fetchData();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to delete brand', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (onSave, saveText) => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
        <Input value={newBrandName} onChange={setNewBrandName} placeholder="Enter brand name" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
        <select value={selectedHsn} onChange={(e) => setSelectedHsn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
          <option value="">Select HSN Code</option>
          {hsns.map((h) => <option key={h._id} value={h._id}>{h.hsn_number} - {h.gst_percentage}%</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Normal %</label>
          <Input type="number" value={discount1.normal} onChange={(v) => setDiscount1((d) => ({ ...d, normal: v }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Special %</label>
          <Input type="number" value={discount1.special} onChange={(v) => setDiscount1((d) => ({ ...d, special: v }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Non-GST Normal %</label>
          <Input type="number" value={discount2.normal} onChange={(v) => setDiscount2((d) => ({ ...d, normal: v }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Non-GST Special %</label>
          <Input type="number" value={discount2.special} onChange={(v) => setDiscount2((d) => ({ ...d, special: v }))} />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onSave} disabled={!newBrandName?.trim() || submitting}>{saveText}</Button>
        <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Master</h1>
          <p className="text-gray-600">Manage item brands and discount structure</p>
        </div>
        <Button onClick={() => { setNewBrandName(''); setSelectedHsn(''); setDiscount1(defaultDiscount); setDiscount2(defaultDiscount); setIsAddModalOpen(true); }} className="flex items-center gap-2"><FaPlus />Add Brand</Button>
      </div>

      <DataTable columns={columns} data={brands} actions={actions} searchable sortable pagination />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Brand" size="lg">{renderForm(handleAddBrand, 'Add Brand')}</Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Brand" size="lg">{renderForm(handleEditBrand, 'Save Changes')}</Modal>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, brand: null })} onConfirm={handleDeleteBrand} itemName={deleteDialog.brand?.name} />
    </div>
  );
};

export default BrandMaster;
