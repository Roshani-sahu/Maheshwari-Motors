import React, { useState } from 'react';
import { FaChartBar, FaChartLine, FaChartPie, FaTrophy,  FaArrowUp } from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  
  const monthlyData = [
    { month: 'Jan', challans: 12, bills: 8, revenue: 125 },
    { month: 'Feb', challans: 18, bills: 14, revenue: 185 },
    { month: 'Mar', challans: 15, bills: 12, revenue: 165 },
    { month: 'Apr', challans: 22, bills: 18, revenue: 245 },
    { month: 'May', challans: 25, bills: 20, revenue: 285 },
    { month: 'Jun', challans: 20, bills: 16, revenue: 225 },
  ];

  const transactionTypeData = [
    { name: 'Challans', value: 253, color: '#3B82F6' },
    { name: 'Bills', value: 200, color: '#10B981' },
    { name: 'Prepaid', value: 45, color: '#8B5CF6' },
    { name: 'Due', value: 32, color: '#F59E0B' }
  ];

  const gstData = [
    { name: '1 (GST)', value: 320, color: '#10B981' },
    { name: '0 (NON-GST)', value: 210, color: '#3B82F6' }
  ];

  const topPartiesData = [
    { party: 'ABC Motors', amount: 450 },
    { party: 'XYZ Parts', amount: 380 },
    { party: 'PQR Auto', amount: 320 },
    { party: 'LMN Garage', amount: 280 },
    { party: 'RST Motors', amount: 250 }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm md:text-base">Track your business performance</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Challans</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">253</h3>
              <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                <FaArrowUp size={10} className="sm:size-3" /> 12% increase
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-blue-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Bills</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">200</h3>
              <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                <FaArrowUp size={10} className="sm:size-3" /> 8% increase
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="text-green-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Revenue</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">₹29.5L</h3>
              <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                <FaArrowUp size={10} className="sm:size-3" /> 15% increase
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaTrophy className="text-purple-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Conversion Rate</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">79%</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Challan to Bill</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaChartPie className="text-orange-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Line Chart */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">Challans vs Bills Trend</h3>
          <ResponsiveContainer width="100%" height={220} className="mx-auto sm:mx-0">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorChallans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '10px', sm: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '10px', sm: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px', sm: '12px' }} />
              <Area type="monotone" dataKey="challans" stroke="#3B82F6" fillOpacity={1} fill="url(#colorChallans)" strokeWidth={2} />
              <Area type="monotone" dataKey="bills" stroke="#10B981" fillOpacity={1} fill="url(#colorBills)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">Monthly Revenue (₹ in thousands)</h3>
          <ResponsiveContainer width="100%" height={220} className="mx-auto sm:mx-0">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '10px', sm: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '10px', sm: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px', sm: '12px' }} />
              <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pie Chart 1 */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">Transaction Types</h3>
          <ResponsiveContainer width="100%" height={180} className="mx-auto">
            <PieChart>
              <Pie
                data={transactionTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {transactionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '11px', sm: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4">
            {transactionTypeData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600 truncate">{item.name}</span>
                <span className="text-xs font-semibold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart 2 */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">GST Distribution</h3>
          <ResponsiveContainer width="100%" height={180} className="mx-auto">
            <PieChart>
              <Pie
                data={gstData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {gstData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '11px', sm: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4">
            {gstData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600 truncate">{item.name}</span>
                <span className="text-xs font-semibold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Parties */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">Top Parties</h3>
          <div className="space-y-2 sm:space-y-3">
            {topPartiesData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {index + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.party}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-900">₹{item.amount}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;