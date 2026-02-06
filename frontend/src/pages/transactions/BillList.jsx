import React, { useState, useEffect } from 'react';
import { FaEye, FaFileInvoiceDollar, FaFilter, FaLink, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Select, Input } from '../../components/ui';
import useStore from '../../store';

const BillList = () => {
  const { bills: storeBills } = useStore();
  const [bills, setBills] = useState([
    {
      id: 1,
      billNo: 'B001',
      date: '2024-01-15',
      party: 'ABC Motors',
      amount: 25000,
      linkedChallans: ['CH001', 'CH002'],
      gstType: 1
    },
    {
      id: 2,
      billNo: 'B002',
      date: '2024-01-14',
      party: 'XYZ Parts',
      amount: 18500,
      linkedChallans: ['CH003'],
      gstType: 0
    },
    {
      id: 3,
      billNo: 'B003',
      date: '2024-01-13',
      party: 'PQR Auto',
      amount: 32000,
      linkedChallans: ['CH004', 'CH005', 'CH006'],
      gstType: 1
    }
  ]);

  useEffect(() => {
    console.log('BillList - Store bills updated:', storeBills);
    setBills(prev => {
      const newBills = storeBills.filter(sb => !prev.some(b => b.id === sb.id));
      console.log('BillList - New bills to add:', newBills);
      return newBills.length > 0 ? [...prev, ...newBills] : prev;
    });
  }, [storeBills]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: ''
  });

  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const parties = ['ABC Motors', 'XYZ Parts', 'PQR Auto', 'LMN Garage', 'RST Motors'];

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
      render: (value, bill) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingBill({...bill});
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete bill ${bill.billNo}?`)) {
                setBills(prev => prev.filter(b => b.id !== bill.id));
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
          <button
            onClick={() => {
              // Generate PDF
              const printWindow = window.open('', '', 'width=800,height=600');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Bill ${bill.billNo}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 40px; }
                      h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                      .info { margin: 20px 0; }
                      .label { font-weight: bold; display: inline-block; width: 150px; }
                      .challans { margin-top: 20px; }
                      .challans ul { list-style: none; padding: 0; }
                      .challans li { padding: 5px 0; border-bottom: 1px solid #eee; }
                    </style>
                  </head>
                  <body>
                    <h1>Bill Details</h1>
                    <div class="info">
                      <p><span class="label">Bill No:</span> ${bill.billNo}</p>
                      <p><span class="label">Date:</span> ${new Date(bill.date).toLocaleDateString()}</p>
                      <p><span class="label">Party:</span> ${bill.party}</p>
                      <p><span class="label">Amount:</span> ₹${bill.amount.toLocaleString()}</p>
                      <p><span class="label">Type:</span> ${bill.gstType}</p>
                    </div>
                    <div class="challans">
                      <h3>Linked Challans:</h3>
                      <ul>
                        ${bill.linkedChallans.map(challan => `<li>${challan}</li>`).join('')}
                      </ul>
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

  const actions = [
    {
      icon: FaEdit,
      onClick: (bill) => {
        console.log('Edit bill:', bill.billNo);
        alert(`Edit ${bill.billNo}`);
      },
      className: 'text-green-600 hover:text-green-700',
      title: 'Edit'
    },
    {
      icon: FaTrash,
      onClick: (bill) => {
        if (confirm(`Delete bill ${bill.billNo}?`)) {
          setBills(prev => prev.filter(b => b.id !== bill.id));
        }
      },
      className: 'text-red-600 hover:text-red-700',
      title: 'Delete'
    },
    {
      icon: FaDownload,
      onClick: (bill) => {
        console.log('Download bill:', bill.billNo);
        alert(`Downloading ${bill.billNo}`);
      },
      className: 'text-blue-600 hover:text-blue-700',
      title: 'Download'
    }
  ];

  const handleEditBill = () => {
    setBills(prev => prev.map(b => 
      b.id === editingBill.id ? {...editingBill, amount: parseFloat(editingBill.amount)} : b
    ));
    setIsEditModalOpen(false);
    setEditingBill(null);
    alert('Bill updated successfully!');
  };

  // Apply filters
  const filteredBills = bills.filter(bill => {
    if (filters.party && !bill.party.toLowerCase().includes(filters.party.toLowerCase())) return false;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-blue-800">Total Bills</h3>
          <p className="text-2xl font-bold text-blue-900">{bills.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-green-800">Total Amount</h3>
          <p className="text-2xl font-bold text-green-900">
            ₹{bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search party..."
            value={filters.party}
            onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <Button
            variant="outline"
            onClick={() => setFilters({
              dateFrom: '', dateTo: '', party: ''
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

      {/* Edit Bill Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Bill"
        size="md"
      >
        {editingBill && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill No</label>
              <input
                type="text"
                value={editingBill.billNo}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
              <select
                value={editingBill.party}
                onChange={(e) => setEditingBill(prev => ({ ...prev, party: e.target.value }))}
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
                value={editingBill.amount}
                onChange={(e) => setEditingBill(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={editingBill.gstType}
                onChange={(e) => setEditingBill(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1</option>
                <option value={0}>0</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleEditBill}
                disabled={!editingBill.party || !editingBill.amount}
                className="flex items-center gap-2"
              >
                <FaEdit />
                Update Bill
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBill(null);
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

export default BillList;