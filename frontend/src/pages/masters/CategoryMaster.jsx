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
    { key: 'name', label: 'Category Name' }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (category) => {
        if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
          setCategories(prev => prev.filter(c => c.id !== category.id));
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
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
    </div>
  );
};

export default CategoryMaster;
