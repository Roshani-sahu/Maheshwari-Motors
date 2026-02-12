import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { Button, Input } from '../components/ui';
import { itemAPI } from '../services/api';
import useStore from '../store';

const AddItem = () => {
  const navigate = useNavigate();
  const { showToast, setLoading } = useStore();
  const [formData, setFormData] = useState({
    item_name: '',
    sale_price: '',
    min_stock: '',
    current_stock: '',
    tax_slab: '',
    image: null
  });
  const [errors, setErrors] = useState({});

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
    
    if (!formData.item_name.trim()) newErrors.item_name = 'Item name is required';
    if (!formData.sale_price || parseFloat(formData.sale_price) <= 0) newErrors.sale_price = 'Valid price is required';
    if (!formData.min_stock && formData.min_stock !== 0) newErrors.min_stock = 'Min stock is required';
    
    // Optional checks
    if (formData.current_stock && parseInt(formData.current_stock) < 0) newErrors.current_stock = 'Cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
        const formDataPayload = new FormData();
        formDataPayload.append('item_name', formData.item_name);
        formDataPayload.append('sale_price', parseFloat(formData.sale_price));
        formDataPayload.append('current_stock', parseInt(formData.current_stock) || 0);
        formDataPayload.append('min_stock', parseInt(formData.min_stock) || 0);
        formDataPayload.append('tax_slab', parseInt(formData.tax_slab) || 0);
        
        if (formData.image) {
            formDataPayload.append('image', formData.image);
        }

        // Axios (via itemAPI.create) will automatically set Content-Type to multipart/form-data when data is FormData
        await itemAPI.create(formDataPayload);
        
        showToast('Item added successfully', 'success');
        navigate('/inventory/item-master');
    } catch (error) {
        console.error(error);
        showToast('Failed to add item', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Item</h1>
          <p className="text-gray-600">Create a new inventory item</p>
        </div>
        <Button 
            variant="outline"
            onClick={() => navigate('/inventory/item-master')}
            className="flex items-center gap-2"
        >
            <FaArrowLeft /> Back
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <Input
                name="item_name"
                value={formData.item_name}
                onChange={(value) => handleChange('item_name', value)}
                placeholder="Enter item name"
                error={errors.item_name}
              />
              {errors.item_name && <p className="text-red-600 text-sm mt-1">{errors.item_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Price (₹) *
              </label>
              <Input
                name="sale_price"
                type="number"
                step="0.01"
                value={formData.sale_price}
                onChange={(value) => handleChange('sale_price', value)}
                placeholder="0.00"
                error={errors.sale_price}
              />
              {errors.sale_price && <p className="text-red-600 text-sm mt-1">{errors.sale_price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level *
              </label>
              <Input
                name="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(value) => handleChange('min_stock', value)}
                placeholder="Minimum stock alert"
                error={errors.min_stock}
              />
              {errors.min_stock && <p className="text-red-600 text-sm mt-1">{errors.min_stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 Current Stock
              </label>
              <Input
                name="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(value) => handleChange('current_stock', value)}
                placeholder="Quantity in hand"
                error={errors.current_stock}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 GST Tax Slab (%)
              </label>
              <Input
                name="tax_slab"
                type="number"
                value={formData.tax_slab}
                onChange={(value) => handleChange('tax_slab', value)}
                placeholder="e.g. 18"
                error={errors.tax_slab}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Image upload not fully supported in simple mode.</p>
          </div>

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