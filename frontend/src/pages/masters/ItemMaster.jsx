import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaImage, FaTrash, FaTimes } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import { itemAPI, getImageUrl } from '../../services/api';
import useStore from '../../store';

const ItemMaster = () => {
  const navigate = useNavigate();

  const { items, setItems } = useStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const { setLoading, showToast } = useStore();


  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await itemAPI.getAll();
      const itemsData = response.data?.data?.data || [];
      console.log('Items loaded:', itemsData);
      setItems(itemsData);
    } catch (error) {
      showToast('Failed to load items', 'error');
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
      key: 'item_name', 
      label: 'Item Name',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    {
      key: 'amount', 
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{Number(value).toFixed(2)}</span>
    },
    {
      key: 'physical_stock', // Backend virtual
      label: 'Stock Count',
      render: (value, row) => (
        <span className={`text-xs sm:text-sm ${(value <= (row.threshold || 0)) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
          {value !== undefined ? value : (row.gst_stock + row.nongst_stock)}
        </span>
      )
    },
    {
      key: 'threshold',
      label: 'Threshold',
      render: (value) => <span className="text-xs sm:text-sm">{value || 0}</span>
    },
    {
      key: 'status', 
      label: 'Stock Status',
      render: (value, row) => {
        const stock = row.physical_stock !== undefined ? row.physical_stock : (row.gst_stock + row.nongst_stock);
        const status = (stock <= (row.threshold || 0)) ? 'LOW' : 'OK';
        return (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          status === 'LOW' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {status}
        </span>
        );
      }
    },
    {
      key: 'image',
      label: 'Image',
      render: (value) => (
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => value && setSelectedImage(value)}
        >
          {value ? (
            <img 
              src={value.startsWith('http') ? value : getImageUrl(value)} 
              alt="Item" 
              className="w-full h-full object-cover rounded"
              crossOrigin="anonymous"
            />
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

      onClick: async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
          setLoading(true);
          try {
            await itemAPI.delete(item._id); // Assuming backend uses _id
            showToast('Item deleted successfully', 'success');
            loadItems();
          } catch (error) {
            showToast('Failed to delete item', 'error');
          } finally {
            setLoading(false);
          }
        }
      },

      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleSaveEdit = async () => {
    if (editingItem) {
      setLoading(true);
      try {
        const formDataPayload = new FormData();
        formDataPayload.append('item_name', editingItem.item_name);
        formDataPayload.append('amount', Number(editingItem.amount));
        formDataPayload.append('threshold', Number(editingItem.threshold) || 0);
        formDataPayload.append('gst_stock', Number(editingItem.gst_stock) || 0);
        formDataPayload.append('nongst_stock', Number(editingItem.nongst_stock) || 0);
        
        if (editImageFile) {
            formDataPayload.append('image', editImageFile);
        }

        await itemAPI.update(editingItem._id, formDataPayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Item updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingItem(null);
        setEditImageFile(null);
        loadItems();
      } catch (error) {
        console.error(error);
        showToast('Failed to update item', 'error');
      } finally {
        setLoading(false);
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
                value={editingItem.item_name}
                onChange={(value) => setEditingItem(prev => ({
                  ...prev,
                  item_name: value
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
                Stock (GST / Non-GST)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="GST"
                  value={editingItem.gst_stock}
                  onChange={(value) => setEditingItem(prev => ({
                    ...prev,
                    gst_stock: parseInt(value) || 0
                  }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
                <Input
                  type="number"
                  placeholder="Non-GST"
                  value={editingItem.nongst_stock}
                  onChange={(value) => setEditingItem(prev => ({
                    ...prev,
                    nongst_stock: parseInt(value) || 0
                  }))}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>
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
              {editingItem.image && (
                <div className="mt-2">
                  <img src={getImageUrl(editingItem.image)} alt="Current" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-cover rounded" />
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
        onConfirm={() => deleteItem(deleteDialog.item.id)}
        itemName={deleteDialog.item?.itemName}
      />
    </div>
  );
};

export default ItemMaster;