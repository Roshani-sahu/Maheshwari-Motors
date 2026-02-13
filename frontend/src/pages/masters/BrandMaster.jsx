import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';

const BrandMaster = () => {
  const { items, showToast } = useStore();
  const [brands, setBrands] = useState(() => {
    const saved = localStorage.getItem('brands');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Castrol', items: [] },
      { id: 2, name: 'Bosch', items: [] },
      { id: 3, name: 'Mahle', items: [] }
    ];
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, brand: null });

  // Save to localStorage whenever brands change
  useEffect(() => {
    localStorage.setItem('brands', JSON.stringify(brands));
  }, [brands]);

  const columns = [
    { key: 'id', label: 'Brand ID' },
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

  const handleAddBrand = () => {
    const newBrand = { 
      id: Math.max(...brands.map(b => b.id), 0) + 1, 
      name: newBrandName, 
      items: selectedItems 
    };
    setBrands([...brands, newBrand]);
    setNewBrandName('');
    setSelectedItems([]);
    setIsAddModalOpen(false);
    showToast('Brand added successfully', 'success');
  };

  const handleEditBrand = () => {
    setBrands(brands.map(b => 
      b.id === editingBrand.id 
        ? { ...b, name: newBrandName, items: selectedItems } 
        : b
    ));
    setIsEditModalOpen(false);
    setEditingBrand(null);
    setNewBrandName('');
    setSelectedItems([]);
    showToast('Brand updated successfully', 'success');
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