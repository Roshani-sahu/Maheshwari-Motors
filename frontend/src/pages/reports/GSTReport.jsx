import React, { useState } from 'react';
import { FaFileInvoiceDollar, FaChartPie, FaCalculator, FaDownload, FaFilter, FaArrowUp } from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { exportToPDF } from '../../utils/pdfExport';

const GSTReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedGSTRate, setSelectedGSTRate] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleDateChange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    // Filter data based on date range
    console.log('Filtering data from', from, 'to', to);
  };

  // Dynamic data based on selected period
  const getFilteredData = () => {
    const baseData = {
      month: {
        monthlyGSTData: [{ month: 'Current', cgst: 25000, sgst: 25000, igst: 14000, total: 64000 }],
        totalGST: '₹64K',
        inputCredit: '₹58K',
        netPayable: '₹6K',
        effectiveRate: '12.8%'
      },
      quarter: {
        monthlyGSTData: [
          { month: 'Month 1', cgst: 18000, sgst: 18000, igst: 10000, total: 46000 },
          { month: 'Month 2', cgst: 28000, sgst: 28000, igst: 15000, total: 71000 },
          { month: 'Month 3', cgst: 32000, sgst: 32000, igst: 18000, total: 82000 }
        ],
        totalGST: '₹1.99L',
        inputCredit: '₹1.85L',
        netPayable: '₹14K',
        effectiveRate: '13.5%'
      },
      year: {
        monthlyGSTData: [
          { month: 'Jan', cgst: 15000, sgst: 15000, igst: 8000, total: 38000 },
          { month: 'Feb', cgst: 22000, sgst: 22000, igst: 12000, total: 56000 },
          { month: 'Mar', cgst: 18000, sgst: 18000, igst: 10000, total: 46000 },
          { month: 'Apr', cgst: 28000, sgst: 28000, igst: 15000, total: 71000 },
          { month: 'May', cgst: 32000, sgst: 32000, igst: 18000, total: 82000 },
          { month: 'Jun', cgst: 25000, sgst: 25000, igst: 14000, total: 64000 }
        ],
        totalGST: '₹3.57L',
        inputCredit: '₹3.27L',
        netPayable: '₹30K',
        effectiveRate: '14.2%'
      },
      custom: {
        monthlyGSTData: [
          { month: dateFrom ? new Date(dateFrom).toLocaleDateString('en-US', {month: 'short'}) : 'Start', cgst: 20000, sgst: 20000, igst: 11000, total: 51000 },
          { month: dateTo ? new Date(dateTo).toLocaleDateString('en-US', {month: 'short'}) : 'End', cgst: 24000, sgst: 24000, igst: 13000, total: 61000 }
        ],
        totalGST: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 200 + 100)}K` : '₹1.12L',
        inputCredit: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 180 + 90)}K` : '₹1.05L',
        netPayable: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 20 + 5)}K` : '₹7K',
        effectiveRate: dateFrom && dateTo ? `${(Math.random() * 5 + 10).toFixed(1)}%` : '13.1%'
      }
    };
    return baseData[selectedPeriod] || baseData.year;
  };

  const currentData = getFilteredData();

  const gstRateData = [
    { rate: '5%', amount: 45000, color: '#10B981' },
    { rate: '12%', amount: 125000, color: '#3B82F6' },
    { rate: '18%', amount: 185000, color: '#8B5CF6' },
    { rate: '28%', amount: 85000, color: '#F59E0B' }
  ];

 

 
  const topSellingGSTItems = [
    { item: 'Engine Oil', sales: 85000, gstRate: '18%', quantity: 450 },
    { item: 'Brake Pads', sales: 72000, gstRate: '28%', quantity: 380 },
    { item: 'Air Filter', sales: 65000, gstRate: '12%', quantity: 520 },
    { item: 'Spark Plugs', sales: 58000, gstRate: '18%', quantity: 290 },
    { item: 'Clutch Plate', sales: 45000, gstRate: '28%', quantity: 180 },
    { item: 'Headlight', sales: 38000, gstRate: '18%', quantity: 160 }
  ];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            {/* <FaFileInvoiceDollar className="text-blue-600" /> */}
            GST Analytics
          </h1>
          <p className="text-gray-500 mt-1">Comprehensive GST reporting and analysis</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToPDF('gst-report-content', 'GST_Report.pdf')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
          >
            <FaDownload /> Download PDF
          </button>
          <select
            value={selectedGSTRate}
            onChange={(e) => setSelectedGSTRate(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All GST Rates</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% GST</option>
            <option value="28">28% GST</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {selectedPeriod === 'custom' && (
            <>
              <input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {dateFrom && dateTo && (
                <button
                  onClick={() => handleDateChange(dateFrom, dateTo)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Apply
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div id="gst-report-content">
      {/* GST Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total GST Collected</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{currentData.totalGST}</h3>
              <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2 flex items-center gap-1">
                <FaArrowUp size={10} className="sm:size-3" /> 12% increase
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCalculator className="text-green-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Input Tax Credit</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{currentData.inputCredit}</h3>
              <p className="text-xs sm:text-sm text-blue-600 mt-1 sm:mt-2">Available for offset</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartPie className="text-blue-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Net GST Payable</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{currentData.netPayable}</h3>
              <p className="text-xs sm:text-sm text-purple-600 mt-1 sm:mt-2">Due this month</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaFileInvoiceDollar className="text-purple-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Effective GST Rate</p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{currentData.effectiveRate}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Weighted average</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaFilter className="text-orange-600 text-sm sm:text-base md:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly GST Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly GST Bills</h3>
            <button className="text-blue-600 hover:text-blue-700">
              <FaDownload />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={currentData.monthlyGSTData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'GST Amount']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* GST Items Sales Breakdown */}
       
<div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
  
  {/* Header */}
  <div className="flex items-center justify-between mb-5">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        Top Selling GST Items
      </h3>
      <p className="text-sm text-gray-500">
        Based on total sales amount
      </p>
    </div>

    {/* Small KPI badge */}
    <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
      GST Sales
    </div>
  </div>

  <ResponsiveContainer width="100%" >
    <BarChart
      data={topSellingGSTItems}
      margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
    >
      {/* Soft grid */}
      <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" />

      {/* X Axis */}
      <XAxis
        dataKey="item"
        stroke="#9CA3AF"
        tick={{ fontSize: 10 }}
        angle={-0}
        textAnchor="end"
        height={70}
      />

      {/* Y Axis */}
      <YAxis
        stroke="#9CA3AF"
        tick={{ fontSize: 12 }}
        tickFormatter={(value) => `₹${value / 1000}k`}
      />

      {/* Tooltip */}
      <Tooltip
        cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
        contentStyle={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          fontSize: "13px",
        }}
        formatter={(value, name) => {
          if (name === "sales")
            return [`₹${value.toLocaleString()}`, "Sales Amount"];
          if (name === "quantity")
            return [value, "Quantity Sold"];
          return [value, name];
        }}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="gstSalesGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Bars */}
      <Bar
        dataKey="sales"
        fill="url(#gstSalesGradient)"
        radius={[8, 8, 0, 0]}
        name="sales"
        barSize={38}
      />
    </BarChart>
  </ResponsiveContainer>
</div>

      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Rate Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Rate Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gstRateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="amount"
              >
                {gstRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {gstRateData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.rate}</span>
                <span className="text-sm font-semibold ml-auto">₹{(item.amount/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

       
       

        {/* Top GST Items List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Selling Items by GST</h3>
          <div className="space-y-4">
            {topSellingGSTItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.item}</p>
                    <p className="text-xs text-gray-500">{item.gstRate} GST • {item.quantity} units</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{(item.sales/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

     
    
    </div>
    </div>
  );
};

export default GSTReport;