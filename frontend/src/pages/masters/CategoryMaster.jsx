import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import { categoryAPI } from '../../services/api';

const CategoryMaster = () => {
  const { showToast } = useStore();
  const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, category: null });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const val = response.data?.data;
      const list = Array.isArray(val) ? val : (val?.data || []);
      setCategories(list.map(c => ({ id: c._id, name: c.name })));
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const columns = [
    { key: 'id', label: 'Category ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
    { key: 'name', label: 'Category Name' }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setSelectedBrands(category.brands || []);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (category) => {
        setDeleteDialog({ isOpen: true, category });
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleAddCategory = async () => {
    try {
        await categoryAPI.create({ name: newCategoryName });
        showToast('Category added successfully', 'success');
        setNewCategoryName('');
        setIsAddModalOpen(false);
        fetchCategories();
    } catch (error) {
        showToast('Failed to add category', 'error');
    }
  };

  const handleEditCategory = async () => {
    try {
        await categoryAPI.update(editingCategory.id, { name: newCategoryName });
        showToast('Category updated successfully', 'success');
        setIsEditModalOpen(false);
        setEditingCategory(null);
        setNewCategoryName('');
        fetchCategories();
    } catch (error) {
        showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async () => {
      try {
          await categoryAPI.delete(deleteDialog.category.id);
          showToast('Category deleted successfully', 'success');
          setDeleteDialog({ isOpen: false, category: null });
          fetchCategories();
      } catch (error) {
          showToast('Failed to delete category', 'error');
      }
  };

  const handleBrandToggle = (brand) => {
    setSelectedBrands(prev => {
      const exists = prev.find(b => b.id === brand.id);
      if (exists) {
        return prev.filter(b => b.id !== brand.id);
      } else {
        return [...prev, brand];
      }
    });
  };

  const removeBrandFromCategory = (brandId) => {
    setSelectedBrands(prev => prev.filter(b => b.id !== brandId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Master</h1>
          <p className="text-gray-600">Manage item categories</p>
        </div>
        <Button onClick={() => {
          setNewCategoryName('');
          setSelectedBrands([]);
          setIsAddModalOpen(true);
        }} className="flex items-center gap-2">
          <FaPlus />
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Category" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <Input
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="Enter category name"
            />
          </div>

          {/* Selected Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brands in Category ({selectedBrands.length})</label>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedBrands.length === 0 ? (
                <p className="text-gray-500 text-sm">No brands selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedBrands.map(brand => (
                    <div key={brand.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{brand.name}</span>
                      <button
                        onClick={() => removeBrandFromCategory(brand.id)}
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

          {/* Available Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Brands</label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {brands.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">No brands available</p>
              ) : (
                <div className="divide-y">
                  {brands.map(brand => {
                    const isSelected = selectedBrands.find(b => b.id === brand.id);
                    return (
                      <div key={brand.id} className="p-3 hover:bg-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleBrandToggle(brand)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{brand.name}</span>
                              <span className="text-sm text-gray-500">{brand.items?.length || 0} items</span>
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
            <Button onClick={handleAddCategory} disabled={!newCategoryName}>Add Category</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Category" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <Input
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="Enter category name"
            />
          </div>

          {/* Selected Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brands in Category ({selectedBrands.length})</label>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedBrands.length === 0 ? (
                <p className="text-gray-500 text-sm">No brands selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedBrands.map(brand => (
                    <div key={brand.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{brand.name}</span>
                      <button
                        onClick={() => removeBrandFromCategory(brand.id)}
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

          {/* Available Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Brands</label>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {brands.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">No brands available</p>
              ) : (
                <div className="divide-y">
                  {brands.map(brand => {
                    const isSelected = selectedBrands.find(b => b.id === brand.id);
                    return (
                      <div key={brand.id} className="p-3 hover:bg-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleBrandToggle(brand)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{brand.name}</span>
                              <span className="text-sm text-gray-500">{brand.items?.length || 0} items</span>
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
            <Button onClick={handleEditCategory} disabled={!newCategoryName}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, category: null })}
        onConfirm={handleDeleteCategory}
        itemName={deleteDialog.category?.name}
      />
    </div>
  );
};

export default CategoryMaster;
