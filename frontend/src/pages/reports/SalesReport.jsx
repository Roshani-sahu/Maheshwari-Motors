import React, { useState } from "react";
import {
  FaShoppingBag,
  FaRupeeSign,
  FaUsers,
  FaArrowUp,
  FaChartLine,
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

const SalesReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("year");

  const monthlySalesData = [
    { month: "Jan", sales: 180 },
    { month: "Feb", sales: 220 },
    { month: "Mar", sales: 200 },
    { month: "Apr", sales: 260 },
    { month: "May", sales: 310 },
    { month: "Jun", sales: 285 },
  ];

  const gstSplitData = [
    { name: "GST Sales", value: 780, color: "#10B981" },
    { name: "Non-GST Sales", value: 420, color: "#3B82F6" },
  ];

  const topCustomers = [
    { customer: "ABC Motors", amount: 320 },
    { customer: "XYZ Automobiles", amount: 285 },
    { customer: "PQR Garage", amount: 250 },
    { customer: "LMN Traders", amount: 210 },
    { customer: "RST Auto", amount: 190 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Sales Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            Sales performance and revenue insights
          </p>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Total Sales"
          value="₹12.8L"
          change="16% increase"
          icon={<FaShoppingBag />}
          color="blue"
        />
        <StatCard
          title="GST Sales"
          value="₹7.8L"
          subtitle="GST invoices"
          icon={<FaRupeeSign />}
          color="green"
        />
        <StatCard
          title="Customers"
          value="96"
          subtitle="Active parties"
          icon={<FaUsers />}
          color="purple"
        />
        <StatCard
          title="Avg Bill Value"
          value="₹38K"
          subtitle="Per invoice"
          icon={<FaChartLine />}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Sales Trend */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Monthly Sales Trend
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySalesData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                formatter={(v) => [`₹${v}K`, "Sales"]}
                contentStyle={{ borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Customers Bar Chart */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Top Customers (₹ in thousands)
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topCustomers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="customer" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip formatter={(v) => [`₹${v}K`, "Sales"]} />
              <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* GST vs Non-GST Pie */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            GST vs Non-GST Sales
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gstSplitData}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
              >
                {gstSplitData.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v}K`, "Amount"]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {gstSplitData.map((item, i) => (
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

        {/* Top Customers List */}
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Best Customers
          </h3>

          <div className="space-y-3">
            {topCustomers.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.customer}
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
  );
};

/* Reusable KPI Card */
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

export default SalesReport;
