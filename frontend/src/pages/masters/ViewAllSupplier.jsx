import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { accountAPI } from '../../services/api'; 
import useStore from '../../store';

const ViewAllSupplier = () => {
  const { selectedFirm, setLoading, showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
        loadSuppliers();
    }
  }, [selectedFirm]);

  const loadSuppliers = async () => {
      setLoading(true);
      try {
          const firmId = selectedFirm._id || selectedFirm.id;
          const response = await accountAPI.getAll(firmId);
          // Filter only suppliers if endpoint returns mixed
          const allParties = response.data?.data?.data || [];
          setSuppliers(allParties.filter(p => p.type === 'supplier'));
      } catch (error) {
          showToast('Failed to load suppliers', 'error');
      } finally {
          setLoading(false);
      }
  };

  const columns = [
    { 
        key: '_id', 
        label: 'ID',
        render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    { 
        key: 'name', 
        label: 'Supplier Name',
        render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    { key: 'phone_number', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'gstin', label: 'GSTIN' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">View All Supplier</h1>
          <p className="text-gray-600">View all suppliers</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        searchable={true}
        sortable={true}
        pagination={true}
      />
    </div>
  );
};

export default ViewAllSupplier;
