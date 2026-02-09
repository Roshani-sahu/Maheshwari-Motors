import React, { useState } from "react";
import {
  FaUndo,
  FaUsers,
  FaRupeeSign,
  FaExclamationCircle,
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

const SalesReturnReport = () => {
  const [period, setPeriod] = useState("year");

  const monthlyReturnData = [
    { month: "Jan", value: 14 },
    { month: "Feb", value: 22 },
    { month: "Mar", value: 18 },
    { month: "Apr", value: 28 },
    { month: "May", value: 24 },
    { month: "Jun", value: 19 },
  ];

  const returnReasonData = [
    { name: "Damaged", value: 32, color: "#EF4444" },
    { name: "Wrong Item", value: 24, color: "#F59E0B" },
    { name: "Customer Cancelled", value: 21, color: "#3B82F6" },
    { name: "Quality Issue", value: 23, color: "#8B5CF6" },
  ];

  const topCustomers = [
    { customer: "ABC Motors", amount: 18 },
    { customer: "XYZ Automobiles", amount: 15 },
    { customer: "PQR Garage", amount: 13 },
    { customer: "LMN Traders", amount: 11 },
    { customer: "RST Auto", amount: 9 },
  ];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Sales Return Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Customer returns, reasons and revenue impact
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Total Returns"
          value="94"
          icon={<FaUndo />}
          color="red"
        />
        <Kpi
          title="Return Value"
          value="₹1.25L"
          icon={<FaRupeeSign />}
          color="orange"
        />
        <Kpi
          title="Customers Involved"
          value="22"
          icon={<FaUsers />}
          color="blue"
        />
        <Kpi
          title="Return Rate"
          value="4.1%"
          icon={<FaExclamationCircle />}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Sales Return Value
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyReturnData}>
              <defs>
                <linearGradient id="salesReturnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v}K`} />
              <Tooltip formatter={(v) => [`₹${v}K`, "Return Value"]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#EF4444"
                strokeWidth={3}
                fill="url(#salesReturnGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Top Customers by Returns (₹K)
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `₹${v}K`} />
              <YAxis type="category" dataKey="customer" width={120} />
              <Tooltip formatter={(v) => [`₹${v}K`, "Returns"]} />
              <Bar
                dataKey="amount"
                fill="#F59E0B"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Sales Return Reasons
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={returnReasonData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {returnReasonData.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {returnReasonData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold ml-auto">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranked List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Customers with Highest Returns
          </h3>

          <div className="space-y-4">
            {topCustomers.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
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

/* KPI Card */
const Kpi = ({ title, value, icon, color }) => {
  const colors = {
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}
      >
        {icon}
      </div>
    </div>
  );
};

export default SalesReturnReport;
