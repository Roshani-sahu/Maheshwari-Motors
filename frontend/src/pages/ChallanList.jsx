import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaCheck, FaTimes, FaFileInvoiceDollar } from 'react-icons/fa';
import { DataTable, Button, Select, Input, FormField } from '../components/ui';
import useStore from '../store';
import { formatCurrency, formatDate } from '../utils';

const ChallanList = () => {
  const navigate = useNavigate();
  const { selectedFirm, showToast, showConfirm } = useStore();
  
  const [challans] = useState([
    {
      id: 1,
      challanNo: 'CH001',
      date: '2025-01-15',
      party: 'ABC Motors',
      items: 3,
      amount: 2850,
      status: 'Draft',
      createdBy: 'Admin'
    },
    {
      id: 2,
      challanNo: 'CH002',
      date: '2025-01-15',
      party: 'XYZ Parts',
      items: 2,
      amount: 1650,
      status: 'Approved',
      createdBy: 'Admin'
    },
    {
      id: 3,
      challanNo: 'CH003',
      date: '2025-01-14',
      party: 'PQR Garage',
      items: 5,
      amount: 4200,
      status: 'Billed',
      createdBy: 'User1'
    }
  ]);

  const [filters, setFilters] = useState({
    status: '',
    party: '',
    dateFrom: '',
    dateTo: ''
  });

  const [selectedChallans, setSelectedChallans] = useState([]);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Billed', label: 'Billed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Draft': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Billed': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status]}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: 'challanNo',
      label: 'Challan No.',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/generate-challan?edit=${row.id}`)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {value}
        </button>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'party',
      label: 'Party'
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => `${value} items`
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'createdBy',
      label: 'Created By'
    }
  ];

  const filteredChallans = challans.filter(challan => {
    if (filters.status && challan.status !== filters.status) return false;
    if (filters.party && !challan.party.toLowerCase().includes(filters.party.toLowerCase())) return false;
    if (filters.dateFrom && challan.date < filters.dateFrom) return false;
    if (filters.dateTo && challan.date > filters.dateTo) return false;
    return true;
  });

  const handleBulkApprove = () => {
    const draftChallans = selectedChallans.filter(challan => challan.status === 'Draft');
    if (draftChallans.length === 0) {
      showToast('No draft challans selected', 'warning');
      return;
    }

    showConfirm(
      `Approve ${draftChallans.length} selected challans?`,
      () => {
        // Mock bulk approve
        showToast(`${draftChallans.length} challans approved successfully`, 'success');
        setSelectedChallans([]);
      }
    );
  };

  const handleBulkBill = () => {
    const approvedChallans = selectedChallans.filter(challan => challan.status === 'Approved');
    if (approvedChallans.length === 0) {
      showToast('No approved challans selected', 'warning');
      return;
    }

    navigate('/challan-posting', { 
      state: { selectedChallans: approvedChallans } 
    });
  };

  const handleEdit = (challan) => {
    if (challan.status === 'Billed') {
      showToast('Cannot edit billed challan', 'error');
      return;
    }
    navigate(`/generate-challan?edit=${challan.id}`);
  };

  const handleView = (challan) => {
    // Mock view functionality - could open a modal or navigate to view page
    showToast('View functionality will be implemented', 'info');
  };

  const handleDelete = (challan) => {
    if (challan.status === 'Billed') {
      showToast('Cannot delete billed challan', 'error');
      return;
    }

    showConfirm(
      `Delete challan ${challan.challanNo}?`,
      () => {
        // Mock delete
        showToast('Challan deleted successfully', 'success');
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan List</h1>
          <p className="text-gray-600">
            Manage delivery challans for {selectedFirm?.name}
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/generate-challan')}
          className="flex items-center gap-2"
        >
          <FaPlus className="text-xs" />
          New Challan
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <FormField label="Status">
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={statusOptions}
              placeholder="All Status"
            />
          </FormField>
          
          <FormField label="Party">
            <Input
              value={filters.party}
              onChange={(value) => setFilters(prev => ({ ...prev, party: value }))}
              placeholder="Search party..."
            />
          </FormField>
          
          <FormField label="Date From">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(value) => setFilters(prev => ({ ...prev, dateFrom: value }))}
            />
          </FormField>
          
          <FormField label="Date To">
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(value) => setFilters(prev => ({ ...prev, dateTo: value }))}
            />
          </FormField>
          
          <FormField label="Actions">
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', party: '', dateFrom: '', dateTo: '' })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </FormField>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedChallans.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedChallans.length} challans selected
            </span>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                className="flex items-center gap-2"
              >
                <FaCheck className="text-xs" />
                Approve Selected
              </Button>
              
              <Button
                size="sm"
                onClick={handleBulkBill}
                className="flex items-center gap-2"
              >
                <FaFileInvoiceDollar className="text-xs" />
                Post to Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Challans Table */}
      <DataTable
        data={filteredChallans}
        columns={columns}
        selectable={true}
        onSelectionChange={setSelectedChallans}
        onEdit={handleEdit}
        onDelete={handleDelete}
        className="shadow-sm"
      />

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Challans</p>
            <p className="text-xl font-bold text-gray-900">{filteredChallans.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-xl font-bold text-yellow-600">
              {filteredChallans.filter(c => c.status === 'Draft').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-xl font-bold text-green-600">
              {filteredChallans.filter(c => c.status === 'Approved').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(filteredChallans.reduce((sum, c) => sum + c.amount, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanList;