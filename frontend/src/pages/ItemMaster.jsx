import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus, FaDownload, FaUpload, FaSearch, FaBarcode } from 'react-icons/fa';
import { useApp } from '../contexts/AppContext';
import { useKeyboard } from '../hooks';
import { formatCurrency } from '../utils';

const EditableCell = ({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  isEditing, 
  onEdit, 
  onCancel,
  className = "" 
}) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancel();
    }
  };

  if (isEditing) {
    if (type === 'select') {
      return (
        <select
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
      onClick={onEdit}
    >
      {type === 'currency' ? formatCurrency(value) : value || '-'}
    </div>
  );
};

const ItemMaster = () => {
  const { state, actions } = useApp();
  const { selectedFirm } = state;
  
  const [items, setItems] = useState([
    {
      id: 1,
      name: 'Engine Oil 5W-30',
      alias: 'EO530',
      barcode: '1234567890123',
      gstCode: '27101980',
      nonGstCode: 'OIL001',
      unit: 'Ltr',
      rate: 450,
      stock: 25,
      reorderLevel: 10
    },
    {
      id: 2,
      name: 'Brake Pad Set',
      alias: 'BPS001',
      barcode: '1234567890124',
      gstCode: '87083010',
      nonGstCode: 'BRK001',
      unit: 'Set',
      rate: 1200,
      stock: 8,
      reorderLevel: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [fastEditMode, setFastEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm)
  );

  // Keyboard shortcuts
  useKeyboard({
    'ctrl+n': () => setShowAddForm(true),
    'ctrl+f': () => document.getElementById('search-input')?.focus(),
    'f2': () => setFastEditMode(!fastEditMode),
    'escape': () => {
      setEditingCell(null);
      setShowAddForm(false);
    }
  });

  const handleCellEdit = (itemId, field) => {
    setEditingCell({ itemId, field });
  };

  const handleCellSave = (itemId, field, value) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    actions.showToast('Item updated successfully', 'success');
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    
    actions.showConfirm(
      `Delete ${selectedItems.size} selected items?`,
      () => {
        setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
        actions.showToast('Items deleted successfully', 'success');
      }
    );
  };

  const handleImport = () => {
    // Mock import functionality
    actions.showToast('Import functionality will be implemented', 'info');
  };

  const handleExport = () => {
    // Mock export functionality
    const csvContent = [
      ['Name', 'Alias', 'Barcode', 'GST Code', 'Non-GST Code', 'Unit', 'Rate', 'Stock', 'Reorder Level'],
      ...filteredItems.map(item => [
        item.name, item.alias, item.barcode, item.gstCode, item.nonGstCode,
        item.unit, item.rate, item.stock, item.reorderLevel
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    actions.showToast('Items exported successfully', 'success');
  };

  const columns = [
    { key: 'name', label: 'Item Name', editable: true },
    { key: 'alias', label: 'Alias', editable: true },
    { key: 'barcode', label: 'Barcode', editable: true },
    { key: 'gstCode', label: 'GST Code', editable: true },
    { key: 'nonGstCode', label: 'Non-GST Code', editable: true },
    { key: 'unit', label: 'Unit', editable: true, type: 'select', options: [
      { value: 'Pcs', label: 'Pieces' },
      { value: 'Ltr', label: 'Liters' },
      { value: 'Kg', label: 'Kilograms' },
      { value: 'Set', label: 'Set' }
    ]},
    { key: 'rate', label: 'Rate', editable: true, type: 'number' },
    { key: 'stock', label: 'Stock', editable: true, type: 'number' },
    { key: 'reorderLevel', label: 'Reorder Level', editable: true, type: 'number' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-gray-600">
            Manage your inventory items for {selectedFirm?.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFastEditMode(!fastEditMode)}
            className={`px-3 py-2 text-sm rounded-md border ${
              fastEditMode 
                ? 'bg-green-100 text-green-800 border-green-300' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Fast Edit {fastEditMode ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FaUpload className="text-xs" />
            Import
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FaDownload className="text-xs" />
            Export
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <FaPlus className="text-xs" />
            Add Item
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              id="search-input"
              type="text"
              placeholder="Search items by name, alias, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedItems.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(filteredItems.map(item => item.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  />
                </th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems);
                        if (e.target.checked) {
                          newSelected.add(item.id);
                        } else {
                          newSelected.delete(item.id);
                        }
                        setSelectedItems(newSelected);
                      }}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-sm">
                      {col.editable ? (
                        <EditableCell
                          value={item[col.key]}
                          onSave={(value) => handleCellSave(item.id, col.key, value)}
                          type={col.type}
                          options={col.options}
                          isEditing={editingCell?.itemId === item.id && editingCell?.field === col.key}
                          onEdit={() => handleCellEdit(item.id, col.key)}
                          onCancel={() => setEditingCell(null)}
                          className={fastEditMode ? 'border border-dashed border-gray-300' : ''}
                        />
                      ) : (
                        <span>{item[col.key]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    {item.stock <= item.reorderLevel ? (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No items found matching your search.' : 'No items found. Add your first item to get started.'}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
          <div><kbd className="bg-white px-2 py-1 rounded">Ctrl+N</kbd> Add Item</div>
          <div><kbd className="bg-white px-2 py-1 rounded">Ctrl+F</kbd> Search</div>
          <div><kbd className="bg-white px-2 py-1 rounded">F2</kbd> Toggle Fast Edit</div>
          <div><kbd className="bg-white px-2 py-1 rounded">Esc</kbd> Cancel</div>
        </div>
      </div>
    </div>
  );
};

export default ItemMaster;