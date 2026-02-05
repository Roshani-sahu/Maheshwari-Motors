import React, { useState } from 'react';
import { FaFilter, FaHistory, FaFileInvoiceDollar, FaReceipt, FaMoneyBillWave } from 'react-icons/fa';
import { DataTable } from '../../components/common';
import { Select, Input, Button } from '../../components/ui';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      transactionId: 'TXN001',
      type: 'Challan',
      firm: 'Maa Auto',
      gstFlag: 0, // GST
      amount: 25000,
      date: '2024-01-15',
      party: 'ABC Motors',
      status: 'Completed'
    },
    {
      id: 2,
      transactionId: 'TXN002',
      type: 'Bill',
      firm: 'Motors Division',
      gstFlag: 1, // NON-GST
      amount: 18500,
      date: '2024-01-15',
      party: 'XYZ Parts',
      status: 'Completed'
    },
    {
      id: 3,
      transactionId: 'TXN003',
      type: 'Payment',
      firm: 'Maa Auto',
      gstFlag: 0, // GST
      amount: 15000,
      date: '2024-01-14',
      party: 'PQR Auto',
      status: 'Pending'
    },
    {
      id: 4,
      transactionId: 'TXN004',
      type: 'Challan',
      firm: 'Surat Branch',
      gstFlag: 0, // GST
      amount: 32000,
      date: '2024-01-14',
      party: 'LMN Garage',
      status: 'Completed'
    },
    {
      id: 5,
      transactionId: 'TXN005',
      type: 'Bill',
      firm: 'Motors Division',
      gstFlag: 1, // NON-GST
      amount: 28000,
      date: '2024-01-13',
      party: 'RST Motors',
      status: 'Completed'
    }
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all', // all, Challan, Bill, Payment
    firm: 'all',
    gstType: 'all', // all, gst, non-gst
    status: 'all'
  });

  const firms = ['Maa Auto', 'Motors Division', 'Surat Branch'];

  const columns = [
    { key: 'transactionId', label: 'Transaction ID' },
    {
      key: 'type',
      label: 'Type',
      render: (value) => {
        const icons = {
          'Challan': <FaFileInvoiceDollar className="inline mr-1" />,
          'Bill': <FaReceipt className="inline mr-1" />,
          'Payment': <FaMoneyBillWave className="inline mr-1" />
        };
        const colors = {
          'Challan': 'bg-blue-100 text-blue-800',
          'Bill': 'bg-green-100 text-green-800',
          'Payment': 'bg-purple-100 text-purple-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colors[value]}`}>
            {icons[value]}
            {value}
          </span>
        );
      }
    },
    { key: 'firm', label: 'Firm' },
    {
      key: 'gstFlag',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { key: 'party', label: 'Party' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  // Apply filters
  const filteredTransactions = transactions.filter(txn => {
    if (filters.type !== 'all' && txn.type !== filters.type) return false;
    if (filters.firm !== 'all' && txn.firm !== filters.firm) return false;
    if (filters.status !== 'all' && txn.status !== filters.status) return false;
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((txn.gstFlag === 0) !== isGst) return false;
    }
    return true;
  });

  // Calculate summary stats
  const stats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0),
    byType: {
      Challan: filteredTransactions.filter(t => t.type === 'Challan').length,
      Bill: filteredTransactions.filter(t => t.type === 'Bill').length,
      Payment: filteredTransactions.filter(t => t.type === 'Payment').length
    },
    byGst: {
      gst: filteredTransactions.filter(t => t.gstFlag === 0).length,
      nonGst: filteredTransactions.filter(t => t.gstFlag === 1).length
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-blue-800">Total Transactions</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-green-800">Total Amount</h3>
          <p className="text-2xl font-bold text-green-900">₹{(stats.totalAmount / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-l-purple-500">
          <h3 className="text-sm font-medium text-purple-800">GST Transactions</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.byGst.gst}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-l-orange-500">
          <h3 className="text-sm font-medium text-orange-800">NON-GST Transactions</h3>
          <p className="text-2xl font-bold text-orange-900">{stats.byGst.nonGst}</p>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-3">Transaction Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-600" />
              <span className="text-sm font-medium">Challans</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{stats.byType.Challan}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-green-600" />
              <span className="text-sm font-medium">Bills</span>
            </div>
            <span className="text-lg font-bold text-green-600">{stats.byType.Bill}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-purple-600" />
              <span className="text-sm font-medium">Payments</span>
            </div>
            <span className="text-lg font-bold text-purple-600">{stats.byType.Payment}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Select
            value={filters.type}
            onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <option value="all">All Types</option>
            <option value="Challan">Challan</option>
            <option value="Bill">Bill</option>
            <option value="Payment">Payment</option>
          </Select>
          
          <Select
            value={filters.firm}
            onChange={(value) => setFilters(prev => ({ ...prev, firm: value }))}
          >
            <option value="all">All Firms</option>
            {firms.map(firm => (
              <option key={firm} value={firm}>{firm}</option>
            ))}
          </Select>
          
          <Select
            value={filters.gstType}
            onChange={(value) => setFilters(prev => ({ ...prev, gstType: value }))}
          >
            <option value="all">All GST Types</option>
            <option value="gst">GST</option>
            <option value="non-gst">NON-GST</option>
          </Select>
          
          <Select
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
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
              dateFrom: '', dateTo: '', type: 'all', firm: 'all', gstType: 'all', status: 'all'
            })}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Transaction Table */}
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