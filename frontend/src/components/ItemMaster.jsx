import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaDownload, FaUpload } from 'react-icons/fa';
import useStore from '../store';
import { itemAPI, groupAPI, unitAPI, hsnAPI } from '../services/api';
import { Button, Input, Select, Modal } from '../components/ui/FormComponents';

const ItemMaster = () => {
  const { selectedFirm, showToast, setLoading } = useStore();
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const gridRef = useRef(null);

  const columns = [
    { key: 'item_code', header: 'Code', width: '120px', editable: true },
    { key: 'item_name', header: 'Item Name', width: '200px', editable: true },
    { key: 'description', header: 'Alias/Description', width: '180px', editable: true },
    { key: 'barcode', header: 'Barcode', width: '150px', editable: true },
    { key: 'unit', header: 'Unit', width: '100px', editable: true, type: 'select' },
    { key: 'category_id', header: 'Group', width: '150px', editable: true, type: 'select' },
    // { key: 'sub_category_id', header: 'Sub Group', width: '150px', editable: true, type: 'select' }, // Removed simplified
    { key: 'hsn_code', header: 'HSN Code', width: '120px', editable: true },
    // { key: 'nonGstCode', header: 'Non-GST Code', width: '120px', editable: true },
    { key: 'tax_slab', header: 'GST %', width: '80px', editable: true, type: 'number' },
    { key: 'sale_price', header: 'Sale Rate', width: '100px', editable: true, type: 'number' },
    { key: 'purchase_price', header: 'Purchase Rate', width: '120px', editable: true, type: 'number' },
    { key: 'discount_value', header: 'Discount %', width: '100px', editable: true, type: 'number' },
    { key: 'current_stock', header: 'Stock', width: '100px', editable: false },
    { key: 'actions', header: 'Actions', width: '100px', editable: false }
  ];

  useEffect(() => {
    if (selectedFirm) {
      loadData();
    }
  }, [selectedFirm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, groupsRes, unitsRes, hsnRes] = await Promise.all([
        itemAPI.getAll(selectedFirm.id),
        groupAPI.getAll(),
        unitAPI.getAll(),
        hsnAPI.getAll()
      ]);
      setItems(itemsRes.data?.data?.data || itemsRes.data || []);
      setGroups(groupsRes.data?.data?.data || groupsRes.data || []);
      setUnits(unitsRes.data?.data?.data || unitsRes.data || []);
      setHsnCodes(hsnRes.data?.data?.data || hsnRes.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (rowIndex, columnKey) => {
    const column = columns.find(col => col.key === columnKey);
    if (column?.editable) {
      setEditingCell({ rowIndex, columnKey });
    }
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    const updatedItems = [...items];
    updatedItems[rowIndex] = { ...updatedItems[rowIndex], [columnKey]: value };
    setItems(updatedItems);
  };

  const handleCellBlur = async (rowIndex, columnKey) => {
    setEditingCell(null);
    const item = items[rowIndex];
    if (item._id || item.id) {
      try {
        await itemAPI.update(item._id || item.id, item);
        showToast('Item updated', 'success');
      } catch (error) {
        showToast('Failed to update item', 'error');
      }
    }
  };

  const handleKeyDown = (e, rowIndex, columnKey) => {
    if (e.key === 'Enter') {
      handleCellBlur(rowIndex, columnKey);
      // Move to next row, same column
      if (rowIndex < items.length - 1) {
        setEditingCell({ rowIndex: rowIndex + 1, columnKey });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur(rowIndex, columnKey);
      // Move to next column
      const currentColIndex = columns.findIndex(col => col.key === columnKey);
      const nextCol = columns[currentColIndex + 1];
      if (nextCol?.editable) {
        setEditingCell({ rowIndex, columnKey: nextCol.key });
      } else if (rowIndex < items.length - 1) {
        setEditingCell({ rowIndex: rowIndex + 1, columnKey: columns[0].key });
      }
    }
  };

  const addNewRow = () => {
    const newItem = {
      // id: null, // Backend assigns ID
      item_code: '',
      item_name: '',
      description: '',
      barcode: '',
      unit: '',
      category_id: '',
      // subGroup: '',
      hsn_code: '',
      // nonGstCode: '',
      tax_slab: 0,
      sale_price: 0,
      purchase_price: 0,
      discount_value: 0,
      current_stock: 0,
      firm_id: selectedFirm?._id || selectedFirm?.id
    };
    setItems([...items, newItem]);
    setEditingCell({ rowIndex: items.length, columnKey: 'item_code' });
  };

  const deleteItem = async (rowIndex) => {
    const item = items[rowIndex];
    if (item.id) {
      try {
        await itemAPI.delete(item.id);
        showToast('Item deleted', 'success');
      } catch (error) {
        showToast('Failed to delete item', 'error');
        return;
      }
    }
    const updatedItems = items.filter((_, index) => index !== rowIndex);
    setItems(updatedItems);
  };

  const saveNewItem = async (rowIndex) => {
    const item = items[rowIndex];
    if (!item.code || !item.name) {
      showToast('Code and Name are required', 'error');
      return;
    }
    
    try {
      const response = await itemAPI.create(item);
      const updatedItems = [...items];
      updatedItems[rowIndex] = response.data;
      setItems(updatedItems);
      showToast('Item saved', 'success');
    } catch (error) {
      showToast('Failed to save item', 'error');
    }
  };

  const renderCell = (item, column, rowIndex) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;
    const value = item[column.key];

    if (column.key === 'actions') {
      return (
        <div className="flex gap-1">
          {!item.id ? (
            <Button size="sm" onClick={() => saveNewItem(rowIndex)}>
              {/* <FaSave className="w-3 h-3" /> */}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleCellClick(rowIndex, 'code')}>
              {/* <FaEdit className="w-3 h-3" /> */}
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => deleteItem(rowIndex)}>
            <FaTrash className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    if (!isEditing) {
      return (
        <div
          className="px-2 py-1 cursor-pointer hover:bg-gray-50 min-h-[32px] flex items-center"
          onClick={() => handleCellClick(rowIndex, column.key)}
        >
          <span className="truncate">{value}</span>
        </div>
      );
    }

    // Editing mode
    if (column.type === 'select') {
      let options = [];
      if (column.key === 'unit') options = units;
      else if (column.key === 'group') options = groups;
      else if (column.key === 'subGroup') options = groups.filter(g => g.parentId === item.group);

      return (
        <select
          value={value}
          onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
          onBlur={() => handleCellBlur(rowIndex, column.key)}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
          className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500"
          autoFocus
        >
          <option value="">Select...</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={column.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
        onBlur={() => handleCellBlur(rowIndex, column.key)}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
        className="w-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    );
  };

  const filteredItems = items.filter(item =>
    item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-sm text-gray-600">Manage your inventory items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FaUpload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FaDownload className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={addNewRow} className="flex items-center gap-2">
            <FaPlus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <FaPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredItems.length} items
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" ref={gridRef}>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                    style={{ width: column.width, minWidth: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item, rowIndex) => (
                <tr key={item.id || rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="border-r border-gray-200 text-sm"
                      style={{ width: column.width, minWidth: column.width }}
                    >
                      {renderCell(item, column, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found. Click "Add Item" to create your first item.</p>
        </div>
      )}
    </div>
  );
};

export default ItemMaster;