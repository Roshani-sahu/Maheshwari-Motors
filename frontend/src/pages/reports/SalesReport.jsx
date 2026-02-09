import React, { useState } from "react";
import {
  FaShoppingBag,
  FaUsers,
  FaRupeeSign,
  FaArrowUp,
  FaPercentage,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
} from "recharts";

const SalesReport = () => {
  const [period, setPeriod] = useState("year");

  const monthlySales = [
    { month: "Jan", sales: 180, bills: 120 },
    { month: "Feb", sales: 220, bills: 150 },
    { month: "Mar", sales: 200, bills: 135 },
    { month: "Apr", sales: 260, bills: 180 },
    { month: "May", sales: 310, bills: 210 },
    { month: "Jun", sales: 285, bills: 195 },
  ];

  const gstSplit = [
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
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Sales Performance
          </h1>
          <p className="text-gray-500 mt-1">
            Revenue, customers & conversion insights
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
        <Kpi title="Total Sales" value="₹12.8L" icon={<FaShoppingBag />} color="blue" />
        <Kpi title="Customers" value="96" icon={<FaUsers />} color="green" />
        <Kpi title="Avg Bill Value" value="₹38K" icon={<FaRupeeSign />} color="purple" />
        <Kpi title="Conversion Rate" value="79%" icon={<FaPercentage />} color="orange" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line + Bar Combined */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Sales vs Bills Trend
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bills" barSize={30} fill="#CBD5E1" />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">
            GST vs Non-GST Sales
          </h3>

          <div className="relative flex-1">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={gstSplit}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {gstSplit.map((item, i) => (
                    <Cell key={i} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v}K`, "Sales"]} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">₹12.8L</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Top Customers by Sales
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => `₹${v}K`} />
              <YAxis type="category" dataKey="customer" width={120} />
              <Tooltip formatter={(v) => [`₹${v}K`, "Sales"]} />
              <Bar dataKey="amount" fill="#10B981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranked List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Best Performing Customers
          </h3>

          <div className="space-y-4">
            {topCustomers.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {c.customer}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ₹{c.amount}K
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* KPI */
const Kpi = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default SalesReport;
