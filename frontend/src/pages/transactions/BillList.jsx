import React, { useState } from 'react';
import { FaEye, FaFileInvoiceDollar, FaFilter, FaLink } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Select, Input } from '../../components/ui';

const BillList = () => {
  const [bills, setBills] = useState([
    {
      id: 1,
      billNo: 'B001',
      date: '2024-01-15',
      party: 'ABC Motors',
      amount: 25000,
      linkedChallans: ['CH001', 'CH002'],
      gstFlag: 0, // GST
      status: 'Paid'
    },
    {
      id: 2,
      billNo: 'B002',
      date: '2024-01-14',
      party: 'XYZ Parts',
      amount: 18500,
      linkedChallans: ['CH003'],
      gstFlag: 1, // NON-GST
      status: 'Pending'
    },
    {
      id: 3,
      billNo: 'B003',
      date: '2024-01-13',
      party: 'PQR Auto',
      amount: 32000,
      linkedChallans: ['CH004', 'CH005', 'CH006'],
      gstFlag: 0, // GST
      status: 'Overdue'
    }
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: '',
    status: 'all',
    gstType: 'all'
  });

  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const columns = [
    { key: 'billNo', label: 'Bill No' },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { key: 'party', label: 'Party' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'linkedChallans',
      label: 'Linked Challans',
      render: (value) => (
        <div className="flex items-center gap-1">
          <FaLink className="text-gray-400 text-xs" />
          <span className="text-sm">{value.length} challan(s)</span>
        </div>
      )
    },
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
      key: 'status',
      label: 'Status',
      render: (value) => {
        const colors = {
          'Paid': 'bg-green-100 text-green-800',
          'Pending': 'bg-yellow-100 text-yellow-800',
          'Overdue': 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colors[value]}`}>
            {value}
          </span>
        );
      }
    }
  ];

  const actions = [
    {
      label: 'View',
      onClick: (bill) => {
        setSelectedBill(bill);
        setIsViewModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: 'Print',
      onClick: (bill) => console.log('Print bill:', bill.billNo),
      className: 'bg-gray-600 text-white hover:bg-gray-700'
    }
  ];

  // Apply filters
  const filteredBills = bills.filter(bill => {
    if (filters.party && !bill.party.toLowerCase().includes(filters.party.toLowerCase())) return false;
    if (filters.status !== 'all' && bill.status !== filters.status) return false;
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((bill.gstFlag === 0) !== isGst) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill List</h1>
          <p className="text-gray-600">View and manage final bills</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-blue-800">Total Bills</h3>
          <p className="text-2xl font-bold text-blue-900">{bills.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-green-800">Paid Bills</h3>
          <p className="text-2xl font-bold text-green-900">
            {bills.filter(b => b.status === 'Paid').length}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-l-yellow-500">
          <h3 className="text-sm font-medium text-yellow-800">Pending Bills</h3>
          <p className="text-2xl font-bold text-yellow-900">
            {bills.filter(b => b.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-l-red-500">
          <h3 className="text-sm font-medium text-red-800">Overdue Bills</h3>
          <p className="text-2xl font-bold text-red-900">
            {bills.filter(b => b.status === 'Overdue').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            placeholder="Search party..."
            value={filters.party}
            onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </Select>
          <Select
            value={filters.gstType}
            onChange={(e) => setFilters(prev => ({ ...prev, gstType: e.target.value }))}
          >
            <option value="all">All GST Types</option>
            <option value="gst">GST</option>
            <option value="non-gst">NON-GST</option>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <Button
            variant="outline"
            onClick={() => setFilters({
              dateFrom: '', dateTo: '', party: '', status: 'all', gstType: 'all'
            })}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Bills Table */}
      <DataTable
        columns={columns}
        data={filteredBills}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* View Bill Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Bill Details - ${selectedBill?.billNo}`}
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bill No</label>
                <p className="text-gray-900 font-medium">{selectedBill.billNo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{new Date(selectedBill.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Party</label>
                <p className="text-gray-900">{selectedBill.party}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900 font-bold">₹{selectedBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBill.gstFlag === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedBill.gstFlag}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  selectedBill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedBill.status}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Linked Challans</label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {selectedBill.linkedChallans.map((challan, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {challan}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex items-center gap-2">
                <FaFileInvoiceDollar />
                Print Bill
              </Button>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillList;