import React, { useState } from 'react';
import { FaChartBar, FaChartLine, FaBoxes, FaTrophy } from 'react-icons/fa';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Mock data for charts
  const monthlyData = {
    challans: [12, 18, 15, 22, 25, 20, 28, 24, 19, 26, 23, 21],
    bills: [8, 14, 12, 18, 20, 16, 22, 19, 15, 21, 18, 17]
  };

  const lowStockItems = [
    { name: 'Engine Oil 5W-30', count: 5 },
    { name: 'Brake Pads', count: 3 },
    { name: 'Spark Plugs', count: 2 },
    { name: 'Air Filter', count: 4 }
  ];

  const topItems = [
    { name: 'Engine Oil', amount: 45000, stock: 25 },
    { name: 'Brake System', amount: 38000, stock: 18 },
    { name: 'Transmission', amount: 32000, stock: 12 },
    { name: 'Electrical', amount: 28000, stock: 15 }
  ];

  const ChartCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white p-4 sm:p-6 rounded-lg border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" />
        </div>
        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{title}</h3>
      </div>
      {children}
    </div>
  );

  const SimpleBarChart = ({ data, labels, colors }) => (
    <div className="space-y-3">
      {data.map((value, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-12 sm:w-16 text-xs sm:text-sm text-gray-600">{labels[index]}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-4 relative">
            <div 
              className={`h-3 sm:h-4 rounded-full ${colors[index % colors.length]}`}
              style={{ width: `${(value / Math.max(...data)) * 100}%` }}
            />
          </div>
          <div className="w-8 sm:w-12 text-xs sm:text-sm font-medium text-gray-900">{value}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header - NO CHANGES HERE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Visual reporting and business analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Monthly Challans vs Bills */}
        <ChartCard title="Monthly Challans vs Bills" icon={FaChartLine}>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Challans</span>
              </div>
              <SimpleBarChart 
                data={monthlyData.challans.slice(-6)} 
                labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                colors={['bg-blue-500']}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Bills</span>
              </div>
              <SimpleBarChart 
                data={monthlyData.bills.slice(-6)} 
                labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                colors={['bg-green-500']}
              />
            </div>
          </div>
        </ChartCard>

        {/* 2. Bills per Month */}
        <ChartCard title="Bills per Month" icon={FaChartBar}>
          <SimpleBarChart 
            data={monthlyData.bills.slice(-6)} 
            labels={['July', 'August', 'September', 'October', 'November', 'December']}
            colors={['bg-purple-500', 'bg-purple-400', 'bg-purple-600', 'bg-purple-300', 'bg-purple-500', 'bg-purple-400']}
          />
        </ChartCard>

        {/* 3. Low Stock Items Count */}
        <ChartCard title="Low Stock Items" icon={FaBoxes}>
          <div className="space-y-3">
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="text-sm font-bold text-red-600">{item.count} units</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
            <span className="text-lg font-bold text-red-600">{lowStockItems.length}</span>
            <span className="text-sm text-gray-600 ml-2">items below threshold</span>
          </div>
        </ChartCard>

        {/* 4. Top Items */}
        <ChartCard title="Top Items (by Amount)" icon={FaTrophy}>
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-600">{item.stock} units in stock</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">₹{item.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Summary Stats - Mobile responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-blue-500">
          <h3 className="text-xs sm:text-sm font-medium text-blue-800">Total Challans</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">
            {monthlyData.challans.reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-[10px] sm:text-xs text-blue-600">This year</p>
        </div>
        
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-green-500">
          <h3 className="text-xs sm:text-sm font-medium text-green-800">Total Bills</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">
            {monthlyData.bills.reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-[10px] sm:text-xs text-green-600">This year</p>
        </div>
        
        <div className="bg-red-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-red-500">
          <h3 className="text-xs sm:text-sm font-medium text-red-800">Low Stock Items</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-900">{lowStockItems.length}</p>
          <p className="text-[10px] sm:text-xs text-red-600">Need attention</p>
        </div>
        
        <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-purple-500">
          <h3 className="text-xs sm:text-sm font-medium text-purple-800">Conversion Rate</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">
            {Math.round((monthlyData.bills.reduce((a, b) => a + b, 0) / monthlyData.challans.reduce((a, b) => a + b, 0)) * 100)}%
          </p>
          <p className="text-[10px] sm:text-xs text-purple-600">Challan to Bill</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;