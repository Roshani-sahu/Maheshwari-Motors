import React, { useState } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';

const ItemView = () => {
  const [items] = useState([
    {
      id: 1,
      itemName: 'Engine Oil 5W-30',
      amount: 450.00,
      threshold: 10,
      stockCount: 5,
      itemMedia: null,
      status: 'LOW',
      categoryId: 1
    },
    {
      id: 2,
      itemName: 'Brake Pads',
      amount: 1200.00,
      threshold: 8,
      stockCount: 3,
      itemMedia: null,
      status: 'LOW',
      categoryId: 2
    },
    {
      id: 3,
      itemName: 'Air Filter',
      amount: 350.00,
      threshold: 12,
      stockCount: 15,
      itemMedia: null,
      status: 'OK',
      categoryId: 3
    }
  ]);

  const categories = [
    { id: 1, name: 'Engine Parts' },
    { id: 2, name: 'Brake System' },
    { id: 3, name: 'Filters' }
  ];

  const [selectedImage, setSelectedImage] = useState(null);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'itemName', label: 'Item Name' },
    {
      key: 'categoryId',
      label: 'Category',
      render: (value) => {
        const cat = categories.find(c => c.id === value);
        return cat ? cat.name : 'N/A';
      }
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toFixed(2)}`
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
