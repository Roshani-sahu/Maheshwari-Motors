import React, { useState } from 'react';
import { DataTable } from '../../components/common';

const ViewAllSupplier = () => {
  const [suppliers] = useState(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'ABC Suppliers', contact: '9876543210', email: 'abc@supplier.com', address: 'Mumbai' },
      { id: 2, name: 'XYZ Parts', contact: '9876543211', email: 'xyz@parts.com', address: 'Delhi' }
    ];
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' }
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
