import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';

import { groupAPI } from '../../services/api';
import useStore from '../../store';

const CategoryMaster = () => {
  const [categories, setCategories] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { setLoading, showToast } = useStore();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await groupAPI.getAll();
      // Handle response.data.data.data structure
      setCategories(response.data?.data?.data || []);
    } catch (error) {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: '_id', label: 'Category ID' },
    { key: 'name', label: 'Category Name' },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, category) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingCategory(category);
              setNewCategoryName(category.name);
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={async () => {
              if (window.confirm(`Delete category "${category.name}"?`)) {
                setLoading(true);
                try {
                  await groupAPI.delete(category._id);
                  showToast('Category deleted successfully', 'success');
                  loadCategories();
                } catch (error) {
                  showToast('Failed to delete category', 'error');
                } finally {
                  setLoading(false);
                }
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
        </div>
      )
    }
  ];

  const handleAddCategory = async () => {
    setLoading(true);
    try {
      await groupAPI.create({ name: newCategoryName });
      showToast('Category added successfully', 'success');
      setNewCategoryName('');
      setIsAddModalOpen(false);
      loadCategories();
    } catch (error) {
      showToast('Failed to add category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    setLoading(true);
    try {
      await groupAPI.update(editingCategory._id, { name: newCategoryName });
      showToast('Category updated successfully', 'success');
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setNewCategoryName('');
      loadCategories();
    } catch (error) {
      showToast('Failed to update category', 'error');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Master</h1>
          <p className="text-gray-600">Manage item categories</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
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
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Category" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <Input
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="Enter category name"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddCategory} disabled={!newCategoryName}>Add Category</Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Category" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <Input
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="Enter category name"
            />
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
        onConfirm={() => {
          const newCategories = categories.filter(c => c.id !== deleteDialog.category.id);
          setCategories(newCategories);
          localStorage.setItem('categories', JSON.stringify(newCategories));
          setDeleteDialog({ isOpen: false, category: null });
          showToast('Category deleted successfully', 'success');
        }}
        itemName={deleteDialog.category?.name}
      />
    </div>
  );
};

export default CategoryMaster;
