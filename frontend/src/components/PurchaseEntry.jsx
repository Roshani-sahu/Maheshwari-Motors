import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import useStore from '../store';
import { itemAPI, accountAPI } from '../services/api';
import { FormField, Input, Select, Button, Card } from '../components/ui/FormComponents';

const PurchaseEntry = () => {
  const navigate = useNavigate();
  const { selectedFirm, showToast, setLoading } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    vehicleNo: '',
    inwardNo: '',
    items: []
  });
  const [totals, setTotals] = useState({
    totalQty: 0,
    totalAmount: 0,
    totalGst: 0,
    netAmount: 0
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
      const [suppliersRes, itemsRes] = await Promise.all([
        accountAPI.getAll(selectedFirm.id),
        itemAPI.getAll(selectedFirm.id)
      ]);
      setSuppliers(suppliersRes.data.filter(acc => acc.type === 'Supplier'));
      setItems(itemsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateChallanNo = () => {
    const nextNo = `00${Math.floor(Math.random() * 1000)}`.slice(-3);
    setFormData(prev => ({ ...prev, challanNo: nextNo }));
  };

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
    const totalAmount = formData.items.reduce((sum, item) => {
      const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + amount;
    }, 0);
    
    const totalGst = formData.items.reduce((sum, item) => {
      const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      const gstRate = parseFloat(item.gstRate) || 0;
      return sum + (amount * gstRate / 100);
    }, 0);

    const netAmount = totalAmount + totalGst;
    setTotals({ totalQty, totalAmount, totalGst, netAmount });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      barcode: '',
      itemName: '',
      mrp: 0,
      stock: 0,
      type: '',
      pcs: 1,
      rate: 0,
      amount: 0,
      discountPercent: 0,
      gstRate: 0,
      gstAmount: 0
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

    // Auto-calculate amount
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].qty) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = qty * rate;
    }

    // Auto-calculate GST
    if (field === 'amount' || field === 'gstRate') {
      const amount = parseFloat(updatedItems[index].amount) || 0;
      const gstRate = parseFloat(updatedItems[index].gstRate) || 0;
      updatedItems[index].gstAmount = amount * gstRate / 100;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }

    if (formData.items.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    setLoading(true);
    try {
      const purchaseData = {
        ...formData,
        firmId: selectedFirm.id,
        totals
      };
      // await purchaseAPI.create(purchaseData);
      showToast('Purchase entry created successfully', 'success');
      navigate('/transactions');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create purchase entry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      key: 'barcode',
      header: 'Barcode',
      render: (item, index) => (
        <Input
          value={item.barcode}
          onChange={(e) => handleItemChange(index, 'barcode', e.target.value)}
          className="w-32"
          placeholder="Barcode"
        />
      )
    },
    {
      key: 'itemName',
      header: 'Item Name',
      render: (item, index) => (
        <Select
          value={item.itemName}
          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
          className="min-w-[200px]"
        >
          <option value="">Select Item</option>
          {items.map(itm => (
            <option key={itm.id} value={itm.name}>{itm.name}</option>
          ))}
        </Select>
      )
    },
    {
      key: 'mrp',
      header: 'MRP',
      render: (item, index) => (
        <Input
          type="number"
          value={item.mrp}
          onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
          className="w-20"
          min="0"
          step="0.01"
        />
      )
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (item, index) => (
        <Input
          type="number"
          value={item.stock}
          onChange={(e) => handleItemChange(index, 'stock', e.target.value)}
          className="w-20"
          min="0"
          step="0.01"
        />
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (item, index) => (
        <Input
          value={item.type}
          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
          className="w-16"
          placeholder="Type"
        />
      )
    },
    {
      key: 'pcs',
      header: 'PCS',
      render: (item, index) => (
        <Input
          type="number"
          value={item.pcs}
          onChange={(e) => handleItemChange(index, 'pcs', e.target.value)}
          className="w-16"
          min="1"
        />
      )
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
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <span className="font-medium">₹{item.amount?.toFixed(2) || '0.00'}</span>
      )
    },
    {
      key: 'discountPercent',
      header: 'Disc %',
      render: (item, index) => (
        <Input
          type="number"
          value={item.discountPercent}
          onChange={(e) => handleItemChange(index, 'discountPercent', e.target.value)}
          className="w-[55px]"
          min="0"
          max="100"
          step="0.01"
        />
      )
    },
    {
      key: 'gstRate',
      header: 'GST %',
      render: (item, index) => (
        <Input
          type="number"
          value={item.gstRate}
          onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
          className="w-[55px]"
          min="0"
          max="100"
          step="0.01"
        />
      )
    },
    {
      key: 'gstAmount',
      header: 'GST Amt',
      render: (item) => (
        <span className="font-medium">₹{item.gstAmount?.toFixed(2) || '0.00'}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Entry</h1>
          <p className="text-sm text-gray-600">Record purchase transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            {/* <FaSave className="w-4 h-4" /> */}
            Save Purchase
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Purchase Details">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <FormField label="Vehicle No">
              <Input
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleChange}
                placeholder="Vehicle number"
              />
            </FormField>

            <FormField label="Inward No">
              <Input
                name="inwardNo"
                value={formData.inwardNo}
                onChange={handleChange}
                placeholder="Inward number"
              />
            </FormField>
          </div>

          <div className="mt-4">
            <FormField label="Supplier" required>
              <Select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
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
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">₹{totals.totalGst.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total GST</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{totals.netAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Net Amount</div>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default PurchaseEntry;