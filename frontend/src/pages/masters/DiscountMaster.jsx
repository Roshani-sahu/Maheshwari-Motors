import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import { Button } from '../../components/ui';
import useStore from '../../store';
import { categoryAPI } from '../../services/api';

const DiscountMaster = () => {
  const { showToast } = useStore();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState(() => {
    const saved = localStorage.getItem('brands');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discounts, setDiscounts] = useState(() => {
    const saved = localStorage.getItem('discounts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const val = response.data?.data;
      const list = Array.isArray(val) ? val : (val?.data || []);
      
      // Get category-brand relationships from localStorage
      const savedCategories = localStorage.getItem('categories');
      const localCategories = savedCategories ? JSON.parse(savedCategories) : [];
      
      const categoriesWithBrands = list.map(c => {
        const localCategory = localCategories.find(lc => lc.name === c.name);
        return {
          id: c._id,
          name: c.name,
          brands: localCategory?.brands || []
        };
      });
      
      setCategories(categoriesWithBrands);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  // Save discounts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('discounts', JSON.stringify(discounts));
  }, [discounts]);

  const getSelectedCategoryBrands = () => {
    if (!selectedCategory) return [];
    const category = categories.find(c => c.id === selectedCategory.id);
    return category?.brands || [];
  };

  const updateDiscount = (brandId, discountType, field, value) => {
    setDiscounts(prev => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [discountType]: {
          ...prev[brandId]?.[discountType],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const getDiscount = (brandId, discountType, field) => {
    return discounts[brandId]?.[discountType]?.[field] || 0;
  };

  const handleSave = () => {
    showToast('Discounts saved successfully', 'success');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Categories Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rate Type</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                selectedCategory?.id === category.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <FaSave size={14} />
              Save
            </Button>
            <div className="text-sm text-gray-600">
              Rate Type: <span className="font-medium">{selectedCategory?.name || 'Select Category'}</span>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedCategory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Select a category to view brands</p>
                <p className="text-sm">Choose a category from the left sidebar to manage discounts</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      ItemGroup
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      <div>Discount I</div>
                      <div className="flex mt-1">
                        <div className="flex-1 text-center border-r border-gray-300">Normal</div>
                        <div className="flex-1 text-center">Special</div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>Discount II</div>
                      <div className="flex mt-1">
                        <div className="flex-1 text-center border-r border-gray-300">Normal</div>
                        <div className="flex-1 text-center">Special</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSelectedCategoryBrands().length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No brands found in this category
                      </td>
                    </tr>
                  ) : (
                    getSelectedCategoryBrands().map((brand, index) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                          {brand.id}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                          {brand.name}
                        </td>
                        <td className="px-2 py-3 border-r border-gray-200">
                          <div className="flex">
                            <div className="flex-1 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={getDiscount(brand.id, 'discount1', 'normal')}
                                onChange={(e) => updateDiscount(brand.id, 'discount1', 'normal', e.target.value)}
                                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex-1 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={getDiscount(brand.id, 'discount1', 'special')}
                                onChange={(e) => updateDiscount(brand.id, 'discount1', 'special', e.target.value)}
                                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex">
                            <div className="flex-1 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={getDiscount(brand.id, 'discount2', 'normal')}
                                onChange={(e) => updateDiscount(brand.id, 'discount2', 'normal', e.target.value)}
                                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex-1 px-2">
                              <input
                                type="number"
                                step="0.01"
                                value={getDiscount(brand.id, 'discount2', 'special')}
                                onChange={(e) => updateDiscount(brand.id, 'discount2', 'special', e.target.value)}
                                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountMaster;