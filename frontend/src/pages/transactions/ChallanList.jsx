import React, { useState } from 'react';
import { FaEye, FaCheck, FaFileInvoiceDollar, FaFilter } from 'react-icons/fa';
import { DataTable, Modal, Toggle } from '../../components/common';
import { Button, Select } from '../../components/ui';

const ChallanList = () => {
  const [challans, setChallans] = useState([
    {
      id: 1,
      challanNo: 'CH001',
      date: '2024-01-15',
      party: 'ABC Motors',
      items: ['Engine Oil', 'Brake Pads'],
      amount: 25000,
      approval: false,
      gstFlag: 0 // GST
    },
    {
      id: 2,
      challanNo: 'CH002',
      date: '2024-01-15',
      party: 'XYZ Parts',
      items: ['Air Filter', 'Spark Plugs'],
      amount: 18500,
      approval: true,
      gstFlag: 1 // NON-GST
    },
    {
      id: 3,
      challanNo: 'CH003',
      date: '2024-01-14',
      party: 'PQR Auto',
      items: ['Transmission Fluid'],
      amount: 32000,
      approval: false,
      gstFlag: 0 // GST
    }
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: '',
    approval: 'all', // all, approved, pending
    gstType: 'all' // all, gst, non-gst
  });

  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const columns = [
    {
      key: 'challanNo',
      label: 'Challan No'
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'party',
      label: 'Party'
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => `${value.length} item(s)`
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'gstFlag',
      label: 'GST Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 0 ? 'GST' : 'NON-GST'}
        </span>
      )
    },
    {
      key: 'approval',
      label: 'Approval',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value ? 'Approved' : 'Pending'}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'View',
      onClick: (challan) => {
        setSelectedChallan(challan);
        setIsViewModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: 'Approve',
      onClick: (challan) => handleApprove(challan.id),
      className: 'bg-green-600 text-white hover:bg-green-700'
    },
    {
      label: 'Convert to Bill',
      onClick: (challan) => handleConvertToBill(challan.id),
      className: 'bg-purple-600 text-white hover:bg-purple-700'
    }
  ];

  const handleApprove = (challanId) => {
    setChallans(prev => prev.map(challan => 
      challan.id === challanId ? { ...challan, approval: true } : challan
    ));
  };

  const handleConvertToBill = (challanId) => {
    const challan = challans.find(c => c.id === challanId);
    if (challan && challan.approval) {
      // Navigate to bill generation or create bill
      console.log('Converting challan to bill:', challan.challanNo);
    } else {
      alert('Challan must be approved before converting to bill');
    }
  };

  // Apply filters
  const filteredChallans = challans.filter(challan => {
    if (filters.approval !== 'all') {
      const isApproved = filters.approval === 'approved';
      if (challan.approval !== isApproved) return false;
    }
    
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((challan.gstFlag === 0) !== isGst) return false;
    }
    
    if (filters.party && !challan.party.toLowerCase().includes(filters.party.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan List</h1>
          <p className="text-gray-600">Manage delivery challans and approvals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party
            </label>
            <input
              type="text"
              value={filters.party}
              onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
              placeholder="Search party..."
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approval Status
            </label>
            <Select
              value={filters.approval}
              onChange={(e) => setFilters(prev => ({ ...prev, approval: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Type
            </label>
            <Select
              value={filters.gstType}
              onChange={(e) => setFilters(prev => ({ ...prev, gstType: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="gst">GST</option>
              <option value="non-gst">NON-GST</option>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({
                dateFrom: '',
                dateTo: '',
                party: '',
                approval: 'all',
                gstType: 'all'
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <DataTable
        columns={columns}
        data={filteredChallans}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Challan Details - ${selectedChallan?.challanNo}`}
        size="lg"
      >
        {selectedChallan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Challan No</label>
                <p className="text-gray-900">{selectedChallan.challanNo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{new Date(selectedChallan.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Party</label>
                <p className="text-gray-900">{selectedChallan.party}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900">₹{selectedChallan.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GST Type</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedChallan.gstFlag === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedChallan.gstFlag === 0 ? 'GST' : 'NON-GST'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedChallan.approval ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedChallan.approval ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
              <ul className="list-disc list-inside space-y-1">
                {selectedChallan.items.map((item, index) => (
                  <li key={index} className="text-gray-900">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChallanList;