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
    amount: '',
    threshold: '',

    gst_stock: '',
    nongst_stock: '',
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
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.threshold && formData.threshold !== 0) newErrors.threshold = 'Threshold is required';
    
    // Optional stocks, but warn if negative
    if (formData.gst_stock && parseInt(formData.gst_stock) < 0) newErrors.gst_stock = 'Cannot be negative';
    if (formData.nongst_stock && parseInt(formData.nongst_stock) < 0) newErrors.nongst_stock = 'Cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }


    setLoading(true);
    try {
        const formDataPayload = new FormData();
        formDataPayload.append('item_name', formData.item_name);
        formDataPayload.append('amount', parseFloat(formData.amount));
        formDataPayload.append('threshold', parseInt(formData.threshold) || 0);
        formDataPayload.append('gst_stock', parseInt(formData.gst_stock) || 0);
        formDataPayload.append('nongst_stock', parseInt(formData.nongst_stock) || 0);
        
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
                Amount (₹) *
              </label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(value) => handleChange('amount', value)}
                placeholder="0.00"
                error={errors.amount}
              />
              {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Threshold *
              </label>
              <Input
                name="threshold"
                type="number"
                value={formData.threshold}
                onChange={(value) => handleChange('threshold', value)}
                placeholder="Minimum stock level"
                error={errors.threshold}
              />
              {errors.threshold && <p className="text-red-600 text-sm mt-1">{errors.threshold}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 GST Stock
              </label>
              <Input
                name="gst_stock"
                type="number"
                value={formData.gst_stock}
                onChange={(value) => handleChange('gst_stock', value)}
                placeholder="GST Stock Quantity"
                error={errors.gst_stock}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 Non-GST Stock
              </label>
              <Input
                name="nongst_stock"
                type="number"
                value={formData.nongst_stock}
                onChange={(value) => handleChange('nongst_stock', value)}
                placeholder="Non-GST Stock Quantity"
                error={errors.nongst_stock}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value={1}>Engine Parts</option>
              <option value={2}>Brake System</option>
              <option value={3}>Filters</option>
            </select>
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