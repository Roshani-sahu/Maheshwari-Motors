import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilter, FaPercent, FaMoneyBillWave, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, Toggle } from '../../components/common';
import { Button, Input, Select } from '../../components/ui';
import { transactionAPI, discountAPI } from '../../services/api';
import useStore from '../../store';

const AccountMaster = () => {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | discounts
  const { selectedFirm, setLoading, showToast } = useStore();
  
  const [transactions, setTransactions] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
       loadData();
    }
  }, [selectedFirm, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const firmId = selectedFirm._id || selectedFirm.id;
      if (activeTab === 'transactions') {
        const response = await transactionAPI.getAll(firmId);
        setTransactions(response.data?.data?.data || []);
      } else {
        const response = await discountAPI.getAll(firmId);
        setDiscounts(response.data?.data?.data || []);
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const transactionActions = [
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: async (transaction) => {
        if (window.confirm(`Are you sure you want to delete transaction "${transaction.transactionId}"?`)) {
          setLoading(true);
          try {
            await transactionAPI.delete(transaction._id);
            showToast('Transaction deleted successfully', 'success');
            loadData();
          } catch (error) {
            showToast('Failed to delete transaction', 'error');
          } finally {
            setLoading(false);
          }
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
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
      onClick: async (discount) => {
        if (window.confirm('Delete discount?')) {
            setLoading(true);
            try {
                await discountAPI.delete(discount._id);
                showToast('Discount deleted', 'success');
                loadData();
            } catch (error) {
                showToast('Failed to delete discount', 'error');
            } finally {
                setLoading(false);
            }
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  // Apply filters to transactions
  const filteredTransactions = transactions.filter(txn => {
    if (filters.firm && !txn.firm?.toLowerCase().includes(filters.firm.toLowerCase())) return false;
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((txn.gstFlag === 0) !== isGst) return false;
    }
    return true;
  });

  const handleAddDiscount = async () => {
    if (!newDiscount.amount) {
      showToast('Amount is required', 'error');
      return;
    }
    
    setLoading(true);
    try {
        // Note: This will fail because backend needs item_id/party_id (ObjectId)
        // but we only have text names. This needs dropdown implementation.
        const discountData = {
            type: newDiscount.discountType === 'ITEM' ? 'item' : 'party',
            value: parseFloat(newDiscount.amount),
            discount_type: 'fixed' // Default to fixed, should be selectable in UI
        };
        
        // Backend requires item_id or party_id but we don't have them
        // This will likely return 400 error
        await discountAPI.create(discountData);

        showToast('Discount added', 'success');
        setNewDiscount({ discountType: 'ITEM', amount: '', itemName: '', companyName: '' });
        setIsAddDiscountModalOpen(false);
        loadData();
    } catch (error) {
        showToast(error.response?.data?.message || 'Failed to add discount. Item/Party ID required.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleEditDiscount = async () => {
    if (editingDiscount) {
        setLoading(true);
        try {
            // Note: Backend needs item_id/party_id which we don't have
            await discountAPI.update(editingDiscount._id, {
                type: editingDiscount.discountType === 'ITEM' ? 'item' : 'party',
                value: parseFloat(editingDiscount.amount),
                discount_type: 'fixed'
            });
            showToast('Discount updated', 'success');
            setIsEditDiscountModalOpen(false);
            setEditingDiscount(null);
            loadData();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update discount', 'error');
        } finally {
            setLoading(false);
        }
    }
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
              onChange={(value) => setNewDiscount(prev => ({ ...prev, discountType: value }))}
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
              className="text-xs sm:text-sm"
            />
          </div>

          {newDiscount.discountType === 'ITEM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <Input
                value={newDiscount.itemName}
                onChange={(value) => setNewDiscount(prev => ({ ...prev, itemName: value }))}
                placeholder="Enter item name"
                className="text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
              />
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
      <Modal isOpen={isEditDiscountModalOpen} onClose={() => setIsEditDiscountModalOpen(false)} title="Edit Discount" size="sm md:md">
        {editingDiscount && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <Select
                value={editingDiscount.discountType}
                onChange={(value) => setEditingDiscount(prev => ({ ...prev, discountType: value }))}
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
                <Input
                  value={editingDiscount.itemName || ''}
                  onChange={(value) => setEditingDiscount(prev => ({ ...prev, itemName: value }))}
                  placeholder="Enter item name"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>
            )}

            {editingDiscount.discountType === 'COMPANY' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <Input
                  value={editingDiscount.companyName || ''}
                  onChange={(value) => setEditingDiscount(prev => ({ ...prev, companyName: value }))}
                  placeholder="Enter company name"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button onClick={handleEditDiscount} className="text-xs sm:text-sm py-1.5 sm:py-2">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditDiscountModalOpen(false)} className="text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountMaster;