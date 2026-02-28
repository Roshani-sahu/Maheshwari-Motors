import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaImage, FaTrash, FaTimes, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';
import {
  getResponseList,
  getResponseMeta,
  normalizeCategory,
  normalizeBrand,
  normalizeContact,
  normalizeItem,
  getEntityId,
  toNumber
} from '../../services/apiUtils';

const ItemMaster = () => {
  const navigate = useNavigate();
  const { items, setItems, deleteItem, showToast } = useStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hsns, setHsns] = useState([]);
  const [departments, setDepartments] = useState([]);

  const mapItemRecord = (item) => {
    const normalized = normalizeItem(item);
    return {
      ...normalized,
      item_id: item?.item_id,
      status: normalized.stockCount < normalized.threshold ? 'LOW' : 'OK'
    };
  };

  const fetchAllItems = async () => {
    let allItems = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      let response;
      try {
        response = await api.get('/items', { params: { page, limit: 100 } });
      } catch (error) {
        console.log('Error fetching items on page', page, error);
      }

      console.log(response);

      const pageItems = getResponseList(response);
      const meta = getResponseMeta(response);

      allItems = [...allItems, ...pageItems];

      if (meta?.hasNextPage) {
        page = toNumber(meta.page, page) + 1;
      } else {
        hasMore = false;
      }

      if (!meta && pageItems.length === 0) {
        hasMore = false;
      }

      if (page > 100) {
        hasMore = false;
      }
    }

    return allItems.map(mapItemRecord);
  };
  
  useEffect(() => {
      const fetchCategories = async () => {
          try {
              const [catRes, supplierRes, hsnRes, deptRes] = await Promise.all([
                  api.get('/categories'),
                  api.get('/contacts/suppliers', { params: { page: 1, limit: 200 } }),
                  api.get('/hsn', { params: { page: 1, limit: 200 } }),
                  api.get('/departments'),
              ]);
              
              setCategories(getResponseList(catRes).map((category) => {
                const normalized = normalizeCategory(category);
                return { id: normalized.id, name: normalized.name };
              }));
              
              // Fetch all brands with pagination
              let allBrands = [];
              let page = 1;
              let hasMore = true;
              
              while (hasMore) {
                try {
                  const brandRes = await api.get('/brands', { params: { page, limit: 100 } });
                  const pageBrands = getResponseList(brandRes);
                  allBrands = [...allBrands, ...pageBrands];
                  
                  const meta = getResponseMeta(brandRes);
                  if (meta?.hasNextPage) {
                    page++;
                  } else {
                    hasMore = false;
                  }
                  
                  if (pageBrands.length === 0) hasMore = false;
                  if (page > 50) hasMore = false;
                } catch (error) {
                  console.error('Error fetching brands page', page, error);
                  hasMore = false;
                }
              }
              
              setBrands(allBrands.map((brand) => {
                const normalized = normalizeBrand(brand);
                return { id: normalized.id, name: normalized.name };
              }));
              
              setSuppliers(getResponseList(supplierRes).map((supplier) => {
                const normalized = normalizeContact(supplier);
                return { id: normalized.id, name: normalized.name };
              }));
              setHsns(
                getResponseList(hsnRes)
                  .filter((hsn) => hsn?.is_active !== false)
                  .map((hsn) => ({
                    _id: getEntityId(hsn),
                    hsn_number: hsn?.hsn_code || '',
                    gst_percentage: toNumber(hsn?.gst_rate, 0)
                  })),
              );
              setDepartments(getResponseList(deptRes).map((dept) => ({
                id: getEntityId(dept),
                name: dept?.department_name || dept?.name
              })));
          } catch (e) { console.error(e); }
      };
      fetchCategories();
  }, []);

  // Fetch items from backend - Iterate all pages
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await fetchAllItems();
        setItems(data);
      } catch (err) {
        console.error("Failed to fetch items", err);
        showToast("Failed to load items", "error");
      }
    };
    fetchItems();
  }, [setItems, showToast]);

  const columns = [
    { key: 'id', label: 'ID', render: (val, row, index) => <span className="text-xs sm:text-sm">{index + 1}</span> },
    { key: 'item_id', label: 'Item ID', render: (val) => <span className="text-xs sm:text-sm">{val || '-'}</span> },
    { key: 'barcode', label: 'Barcode', render: (val) => <span className="text-xs sm:text-sm">{val || '-'}</span> },
    {
      key: 'itemName',
      label: 'Item Name',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    {
      key: 'categoryId',
      label: 'Category',
      render: (value) => {
        const cat = categories.find(c => c.id === value);
        return <span className="text-xs sm:text-sm">{cat ? cat.name : '-'}</span>;
      }
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 1 ? '1' : '0'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{Number(value || 0).toFixed(2)}</span>
    },
    {
      key: 'stockCount',
      label: 'Stock Count',
      render: (value, row) => (
        <span className={`text-xs sm:text-sm ${row.status === 'LOW' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'threshold',
      label: 'Threshold',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'status',
      label: 'Stock Status',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 'LOW' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'itemMedia',
      label: 'Image',
      render: (value) => (
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => value && setSelectedImage(value)}
        >
          {value ? (
            <img src={value} alt="Item" className="w-full h-full object-cover rounded" />
          ) : (
            <FaImage className="text-gray-400 text-xs sm:text-sm" />
          )}
        </div>
      )
    }
  ];

  const actions = [
    {
      label: <FaEye size={10} className="sm:size-3 md:size-4" />,
      onClick: (item) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
      },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (item) => setDeleteDialog({ isOpen: true, item }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        const formData = new FormData();
        formData.append('item_name', editingItem.itemName);
        formData.append('sale_rate', editingItem.amount);
        formData.append('threshold', editingItem.threshold);
        formData.append('is_gst', editingItem.type);
        formData.append('stock', editingItem.stockCount);
        
        if (editingItem.purchase_rate) formData.append('purchase_rate', editingItem.purchase_rate);
        if (editingItem.mrp_rate) formData.append('mrp_rate', editingItem.mrp_rate);
        if (editingItem.discount) formData.append('discount', editingItem.discount);
        if (editingItem.gst_percent) formData.append('gst_percent', editingItem.gst_percent);
        if (editingItem.categoryId) formData.append('category_id', editingItem.categoryId);
        if (editingItem.brandId) formData.append('brand_id', editingItem.brandId);
        if (editingItem.supplierId) formData.append('contact_id', editingItem.supplierId);
        if (editingItem.departmentId) formData.append('dept_id', editingItem.departmentId);
        if (editingItem.hsn_code) formData.append('hsn_id', editingItem.hsn_code);
        if (editingItem.alias) formData.append('alias', editingItem.alias);
        if (editingItem.description) formData.append('description', editingItem.description);
        
        if (editImageFile) {
          formData.append('image', editImageFile);
        }

        await api.put(`/items/${editingItem.id}`, formData, {
          headers: editImageFile ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        
        showToast('Item updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditImageFile(null);
        
        // Refresh
        const data = await fetchAllItems();
        setItems(data);
      } catch (error) {
        console.error('Update failed', error);
        showToast('Failed to update item', 'error');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEditImageFile(file);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Item Management</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage inventory items and stock levels</p>
        </div>
        <Button 
          onClick={() => navigate('/masters/item-master/add')}
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <FaPlus className="text-sm sm:text-base" />
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={items}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          minWidth="700px"
          className="text-xs sm:text-sm"
        />
      </div>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <FaTimes size={20} />
            </button>
            <img
              src={selectedImage}
              alt="Zoomed"
              className="max-w-full max-h-screen object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Item"
        size="lg"
      >
        {editingItem && (
          <div className="max-h-[70vh] overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <Input
                  value={editingItem.itemName}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, itemName: value }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Alias</label>
                <Input
                  value={editingItem.alias || ''}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, alias: value }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Current Stock Count
                </label>
                <Input
                  type="number"
                  value={editingItem.stockCount}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, stockCount: parseInt(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingItem.categoryId || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={editingItem.brandId || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, brandId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={editingItem.supplierId || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={editingItem.departmentId || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                <select
                  value={editingItem.hsn_code || ''}
                  onChange={(e) => {
                    const hsnId = e.target.value;
                    const selectedHsn = hsns.find(h => h._id === hsnId);
                    setEditingItem(prev => ({ 
                      ...prev, 
                      hsn_code: hsnId,
                      gst_percent: selectedHsn ? selectedHsn.gst_percentage : prev.gst_percent
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">Select HSN Code</option>
                  {hsns.map(h => (
                    <option key={h._id} value={h._id}>{h.hsn_number} - {h.gst_percentage}%</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.gst_percent || ''}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, gst_percent: value }))}
                  disabled={!!editingItem.hsn_code}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sale Rate (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.amount}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, amount: parseFloat(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Purchase Rate (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.purchase_rate || ''}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, purchase_rate: parseFloat(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  MRP Rate (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.mrp_rate || ''}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, mrp_rate: parseFloat(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Discount (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.discount || ''}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, discount: parseFloat(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Threshold
                </label>
                <Input
                  type="number"
                  value={editingItem.threshold}
                  onChange={(value) => setEditingItem(prev => ({ ...prev, threshold: parseInt(value) || 0 }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div
                onClick={() => setEditingItem(prev => ({ ...prev, type: prev.type === 0 ? 1 : 0 }))}
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  editingItem.type === 1 ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                    editingItem.type === 1 ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-600 mt-1 block">{editingItem.type === 1 ? '' : ''}</span>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Item Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-1.5  file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingItem.itemMedia && (
                <div className="mt-2">
                  <img src={editingItem.itemMedia} alt="Current" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-cover rounded" />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button onClick={handleSaveEdit} className="text-xs sm:text-sm py-1.5 sm:py-2">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Item Details"
        size="lg"
      >
        {viewingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Item Name</label>
                <p className="text-sm font-medium text-gray-900">{viewingItem.itemName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Alias</label>
                <p className="text-sm text-gray-900">{viewingItem.alias || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Category</label>
                <p className="text-sm text-gray-900">{categories.find(c => c.id === viewingItem.categoryId)?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Brand</label>
                <p className="text-sm text-gray-900">{brands.find(b => b.id === viewingItem.brandId)?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Supplier</label>
                <p className="text-sm text-gray-900">{suppliers.find(s => s.id === viewingItem.supplierId)?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Department</label>
                <p className="text-sm text-gray-900">{departments.find(d => d.id === viewingItem.departmentId)?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">HSN Code</label>
                <p className="text-sm text-gray-900">{viewingItem.hsn_number || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">GST %</label>
                <p className="text-sm text-gray-900">{viewingItem.gst_percent || 0}%</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Sale Rate</label>
                <p className="text-sm font-medium text-gray-900">₹{viewingItem.amount?.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Purchase Rate</label>
                <p className="text-sm text-gray-900">₹{viewingItem.purchase_rate?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">MRP Rate</label>
                <p className="text-sm text-gray-900">₹{viewingItem.mrp_rate?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Discount</label>
                <p className="text-sm text-gray-900">₹{viewingItem.discount?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Stock</label>
                <p className="text-sm text-gray-900">{viewingItem.stockCount}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Threshold</label>
                <p className="text-sm text-gray-900">{viewingItem.threshold}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Type</label>
                <p className="text-sm text-gray-900">{viewingItem.type === 1 ? 'GST' : 'Non-GST'}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{viewingItem.description || '-'}</p>
              </div>
              {viewingItem.itemMedia && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Image</label>
                  <img src={viewingItem.itemMedia} alt={viewingItem.itemName} className="w-32 h-32 object-cover rounded" />
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="text-xs sm:text-sm">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={async () => {
          try {
             await api.delete(`/items/${deleteDialog.item.id}`);
             showToast('Item deleted successfully', 'success');
             deleteItem(deleteDialog.item.id);
             setDeleteDialog({ isOpen: false, item: null });
          } catch (error) {
             console.error(error);
             showToast('Failed to delete item', 'error');
          }
        }}
        itemName={deleteDialog.item?.itemName}
      />
    </div>
  );
};

export default ItemMaster;
