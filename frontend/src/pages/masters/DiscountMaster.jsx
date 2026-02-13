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
      
      // Add dummy data if no categories or brands found
      if (categoriesWithBrands.length === 0 || categoriesWithBrands.every(c => c.brands.length === 0)) {
        const dummyCategories = [
          {
            id: 'cat1',
            name: 'Engine Parts',
            brands: [
              { id: 'brand1', name: 'Castrol' },
              { id: 'brand2', name: 'Mobil' },
              { id: 'brand3', name: 'Shell' }
            ]
          },
          {
            id: 'cat2',
            name: 'Brake System',
            brands: [
              { id: 'brand4', name: 'Bosch' },
              { id: 'brand5', name: 'Brembo' },
              { id: 'brand6', name: 'ATE' }
            ]
          },
          {
            id: 'cat3',
            name: 'Filters',
            brands: [
              { id: 'brand7', name: 'Mann Filter' },
              { id: 'brand8', name: 'Mahle' },
              { id: 'brand9', name: 'K&N' }
            ]
          }
        ];
        setCategories(dummyCategories);
      } else {
        setCategories(categoriesWithBrands);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
      // Fallback to dummy data on error
      const dummyCategories = [
        {
          id: 'cat1',
          name: 'Engine Parts',
          brands: [
            { id: 'brand1', name: 'Castrol' },
            { id: 'brand2', name: 'Mobil' },
            { id: 'brand3', name: 'Shell' }
          ]
        },
        {
          id: 'cat2',
          name: 'Brake System',
          brands: [
            { id: 'brand4', name: 'Bosch' },
            { id: 'brand5', name: 'Brembo' },
            { id: 'brand6', name: 'ATE' }
          ]
        },
        {
          id: 'cat3',
          name: 'Filters',
          brands: [
            { id: 'brand7', name: 'Mann Filter' },
            { id: 'brand8', name: 'Mahle' },
            { id: 'brand9', name: 'K&N' }
          ]
        }
      ];
      setCategories(dummyCategories);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Discount Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage discount rates by category and brand</p>
        </div>
        <Button 
          onClick={handleSave} 
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <FaSave className="text-sm sm:text-base" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Categories Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Rate Categories</h3>
              <p className="text-xs text-gray-500 mt-1">Select category to manage</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No categories available
                </div>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                      selectedCategory?.id === category.id 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-900' 
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.brands?.length || 0} brands
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Discount Table Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                    {selectedCategory ? `${selectedCategory.name} - Brand Discounts` : 'Brand Discounts'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCategory ? 'Set discount rates for brands in this category' : 'Select a category to view brands'}
                  </p>
                </div>
                {selectedCategory && (
                  <div className="text-xs text-gray-500">
                    {getSelectedCategoryBrands().length} brands
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              {!selectedCategory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaSave className="text-gray-400 text-xl" />
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-2">No Category Selected</p>
                    <p className="text-sm text-gray-500">Choose a category from the left panel to manage discount rates</p>
                  </div>
                </div>
              ) : getSelectedCategoryBrands().length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-gray-500">
                    <p className="text-base font-medium text-gray-900 mb-2">No Brands Found</p>
                    <p className="text-sm text-gray-500">This category doesn't have any brands assigned</p>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Brand ID
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Brand Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        <div className="mb-1">Discount I (%)</div>
                        <div className="flex">
                          <div className="flex-1 text-center border-r border-gray-300 pr-2">Normal</div>
                          <div className="flex-1 text-center pl-2">Special</div>
                        </div>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="mb-1">Discount II (%)</div>
                        <div className="flex">
                          <div className="flex-1 text-center border-r border-gray-300 pr-2">Normal</div>
                          <div className="flex-1 text-center pl-2">Special</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getSelectedCategoryBrands().map((brand, index) => (
                      <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 border-r border-gray-200">
                          <span className="font-mono">{String(brand.id).slice(-6)}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200">
                          {brand.name}
                        </td>
                        <td className="px-2 py-3 border-r border-gray-200">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={getDiscount(brand.id, 'discount1', 'normal')}
                                onChange={(e) => updateDiscount(brand.id, 'discount1', 'normal', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={getDiscount(brand.id, 'discount1', 'special')}
                                onChange={(e) => updateDiscount(brand.id, 'discount1', 'special', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={getDiscount(brand.id, 'discount2', 'normal')}
                                onChange={(e) => updateDiscount(brand.id, 'discount2', 'normal', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={getDiscount(brand.id, 'discount2', 'special')}
                                onChange={(e) => updateDiscount(brand.id, 'discount2', 'special', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default DiscountMaster;