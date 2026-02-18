import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaImage, FaTrash, FaTimes } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import { itemAPI, categoryAPI } from '../../services/api';

const ItemMaster = () => {
  const navigate = useNavigate();
  const { items, setItems, updateItem, deleteItem, showToast } = useStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
      const fetchCategories = async () => {
          try {
              const res = await categoryAPI.getAll();
              const val = res.data?.data;
              const list = Array.isArray(val) ? val : (val?.data || []);
              setCategories(list.map(c => ({ id: c._id, name: c.name })));
          } catch (e) { console.error(e); }
      };
      fetchCategories();
  }, []);

  // Fetch items from backend - Iterate all pages
  useEffect(() => {
    const fetchItems = async () => {
      try {
        let allDocs = [];
        let page = 1;
        let hasMore = true;
        
        while(hasMore) {
            // Request large limit, backend will cap it to MAX_PAGE_SIZE (10)
            const response = await itemAPI.getAll({ page, limit: 100 });
            const payload = response.data?.data;
            let pageData = [];
            
            if (Array.isArray(payload)) {
                pageData = payload;
                hasMore = false; // If array, likely no pagination meta, assume single page or all
            } else {
                pageData = payload?.data || [];
                // Check if we have more pages
                if (payload?.meta && payload.meta.hasNextPage) {
                    page++;
                } else {
                    hasMore = false;
                }
            }
            
            allDocs = [...allDocs, ...pageData];
            if (page > 100) break; // Safety break
        }
        
        const backendItems = allDocs.map(item => ({
          id: item._id,
          itemName: item.item_name,
          amount: item.sale_rate || item.amount || 0,
          threshold: Number(item.threshold) || 0,
          stockCount: Number(item.stock) || Number(item.current_stock) || Number(item.opening_stock) || Number(item.physical_stock) || Number(item.quantity) || (Number(item.gst_stock || 0) + Number(item.nongst_stock || 0)) || 0,
          itemMedia: item.image,
          status: ((Number(item.stock) || 0) < (Number(item.threshold) || 0)) ? 'LOW' : 'OK',
          type: item.is_gst,
          categoryId: item.category_id || item.category_ids?.[0]
        }));
        setItems(backendItems);
      } catch (err) {
        console.error("Failed to fetch items", err);
        showToast("Failed to load items", "error");
      }
    };
    fetchItems();
  }, [setItems, showToast]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
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
        formData.append('amount', editingItem.amount);
        formData.append('threshold', editingItem.threshold);
        formData.append('is_gst', editingItem.type);
        
        if (editImageFile) {
          formData.append('image', editImageFile);
        }

        await itemAPI.update(editingItem.id, formData);
        
        showToast('Item updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditImageFile(null);
        
        // Refresh
        const response = await itemAPI.getAll();
        const val = response.data?.data;
        const rawList = Array.isArray(val) ? val : (val?.data || []);
        const backendItems = rawList.map(item => ({
            id: item._id,
            itemName: item.item_name,
            amount: item.sale_rate || item.amount || 0,
            threshold: Number(item.threshold) || 0,
            stockCount: Number(item.stock) || Number(item.physical_stock) || (Number(item.gst_stock || 0) + Number(item.nongst_stock || 0)) || 0,
            itemMedia: item.image,
            status: ((Number(item.stock) || Number(item.physical_stock) || 0) < (Number(item.threshold) || 0)) ? 'LOW' : 'OK',
            type: item.is_gst,
            categoryId: item.category_id || item.category_ids?.[0]
        }));
        setItems(backendItems);
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
        size="sm"
      >
        {editingItem && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <Input
                value={editingItem.itemName}
                onChange={(value) => setEditingItem(prev => ({
                  ...prev,
                  itemName: value
                }))}
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.amount}
                  onChange={(value) => setEditingItem(prev => ({
                    ...prev,
                    amount: parseFloat(value) || 0
                  }))}
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
                  onChange={(value) => setEditingItem(prev => ({
                    ...prev,
                    threshold: parseInt(value) || 0
                  }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Type</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gstType"
                    value="1"
                    checked={editingItem.type === 1}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, type: parseInt(e.target.value) }))}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">GST (1)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gstType"
                    value="0"
                    checked={editingItem.type === 0}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, type: parseInt(e.target.value) }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">Non-GST (0)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editingItem.categoryId || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Current Stock Count
              </label>
              <Input
                type="number"
                value={editingItem.stockCount}
                onChange={(value) => setEditingItem(prev => ({
                  ...prev,
                  stockCount: parseInt(value) || 0
                }))}
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              />
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

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={async () => {
          try {
             await itemAPI.delete(deleteDialog.item.id);
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
