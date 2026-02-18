import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common';
import { reportAPI } from '../../services/api';

const StockAlertMaster = () => {
  const [stockAlerts, setStockAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await reportAPI.getStockAlertItems(); // Use the endpoint you confirmed works
            const val = response.data?.data;
            const items = Array.isArray(val) ? val : (val?.data || []);
            setStockAlerts(items.map(i => ({
                id: i._id,
                itemName: i.item_name,
                stockCount: Number(i.stock) || 0,
                threshold: Number(i.threshold) || 0,
                status: (Number(i.stock) || 0) < (Number(i.threshold) || 0) ? 'LOW' : 'OK'
            })));
        } catch (error) {
            console.error("Failed to fetch stock alerts", error);
        }
    };
    fetchData();
  }, []);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'itemName',
      label: 'Item Name',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    {
      key: 'stockCount',
      label: 'Stock Count',
      render: (value, row) => (
        <span className={`text-xs sm:text-sm ${row.status === 'LOW' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'threshold',
      label: 'Threshold',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    }
  ];

  const [showOnlyLow, setShowOnlyLow] = useState(true);
  const filteredData = showOnlyLow ? 
    stockAlerts.filter(item => item.status === 'LOW') : 
    stockAlerts;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stock Alert Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Monitor items below threshold levels</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={showOnlyLow}
              onChange={(e) => setShowOnlyLow(e.target.checked)}
              className="rounded text-xs sm:text-sm"
            />
            Show only LOW stock
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-red-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-red-500">
          <h3 className="text-xs sm:text-sm font-medium text-red-800">Low Stock Items</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-900">
            {stockAlerts.filter(item => item.status === 'LOW').length}
          </p>
        </div>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-blue-500">
          <h3 className="text-xs sm:text-sm font-medium text-blue-800">Total Items</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{stockAlerts.length}</p>
        </div>
      </div>

      {/* Stock Alerts Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={filteredData}
          searchable={true}
          sortable={true}
          pagination={true}
          minWidth="600px"
          className="text-xs sm:text-sm"
          onRowClick={(row) => {
            if (row.status === 'LOW') {
              // Navigate to item master or show reorder dialog
              console.log('Reorder item:', row.itemName);
            }
          }}
        />
      </div>
    </div>
  );
};

export default StockAlertMaster;
