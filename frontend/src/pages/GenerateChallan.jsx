import React, { useState, useRef, useEffect } from 'react';
import { FaBarcode, FaPlus, FaTrash, FaSave, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import { useApp } from '../contexts/AppContext';
import { useKeyboard } from '../hooks';
import { formatCurrency, formatDate } from '../utils';

const ItemRow = ({ 
  item, 
  index, 
  onUpdate, 
  onDelete, 
  onNext, 
  isActive, 
  firmType 
}) => {
  const barcodeRef = useRef(null);
  const quantityRef = useRef(null);
  const rateRef = useRef(null);

  useEffect(() => {
    if (isActive && barcodeRef.current) {
      barcodeRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'barcode' && quantityRef.current) {
        quantityRef.current.focus();
      } else if (field === 'quantity' && rateRef.current) {
        rateRef.current.focus();
      } else if (field === 'rate') {
        onNext();
      }
    } else if (e.key === 'Tab' && field === 'rate') {
      onNext();
    }
  };

  const handleBarcodeChange = (barcode) => {
    // Mock item lookup by barcode
    const mockItems = {
      '1234567890123': { name: 'Engine Oil 5W-30', rate: 450, stock: 25, unit: 'Ltr' },
      '1234567890124': { name: 'Brake Pad Set', rate: 1200, stock: 8, unit: 'Set' }
    };

    const foundItem = mockItems[barcode];
    if (foundItem) {
      onUpdate(index, {
        ...item,
        barcode,
        itemName: foundItem.name,
        rate: foundItem.rate,
        availableStock: foundItem.stock,
        unit: foundItem.unit
      });
    } else {
      onUpdate(index, { ...item, barcode });
    }
  };

  const amount = (item.quantity || 0) * (item.rate || 0);

  return (
    <tr className={`${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <td className="px-2 py-2 text-sm">{index + 1}</td>
      
      {/* Barcode */}
      <td className="px-2 py-2">
        <div className="relative">
          <input
            ref={barcodeRef}
            type="text"
            value={item.barcode || ''}
            onChange={(e) => handleBarcodeChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'barcode')}
            placeholder="Scan/Enter barcode"
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaBarcode className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </td>

      {/* Item Name */}
      <td className="px-2 py-2">
        <input
          type="text"
          value={item.itemName || ''}
          onChange={(e) => onUpdate(index, { ...item, itemName: e.target.value })}
          placeholder="Item name"
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>

      {/* Quantity */}
      <td className="px-2 py-2">
        <input
          ref={quantityRef}
          type="number"
          value={item.quantity || ''}
          onChange={(e) => onUpdate(index, { ...item, quantity: parseFloat(e.target.value) || 0 })}
          onKeyDown={(e) => handleKeyDown(e, 'quantity')}
          placeholder="Qty"
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </td>

      {/* Unit */}
      <td className="px-2 py-2 text-sm text-gray-600">
        {item.unit || '-'}
      </td>

      {/* Rate */}
      <td className="px-2 py-2">
        <input
          ref={rateRef}
          type="number"
          value={item.rate || ''}
          onChange={(e) => onUpdate(index, { ...item, rate: parseFloat(e.target.value) || 0 })}
          onKeyDown={(e) => handleKeyDown(e, 'rate')}
          placeholder="Rate"
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
          step="0.01"
        />
      </td>

      {/* Amount */}
      <td className="px-2 py-2 text-sm text-right font-medium">
        {formatCurrency(amount)}
      </td>

      {/* Stock */}
      <td className="px-2 py-2 text-sm text-center">
        {item.availableStock !== undefined ? (
          <span className={`px-2 py-1 rounded-full text-xs ${
            item.availableStock < (item.quantity || 0) 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {item.availableStock}
          </span>
        ) : '-'}
      </td>

      {/* GST/Non-GST Tag */}
      <td className="px-2 py-2 text-center">
        <span className={`px-2 py-1 rounded-full text-xs ${
          firmType === 'GST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {firmType}
        </span>
      </td>

      {/* Actions */}
      <td className="px-2 py-2">
        <button
          onClick={() => onDelete(index)}
          className="text-red-600 hover:text-red-800 p-1"
        >
          <FaTrash className="text-xs" />
        </button>
      </td>
    </tr>
  );
};

const GenerateChallan = () => {
  const { state, actions } = useApp();
  const { selectedFirm } = state;
  
  const [challanData, setChallanData] = useState({
    challanNo: 'CH001',
    date: formatDate(new Date(), 'yyyy-mm-dd'),
    party: '',
    status: 'Draft'
  });

  const [items, setItems] = useState([
    { id: 1, barcode: '', itemName: '', quantity: 0, unit: '', rate: 0, availableStock: undefined }
  ]);

  const [activeRow, setActiveRow] = useState(0);
  const [parties] = useState([
    { id: 1, name: 'ABC Motors', type: 'Customer' },
    { id: 2, name: 'XYZ Parts', type: 'Customer' },
    { id: 3, name: 'PQR Garage', type: 'Customer' }
  ]);

  // Keyboard shortcuts
  useKeyboard({
    'ctrl+s': () => handleSave(),
    'ctrl+enter': () => handleApprove(),
    'escape': () => handleCancel(),
    'f9': () => addNewRow(),
    'f10': () => setActiveRow(Math.max(0, activeRow - 1)),
    'f11': () => setActiveRow(Math.min(items.length - 1, activeRow + 1))
  });

  const addNewRow = () => {
    const newItem = { 
      id: Date.now(), 
      barcode: '', 
      itemName: '', 
      quantity: 0, 
      unit: '', 
      rate: 0, 
      availableStock: undefined 
    };
    setItems([...items, newItem]);
    setActiveRow(items.length);
  };

  const updateItem = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const deleteItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setActiveRow(Math.min(activeRow, newItems.length - 1));
    }
  };

  const handleNextRow = () => {
    if (activeRow === items.length - 1) {
      addNewRow();
    } else {
      setActiveRow(activeRow + 1);
    }
  };

  const handleSave = () => {
    if (!challanData.party) {
      actions.showToast('Please select a party', 'error');
      return;
    }

    const validItems = items.filter(item => item.itemName && item.quantity > 0);
    if (validItems.length === 0) {
      actions.showToast('Please add at least one item', 'error');
      return;
    }

    // Mock save
    actions.showToast('Challan saved successfully', 'success');
  };

  const handleApprove = () => {
    if (!challanData.party) {
      actions.showToast('Please select a party', 'error');
      return;
    }

    const validItems = items.filter(item => item.itemName && item.quantity > 0);
    if (validItems.length === 0) {
      actions.showToast('Please add at least one item', 'error');
      return;
    }

    setChallanData(prev => ({ ...prev, status: 'Approved' }));
    actions.showToast('Challan approved successfully', 'success');
  };

  const handleCancel = () => {
    actions.showConfirm(
      'Are you sure you want to cancel? All unsaved changes will be lost.',
      () => {
        // Reset form or navigate away
        setChallanData({ challanNo: 'CH001', date: formatDate(new Date(), 'yyyy-mm-dd'), party: '', status: 'Draft' });
        setItems([{ id: 1, barcode: '', itemName: '', quantity: 0, unit: '', rate: 0, availableStock: undefined }]);
      }
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Challan</h1>
          <p className="text-gray-600">Create delivery challan for {selectedFirm?.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            challanData.status === 'Draft' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {challanData.status}
          </span>
        </div>
      </div>

      {/* Challan Header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firm
            </label>
            <input
              type="text"
              value={selectedFirm?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Challan No.
            </label>
            <input
              type="text"
              value={challanData.challanNo}
              onChange={(e) => setChallanData(prev => ({ ...prev, challanNo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={challanData.date}
              onChange={(e) => setChallanData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party <span className="text-red-500">*</span>
            </label>
            <select
              value={challanData.party}
              onChange={(e) => setChallanData(prev => ({ ...prev, party: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Party</option>
              {parties.map(party => (
                <option key={party.id} value={party.name}>
                  {party.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">Items</h3>
          <button
            onClick={addNewRow}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="text-xs" />
            Add Row
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onNext={handleNextRow}
                  isActive={activeRow === index}
                  firmType={selectedFirm?.type}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium">
            Total Amount: {formatCurrency(totalAmount)}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FaTimes className="text-xs" />
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaSave className="text-xs" />
              Save
            </button>
            
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FaCheck className="text-xs" />
              Approve
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-blue-800">
          <div><kbd className="bg-white px-2 py-1 rounded">Ctrl+S</kbd> Save</div>
          <div><kbd className="bg-white px-2 py-1 rounded">Ctrl+Enter</kbd> Approve</div>
          <div><kbd className="bg-white px-2 py-1 rounded">F9</kbd> Add Row</div>
          <div><kbd className="bg-white px-2 py-1 rounded">Enter</kbd> Next Field</div>
          <div><kbd className="bg-white px-2 py-1 rounded">Esc</kbd> Cancel</div>
        </div>
      </div>
    </div>
  );
};

export default GenerateChallan;