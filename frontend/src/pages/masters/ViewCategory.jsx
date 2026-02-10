import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { groupAPI } from '../../services/api';
import useStore from '../../store';

const ViewCategory = () => {

  const { setLoading, showToast } = useStore();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await groupAPI.getAll();
      // response.data -> ApiResponse { status, data, message }
      // data may contain pagination: { data: [...], meta: {...} }
      const list = response.data?.data?.data || response.data?.data || [];
      setCategories(list);
    } catch (error) {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    { key: '_id', label: 'Category ID' },
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
