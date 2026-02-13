import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave } from 'react-icons/fa';
import { Button, Input } from '../components/ui';
import useStore from '../store';

const AddItem = () => {
  const navigate = useNavigate();
  const { showToast, addItem } = useStore();

  const [formData, setFormData] = useState({
    itemName: '',
    amount: '',
    threshold: '',
    stockCount: '',
    itemMedia: null,
    categoryId: 1,
    type: 1 // Default OFF → 1
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
    setFormData(prev => ({ ...prev, itemMedia: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.itemName.trim())
      newErrors.itemName = 'Item name is required';

    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = 'Valid amount is required';

    if (!formData.threshold || parseInt(formData.threshold) <= 0)
      newErrors.threshold = 'Valid threshold is required';

    if (!formData.stockCount || parseInt(formData.stockCount) < 0)
      newErrors.stockCount = 'Valid stock count is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newItem = {
      itemName: formData.itemName,
      amount: parseFloat(formData.amount),
      threshold: parseInt(formData.threshold),
      stockCount: parseInt(formData.stockCount),
      itemMedia: formData.itemMedia
        ? URL.createObjectURL(formData.itemMedia)
        : null,
      status:
        parseInt(formData.stockCount) <= parseInt(formData.threshold)
          ? 'LOW'
          : 'OK',
      categoryId: parseInt(formData.categoryId || 1),
      type: formData.type
    };

    addItem(newItem);
    showToast('Item added successfully', 'success');
    navigate('/inventory/item-master');
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
                name="itemName"
                value={formData.itemName}
                onChange={(value) => handleChange('itemName', value)}
                placeholder="Enter item name"
              />
              {errors.itemName && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.itemName}
                </p>
              )}
            </div>

            {/* Amount */}
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
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Threshold */}
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
              />
              {errors.threshold && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.threshold}
                </p>
              )}
            </div>

            {/* Stock Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Stock Count *
              </label>
              <Input
                name="stockCount"
                type="number"
                value={formData.stockCount}
                onChange={(value) => handleChange('stockCount', value)}
                placeholder="Current stock quantity"
              />
              {errors.stockCount && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.stockCount}
                </p>
              )}
            </div>

            {/* Toggle Switch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type *
              </label>

              <div
                onClick={() =>
                  handleChange('type', formData.type === 0 ? 1 : 0)
                }
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  formData.type === 0
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                    formData.type === 0
                      ? 'translate-x-7'
                      : 'translate-x-0'
                  }`}
                />
              </div>
            </div>

          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                handleChange('categoryId', e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value={1}>Engine Parts</option>
              <option value={2}>Brake System</option>
              <option value={3}>Filters</option>
            </select>
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
