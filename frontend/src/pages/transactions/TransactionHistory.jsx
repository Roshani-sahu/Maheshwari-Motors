import React, { useState, useEffect } from 'react';
import { FaFilter, FaFileInvoiceDollar, FaReceipt, FaMoneyBillWave, FaCheckCircle, FaDownload } from 'react-icons/fa';
import { DataTable } from '../../components/common';
import { Select, Input, Button } from '../../components/ui';
import { transactionAPI } from '../../services/api';
import useStore from '../../store';

const TransactionHistory = () => {
  const { selectedFirm, setLoading, showToast } = useStore();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
       loadTransactions();
    }
  }, [selectedFirm]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const firmId = selectedFirm._id || selectedFirm.id;
      const response = await transactionAPI.getAll(firmId);
      setTransactions(response.data?.data?.data || []);
    } catch (error) {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    firm: 'all'
  });

  const columns = [
    { 
      key: '_id', 
      label: 'Transaction ID',
      render: (value) => <span className="text-xs text-gray-500">{value.slice(-6)}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => {
        const colors = {
          'SALE': 'bg-green-100 text-green-800',
          'PURCHASE': 'bg-blue-100 text-blue-800',
          'PAYMENT_IN': 'bg-purple-100 text-purple-800',
          'PAYMENT_OUT': 'bg-orange-100 text-orange-800',
          'EXPENSE': 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colors[value] || 'bg-gray-100'}`}>
            {value}
          </span>
        );
      }
    },
    { 
        key: 'amount', 
        label: 'Amount',
        render: (value) => <span className="font-medium">₹{value?.toLocaleString()}</span>
    },
    {
      key: 'payment_mode',
      label: 'Mode',
      render: (value) => <span className="capitalize text-sm">{value}</span>
    },
    {
        key: 'date',
        label: 'Date',
        render: (value) => new Date(value).toLocaleDateString()
    },
    {
        key: 'party_id',
        label: 'Party',
        render: (value) => <span className="text-sm font-medium">{value?.name || 'N/A'}</span>
    },
    {
        key: 'description',
        label: 'Description',
        render: (value) => <span className="text-xs text-gray-500 truncate max-w-[150px] block" title={value}>{value || '-'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, txn) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              const printWindow = window.open('', '', 'width=800,height=600');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Transaction ${txn._id}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 40px; }
                      h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                      .info { margin: 20px 0; }
                      .label { font-weight: bold; display: inline-block; width: 150px; }
                    </style>
                  </head>
                  <body>
                    <h1>Transaction Details</h1>
                    <div class="info">
                      <p><span class="label">ID:</span> ${txn._id}</p>
                      <p><span class="label">Type:</span> ${txn.type}</p>
                      <p><span class="label">Amount:</span> ₹${txn.amount}</p>
                      <p><span class="label">Mode:</span> ${txn.payment_mode}</p>
                      <p><span class="label">Date:</span> ${new Date(txn.date).toLocaleDateString()}</p>
                      <p><span class="label">Party:</span> ${txn.party_id?.name || 'N/A'}</p>
                      <p><span class="label">Description:</span> ${txn.description || '-'}</p>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Download Receipt"
          >
            <FaDownload size={14} />
          </button>
        </div>
      )
    }
  ];

  // const handleEditTransaction = () => {
  //   setTransactions(prev => prev.map(t => 
  //     t.id === editingTransaction.id ? {...editingTransaction, amount: parseFloat(editingTransaction.amount)} : t
  //   ));
  //   setIsEditModalOpen(false);
  //   setEditingTransaction(null);
  //   alert('Transaction updated successfully!');
  // };

  const filteredTransactions = transactions.filter(txn => {
    if (filters.type !== 'all' && txn.type !== filters.type) return false;
    // Firm filter might not work if firm name is not populated, but we are fetching for selectedFirm anyway.
    // If we want to filter by other firms (global view), we need to fetch all firms' transactions which current API might not support directly 
    // without iterating. But here we are fetching transactions for 'selectedFirm'.
    // So filter by firm is redundant unless we have mixed data.
    // Let's assume we are ignoring firm filter for now as we are scoped to selectedFirm.
    if (filters.dateFrom) {
        const txnDate = new Date(txn.date).setHours(0,0,0,0);
        const filterDate = new Date(filters.dateFrom).setHours(0,0,0,0);
        if (txnDate < filterDate) return false;
    }
    return true;
  });

  const stats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
    byType: {
      SALE: filteredTransactions.filter(t => t.type === 'SALE').length,
      PURCHASE: filteredTransactions.filter(t => t.type === 'PURCHASE').length,
      PAYMENT_IN: filteredTransactions.filter(t => t.type === 'PAYMENT_IN').length,
      PAYMENT_OUT: filteredTransactions.filter(t => t.type === 'PAYMENT_OUT').length,
      EXPENSE: filteredTransactions.filter(t => t.type === 'EXPENSE').length
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600">Unified history of all transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-green-800">Total Amount</h3>
          <p className="text-2xl font-bold text-green-900">₹{(stats.totalAmount / 100000).toFixed(1)}L</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-3">Transaction Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-green-600" />
              <span className="text-sm font-medium">Sales</span>
            </div>
            <span className="text-lg font-bold text-green-600">{stats.byType.SALE}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-600" />
              <span className="text-sm font-medium">Purchases</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{stats.byType.PURCHASE}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-purple-600" />
              <span className="text-sm font-medium">Received</span>
            </div>
            <span className="text-lg font-bold text-purple-600">{stats.byType.PAYMENT_IN}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-orange-600" />
              <span className="text-sm font-medium">Paid</span>
            </div>
            <span className="text-lg font-bold text-orange-600">{stats.byType.PAYMENT_OUT}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.type}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <option value="all">All Types</option>
            <option value="SALE">Sale</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PAYMENT_IN">Payment In</option>
            <option value="PAYMENT_OUT">Payment Out</option>
            <option value="EXPENSE">Expense</option>
          </Select>
          
          <Select
            value={filters.firm} // This is likely redundant as we don't have multiple firms in filteredTransactions usually, but kept for consistency
            onChange={(value) => setFilters(prev => ({ ...prev, firm: value }))}
            disabled={true} // Disable strict firm filter as we are already firmly scoped
          >
             <option value="all">Current Firm</option>
          </Select>
          
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
            placeholder="From Date"
          />
          
          <Button
            variant="outline"
            onClick={() => setFilters({
              dateFrom: '', dateTo: '', type: 'all', firm: 'all'
            })}
          >
            Clear All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchable={true}
        sortable={true}
        pagination={true}
        pageSize={15}
      />
    </div>
  );
};

export default TransactionHistory;
