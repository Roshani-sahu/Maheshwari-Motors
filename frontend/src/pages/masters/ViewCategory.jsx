import React, { useState } from 'react';
import { DataTable } from '../../components/common';

const ViewCategory = () => {
  const [categories] = useState(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Engine Parts' },
      { id: 2, name: 'Brake System' },
      { id: 3, name: 'Filters' }
    ];
  });

  const columns = [
    { key: 'id', label: 'Category ID' },
    { key: 'name', label: 'Category Name' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">View Category</h1>
          <p className="text-gray-600">View all item categories</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        searchable={true}
        sortable={true}
        pagination={true}
      />
    </div>
  );
};

export default ViewCategory;
