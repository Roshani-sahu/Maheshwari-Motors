import React, { useState } from 'react';
import { FaPlus, FaFilter, FaPercent, FaMoneyBillWave } from 'react-icons/fa';
import { DataTable, Modal, Toggle } from '../../components/common';
import { Button, Input, Select } from '../../components/ui';

const AccountMaster = () => {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | discounts
  
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
    { key: 'id', label: 'ID' },
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'payerId', label: 'Payer ID' },
    { key: 'utr', label: 'UTR' },
    { key: 'firm', label: 'Firm' },
    {
      key: 'gstFlag',
      label: 'GST Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 0 ? '1' : '0'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Discount columns
  const discountColumns = [
    { key: 'id', label: 'ID' },
    {
      key: 'discountType',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'ITEM' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'itemName',
      label: 'Item',
      render: (value, row) => row.discountType === 'ITEM' ? value : 'N/A'
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value, row) => row.discountType === 'COMPANY' ? value : 'N/A'
    }
  ];

  const discountActions = [
    {
      label: 'Edit',
      onClick: (discount) => {
        setEditingDiscount(discount);
        setIsEditDiscountModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: 'Delete',
      onClick: (discount) => setDiscounts(prev => prev.filter(d => d.id !== discount.id)),
      className: 'bg-red-600 text-white hover:bg-red-700'
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
    const discount = {
      id: Date.now(),
      ...newDiscount,
      amount: parseFloat(newDiscount.amount),
      itemId: newDiscount.discountType === 'ITEM' ? 'ITM' + Date.now() : null,
      companyId: newDiscount.discountType === 'COMPANY' ? 'COMP' + Date.now() : null
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Master</h1>
          <p className="text-gray-600">Manage account transactions and discounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaMoneyBillWave />
                Transactions
              </div>
            </button>
            <button
              onClick={() => setActiveTab('discounts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FaPercent />
                Discounts
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* Transaction Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <FaFilter className="text-gray-500" />
                  <h3 className="font-medium text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Search firm..."
                    value={filters.firm}
                    onChange={(value) => setFilters(prev => ({ ...prev, firm: value }))}
                  />
                  <Select
                    value={filters.gstType}
                    onChange={(value) => setFilters(prev => ({ ...prev, gstType: value }))}
                  >
                    <option value="all">All  Types</option>
                    <option value="gst"> 1 </option>
                    <option value="non-gst">0 </option>
                  </Select>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
                  />
                </div>
              </div>

              <DataTable
                columns={transactionColumns}
                data={filteredTransactions}
                searchable={true}
                sortable={true}
                pagination={true}
              />
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsAddDiscountModalOpen(true)} className="flex items-center gap-2">
                  <FaPlus />
                  Add Discount
                </Button>
              </div>

              <DataTable
                columns={discountColumns}
                data={discounts}
                actions={discountActions}
                searchable={true}
                sortable={true}
                pagination={true}
              />
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
              onChange={(value) => setNewDiscount(prev => ({ ...prev, discountType: value }))}
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
            />
          </div>

          {newDiscount.discountType === 'ITEM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <Input
                value={newDiscount.itemName}
                onChange={(value) => setNewDiscount(prev => ({ ...prev, itemName: value }))}
                placeholder="Enter item name"
              />
            </div>
          )}

          {newDiscount.discountType === 'COMPANY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input
                value={newDiscount.companyName}
                onChange={(value) => setNewDiscount(prev => ({ ...prev, companyName: value }))}
                placeholder="Enter company name"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddDiscount}>Add Discount</Button>
            <Button variant="outline" onClick={() => setIsAddDiscountModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Discount Modal */}
      <Modal isOpen={isEditDiscountModalOpen} onClose={() => setIsEditDiscountModalOpen(false)} title="Edit Discount" size="md">
        {editingDiscount && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <Select
                value={editingDiscount.discountType}
                onChange={(value) => setEditingDiscount(prev => ({ ...prev, discountType: value }))}
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
                value={editingDiscount.amount}
                onChange={(value) => setEditingDiscount(prev => ({ ...prev, amount: parseFloat(value) || 0 }))}
                placeholder="Enter discount amount"
              />
            </div>

            {editingDiscount.discountType === 'ITEM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <Input
                  value={editingDiscount.itemName || ''}
                  onChange={(value) => setEditingDiscount(prev => ({ ...prev, itemName: value }))}
                  placeholder="Enter item name"
                />
              </div>
            )}

            {editingDiscount.discountType === 'COMPANY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Input
                  value={editingDiscount.companyName || ''}
                  onChange={(value) => setEditingDiscount(prev => ({ ...prev, companyName: value }))}
                  placeholder="Enter company name"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleEditDiscount}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountMaster;