import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import { brandAPI, itemAPI } from '../../services/api';

const BrandMaster = () => {
  const { showToast } = useStore();
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, brand: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
          const [brandRes, itemRes] = await Promise.all([
              brandAPI.getAll(),
              itemAPI.getAll()
          ]);
          
          // Helper to extract data array from potentially paginated response
          const extractData = (res) => {
              const payload = res?.data?.data; // ApiResponse returns { data: ... }
              if (Array.isArray(payload)) return payload;
              if (payload?.docs && Array.isArray(payload.docs)) return payload.docs; // Mongoose pagination
              if (payload?.data && Array.isArray(payload.data)) return payload.data; // Other pagination
              return [];
          };

          const brandList = extractData(brandRes);
          const itemList = extractData(itemRes);

          setItems(itemList.map(i => ({ 
              id: i._id, 
              itemName: i.item_name,
              amount: i.amount,
              type: i.is_gst // 1 = GST, 0 = Non-GST
          })));

          setBrands(brandList.map(b => ({
              id: b._id,
              name: b.name,
              // Items might be populated or just IDs. check backend response likely ObjectId.
              // If populated, use it. If IDs, find in itemList.
              items: b.item_ids?.map(itemId => {
                  const item = itemList.find(i => i._id === itemId || i._id === itemId._id);
                  return item ? { id: item._id, itemName: item.item_name } : null;
              }).filter(Boolean) || []
          })));

      } catch (error) {
          console.error("Failed to fetch data", error);
          showToast('Failed to load data', 'error');
      }
  };

  const columns = [
    { key: 'id', label: 'Brand ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
    { key: 'name', label: 'Brand Name' },
    { 
      key: 'items', 
      label: 'Items Count',
      render: (value) => <span className="text-sm">{value?.length || 0} items</span>
    }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (brand) => {
        setEditingBrand(brand);
        setNewBrandName(brand.name);
        setSelectedItems(brand.items || []);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (brand) => {
        setDeleteDialog({ isOpen: true, brand });
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleAddBrand = async () => {
    try {
        await brandAPI.create({ 
            brand_name: newBrandName, 
            items: selectedItems.map(i => i.id) 
        });
        showToast('Brand added successfully', 'success');
        setNewBrandName('');
        setSelectedItems([]);
        setIsAddModalOpen(false);
        fetchData();
    } catch (error) {
        showToast('Failed to add brand', 'error');
    }
  };

  const handleEditBrand = async () => {
    try {
        await brandAPI.update(editingBrand.id, { 
            brand_name: newBrandName, 
            items: selectedItems.map(i => i.id) 
        });
        showToast('Brand updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingBrand(null);
        setNewBrandName('');
        setSelectedItems([]);
        fetchData();
    } catch (error) {
        showToast('Failed to update brand', 'error');
    }
  };

  const handleDeleteBrand = async () => {
      try {
          await brandAPI.delete(deleteDialog.brand.id);
          showToast('Brand deleted successfully', 'success');
          setDeleteDialog({ isOpen: false, brand: null });
          fetchData();
      } catch (error) {
          showToast('Failed to delete brand', 'error');
      }
  };

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const removeItemFromBrand = (itemId) => {
    setSelectedItems(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Master</h1>
          <p className="text-gray-600">Manage item brands and groupings</p>
        </div>
        <Button onClick={() => {
          setNewBrandName('');
          setSelectedItems([]);
          setIsAddModalOpen(true);
        }} className="flex items-center gap-2">
          <FaPlus />
          Add Brand
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={brands}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Brand" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <Input
              value={newBrandName}
              onChange={setNewBrandName}
              placeholder="Enter brand name"
            />
          </div>

          {/* Selected Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items in Brand ({selectedItems.length})</label>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No items selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{item.itemName}</span>
                      <button
                        onClick={() => removeItemFromBrand(item.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Items</label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">No items available</p>
              ) : (
                <div className="divide-y">
                  {items.map(item => {
                    const isSelected = selectedItems.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="p-3 hover:bg-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleItemToggle(item)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{item.itemName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">₹{item.amount}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  item.type === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.type === 1 ? 'GST' : 'Non-GST'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddBrand} disabled={!newBrandName}>Add Brand</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Brand" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <Input
              value={newBrandName}
              onChange={setNewBrandName}
              placeholder="Enter brand name"
            />
          </div>

          {/* Selected Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items in Brand ({selectedItems.length})</label>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No items selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{item.itemName}</span>
                      <button
                        onClick={() => removeItemFromBrand(item.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Items</label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">No items available</p>
              ) : (
                <div className="divide-y">
                  {items.map(item => {
                    const isSelected = selectedItems.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className="p-3 hover:bg-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleItemToggle(item)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{item.itemName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">₹{item.amount}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  item.type === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.type === 1 ? 'GST' : 'Non-GST'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleEditBrand} disabled={!newBrandName}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, brand: null })}
        onConfirm={() => {
          setBrands(brands.filter(b => b.id !== deleteDialog.brand.id));
          setDeleteDialog({ isOpen: false, brand: null });
          showToast('Brand deleted successfully', 'success');
        }}
        itemName={deleteDialog.brand?.name}
      />
    </div>
  );
};

export default BrandMaster;