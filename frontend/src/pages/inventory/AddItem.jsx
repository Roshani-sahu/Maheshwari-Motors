import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const AddItem = () => {
  const navigate = useNavigate();
  const { showToast } = useStore();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hsns, setHsns] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    category: '',
    brand: '',
    supplier: '',
    hsn_code: '',
    description: '',
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

  const listFromResponse = (res) => {
    const payload = res?.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const [catRes, brandRes, supplierRes, hsnRes] = await Promise.all([
          api.get('/categories', { params: { page: 1, limit: 200 }, signal: controller.signal }),
          api.get('/brands', { params: { page: 1, limit: 200 }, signal: controller.signal }),
          api.get('/contacts', { params: { page: 1, limit: 200, type: 'supplier' }, signal: controller.signal }),
          api.get('/hsn', { params: { page: 1, limit: 200 }, signal: controller.signal })
        ]);

        const cats = listFromResponse(catRes);
        const brds = listFromResponse(brandRes);
        const sups = listFromResponse(supplierRes);
        const hsnList = listFromResponse(hsnRes).filter((h) => h?.is_active !== false);

        setCategories(cats);
        setAllBrands(brds);
        setBrands(brds);
        setSuppliers(sups);
        setHsns(hsnList.map((h) => ({ _id: h._id, hsn_number: h.hsn_code, gst_percentage: Number(h.gst_rate || 0) })));
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          showToast('Failed to load form data', 'error');
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, [showToast]);

  useEffect(() => {
    if (!formData.category) {
      setBrands(allBrands);
      return;
    }

    const selectedCat = categories.find((c) => c._id === formData.category);
    const linkedBrandIds = (selectedCat?.brands || selectedCat?.brand_ids || []).map((b) => (typeof b === 'object' ? b._id : b));
    if (linkedBrandIds.length === 0) {
      setBrands(allBrands);
      return;
    }

    setBrands(allBrands.filter((b) => linkedBrandIds.includes(b._id)));
  }, [formData.category, categories, allBrands]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'hsn_code' && value) {
      const selectedHsn = hsns.find((h) => h._id === value);
      if (selectedHsn) {
        setFormData((prev) => ({ ...prev, gst_percent: selectedHsn.gst_percentage }));
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, image: file || null }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.name?.trim()) nextErrors.name = 'Item name is required';
    if (!formData.sale_rate || Number(formData.sale_rate) <= 0) nextErrors.sale_rate = 'Valid sale rate is required';
    if (formData.stock === '' || Number(formData.stock) < 0) nextErrors.stock = 'Valid stock is required';
    if (formData.image && formData.image.size > 5 * 1024 * 1024) nextErrors.image = 'File must be <= 5MB';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const appendOptional = (fd, key, value) => {
    if (value !== undefined && value !== null && String(value) !== '') fd.append(key, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('item_name', formData.name.trim());
      payload.append('sale_rate', Number(formData.sale_rate));
      payload.append('stock', Number(formData.stock));
      payload.append('is_gst', Number(formData.is_gst));

      appendOptional(payload, 'purchase_rate', formData.purchase_rate);
      appendOptional(payload, 'mrp_rate', formData.mrp_rate);
      appendOptional(payload, 'gst_percent', formData.gst_percent);
      appendOptional(payload, 'discount', formData.discount);
      appendOptional(payload, 'threshold', formData.threshold);
      appendOptional(payload, 'category_id', formData.category);
      appendOptional(payload, 'brand_id', formData.brand);
      appendOptional(payload, 'contact_id', formData.supplier);
      appendOptional(payload, 'description', formData.description);
      if (formData.image) payload.append('image', formData.image);

      await api.post('/items', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Item added successfully', 'success');
      navigate('/inventory/item-master');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to add item';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <Input name="name" value={formData.name} onChange={(value) => handleChange('name', value)} placeholder="Enter item name" />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <Input name="stock" type="number" value={formData.stock} onChange={(value) => handleChange('stock', value)} placeholder="0" />
              {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category || ''} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.category_name || c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select value={formData.brand || ''} onChange={(e) => handleChange('brand', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Select Brand</option>
                {brands.map((b) => <option key={b._id} value={b._id}>{b.brand_name || b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select value={formData.supplier || ''} onChange={(e) => handleChange('supplier', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Select Supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
              <select value={formData.hsn_code || ''} onChange={(e) => handleChange('hsn_code', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Select HSN Code</option>
                {hsns.map((h) => <option key={h._id} value={h._id}>{h.hsn_number} - {h.gst_percentage}%</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">GST %</label><Input name="gst_percent" type="number" step="0.01" value={formData.gst_percent} onChange={(value) => handleChange('gst_percent', value)} disabled={!!formData.hsn_code} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Sale Rate *</label><Input name="sale_rate" type="number" step="0.01" value={formData.sale_rate} onChange={(value) => handleChange('sale_rate', value)} />{errors.sale_rate && <p className="text-red-600 text-sm mt-1">{errors.sale_rate}</p>}</div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Purchase Rate</label><Input name="purchase_rate" type="number" step="0.01" value={formData.purchase_rate} onChange={(value) => handleChange('purchase_rate', value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">MRP Rate</label><Input name="mrp_rate" type="number" step="0.01" value={formData.mrp_rate} onChange={(value) => handleChange('mrp_rate', value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount</label><Input name="discount" type="number" step="0.01" value={formData.discount} onChange={(value) => handleChange('discount', value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label><Input name="threshold" type="number" value={formData.threshold} onChange={(value) => handleChange('threshold', value)} /></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex items-center gap-2" disabled={submitting}><FaSave />{submitting ? 'Saving...' : 'Save Item'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/item-master')}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
