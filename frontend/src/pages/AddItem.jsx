import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';
import { Button, Input } from '../components/ui';
import useStore from '../store';
import { itemAPI, categoryAPI, brandAPI, supplierAPI } from '../services/api';

const AddItem = () => {
  const navigate = useNavigate();
  const { showToast } = useStore();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    category: '',
    brand: '',
    supplier: '',
    gst_percent: '',
    sale_rate: '',
    purchase_rate: '',
    mrp_rate: '',
    discount: '',
    image: null,
    threshold: '',
    is_gst: 1
  });

  const [errors, setErrors] = useState({});

  const [allBrands, setAllBrands] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [catRes, brandRes, supplierRes] = await Promise.all([
                categoryAPI.getAll(),
                brandAPI.getAll(),
                supplierAPI.getAll()
            ]);
            
            const getList = (res) => {
                const val = res.data?.data;
                return Array.isArray(val) ? val : (val?.data || []);
            };

            const cats = getList(catRes);
            const brds = getList(brandRes);
            const sups = getList(supplierRes);
            
            setCategories(cats);
            setAllBrands(brds); // Store all brands
            setBrands(brds); // Initially show all brands or empty? User said "after i select cat brand ... will show", likely means filter.
                             // But usually better to show all if no category selected, or none. 
                             // Let's default to showing none or all? 
                             // If I look at the requested flow: "after i select cat brand of the cat will show there"
                             // I'll show all initially, and filter if a category is picked.
            setSuppliers(sups);
        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast("Failed to load form data", "error");
        }
    };
    fetchData();
  }, [showToast]);

  // Filter brands when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCat = categories.find(c => c._id === formData.category);
      if (selectedCat && selectedCat.brand_ids && selectedCat.brand_ids.length > 0) {
        // If query/population returns objects in brand_ids, map to IDs. If strings, use directly.
        // Safely handle both
        const linkedBrandIds = selectedCat.brand_ids.map(b => (typeof b === 'object' ? b._id : b));
        const filtered = allBrands.filter(b => linkedBrandIds.includes(b._id));
        setBrands(filtered.length > 0 ? filtered : allBrands); // Fallback to all if filter result is empty (optional decision) or strict?
        // Let's be strict but safe: if category determines brands, show only those.
        // However, if the category has NO brands linked, maybe it applies to all?
        // User said: "brand of the cat will show there".
        if (filtered.length > 0) {
            setBrands(filtered);
        } else {
             // If no brands linked to this category, maybe show all or none? 
             // Let's show all for now to avoid blocking the user if data is missing links.
             setBrands(allBrands); 
        }
      } else {
        // No brand links found, show all
        setBrands(allBrands);
      }
    } else {
      setBrands(allBrands);
    }
  }, [formData.category, categories, allBrands]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.sale_rate || parseFloat(formData.sale_rate) <= 0) newErrors.sale_rate = 'Valid sale rate is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
        if (formData.image) {
            const payload = new FormData();
            payload.append('item_name', formData.name);
            payload.append('sale_rate', formData.sale_rate);
            payload.append('stock', formData.stock);
            payload.append('is_gst', formData.is_gst);
            
            if (formData.purchase_rate) payload.append('purchase_rate', formData.purchase_rate);
            if (formData.mrp_rate) payload.append('mrp_rate', formData.mrp_rate);
            if (formData.gst_percent) payload.append('gst_percent', formData.gst_percent);
            if (formData.discount) payload.append('discount', formData.discount);
            if (formData.threshold) payload.append('threshold', formData.threshold);
            
            if (formData.category) payload.append('category_id', formData.category);
            if (formData.brand) payload.append('brand_id', formData.brand);
            if (formData.supplier) payload.append('supplier_id', formData.supplier);
            
            payload.append('image', formData.image);
            
            await itemAPI.create(payload);
        } else {
            const payload = {
                item_name: formData.name,
                sale_rate: parseFloat(formData.sale_rate),
                stock: parseInt(formData.stock),
                is_gst: formData.is_gst,
                
                purchase_rate: parseFloat(formData.purchase_rate) || 0,
                mrp_rate: parseFloat(formData.mrp_rate) || 0,
                gst_percent: parseFloat(formData.gst_percent) || 0,
                discount: parseFloat(formData.discount) || 0,
                threshold: parseInt(formData.threshold) || 0,
                
                category_id: formData.category || undefined,
                brand_id: formData.brand || undefined,
                supplier_id: formData.supplier || undefined
            };
            await itemAPI.create(payload);
        }

        showToast('Item added successfully', 'success');
        navigate('/inventory/item-master');
    } catch (error) {
        console.error("Add item failed", error);
        const msg = error.response?.data?.message || 'Failed to add item';
        // Detailed validation error handling
        const details = error.response?.data?.errors 
            ? (Array.isArray(error.response.data.errors) ? error.response.data.errors.join(', ') : JSON.stringify(error.response.data.errors))
            : '';
        showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Item</h1>
          <p className="text-gray-600">Create a new inventory item</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={(value) => handleChange('name', value)}
                placeholder="Enter item name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <Input
                name="stock"
                type="number"
                value={formData.stock}
                onChange={(value) => handleChange('stock', value)}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.stock}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={formData.brand || ''}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier || ''}
                onChange={(e) => handleChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* GST % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST %
              </label>
              <Input
                name="gst_percent"
                type="number"
                step="0.01"
                value={formData.gst_percent}
                onChange={(value) => handleChange('gst_percent', value)}
                placeholder="0"
              />
            </div>

            {/* Sale Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Rate (₹) *
              </label>
              <Input
                name="sale_rate"
                type="number"
                step="0.01"
                value={formData.sale_rate}
                onChange={(value) => handleChange('sale_rate', value)}
                placeholder="0.00"
              />
              {errors.sale_rate && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.sale_rate}
                </p>
              )}
            </div>

            {/* Purchase Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Rate (₹)
              </label>
              <Input
                name="purchase_rate"
                type="number"
                step="0.01"
                value={formData.purchase_rate}
                onChange={(value) => handleChange('purchase_rate', value)}
                placeholder="0.00"
              />
            </div>

            {/* MRP Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MRP Rate (₹)
              </label>
              <Input
                name="mrp_rate"
                type="number"
                step="0.01"
                value={formData.mrp_rate}
                onChange={(value) => handleChange('mrp_rate', value)}
                placeholder="0.00"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (₹)
              </label>
              <Input
                name="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(value) => handleChange('discount', value)}
                placeholder="0.00"
              />
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threshold
              </label>
              <Input
                name="threshold"
                type="number"
                value={formData.threshold}
                onChange={(value) => handleChange('threshold', value)}
                placeholder="Minimum stock level"
              />
            </div>

            {/* Toggle Switch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                GST Type *
              </label>

              <div
                onClick={() =>
                  handleChange('is_gst', formData.is_gst === 0 ? 1 : 0)
                }
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  formData.is_gst === 0
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                    formData.is_gst === 0
                      ? 'translate-x-7'
                      : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex items-center gap-2">
              <FaSave />
              Save Item
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory/item-master')}
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddItem;
