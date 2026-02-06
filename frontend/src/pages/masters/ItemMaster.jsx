import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaImage, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const ItemMaster = () => {
  const navigate = useNavigate();
  const { items, setItems, updateItem, deleteItem } = useStore();
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);

  // Initialize with sample data if empty
  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          id: 1,
          itemName: 'Engine Oil 5W-30',
          amount: 450.00,
          threshold: 10,
          stockCount: 5,
          itemMedia: null,
          status: 'LOW'
        },
        {
          id: 2,
          itemName: 'Brake Pads',
          amount: 1200.00,
          threshold: 8,
          stockCount: 3,
          itemMedia: null,
          status: 'LOW'
        },
        {
          id: 3,
          itemName: 'Air Filter',
          amount: 350.00,
          threshold: 12,
          stockCount: 15,
          itemMedia: null,
          status: 'OK'
        },
        {
          id: 4,
          itemName: 'Spark Plugs',
          amount: 180.00,
          threshold: 6,
          stockCount: 2,
          itemMedia: null,
          status: 'LOW'
        }
      ]);
    }
  }, [items.length, setItems]);

  const columns = [
    {
      key: 'id',
      label: 'ID'
    },
    {
      key: 'itemName',
      label: 'Item Name'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toFixed(2)}`
    },
    {
      key: 'stockCount',
      label: 'Stock Count',
      render: (value, row) => (
        <span className={row.status === 'LOW' ? 'text-red-600 font-medium' : 'text-gray-900'}>
          {value}
        </span>
      )
    },
    {
      key: 'threshold',
      label: 'Threshold'
    },
    {
      key: 'status',
      label: 'Stock Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
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
        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
          {value ? (
            <img src={value} alt="Item" className="w-full h-full object-cover rounded" />
          ) : (
            <FaImage className="text-gray-400 text-sm" />
          )}
        </div>
      )
    }
  ];

  const actions = [
    {
      label: <FaEdit size={14} />,
      onClick: (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: <FaTrash size={14} />,
      onClick: (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.itemName}"?`)) {
          deleteItem(item.id);
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700'
    }
  ];

  const handleSaveEdit = () => {
    if (editingItem) {
      let updatedItem = {
        ...editingItem,
        status: editingItem.stockCount <= editingItem.threshold ? 'LOW' : 'OK'
      };
      
      // Handle image update
      if (editImageFile) {
        const imageUrl = URL.createObjectURL(editImageFile);
        updatedItem.itemMedia = imageUrl;
      }
      
      updateItem(editingItem.id, updatedItem);
      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditImageFile(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEditImageFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-gray-600">Manage inventory items and stock levels</p>
        </div>
        <Button 
          onClick={() => navigate('/masters/item-master/add')}
          className="flex items-center gap-2"
        >
          <FaPlus />
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      <DataTable
        columns={columns}
        data={items}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Item"
        size="md"
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <Input
                value={editingItem.itemName}
                onChange={(value) => setEditingItem(prev => ({
                  ...prev,
                  itemName: value
                }))}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold
                </label>
                <Input
                  type="number"
                  value={editingItem.threshold}
                  onChange={(value) => setEditingItem(prev => ({
                    ...prev,
                    threshold: parseInt(value) || 0
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock Count
              </label>
              <Input
                type="number"
                value={editingItem.stockCount}
                onChange={(value) => setEditingItem(prev => ({
                  ...prev,
                  stockCount: parseInt(value) || 0
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editingItem.itemMedia && (
                <div className="mt-2">
                  <img src={editingItem.itemMedia} alt="Current" className="w-16 h-16 object-cover rounded" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ItemMaster;