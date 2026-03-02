import React, { useState, useEffect, useMemo } from "react";
import {
  FaFilter,
  FaFileInvoiceDollar,
  FaReceipt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaDownload,
} from "react-icons/fa";
import { DataTable } from "../../components/common";
import { Select, Input, Button } from "../../components/ui";
import useStore from "../../store";
import api from "../../services/axiosInstance";
import {
  getResponseList,
  normalizeChallan,
  normalizeBill,
} from "../../services/apiUtils";

const TransactionHistory = () => {
  const { setTransactions: setStoreTransactions, showToast } = useStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    type: "all",
    gstType: "all",
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const [saleRes, purchaseRes, billRes] = await Promise.all([
          api.get("/challans/sale", {
            params: { page: 1, limit: 200 },
            signal: controller.signal,
          }),
          api.get("/challans/purchase", {
            params: { page: 1, limit: 200 },
            signal: controller.signal,
          }),
          api.get("/bills", {
            params: { page: 1, limit: 200 },
            signal: controller.signal,
          }),
        ]);

        const saleTxns = getResponseList(saleRes).map((challan) => {
          const normalized = normalizeChallan(challan);
          return {
            id: normalized.id,
            transactionId: normalized.challanNo || normalized.id,
            type: "Challan",
            amount: Number(normalized.amount || 0),
            date: normalized.date,
            party: normalized.party,
            gstType: Number(normalized.gstType || 0),
            status:
              normalized.payment_status ||
              (normalized.converted_to_bill ? "Converted" : "Generated"),
          };
        });

        const purchaseTxns = getResponseList(purchaseRes).map((challan) => {
          const normalized = normalizeChallan(challan);
          return {
            id: normalized.id,
            transactionId: normalized.challanNo || normalized.id,
            type: "Prepaid",
            amount: Number(normalized.amount || 0),
            date: normalized.date,
            party: normalized.party,
            gstType: Number(normalized.gstType || 0),
            status: normalized.payment_status || "Generated",
          };
        });

        const billTxns = getResponseList(billRes).map((bill) => {
          const normalized = normalizeBill(bill);
          return {
            id: normalized.id,
            transactionId: normalized.billNo || normalized.id,
            type: "Bill",
            amount: Number(normalized.amount || 0),
            date: normalized.date,
            party: normalized.party,
            gstType: Number(normalized.gstType || 0),
            status: normalized.payment_status || "Generated",
          };
        });

        const merged = [...saleTxns, ...purchaseTxns, ...billTxns].filter(
          (t) => t.id,
        );
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(merged);
        setStoreTransactions(merged);
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("Failed to fetch transactions", error);
          showToast(
            error?.response?.data?.message || "Failed to load transactions",
            "error",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    return () => controller.abort();
  }, [setStoreTransactions]);

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((txn) => {
        if (filters.type !== "all" && txn.type !== filters.type) return false;
        if (
          filters.gstType !== "all" &&
          txn.gstType !== Number(filters.gstType)
        )
          return false;
        if (filters.dateFrom && new Date(txn.date) < new Date(filters.dateFrom))
          return false;
        return true;
      }),
    [transactions, filters],
  );

  const stats = useMemo(
    () => ({
      total: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce(
        (sum, txn) => sum + Number(txn.amount || 0),
        0,
      ),
      byType: {
        Challan: filteredTransactions.filter((t) => t.type === "Challan")
          .length,
        Bill: filteredTransactions.filter((t) => t.type === "Bill").length,
        Prepaid: filteredTransactions.filter((t) => t.type === "Prepaid")
          .length,
        Due: filteredTransactions.filter((t) => t.status === "due").length,
      },
    }),
    [filteredTransactions],
  );

  const columns = [
    {
      key: "transactionId",
      label: "Transaction ID",
      render: (val, row, index) => <span className="text-xs">{index + 1}</span>,
    },

    {
      key: "type",
      label: "Type",
      render: (value) => {
        const icons = {
          Challan: <FaFileInvoiceDollar className="inline mr-1" />,
          Bill: <FaReceipt className="inline mr-1" />,
          Prepaid: <FaCheckCircle className="inline mr-1" />,
          Due: <FaMoneyBillWave className="inline mr-1" />,
        };
        const colors = {
          Challan: "bg-blue-100 text-blue-800",
          Bill: "bg-green-100 text-green-800",
          Prepaid: "bg-purple-100 text-purple-800",
          Due: "bg-orange-100 text-orange-800",
        };
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${colors[value] || "bg-gray-100 text-gray-700"}`}
          >
            {icons[value]}
            {value}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => `Rs ${Number(value || 0).toLocaleString()}`,
    },
    {
      key: "date",
      label: "Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    { key: "party", label: "Party" },
    {
      key: "gstType",
      label: "GST Type",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${value === 1 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, txn) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              const printWindow = window.open("", "", "width=800,height=600");
              printWindow.document.write(`
                <html>
                  <head><title>Transaction ${txn.transactionId}</title></head>
                  <body style="font-family: Arial; padding: 24px;">
                    <h2>Transaction Details</h2>
                    <p><strong>Transaction ID:</strong> ${txn.transactionId}</p>
                    <p><strong>Type:</strong> ${txn.type}</p>
                    <p><strong>Party:</strong> ${txn.party}</p>
                    <p><strong>Date:</strong> ${new Date(txn.date).toLocaleDateString()}</p>
                    <p><strong>Amount:</strong> Rs ${Number(txn.amount || 0).toLocaleString()}</p>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Download"
          >
            <FaDownload size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">Loading transactions...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction History
          </h1>
          <p className="text-gray-600">Unified history of bills and challans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-l-blue-500">
          <h3 className="text-sm font-medium text-blue-800">
            Total Transactions
          </h3>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-l-green-500">
          <h3 className="text-sm font-medium text-green-800">Total Amount</h3>
          <p className="text-2xl font-bold text-green-900">
            Rs {(stats.totalAmount / 100000).toFixed(1)}L
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-3">
          Transaction Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-600" />
              <span className="text-sm font-medium">Challans</span>
            </div>
            <span className="text-lg font-bold text-blue-600">
              {stats.byType.Challan}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-green-600" />
              <span className="text-sm font-medium">Bills</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {stats.byType.Bill}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-purple-600" />
              <span className="text-sm font-medium">Prepaid</span>
            </div>
            <span className="text-lg font-bold text-purple-600">
              {stats.byType.Prepaid}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FaMoneyBillWave className="text-orange-600" />
              <span className="text-sm font-medium">Due</span>
            </div>
            <span className="text-lg font-bold text-orange-600">
              {stats.byType.Due}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={filters.type}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, type: value }))
            }
          >
            <option value="all">All Types</option>
            <option value="Challan">Challan</option>
            <option value="Bill">Bill</option>
            <option value="Prepaid">Prepaid</option>
          </Select>

          <Select
            value={filters.gstType}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, gstType: value }))
            }
          >
            <option value="all">All GST Types</option>
            <option value="1">1</option>
            <option value="0">0</option>
          </Select>

          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, dateFrom: value }))
            }
            placeholder="From Date"
          />

          <Button
            variant="outline"
            onClick={() =>
              setFilters({ dateFrom: "", type: "all", gstType: "all" })
            }
          >
            Clear All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchable
        sortable
        pagination
        pageSize={15}
      />
    </div>
  );
};

export default TransactionHistory;
