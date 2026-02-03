import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa6';
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
  const [totals, setTotals] = useState({
    totalQty: 0,
    totalAmount: 0,
    totalTax: 0,
    grandTotal: 0
  });

  useEffect(() => {
    if (selectedFirm) {
      loadData();
      generateChallanNo();
    }
  }, [selectedFirm]);

  useEffect(() => {
    calculateTotals();
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

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
    const totalAmount = formData.items.reduce((sum, item) => {
      const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + amount;
    }, 0);
    
    const totalTax = formData.items.reduce((sum, item) => {
      const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      const taxRate = parseFloat(item.taxRate) || 0;
      return sum + (amount * taxRate / 100);
    }, 0);

    const grandTotal = totalAmount + totalTax;

    setTotals({ totalQty, totalAmount, totalTax, grandTotal });
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

    // Validate stock for all items
    for (const item of formData.items) {
      if (item.qty > 0) {
        const stockAvailable = await validateStock(item.itemId, item.qty);
        if (!stockAvailable) {
          showToast(`Insufficient stock for ${item.itemName}`, 'error');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const challanData = {
        ...formData,
        firmId: selectedFirm.id,
        totals
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

        <Card 
          title="Items" 
          headerActions={
            <Button onClick={addItem} size="sm" className="flex items-center gap-2">
              <FaPlus className="w-3 h-3" />
              Add Item
            </Button>
          }
        >
          {formData.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    {itemColumns.map(col => (
                      <th key={col.key} className="text-left py-2 px-2 text-sm font-medium text-gray-700">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      {itemColumns.map(col => (
                        <td key={col.key} className="py-2 px-2">
                          {col.render(item, index)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No items added. Click "Add Item" to start.
            </div>
          )}
        </Card>

        {formData.items.length > 0 && (
          <Card title="Summary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totals.totalQty}</div>
                <div className="text-sm text-gray-600">Total Qty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{totals.totalAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Subtotal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{totals.totalTax.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Tax</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{totals.grandTotal.toFixed(2)}</div>
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