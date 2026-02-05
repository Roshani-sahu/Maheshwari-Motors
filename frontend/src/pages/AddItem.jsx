import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaUpload } from 'react-icons/fa';
import { Button, Input } from '../components/ui';

const AddItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    amount: '',
    threshold: '',
    stockCount: '',
    itemMedia: null
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, itemMedia: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!formData.itemName.trim()) newErrors.itemName = 'Item name is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.threshold || parseInt(formData.threshold) <= 0) newErrors.threshold = 'Valid threshold is required';
    if (!formData.stockCount || parseInt(formData.stockCount) < 0) newErrors.stockCount = 'Valid stock count is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Save item logic here
    console.log('Saving item:', formData);
    navigate('/masters/item-master');
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <Input
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="Enter item name"
                error={errors.itemName}
              />
              {errors.itemName && <p className="text-red-600 text-sm mt-1">{errors.itemName}</p>}
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
                onChange={handleChange}
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
                onChange={handleChange}
                placeholder="Minimum stock level"
                error={errors.threshold}
              />
              {errors.threshold && <p className="text-red-600 text-sm mt-1">{errors.threshold}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Stock Count *
              </label>
              <Input
                name="stockCount"
                type="number"
                value={formData.stockCount}
                onChange={handleChange}
                placeholder="Current stock quantity"
                error={errors.stockCount}
              />
              {errors.stockCount && <p className="text-red-600 text-sm mt-1">{errors.stockCount}</p>}
            </div>
          </div>

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

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex items-center gap-2">
              <FaSave />
              Save Item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/masters/item-master')}
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