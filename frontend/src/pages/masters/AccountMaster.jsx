import React, { useState } from 'react';
import { FaPlus, FaFilter, FaPercent, FaMoneyBillWave, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, Toggle, DeleteConfirmDialog } from '../../components/common';
import { Button, Input, Select } from '../../components/ui';

const AccountMaster = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null, type: '' }); // transactions | discounts
  
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      transactionId: 'TXN001',
      payerId: 'PAY001',
      utr: 'UTR123456789',
      firm: 'Maa Auto',
      gstFlag: 0, // GST
      companyId: 'COMP001',
      amount: 25000,
      date: '2024-01-15'
    },
    {
      id: 2,
      transactionId: 'TXN002',
      payerId: 'PAY002',
      utr: 'UTR987654321',
      firm: 'Motors Division',
      gstFlag: 1, // NON-GST
      companyId: 'COMP002',
      amount: 18500,
      date: '2024-01-14'
    }
  ]);

  const transactionActions = [
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (transaction) => setDeleteDialog({ isOpen: true, item: transaction, type: 'transaction' }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const [discounts, setDiscounts] = useState([
    {
      id: 1,
      discountType: 'ITEM',
      amount: 500,
      itemId: 'ITM001',
      itemName: 'Engine Oil',
      companyId: null,
      companyName: null
    },
    {
      id: 2,
      discountType: 'COMPANY',
      amount: 1000,
      itemId: null,
      itemName: null,
      companyId: 'COMP001',
      companyName: 'ABC Motors'
    }
  ]);

  // derive unique company and item name lists from existing discounts
  const companyOptions = Array.from(new Set(discounts.filter(d => d.companyName).map(d => d.companyName)));
  const itemOptions = Array.from(new Set(discounts.filter(d => d.itemName).map(d => d.itemName)));

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    firm: '',
    gstType: 'all'
  });

  const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
  const [isEditDiscountModalOpen, setIsEditDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [newDiscount, setNewDiscount] = useState({
    discountType: 'ITEM',
    amount: '',
    itemName: '',
    companyName: ''
  });

  // Transaction columns
  const transactionColumns = [
    { 
      key: 'id', 
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    { 
      key: 'transactionId', 
      label: 'Transaction ID',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    { 
      key: 'payerId', 
      label: 'Payer ID',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    { 
      key: 'utr', 
      label: 'UTR',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    { 
      key: 'firm', 
      label: 'Firm',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    {
      key: 'gstFlag',
      label: 'GST Type',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 0 ? '1' : '0'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{value.toLocaleString()}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-xs sm:text-sm">{new Date(value).toLocaleDateString()}</span>
    }
  ];

  // Discount columns
  const discountColumns = [
    { 
      key: 'id', 
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'discountType',
      label: 'Type',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 'ITEM' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{value.toLocaleString()}</span>
    },
    {
      key: 'itemName',
      label: 'Item',
      render: (value, row) => <span className="text-xs sm:text-sm truncate">{row.discountType === 'ITEM' ? value : 'N/A'}</span>
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value, row) => <span className="text-xs sm:text-sm truncate">{row.discountType === 'COMPANY' ? value : 'N/A'}</span>
    }
  ];

  const discountActions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (discount) => {
        setEditingDiscount(discount);
        setIsEditDiscountModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (discount) => setDeleteDialog({ isOpen: true, item: discount, type: 'discount' }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  // Apply filters to transactions
  const filteredTransactions = transactions.filter(txn => {
    if (filters.firm && !txn.firm.toLowerCase().includes(filters.firm.toLowerCase())) return false;
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((txn.gstFlag === 0) !== isGst) return false;
    }
    return true;
  });

  const handleAddDiscount = () => {
    // attempt to reuse existing ids when a matching name exists
    const existingItem = discounts.find(d => d.itemName === newDiscount.itemName && d.itemId);
    const existingCompany = discounts.find(d => d.companyName === newDiscount.companyName && d.companyId);
    const discount = {
      id: discounts.length + 1,
      ...newDiscount,
      amount: parseFloat(newDiscount.amount),
      itemId: newDiscount.discountType === 'ITEM' ? (existingItem ? existingItem.itemId : 'ITM' + Date.now()) : null,
      companyId: newDiscount.discountType === 'COMPANY' ? (existingCompany ? existingCompany.companyId : 'COMP' + Date.now()) : null
    };
    setDiscounts(prev => [...prev, discount]);
    setNewDiscount({ discountType: 'ITEM', amount: '', itemName: '', companyName: '' });
    setIsAddDiscountModalOpen(false);
  };

  const handleEditDiscount = () => {
    setDiscounts(prev => prev.map(d => d.id === editingDiscount.id ? editingDiscount : d));
    setIsEditDiscountModalOpen(false);
    setEditingDiscount(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Account Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage account transactions and discounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b overflow-x-auto">
          <nav className="flex px-4 sm:px-6">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <FaMoneyBillWave className="text-sm sm:text-base" />
                Transactions
              </div>
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'discounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <FaPercent className="text-sm sm:text-base" />
                Discounts
              </div>
            </button>
          </nav>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Transaction Filters */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <FaFilter className="text-gray-500 text-sm sm:text-base" />
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Input
                    placeholder="Search firm..."
                    value={filters.firm}
                    onChange={(value) => setFilters(prev => ({ ...prev, firm: value }))}
                    className="text-xs sm:text-sm py-1.5 sm:py-2"
                  />
                  <Select
                    value={filters.gstType}
                    onChange={(value) => setFilters(prev => ({ ...prev, gstType: value }))}
                    className="text-xs sm:text-sm py-1.5 sm:py-2"
                  >
                    <option value="all">All Types</option>
                    <option value="gst">1</option>
                    <option value="non-gst">0</option>
                  </Select>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
                    className="text-xs sm:text-sm py-1.5 sm:py-2"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
                    className="text-xs sm:text-sm py-1.5 sm:py-2"
                  />
                </div>
              </div>

              <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                <DataTable
                  columns={transactionColumns}
                  data={filteredTransactions}
                  actions={transactionActions}
                  searchable={true}
                  sortable={true}
                  pagination={true}
                  minWidth="700px"
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="space-y-4">
              <div className="flex justify-end">
  <Button 
    onClick={() => setIsAddDiscountModalOpen(true)} 
    className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
  >
    <FaPlus className="text-sm sm:text-base" />
    Add Discount
  </Button>
</div>

              <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                <DataTable
                  columns={discountColumns}
                  data={discounts}
                  actions={discountActions}
                  searchable={true}
                  sortable={true}
                  pagination={true}
                  minWidth="600px"
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

            {/* Add Discount Modal */}
      <Modal isOpen={isAddDiscountModalOpen} onClose={() => setIsAddDiscountModalOpen(false)} title="Add Discount" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <Select
              value={newDiscount.discountType}
              onChange={(value) => setNewDiscount(prev => ({ ...prev, discountType: value, itemName: '', companyName: '' }))}
              className="text-xs sm:text-sm"
            >
              <option value="ITEM">Item Discount</option>
              <option value="COMPANY">Company Discount</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <Input
              type="number"
              step="0.01"
              value={newDiscount.amount}
              onChange={(value) => setNewDiscount(prev => ({ ...prev, amount: value }))}
              placeholder="Enter discount amount"
              onWheel={(e) => e.target.blur()}
              className="text-xs sm:text-sm"
            />
          </div>

          {newDiscount.discountType === 'ITEM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <Select
                value={newDiscount.itemName}
                onChange={(value) => setNewDiscount(prev => ({ ...prev, itemName: value }))}
                className="text-xs sm:text-sm"
              >
                <option value="">Select item</option>
                {itemOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </div>
          )}

          {newDiscount.discountType === 'COMPANY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Select
                value={newDiscount.companyName}
                onChange={(value) => setNewDiscount(prev => ({ ...prev, companyName: value }))}
                className="text-xs sm:text-sm"
              >
                <option value="">Select company</option>
                {companyOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button onClick={handleAddDiscount} className="w-full sm:w-auto text-xs sm:text-sm">
              Add Discount
            </Button>
            <Button variant="outline" onClick={() => setIsAddDiscountModalOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

  

      {/* Edit Discount Modal */}
      <Modal isOpen={isEditDiscountModalOpen} onClose={() => setIsEditDiscountModalOpen(false)} title="Edit Discount" size="sm">
        {editingDiscount && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <Select
                value={editingDiscount.discountType}
                onChange={(value) => setEditingDiscount(prev => ({ ...prev, discountType: value, itemName: '', itemId: null, companyName: '', companyId: null }))}
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              >
                <option value="ITEM">Item Discount</option>
                <option value="COMPANY">Company Discount</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={editingDiscount.amount}
                onChange={(value) => setEditingDiscount(prev => ({ ...prev, amount: parseFloat(value) || 0 }))}
                placeholder="Enter discount amount"
                className="text-xs sm:text-sm py-1.5 sm:py-2"
              />
            </div>

            {editingDiscount.discountType === 'ITEM' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <Select
                  value={editingDiscount.itemName || ''}
                  onChange={(value) => {
                    const existing = discounts.find(d => d.itemName === value && d.itemId);
                    setEditingDiscount(prev => ({ ...prev, itemName: value, itemId: existing ? existing.itemId : (prev.itemId || 'ITM' + Date.now()) }));
                  }}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <option value="">Select item</option>
                  {itemOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
            )}

            {editingDiscount.discountType === 'COMPANY' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Select
                  value={editingDiscount.companyName || ''}
                  onChange={(value) => {
                    const existing = discounts.find(d => d.companyName === value && d.companyId);
                    setEditingDiscount(prev => ({ ...prev, companyName: value, companyId: existing ? existing.companyId : (prev.companyId || 'COMP' + Date.now()) }));
                  }}
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <option value="">Select company</option>
                  {companyOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button onClick={handleEditDiscount} className="text-xs sm:text-sm py-1.5 sm:py-2">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, item: null, type: '' })}
        onConfirm={() => {
          if (deleteDialog.type === 'transaction') {
            setTransactions(prev => prev.filter(t => t.id !== deleteDialog.item.id));
          } else if (deleteDialog.type === 'discount') {
            setDiscounts(prev => prev.filter(d => d.id !== deleteDialog.item.id));
          }
        }}
        itemName={deleteDialog.type === 'transaction' ? deleteDialog.item?.transactionId : `discount for ${deleteDialog.item?.itemName || deleteDialog.item?.companyName}`}
      />
    </div>
  );
};

export default AccountMaster;