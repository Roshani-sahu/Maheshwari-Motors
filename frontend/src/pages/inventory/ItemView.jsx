import React, { useState, useEffect } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import useStore from '../../store';
import api from '../../services/axiosInstance';// 

const ItemView = () => {
  const { items, setItems } = useStore();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Categories and Brands
            const [catRes, brandRes] = await Promise.all([
                api.get('/categories'),
                api.get('/brands')
            ]);
            
            const catList = catRes.data?.data;
            const finalCats = Array.isArray(catList) ? catList : (catList?.data || []);
            setCategories(finalCats.map(c => ({ id: c._id, name: c.category_name || c.name })));
            
            const brandList = brandRes.data?.data;
            const finalBrands = Array.isArray(brandList) ? brandList : (brandList?.data || []);
            setBrands(finalBrands.map(b => ({ id: b._id, name: b.brand_name || b.name })));

            // Fetch Items - Loop paging
            let allDocs = [];
            let page = 1;
            let hasMore = true;
            
            while(hasMore) {
                const response = await api.get('/items', { params: { page, limit: 100 } });
                const payload = response.data?.data;
                let pageData = [];
                
                if (Array.isArray(payload)) {
                    pageData = payload;
                    hasMore = false;
                } else {
                    pageData = payload?.data || [];
                    if (payload?.meta && payload.meta.hasNextPage) {
                        page++;
                    } else {
                        hasMore = false;
                    }
                }
                
                allDocs = [...allDocs, ...pageData];
                if (page > 100) break;
            }

            const backendItems = allDocs.map(item => ({
                id: item._id,
                itemName: item.item_name,
                amount: item.sale_rate || item.amount || 0,
                categoryId: item.category_id || item.category_ids?.[0],
                brandId: item.brand_id,
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
    if (brandFilter !== 'all' && String(item.brandId) !== String(brandFilter)) {
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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Brand:</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Brands</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
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
