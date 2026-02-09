import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Input } from '../../components/ui';

const CategoryMaster = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Engine Parts' },
    { id: 2, name: 'Brake System' },
    { id: 3, name: 'Filters' }
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const columns = [
    { key: 'id', label: 'Category ID' },
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
            onClick={() => {
              if (window.confirm(`Delete category "${category.name}"?`)) {
                setCategories(prev => prev.filter(c => c.id !== category.id));
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

  const handleAddCategory = () => {
    setCategories(prev => [...prev, { id: Date.now(), name: newCategoryName }]);
    setNewCategoryName('');
    setIsAddModalOpen(false);
  };

  const handleEditCategory = () => {
    setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: newCategoryName } : c));
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setNewCategoryName('');
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
    </div>
  );
};

export default CategoryMaster;
