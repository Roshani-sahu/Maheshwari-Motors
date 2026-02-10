import React, { useState, useEffect } from 'react';
import { FaFilter, FaHistory, FaFileInvoiceDollar, FaReceipt, FaMoneyBillWave, FaCheckCircle, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const firms = ['Maa Auto', 'Motors Division', 'Surat Branch'];
  const parties = ['ABC Motors', 'XYZ Parts', 'PQR Auto', 'LMN Garage', 'RST Motors'];

  const columns = [
    { key: 'transactionId', label: 'Transaction ID' },
    {
      key: 'type',
      label: 'Type',
      render: (value) => {
        const icons = {
          'Challan': <FaFileInvoiceDollar className="inline mr-1" />,
          'Bill': <FaReceipt className="inline mr-1" />,
          'Prepaid': <FaCheckCircle className="inline mr-1" />,
          'Due': <FaMoneyBillWave className="inline mr-1" />
        };
        const colors = {
          'Challan': 'bg-blue-100 text-blue-800',
          'Bill': 'bg-green-100 text-green-800',
          'Prepaid': 'bg-purple-100 text-purple-800',
          'Due': 'bg-orange-100 text-orange-800'
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
      key: 'status',
      label: 'Status',
      render: (value) => value ? (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Generated' ? 'bg-green-100 text-green-800' : value === 'Deleted' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ) : (
        <span className="text-xs text-gray-500">—</span>
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
      key: 'gstType',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, txn) => (
        <div className="flex gap-2">
          {/* <button
            onClick={() => {
              setEditingTransaction({...txn});
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete transaction ${txn.transactionId}?`)) {
                setTransactions(prev => prev.filter(t => t.id !== txn.id));
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <FaTrash size={14} />
          </button> */}
          <button
            onClick={() => {
              // Generate PDF
              const printWindow = window.open('', '', 'width=800,height=600');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Transaction ${txn.transactionId}</title>
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
                      <p><span class="label">Transaction ID:</span> ${txn.transactionId}</p>
                      <p><span class="label">Type:</span> ${txn.type}</p>
                      <p><span class="label">Firm:</span> ${txn.firm}</p>
                      <p><span class="label">Party:</span> ${txn.party}</p>
                      <p><span class="label">Date:</span> ${new Date(txn.date).toLocaleDateString()}</p>
                      <p><span class="label">Amount:</span> ₹${txn.amount.toLocaleString()}</p>
                      <p><span class="label">GST Type:</span> ${txn.gstType}</p>
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Download"
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

  // Deduplicate transactions: keep only the latest status per reference (bill/challan)
  // so if a bill is generated then deleted, show only the Deleted one
  const getLatestTransactionPerReference = (txns) => {
    const refMap = {};
    // Group transactions by reference, preferring "Deleted" status, otherwise keep the most recent
    txns.forEach(txn => {
      if (txn.reference) {
        const existingTxn = refMap[txn.reference];
        // If we haven't seen this reference, or if this one is "Deleted" and the existing isn't, update
        if (!existingTxn || (txn.status === 'Deleted' && existingTxn.status !== 'Deleted')) {
          refMap[txn.reference] = txn;
        }
      }
    });
    
    // Return transactions: keep only latest per reference, or keep all if no reference
    const latestIds = new Set(Object.values(refMap).map(txn => txn.id));
    return txns.filter(txn => {
      if (!txn.reference) return true; // keep transactions without reference
      return latestIds.has(txn.id); // keep only the latest per reference
    });
  };

  const deduplicatedTransactions = getLatestTransactionPerReference(transactions);

  const filteredTransactions = deduplicatedTransactions.filter(txn => {
    if (filters.type !== 'all' && txn.type !== filters.type) return false;
    if (filters.firm !== 'all' && txn.firm !== filters.firm) return false;
    return true;
  });

  const stats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0),
    byType: {
      Challan: filteredTransactions.filter(t => t.type === 'Challan').length,
      Bill: filteredTransactions.filter(t => t.type === 'Bill').length,
      Prepaid: filteredTransactions.filter(t => t.type === 'Prepaid').length,
      Due: filteredTransactions.filter(t => t.type === 'Due').length
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
              <FaCheckCircle className="text-purple-600" />
              <span className="text-sm font-medium">Prepaid</span>
            </div>
            <span className="text-lg font-bold text-purple-600">{stats.byType.Prepaid}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-orange-600" />
              <span className="text-sm font-medium">Due Amount</span>
            </div>
            <span className="text-lg font-bold text-orange-600">{stats.byType.Due}</span>
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
            <option value="Challan">Challan</option>
            <option value="Bill">Bill</option>
            <option value="Prepaid">Prepaid</option>
            <option value="Due">Due</option>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Transaction"
        size="md"
      >
        {editingTransaction && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                value={editingTransaction.transactionId}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={editingTransaction.type}
                onChange={(e) => setEditingTransaction(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Challan">Challan</option>
                <option value="Bill">Bill</option>
                <option value="Prepaid">Prepaid</option>
                <option value="Due">Due</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firm *</label>
              <select
                value={editingTransaction.firm}
                onChange={(e) => setEditingTransaction(prev => ({ ...prev, firm: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {firms.map(firm => (
                  <option key={firm} value={firm}>{firm}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
              <select
                value={editingTransaction.party}
                onChange={(e) => setEditingTransaction(prev => ({ ...prev, party: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Party</option>
                {parties.map(party => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                value={editingTransaction.amount}
                onChange={(e) => setEditingTransaction(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Type *</label>
              <select
                value={editingTransaction.gstType}
                onChange={(e) => setEditingTransaction(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1</option>
                <option value={0}>0</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleEditTransaction}
                disabled={!editingTransaction.party || !editingTransaction.amount}
                className="flex items-center gap-2"
              >
                <FaEdit />
                Update Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTransaction(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionHistory;
