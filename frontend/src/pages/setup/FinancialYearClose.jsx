import React, { useState } from "react";
import {
  FaCalendarXmark,
  FaCircleInfo,
  FaCircleCheck,
} from "react-icons/fa6";
import { Button } from "../../components/ui";
import { ConfirmationDialog } from "../../components/common";

const FinancialYearClose = () => {
  const [currentFinancialYear] = useState("2023-24");
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isYearClosed, setIsYearClosed] = useState(false);

  const [closingSummary] = useState({
    totalChallans: 245,
    totalBills: 198,
    totalRevenue: 2450000,
    pendingPayments: 125000,
    stockValue: 350000,
    gstCollected: 245000,
    gstPaid: 198000,
  });

  const handleYearClose = () => {
    setIsYearClosed(true);
    setIsCloseDialogOpen(false);
  };

  const SummaryCard = ({ title, value, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-l-blue-500",
      green: "bg-green-50 text-green-600 border-l-green-500",
      red: "bg-red-50 text-red-600 border-l-red-500",
      purple: "bg-purple-50 text-purple-600 border-l-purple-500",
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 ${colorClasses[color]}`}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2 rounded-lg ${colorClasses[color].split(" ")[0]}`}>
              <Icon className={colorClasses[color].split(" ")[1]} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Financial Year Close
        </h1>
        <p className="text-gray-600">
          Close current financial year and prepare for new year
        </p>
      </div>

      {/* Current Year Status */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FaCalendarXmark className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              Current Financial Year
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {currentFinancialYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {isYearClosed ? (
            <>
              <FaCircleCheck className="text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Year Closed Successfully
              </span>
            </>
          ) : (
            <>
              <FaCircleInfo className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                Year is currently active
              </span>
            </>
          )}
        </div>

        {!isYearClosed && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <FaCircleInfo className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">
                  Before closing the financial year:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure all transactions are recorded</li>
                  <li>Complete all pending bill generations</li>
                  <li>Reconcile all accounts</li>
                  <li>Take a complete backup</li>
                  <li>Verify stock counts</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-4">
          Financial Year Summary (Read-Only)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard title="Total Challans" value={closingSummary.totalChallans.toLocaleString()} />
          <SummaryCard title="Total Bills" value={closingSummary.totalBills.toLocaleString()} color="green" />
          <SummaryCard title="Total Revenue" value={`₹${(closingSummary.totalRevenue / 100000).toFixed(1)}L`} color="purple" />
          <SummaryCard title="Pending Payments" value={`₹${(closingSummary.pendingPayments / 100000).toFixed(1)}L`} color="red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Stock Value" value={`₹${(closingSummary.stockValue / 100000).toFixed(1)}L`} />
          <SummaryCard title="GST Collected" value={`₹${(closingSummary.gstCollected / 100000).toFixed(1)}L`} color="green" />
          <SummaryCard title="GST Paid" value={`₹${(closingSummary.gstPaid / 100000).toFixed(1)}L`} color="purple" />
        </div>
      </div>

      {/* Action Section */}
      {!isYearClosed && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-4">
            Close Financial Year
          </h3>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
            <div className="flex items-start gap-3">
              <FaCircleInfo className="text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Warning:</p>
                <p>
                  Closing the financial year is irreversible. Once closed, you
                  cannot add or modify transactions for this year.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setIsCloseDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Close Financial Year {currentFinancialYear}
          </Button>
        </div>
      )}

      {/* Success Message */}
      {isYearClosed && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <FaCircleCheck className="text-green-600 text-xl" />
            <div>
              <h3 className="font-medium text-green-800">
                Financial Year Closed Successfully
              </h3>
              <p className="text-sm text-green-700">
                Financial year {currentFinancialYear} has been closed. The system
                is now ready for the new financial year.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={handleYearClose}
        title="Close Financial Year"
        message={`Are you sure you want to close financial year ${currentFinancialYear}? This action cannot be undone.`}
        confirmText="Close Year"
        type="danger"
      />
    </div>
  );
};

export default FinancialYearClose;
