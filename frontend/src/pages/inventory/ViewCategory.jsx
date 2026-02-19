import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import api from '../../services/axiosInstance';

const ViewCategory = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
        try {
            const res = await api.get('/categories');
            const list = res.data?.data;
            const final = Array.isArray(list) ? list : (list?.data || []);
            setCategories(final.map(c => ({ id: c._id, name: c.category_name || c.name })));
        } catch(e) { console.error(e); }
    };
    fetchCats();
  }, []);

  const columns = [
    { key: 'id', label: 'Category ID', render: (val) => <span className="text-xs">{val?.slice(-4)}</span> },
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
