import React, { useState } from "react";
import {
  FaShoppingCart,
  FaTruck,
  FaRupeeSign,
  FaArrowUp,
  FaChartBar,
  FaDownload,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { exportToPDF } from '../../utils/pdfExport';

const PurchaseReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleDateChange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    console.log('Filtering purchase data from', from, 'to', to);
  };

  // Dynamic data based on selected period
  const getFilteredData = () => {
    const baseData = {
      month: {
        monthlyPurchaseData: [{ month: 'Current', purchase: 210 }],
        totalPurchase: '₹210K',
        gstPurchase: '₹150K',
        suppliers: '12',
        avgPurchase: '₹18K'
      },
      quarter: {
        monthlyPurchaseData: [
          { month: 'Month 1', purchase: 142 },
          { month: 'Month 2', purchase: 190 },
          { month: 'Month 3', purchase: 225 }
        ],
        totalPurchase: '₹5.57L',
        gstPurchase: '₹3.9L',
        suppliers: '18',
        avgPurchase: '₹31K'
      },
      year: {
        monthlyPurchaseData: [
          { month: 'Jan', purchase: 120 },
          { month: 'Feb', purchase: 165 },
          { month: 'Mar', purchase: 142 },
          { month: 'Apr', purchase: 190 },
          { month: 'May', purchase: 225 },
          { month: 'Jun', purchase: 210 }
        ],
        totalPurchase: '₹10.5L',
        gstPurchase: '₹7.2L',
        suppliers: '28',
        avgPurchase: '₹42K'
      },
      custom: {
        monthlyPurchaseData: [
          { month: dateFrom ? new Date(dateFrom).toLocaleDateString('en-US', {month: 'short'}) : 'Start', purchase: Math.floor(Math.random() * 100 + 150) },
          { month: dateTo ? new Date(dateTo).toLocaleDateString('en-US', {month: 'short'}) : 'End', purchase: Math.floor(Math.random() * 100 + 180) }
        ],
        totalPurchase: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 500 + 300)}K` : '₹4.2L',
        gstPurchase: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 300 + 200)}K` : '₹2.8L',
        suppliers: dateFrom && dateTo ? `${Math.floor(Math.random() * 10 + 15)}` : '22',
        avgPurchase: dateFrom && dateTo ? `₹${Math.floor(Math.random() * 20 + 25)}K` : '₹35K'
      }
    };
    return baseData[selectedPeriod] || baseData.year;
  };

  const currentData = getFilteredData();

  const purchaseTypeData = [
    { name: "GST Purchase", value: 720, color: "#10B981" },
    { name: "Non-GST Purchase", value: 330, color: "#3B82F6" },
  ];

  const topSuppliers = [
    { supplier: "ABC Auto Parts", amount: 280 },
    { supplier: "Speed Motors", amount: 210 },
    { supplier: "Universal Spares", amount: 185 },
    { supplier: "Prime Traders", amount: 150 },
    { supplier: "Auto Hub", amount: 120 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Purchase Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            Monitor supplier purchases and trends
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportToPDF('purchase-report-content', 'Purchase_Report.pdf')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition text-sm"
          >
            <FaDownload /> Download PDF
          </button>
          <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {dateFrom && dateTo && (
              <button
                onClick={() => handleDateChange(dateFrom, dateTo)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                Apply
              </button>
            )}
          </>
        )}
        </div>
      </div>

      <div id="purchase-report-content">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Total Purchase"
          value={currentData.totalPurchase}
          change="14% increase"
          icon={<FaShoppingCart />}
          color="blue"
        />
        <StatCard
          title="GST Purchase"
          value={currentData.gstPurchase}
          subtitle="GST invoices"
          icon={<FaRupeeSign />}
          color="green"
        />
        <StatCard
          title="Suppliers"
          value={currentData.suppliers}
          subtitle="Active vendors"
          icon={<FaTruck />}
          color="purple"
        />
        <StatCard
          title="Avg Purchase"
          value={currentData.avgPurchase}
          subtitle="Per invoice"
          icon={<FaChartBar />}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Area Chart */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Monthly Purchase Trend
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={currentData.monthlyPurchaseData}>
              <defs>
                <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                formatter={(v) => [`₹${v}K`, "Purchase"]}
                contentStyle={{ borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="purchase"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#purchaseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Top Suppliers (₹ in thousands)
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSuppliers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="supplier" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip formatter={(v) => [`₹${v}K`, "Purchase"]} />
              <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Purchase Type Distribution
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={purchaseTypeData}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
              >
                {purchaseTypeData.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v}K`, "Amount"]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {purchaseTypeData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold ml-auto">
                  ₹{item.value}K
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suppliers List */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Best Suppliers
          </h3>

          <div className="space-y-3">
            {topSuppliers.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.supplier}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ₹{item.amount}K
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

/* Reusable Stat Card */
const StatCard = ({ title, value, subtitle, change, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            {value}
          </h3>
          {change && (
            <p className="text-xs sm:text-sm text-green-600 mt-1 flex items-center gap-1">
              <FaArrowUp size={10} /> {change}
            </p>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default PurchaseReport;
