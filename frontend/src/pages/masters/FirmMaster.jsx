import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';

const FirmMaster = () => {
  const navigate = useNavigate();
  const { firms, setFirms, deleteFirm } = useStore();
  const [gstFilter, setGstFilter] = useState('all');

  // Initialize with sample data if empty
  useEffect(() => {
    if (firms.length === 0) {
      setFirms([
        {
          id: 1,
          name: 'Maa Auto',
          type: 0, // non gst
          address: '123 Main St, Surat',
          phone: '9876543210',
          city: 'Surat',
          state: 'Gujarat',
          email: 'maa@auto.com',
          gstin: '24ABCDE1234F1Z5'
        },
        {
          id: 2,
          name: 'Motors Division',
          type: 1, // GST
          address: '456 Park Ave, Mumbai',
          phone: '9876543211',
          city: 'Mumbai',
          state: 'Maharashtra',
          email: 'motors@division.com',
          gstin: ''
        },
        {
          id: 3,
          name: 'Surat Branch',
          type: 0, // GST
          address: '789 Commerce St, Surat',
          phone: '9876543212',
          city: 'Surat',
          state: 'Gujarat',
          email: 'surat@branch.com',
          gstin: '24FGHIJ5678K2L6'
        }
      ]);
    }
  }, [firms.length, setFirms]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '50px',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'name',
      label: 'Firm Name',
      width: '180px',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 1 ? '1 ' : '0 '}
        </span>
      ),
      width: '60px'
    },
    {
      key: 'city',
      label: 'City',
      width: '90px',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '110px',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'email',
      label: 'Email',
      width: '140px',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    {
      key: 'gstin',
      label: 'GSTIN',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value || 'N/A'}</span>,
      width: '130px'
    }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (firm) => navigate(`/masters/firm-master/edit/${firm.id}`),
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (firm) => {
        if (window.confirm(`Are you sure you want to delete "${firm.name}"?`)) {
          deleteFirm(firm.id);
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const filteredFirms = firms.filter(firm => {
    if (gstFilter !== 'all' && firm.type !== parseInt(gstFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Firm Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Manage your business firms (GST / NON-GST)
          </p>
        </div>
        <Button
          onClick={() => navigate('/masters/firm-master/add')}
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <FaPlus className="text-sm sm:text-base" />
          Add Firm
        </Button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
          <select
            value={gstFilter}
            onChange={(e) => setGstFilter(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="1">1 (GST)</option>
            <option value="0">0 (Non GST)</option>
          </select>
        </div>
      </div>

      {/* Firms Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={filteredFirms}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          minWidth="750px"
          className="text-xs sm:text-sm"
        />
      </div>
    </div>
  );
};

export default FirmMaster;