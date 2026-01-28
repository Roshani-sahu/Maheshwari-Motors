import React from "react";
import {
  FaArrowTrendUp,
  FaArrowTrendDown,
  FaWallet,
  FaBuildingColumns,
  FaTriangleExclamation,
  FaRotateRight,
  FaFileInvoiceDollar,
  FaEye,
} from "react-icons/fa6";

const Dashboard = () => {
  const kpiData = [
    {
      title: "Total Sales",
      value: "1,25,430.50",
      meta: "+12.5% from last month",
      icon: FaArrowTrendUp,
      trend: "up",
    },
    {
      title: "Total Purchases",
      value: "82,115.00",
      meta: "-5.2% from last month",
      icon: FaArrowTrendDown,
      trend: "down",
    },
    {
      title: "Cash in Hand",
      value: "15,890.75",
      meta: "As of today",
      icon: FaWallet,
      trend: "neutral",
    },
    {
      title: "Bank Balance",
      value: "4,56,721.20",
      meta: "Across 3 accounts",
      icon: FaBuildingColumns,
      trend: "blue",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl text-neutral-900">Dashboard</h1>
        <p className="text-xs md:text-sm text-neutral-500">
          Overview of your business performance for Motors GST.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
        {kpiData.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              className={`
                bg-white p-3 md:p-5 border border-neutral-200 rounded-lg
                transition-all duration-300 cursor-pointer group
                hover:shadow-md
                ${
                  card.trend === "up"
                    ? "hover:border-l-4 hover:border-emerald-500"
                    : card.trend === "down"
                    ? "hover:border-l-4 hover:border-red-500"
                    : "hover:border-l-4 hover:border-blue-500"
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs md:text-sm text-neutral-600">
                  {card.title}
                </p>

                <Icon
                  className={`
                    text-sm md:text-lg transition-colors
                    ${
                      card.trend === "up"
                        ? "text-emerald-600"
                        : card.trend === "down"
                        ? "text-red-500"
                        : card.trend === "blue"
                        ? "text-blue-500"
                        : "text-gray-600"
                    }
                  `}
                />
              </div>

              <p className="text-lg md:text-2xl font-bold text-neutral-900 mb-1">
                {card.value}
              </p>

              <p
                className={`
                  text-xs transition-colors
                  ${
                    card.trend === "up"
                      ? "text-emerald-600"
                      : card.trend === "down"
                      ? "text-red-500"
                      : card.trend === "blue"
                      ? "text-blue-500"
                      : "text-gray-600"
                  }
                `}
              >
                {card.meta}
              </p>
            </div>
          );
        })}
      </section>

      {/* Stock + Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Stock Summary */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
          <div className="p-3 md:p-4  border-b flex justify-between items-center">
            <h3 className="text-sm  md:text-base text-neutral-900">
              Stock Summary
            </h3>
            <button className="text-xs text-neutral-600 hover:underline">
              View All
            </button>
          </div>

          <div className=" overflow-x-auto">
            <table className="w-full text-xs md:text-sm min-w-[400px]">
              <thead className="bg-[#F1F5F9] text-xs text-neutral-700 text-left">
                <tr>
                  <th className="p-1 md:p-2">Item Name</th>
                  <th className="p-1 md:p-2 text-right">In Stock</th>
                  <th className="p-1 md:p-2 text-right">Value (₹)</th>
                  <th className="p-1 md:p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Engine Oil 5L", "15 units", "22,500.00", "In Stock"],
                  ["Air Filter A-21", "8 units", "3,200.00", "Low Stock"],
                  ["Brake Pad Set", "2 units", "2,400.00", "Reorder"],
                  ["Spark Plug (4-pack)", "50 units", "10,000.00", "In Stock"],
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-none">
                    <td className="p-1 md:p-2 text-neutral-800">{row[0]}</td>
                    <td className="p-1 md:p-2 text-right text-neutral-600">
                      {row[1]}
                    </td>
                    <td className="p-1 md:p-2 text-right text-neutral-600">
                      {row[2]}
                    </td>
                    <td className="p-1 md:p-2 text-center">
                      <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded-full ${
                        row[3] === 'In Stock' 
                          ? 'text-green-600'
                          : row[3] === 'Low Stock'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}>
                        {row[3]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="p-3 md:p-4 border-b">
            <h3 className="text-sm md:text-base text-neutral-900">
              Alerts & Notifications
            </h3>
          </div>

          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            {[
              {
                title: "Low Stock: Air Filter A-21",
                desc: "Only 8 units remaining. Reorder level is 10.",
                icon: FaTriangleExclamation,
              },
              {
                title: "Reorder: Brake Pad Set",
                desc: "Stock is at 2 units. Min stock level is 5.",
                icon: FaRotateRight,
              },
              {
                title: "3 Overdue Invoices",
                desc: "Totaling 12,300.00",
                icon: FaFileInvoiceDollar,
              },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-2 md:gap-3">
                <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-neutral-100 rounded-full mt-1">
                  <alert.icon className="text-xs text-neutral-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-neutral-800">
                    {alert.title}
                  </p>
                  <p className="text-xs text-neutral-500">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="bg-white border border-neutral-200 rounded-lg">
        <div className="p-3 md:p-4 border-b flex justify-between items-center">
          <h3 className="text-sm md:text-base text-neutral-900">
            Recent Transactions
          </h3>
          <button className="text-xs md:text-sm text-neutral-600 hover:underline">
            View All Transactions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm min-w-[600px]">
            <thead className="bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="p-2 md:p-3 text-left">Date</th>
                <th className="p-2 md:p-3 text-left">Voucher No</th>
                <th className="p-2 md:p-3 text-left">Party Name</th>
                <th className="p-2 md:p-3 text-left">Type</th>
                <th className="p-2 md:p-3 text-right">Amount (₹)</th>
                <th className="p-2 md:p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["2025-01-23", "SALE-0152", "City Car Service", "Sale", "8,450.00"],
                ["2025-01-22", "PUR-0098", "Auto Parts Inc.", "Purchase", "25,000.00"],
                ["2025-01-22", "RCPT-0045", "National Garage", "Receipt", "5,000.00"],
                ["2025-01-21", "PMT-0031", "Office Rent", "Payment", "15,000.00"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="p-2 md:p-3 text-neutral-600">{row[0]}</td>
                  <td className="p-2 md:p-3 text-neutral-800">{row[1]}</td>
                  <td className="p-2 md:p-3 text-neutral-800">{row[2]}</td>
                  <td className="p-2 md:p-3 text-neutral-600">{row[3]}</td>
                  <td className="p-2 md:p-3 text-right text-neutral-600">
                    {row[4]}
                  </td>
                  <td className="p-2 md:p-3 text-center">
                    <button className="text-neutral-500 hover:text-neutral-800">
                      <FaEye className="text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
