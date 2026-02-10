import React, { useState } from "react";
import {
  FaUndoAlt,
  FaExclamationTriangle,
  FaTruck,
  FaArrowUp,
  FaDownload,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { exportToPDF } from '../../utils/pdfExport';

const PurchaseReturnReport = () => {
  const [period, setPeriod] = useState("year");

  const monthlyReturnData = [
    { month: "Jan", qty: 12, value: 18 },
    { month: "Feb", qty: 16, value: 24 },
    { month: "Mar", qty: 10, value: 15 },
    { month: "Apr", qty: 22, value: 32 },
    { month: "May", qty: 18, value: 26 },
    { month: "Jun", qty: 14, value: 20 },
  ];

  const returnTypeData = [
    { name: "Damaged", value: 38, color: "#EF4444" },
    { name: "Wrong Item", value: 26, color: "#F59E0B" },
    { name: "Excess Supply", value: 21, color: "#3B82F6" },
    { name: "Quality Issue", value: 15, color: "#8B5CF6" },
  ];

  const topSuppliers = [
    { supplier: "ABC Auto Parts", returns: 22 },
    { supplier: "Speed Motors", returns: 18 },
    { supplier: "Universal Spares", returns: 15 },
    { supplier: "Prime Traders", returns: 11 },
  ];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Purchase Return Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Track supplier returns, reasons, and impact
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportToPDF('purchase-return-report-content', 'Purchase_Return_Report.pdf')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
          >
            <FaDownload /> Download PDF
          </button>
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
      </div>

      <div id="purchase-return-report-content">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Total Returns"
          value="92"
          icon={<FaUndoAlt />}
          color="red"
        />
        <Kpi
          title="Return Value"
          value="₹1.35L"
          icon={<FaExclamationTriangle />}
          color="orange"
        />
        <Kpi
          title="Suppliers Affected"
          value="14"
          icon={<FaTruck />}
          color="blue"
        />
        <Kpi
          title="Return Rate"
          value="3.8%"
          icon={<FaArrowUp />}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Purchase Returns (Value)
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyReturnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v}K`} />
              <Tooltip formatter={(v) => [`₹${v}K`, "Return Value"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Quantity vs Value Returned
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyReturnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="qty" stackId="a" fill="#F59E0B" />
              <Bar dataKey="value" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Return Reason Distribution
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={returnTypeData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {returnTypeData.map((item, i) => (
                  <Cell key={i} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {returnTypeData.map((item, i) => (
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

        {/* Supplier Ranking */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">
            Suppliers with Highest Returns
          </h3>

          <div className="space-y-4">
            {topSuppliers.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.supplier}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {item.returns} returns
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

export default PurchaseReturnReport;
