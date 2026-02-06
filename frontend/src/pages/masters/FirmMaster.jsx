import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';

const FirmMaster = () => {
  const navigate = useNavigate();
  const { firms, setFirms, deleteFirm } = useStore();

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
      width: '60px' // Mobile pe thodi width increase
    },
{
  key: 'name',
  label: 'Firm Name',
  width: '180px'
},
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 0 ? '1' : '0'}
        </span>
      ),
      width: '70px' // Mobile pe thodi width increase
    },
    {
      key: 'city',
      label: 'City',
      width: '100px' // Mobile pe thodi width increase
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '120px' // Mobile pe thodi width increase
    },
    {
      key: 'email',
      label: 'Email',
      width: '150px' // Mobile pe thodi width increase
    },
    {
      key: 'gstin',
      label: 'GSTIN',
      render: (value) => value || 'N/A',
      width: '140px' // Mobile pe thodi width increase
    }
  ];

  const actions = [
    {
      label: <FaEdit size={12} className="sm:size-4" />,
      onClick: (firm) => navigate(`/masters/firm-master/edit/${firm.id}`),
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1.5 sm:p-2'
    },
    {
      label: <FaTrash size={12} className="sm:size-4" />,
      onClick: (firm) => {
        if (window.confirm(`Are you sure you want to delete "${firm.name}"?`)) {
          deleteFirm(firm.id);
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700 p-1.5 sm:p-2'
    }
  ];

  return (
    <div className="space-y-6">
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

      {/* Firms Table */}
      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={firms}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          minWidth="800px" // Minimum width for better mobile scrolling
        />
      </div>
    </div>
  );
};

export default FirmMaster;