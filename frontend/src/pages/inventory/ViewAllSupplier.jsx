import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { supplierAPI } from '../../services/api';

const ViewAllSupplier = () => {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierAPI.getAll();
        const val = response.data?.data;
        const list = Array.isArray(val) ? val : (val?.data || []);
        setSuppliers(list.map(s => ({
            id: s._id,
            name: s.name,
            contact: s.phone,
            email: s.email,
            address: s.address,
            city: s.city,
            state: s.state,
            gstin: s.gstin
        })));
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      }
    };
    fetchSuppliers();
  }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
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
