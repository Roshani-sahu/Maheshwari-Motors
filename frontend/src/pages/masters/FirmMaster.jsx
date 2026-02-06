import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit } from 'react-icons/fa';
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
      label: 'ID'
    },
    {
      key: 'name',
      label: 'Firm Name'
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
      )
    },
    {
      key: 'city',
      label: 'City'
    },
    {
      key: 'phone',
      label: 'Phone'
    },
    {
      key: 'email',
      label: 'Email'
    },
    {
      key: 'gstin',
      label: 'GSTIN',
      render: (value) => value || 'N/A'
    }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: (firm) => navigate(`/masters/firm-master/edit/${firm.id}`),
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      label: 'Delete',
      onClick: (firm) => {
        if (window.confirm(`Are you sure you want to delete "${firm.name}"?`)) {
          deleteFirm(firm.id);
        }
      },
      className: 'bg-red-600 text-white hover:bg-red-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firm Master</h1>
          <p className="text-gray-600">Manage your business firms (GST / NON-GST)</p>
        </div>
        <Button
          onClick={() => navigate('/masters/firm-master/add')}
          className="flex items-center gap-2"
        >
          <FaPlus />
          Add Firm
        </Button>
      </div>

      {/* Firms Table */}
      <DataTable
        columns={columns}
        data={firms}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
      />
    </div>
  );
};

export default FirmMaster;