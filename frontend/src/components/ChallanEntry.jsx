import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa';
import useStore from '../store';
import { challanAPI, accountAPI, itemAPI } from '../services/api';
import { FormField, Input, Select, Button, Card, Table } from '../components/ui/FormComponents';

const ChallanEntry = () => {
  const navigate = useNavigate();
  const { selectedFirm, showToast, setLoading } = useStore();
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    partyId: '',
    transporterId: '',
    vehicleNo: '',
    remarks: '',
    items: []
  });
  const [currentItem, setCurrentItem] = useState({
    barcode: '',
    itemName: '',
    mrp: 0,
    stock: 0,
    type: '',
    pcs: 1,
    rate: 0,
    amount: 0,
    discountPercent: 0,
    spDiscount: 0,
    taxableAmount: 0,
    gstPercent: 0,
    gstAmount: 0
  });

  useEffect(() => {
    if (selectedFirm) {
      loadData();
      generateChallanNo();
    }
  }, [selectedFirm]);

  useEffect(() => {
    // calculateTotals(); // Removed since function doesn't exist
  }, [formData.items]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsRes, itemsRes] = await Promise.all([
        accountAPI.getAll(selectedFirm.id),
        itemAPI.getAll(selectedFirm.id)
      ]);
      setAccounts(accountsRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateChallanNo = async () => {
    try {
      const response = await challanAPI.getNextNumber(selectedFirm.id);
      setFormData(prev => ({ ...prev, challanNo: response.data.nextNumber }));
    } catch (error) {
      console.error('Failed to generate challan number');
    }
  };

  const handleCurrentItemChange = (field, value) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate amount
    if (field === 'pcs' || field === 'rate') {
      const pcs = field === 'pcs' ? parseFloat(value) || 0 : parseFloat(currentItem.pcs) || 0;
      const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(currentItem.rate) || 0;
      const amount = pcs * rate;
      const discountAmount = amount * (parseFloat(currentItem.discountPercent) || 0) / 100;
      const taxableAmount = amount - discountAmount;
      const gstAmount = taxableAmount * (parseFloat(currentItem.gstPercent) || 0) / 100;
      
      setCurrentItem(prev => ({
        ...prev,
        amount,
        taxableAmount,
        gstAmount
      }));
    }
  };

  const addCurrentItemToTable = () => {
    if (!currentItem.itemName || !currentItem.pcs || !currentItem.rate) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const newItem = {
      id: Date.now(),
      itemId: currentItem.itemName, // Use itemName as itemId for now
      itemName: currentItem.itemName,
      qty: currentItem.pcs,
      unit: 'PCS',
      rate: currentItem.rate,
      gstFlag: currentItem.gstPercent > 0 ? 'GST' : 'NON_GST',
      taxRate: currentItem.gstPercent,
      amount: currentItem.amount,
      ...currentItem
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    // Reset current item form
    setCurrentItem({
      barcode: '',
      itemName: '',
      mrp: 0,
      stock: 0,
      type: '',
      pcs: 1,
      rate: 0,
      amount: 0,
      discountPercent: 0,
      spDiscount: 0,
      taxableAmount: 0,
      gstPercent: 0,
      gstAmount: 0
    });
    
    showToast('Item added successfully', 'success');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      itemId: '',
      itemName: '',
      qty: 0,
      unit: '',
      rate: 0,
      gstFlag: 'GST',
      taxRate: 0,
      amount: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-fill item details when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(item => item.id === value);
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          itemName: selectedItem.name,
          unit: selectedItem.unit,
          gstFlag: selectedItem.gstFlag,
          taxRate: selectedItem.gstFlag === 'GST' ? 18 : 0
        };
      }
    }

    // Calculate amount
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].qty) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = qty * rate;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const validateStock = async (itemId, qty) => {
    try {
      const response = await itemAPI.checkStock(itemId, qty);
      return response.data.available;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.partyId) {
      showToast('Please select a party', 'error');
      return;
    }

    if (formData.items.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    // Validate stock for all items (skip for now since we're using mock data)
    // for (const item of formData.items) {
    //   if (item.qty > 0) {
    //     const stockAvailable = await validateStock(item.itemId, item.qty);
    //     if (!stockAvailable) {
    //       showToast(`Insufficient stock for ${item.itemName}`, 'error');
    //       return;
    //     }
    //   }
    // }

    setLoading(true);
    try {
      const challanData = {
        ...formData,
        firmId: selectedFirm.id
      };
      await challanAPI.create(challanData);
      showToast('Challan created successfully', 'success');
      navigate('/challan-list');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create challan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      key: 'itemId',
      header: 'Item',
      render: (item, index) => (
        <Select
          value={item.itemId}
          onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
          className="min-w-[200px]"
        >
          <option value="">Select Item</option>
          {items.map(itm => (
            <option key={itm.id} value={itm.id}>{itm.name}</option>
          ))}
        </Select>
      )
    },
    {
      key: 'qty',
      header: 'Qty',
      render: (item, index) => (
        <Input
          type="number"
          value={item.qty}
          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
          className="w-20"
          min="0"
          step="0.01"
        />
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (item) => <span className="text-sm text-gray-600">{item.unit}</span>
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (item, index) => (
        <Input
          type="number"
          value={item.rate}
          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
          className="w-24"
          min="0"
          step="0.01"
        />
      )
    },
    {
      key: 'gstFlag',
      header: 'GST',
      render: (item, index) => (
        <Select
          value={item.gstFlag}
          onChange={(e) => handleItemChange(index, 'gstFlag', e.target.value)}
          className="w-24"
        >
          <option value="GST">GST</option>
          <option value="NON_GST">Non-GST</option>
        </Select>
      )
    },
    {
      key: 'taxRate',
      header: 'Tax %',
      render: (item, index) => (
        <Input
          type="number"
          value={item.taxRate}
          onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
          className="w-20"
          min="0"
          max="100"
          step="0.01"
        />
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <span className="font-medium">₹{item.amount?.toFixed(2) || '0.00'}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item, index) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => removeItem(index)}
        >
          <FaTrash className="w-3 h-3" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan Entry</h1>
          <p className="text-sm text-gray-600">Create delivery challan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/challan-list')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            {/* <FaSave className="w-4 h-4" /> */}
            Save Challan
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Challan Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Challan No" required>
              <Input
                name="challanNo"
                value={formData.challanNo}
                onChange={handleChange}
                placeholder="Auto-generated"
                readOnly
              />
            </FormField>

            <FormField label="Date" required>
              <Input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Party" required>
              <Select
                name="partyId"
                value={formData.partyId}
                onChange={handleChange}
              >
                <option value="">Select Party</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Transporter">
              <Select
                name="transporterId"
                value={formData.transporterId}
                onChange={handleChange}
              >
                <option value="">Select Transporter</option>
                {/* Add transporters here */}
              </Select>
            </FormField>

            <FormField label="Vehicle No">
              <Input
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleChange}
                placeholder="Enter vehicle number"
              />
            </FormField>

            <FormField label="Remarks">
              <Input
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
              />
            </FormField>
          </div>
        </Card>

        <Card title="Add Item">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <FormField label="Barcode">
              <Input
                value={currentItem.barcode}
                onChange={(e) => handleCurrentItemChange('barcode', e.target.value)}
                placeholder="Barcode"
              />
            </FormField>
            
            <FormField label="Item Name" required>
              <Select
                value={currentItem.itemName}
                onChange={(e) => {
                  const selectedItem = items.find(item => item.name === e.target.value);
                  if (selectedItem) {
                    setCurrentItem(prev => ({
                      ...prev,
                      itemName: selectedItem.name,
                      barcode: selectedItem.barcode,
                      mrp: selectedItem.mrp,
                      stock: selectedItem.stock,
                      rate: selectedItem.saleRate,
                      gstPercent: selectedItem.gstFlag === 'GST' ? 18 : 0
                    }));
                  } else {
                    handleCurrentItemChange('itemName', e.target.value);
                  }
                }}
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </Select>
            </FormField>
            
            <FormField label="MRP">
              <Input
                type="number"
                value={currentItem.mrp}
                onChange={(e) => handleCurrentItemChange('mrp', e.target.value)}
                min="0"
                step="0.01"
              />
            </FormField>
            
            <FormField label="Stock">
              <Input
                type="number"
                value={currentItem.stock}
                onChange={(e) => handleCurrentItemChange('stock', e.target.value)}
                min="0"
                step="0.01"
              />
            </FormField>
            
            <FormField label="Type">
              <Input
                value={currentItem.type}
                onChange={(e) => handleCurrentItemChange('type', e.target.value)}
                placeholder="Type"
              />
            </FormField>
            
            <FormField label="PCS" required>
              <Input
                type="number"
                value={currentItem.pcs}
                onChange={(e) => handleCurrentItemChange('pcs', e.target.value)}
                min="1"
              />
            </FormField>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <FormField label="Rate" required>
              <Input
                type="number"
                value={currentItem.rate}
                onChange={(e) => handleCurrentItemChange('rate', e.target.value)}
                min="0"
                step="0.01"
              />
            </FormField>
            
            <FormField label="Amount">
              <Input
                type="number"
                value={currentItem.amount}
                readOnly
                className="bg-gray-100"
              />
            </FormField>
            
            <FormField label="Disc %">
              <Input
                type="number"
                value={currentItem.discountPercent}
                onChange={(e) => handleCurrentItemChange('discountPercent', e.target.value)}
                min="0"
                max="100"
                step="0.01"
              />
            </FormField>
            
            <FormField label="Taxable Amount">
              <Input
                type="number"
                value={currentItem.taxableAmount}
                readOnly
                className="bg-gray-100"
              />
            </FormField>
            
            <FormField label="GST %">
              <Input
                type="number"
                value={currentItem.gstPercent}
                onChange={(e) => handleCurrentItemChange('gstPercent', e.target.value)}
                min="0"
                max="100"
                step="0.01"
              />
            </FormField>
            
            <FormField label="GST Amount">
              <Input
                type="number"
                value={currentItem.gstAmount}
                readOnly
                className="bg-gray-100"
              />
            </FormField>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={addCurrentItemToTable} className="flex items-center gap-2">
              <FaPlus className="w-3 h-3" />
              Add to Table
            </Button>
          </div>
        </Card>
        <Card title="Items Table">
          {formData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">S.No</th>
                    <th className="px-2 py-2 text-left">Barcode</th>
                    <th className="px-2 py-2 text-left">Item Name</th>
                    <th className="px-2 py-2 text-left">MRP</th>
                    <th className="px-2 py-2 text-left">Stock</th>
                    <th className="px-2 py-2 text-left">Type</th>
                    <th className="px-2 py-2 text-left">PCS</th>
                    <th className="px-2 py-2 text-left">Rate</th>
                    <th className="px-2 py-2 text-left">Amount</th>
                    <th className="px-2 py-2 text-left">Disc %</th>
                    <th className="px-2 py-2 text-left">Taxable Amount</th>
                    <th className="px-2 py-2 text-left">GST %</th>
                    <th className="px-2 py-2 text-left">GST Amt</th>
                    <th className="px-2 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-2">{index + 1}</td>
                      <td className="px-2 py-2">{item.barcode}</td>
                      <td className="px-2 py-2">{item.itemName}</td>
                      <td className="px-2 py-2">₹{item.mrp}</td>
                      <td className="px-2 py-2">{item.stock}</td>
                      <td className="px-2 py-2">{item.type}</td>
                      <td className="px-2 py-2">{item.pcs}</td>
                      <td className="px-2 py-2">₹{item.rate}</td>
                      <td className="px-2 py-2">₹{item.amount.toFixed(2)}</td>
                      <td className="px-2 py-2">{item.discountPercent}%</td>
                      <td className="px-2 py-2">₹{item.taxableAmount.toFixed(2)}</td>
                      <td className="px-2 py-2">{item.gstPercent}%</td>
                      <td className="px-2 py-2">₹{item.gstAmount.toFixed(2)}</td>
                      <td className="px-2 py-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <FaTrash className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No items added. Fill the form above and click "Add to Table".
            </div>
          )}
        </Card>

        {formData.items.length > 0 && (
          <Card title="Summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formData.items.reduce((sum, item) => sum + (item.pcs || 0), 0)}</div>
                <div className="text-sm text-gray-600">Total Qty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{formData.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Subtotal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{formData.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Tax</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{formData.items.reduce((sum, item) => sum + (item.amount || 0) + (item.gstAmount || 0), 0).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Grand Total</div>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default ChallanEntry;