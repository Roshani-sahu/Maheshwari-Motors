import React, { useState, useEffect } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import { DataTable } from '../../components/common';
import { itemAPI, groupAPI } from '../../services/api';
import useStore from '../../store';

const ItemView = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const { setLoading, showToast } = useStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        itemAPI.getAll(),
        groupAPI.getAll()
      ]);
      setItems(itemsRes.data?.data?.data || []);
      setCategories(categoriesRes.data?.data?.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: '_id', label: 'ID' },
    { key: 'item_name', label: 'Item Name' },
    {
      key: 'category_ids', // Backend uses 'category_ids' array which might be populated
      label: 'Category',
      render: (value) => {
        // If value is array and has elements
        if (Array.isArray(value) && value.length > 0) {
             const cat = value[0];
             return cat.name || categories.find(c => c._id === cat)?.name || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      key: 'amount', 
      label: 'Amount',
      render: (value) => `₹${Number(value).toFixed(2)}`
    },
    {
      key: 'image',
      label: 'Image',
      render: (value) => (
        <div 
          className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => value && setSelectedImage(value)}
        >
          {value ? (
            <img src={value} alt="Item" className="w-full h-full object-cover rounded" />
          ) : (
            <FaImage className="text-gray-400 text-sm" />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item View</h1>
          <p className="text-gray-600">View all inventory items</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchable={true}
        sortable={true}
        pagination={true}
      />

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
    </div>
  );
};

export default ItemView;
