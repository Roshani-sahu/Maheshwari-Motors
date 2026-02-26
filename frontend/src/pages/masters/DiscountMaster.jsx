import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus } from 'react-icons/fa';
import { Button, Modal } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const DiscountMaster = () => {
  const { showToast } = useStore();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [brands, setBrands] = useState([]);
  const [discounts, setDiscounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [labels, setLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [isAddLabelModalOpen, setIsAddLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const listFromResponse = (res) => {
    const payload = res?.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchCategories = async () => {
      try {
        const catRes = await api.get('/categories', { params: { page: 1, limit: 200 }, signal: controller.signal });
        const catList = listFromResponse(catRes).map((c) => ({ id: c._id, name: c.category_name || c.name || '' }));
        setCategories(catList);
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          showToast('Failed to load categories', 'error');
        }
      }
    };

    fetchCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCategory?.id) {
      setLabels([]);
      setSelectedLabel(null);
      setBrands([]);
      setDiscounts({});
      return;
    }

    const controller = new AbortController();
    const fetchLabels = async () => {
      try {
        const res = await api.get('/labels', { signal: controller.signal });
        const list = listFromResponse(res).map((l) => ({ id: l._id, name: l.name || '' }));
        setLabels(list);
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          showToast('Failed to load labels', 'error');
        }
      }
    };

    fetchLabels();
    return () => controller.abort();
  }, [selectedCategory?.id]);

  useEffect(() => {
    if (!selectedCategory?.id || !selectedLabel?.id) {
      setBrands([]);
      setDiscounts({});
      return;
    }

    const controller = new AbortController();
    const fetchCategoryDiscounts = async () => {
      try {
        const res = await api.get(`/brands/category/${selectedCategory.id}/discounts`, { signal: controller.signal });
        const list = listFromResponse(res).map((b) => ({
          id: b._id,
          name: b.brand_name || b.name || '',
          discount1: b.discount1 || { normal: 0, special: 0 },
          discount2: b.discount2 || { normal: 0, special: 0 }
        }));
        setBrands(list);

        const discountMap = {};
        list.forEach((b) => {
          discountMap[b.id] = {
            discount1: b.discount1,
            discount2: b.discount2
          };
        });
        setDiscounts(discountMap);
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          showToast('Failed to load brand discounts', 'error');
        }
      }
    };

    fetchCategoryDiscounts();
    return () => controller.abort();
  }, [selectedCategory?.id, selectedLabel?.id, showToast]);

  const updateDiscount = (brandId, discountType, field, value) => {
    setDiscounts((prev) => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [discountType]: {
          ...prev[brandId]?.[discountType],
          [field]: Number(value) || 0
        }
      }
    }));
  };

  const getDiscount = (brandId, discountType, field) => {
    return discounts[brandId]?.[discountType]?.[field] || 0;
  };

  const handleSave = async () => {
    if (saving || Object.keys(discounts).length === 0) return;

    const allValues = Object.values(discounts).flatMap((d) => [
      Number(d?.discount1?.normal || 0),
      Number(d?.discount1?.special || 0),
      Number(d?.discount2?.normal || 0),
      Number(d?.discount2?.special || 0)
    ]);

    if (allValues.some((n) => Number.isNaN(n) || n < 0 || n > 100)) {
      showToast('Discount values must be between 0 and 100', 'error');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        Object.keys(discounts).map((brandId) => api.patch(`/brands/${brandId}/discount`, {
          discount1: discounts[brandId].discount1,
          discount2: discounts[brandId].discount2
        }))
      );
      showToast('Discounts saved successfully', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save discounts', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Discount Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage discount rates by category and brand</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2 text-xs sm:text-sm" disabled={saving || !selectedCategory || !selectedLabel}><FaSave className="text-sm sm:text-base" />Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Rate Categories</h3>
              <p className="text-xs text-gray-500 mt-1">Select category to manage</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {categories.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">No categories available</div> : categories.map((category) => (
                <div key={category.id} onClick={() => setSelectedCategory(category)} className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedCategory?.id === category.id ? 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-900' : 'text-gray-700'}`}>
                  <div className="text-sm font-medium">{category.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Labels</h3>
                <p className="text-xs text-gray-500 mt-1">Select label to manage</p>
              </div>
              <button onClick={() => setIsAddLabelModalOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                <FaPlus className="text-blue-600 text-sm" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!selectedCategory ? <div className="p-4 text-center text-gray-500 text-sm">Select a category first</div> : labels.length === 0 ? <div className="p-4 text-center text-gray-500 text-sm">No labels available</div> : labels.map((label) => (
                <div key={label.id} onClick={() => setSelectedLabel(label)} className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-green-50 transition-colors ${selectedLabel?.id === label.id ? 'bg-green-50 border-l-4 border-l-green-500 text-green-900' : 'text-gray-700'}`}>
                  <div className="text-sm font-medium">{label.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">{selectedCategory ? `${selectedCategory.name} - Brand Discounts` : 'Brand Discounts'}</h3>
            </div>

            <div className="overflow-x-auto">
              {!selectedCategory ? (
                <div className="flex items-center justify-center py-12"><p className="text-sm text-gray-500">Select a category first</p></div>
              ) : !selectedLabel ? (
                <div className="flex items-center justify-center py-12"><p className="text-sm text-gray-500">Select a label to manage discount rates</p></div>
              ) : brands.length === 0 ? (
                <div className="flex items-center justify-center py-12"><p className="text-sm text-gray-500">No brands available in this category</p></div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Brand</th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        <div className="mb-2">GST Discount</div>
                        <div className="flex gap-2 text-[10px] normal-case font-normal">
                          <div className="w-full">Normal</div>
                          <div className="w-full">Special</div>
                        </div>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="mb-2">Non-GST Discount</div>
                        <div className="flex gap-2 text-[10px] normal-case font-normal">
                          <div className="w-full">Normal</div>
                          <div className="w-full">Special</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200">{brand.name}</td>
                        <td className="px-2 py-3 border-r border-gray-200">
                          <div className="flex gap-2">
                            <input type="number" step="0.01" min="0" max="100" value={getDiscount(brand.id, 'discount1', 'normal')} onChange={(e) => updateDiscount(brand.id, 'discount1', 'normal', e.target.value)} className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md" />
                            <input type="number" step="0.01" min="0" max="100" value={getDiscount(brand.id, 'discount1', 'special')} onChange={(e) => updateDiscount(brand.id, 'discount1', 'special', e.target.value)} className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md" />
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex gap-2">
                            <input type="number" step="0.01" min="0" max="100" value={getDiscount(brand.id, 'discount2', 'normal')} onChange={(e) => updateDiscount(brand.id, 'discount2', 'normal', e.target.value)} className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md" />
                            <input type="number" step="0.01" min="0" max="100" value={getDiscount(brand.id, 'discount2', 'special')} onChange={(e) => updateDiscount(brand.id, 'discount2', 'special', e.target.value)} className="w-full px-2 py-1.5 text-xs text-center border border-gray-300 rounded-md" />
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

      <Modal isOpen={isAddLabelModalOpen} onClose={() => { setIsAddLabelModalOpen(false); setNewLabelName(''); }} title="Add New Label" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label Name</label>
            <input type="text" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter label name" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setIsAddLabelModalOpen(false); setNewLabelName(''); }}>Cancel</Button>
            <Button onClick={async () => {
              if (!newLabelName.trim()) {
                showToast('Label name is required', 'error');
                return;
              }
              try {
                await api.post('/labels', { name: newLabelName });
                showToast('Label added successfully', 'success');
                const res = await api.get('/labels');
                const list = listFromResponse(res).map((l) => ({ id: l._id, name: l.name || '' }));
                setLabels(list);
                setIsAddLabelModalOpen(false);
                setNewLabelName('');
              } catch (error) {
                showToast(error?.response?.data?.message || 'Failed to add label', 'error');
              }
            }}>Add Label</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DiscountMaster;
