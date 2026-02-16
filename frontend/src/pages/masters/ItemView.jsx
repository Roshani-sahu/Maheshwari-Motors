import React, { useState, useEffect } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import useStore from '../../store';
import { itemAPI, categoryAPI } from '../../services/api';

const ItemView = () => {
  const { items, setItems } = useStore();
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Categories
            const catRes = await categoryAPI.getAll();
            const catList = catRes.data?.data;
            const finalCats = Array.isArray(catList) ? catList : (catList?.data || []);
            setCategories(finalCats.map(c => ({ id: c._id, name: c.name })));

            // Fetch Items
            const itemRes = await itemAPI.getAll();
            const val = itemRes.data?.data;
            const rawList = Array.isArray(val) ? val : (val?.data || []);
            const backendItems = rawList.map(item => ({
                id: item._id,
                itemName: item.item_name,
                amount: item.amount,
                categoryId: item.category_ids?.[0], // ObjectId
                itemMedia: item.image,
            }));
            setItems(backendItems);
        } catch(e) { console.error(e); }
    };
    fetchData();
  }, [setItems]);

  const columns = [
    { key: 'id', label: 'ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
    { key: 'itemName', label: 'Item Name' },
    {
      key: 'categoryId',
      label: 'Category',
      render: (value) => {
        const cat = categories.find(c => c.id === value);
        return <span className="text-xs sm:text-sm">{cat ? cat.name : 'N/A'}</span>;
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${Number(value || 0).toFixed(2)}`
    },
    {
      key: 'itemMedia',
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

  const filteredItems = items.filter(item => {
    if (categoryFilter !== 'all' && String(item.categoryId) !== String(categoryFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item View</h1>
          <p className="text-gray-600">View all inventory items</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
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
