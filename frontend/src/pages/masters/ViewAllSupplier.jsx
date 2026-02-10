import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { supplierAPI } from '../../services/api'; 
import useStore from '../../store';

const ViewAllSupplier = () => {
  const { setLoading, showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
      try {
          setLoading(true);
          const response = await supplierAPI.getAll();
          
          const suppliersData = response.data?.data?.data || [];
          setSuppliers(suppliersData);
      } catch (error) {
          console.error('Load error:', error);
          showToast('Failed to load suppliers', 'error');
          setSuppliers([]);
      } finally {
          setLoading(false);
      }
  };

  const columns = [
    { 
        key: '_id', 
        label: 'ID',
        render: (value) => <span className="text-xs sm:text-sm">{value?.slice(0, 8)}</span>
    },
    { 
        key: 'name', 
        label: 'Supplier Name',
        render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    { key: 'phone', label: 'Contact' },
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
