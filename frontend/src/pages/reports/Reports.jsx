import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Select } from "../../components/ui";
import api from "../../services/axiosInstance";
import { getResponseList, normalizeContact, toNumber } from "../../services/apiUtils";
import { FaPrint, FaSyncAlt, FaSearch } from "react-icons/fa";

const SAMPLE_ROWS = [
  {
    date: "2026-02-12",
    voucherNo: "01232",
    type: "Sale",
    docNo: "SALE BOOK (GST)",
    narration: "SALE BOOK (GST)",
    debit: 1690.0,
    credit: 0,
    balance: 16265.0,
    cd: "Dr",
    firm: "MAA",
  },
  {
    date: "2026-02-13",
    voucherNo: "01270",
    type: "Sale",
    docNo: "SALE BOOK (GST)",
    narration: "SALE BOOK (GST)",
    debit: 4050.0,
    credit: 0,
    balance: 20315.0,
    cd: "Dr",
    firm: "MAA",
  },
  {
    date: "2026-02-14",
    voucherNo: "00724",
    type: "Cash Rec",
    docNo: "CASH BOOK",
    narration: "CASH BOOK",
    debit: 0,
    credit: 12022.0,
    balance: 8955.0,
    cd: "Dr",
    firm: "MAA",
  },
];

const REPORT_TYPES = ["All", "Sale", "Purchase", "Cash Rec", "Cash Pay", "Bank Rec", "Bank Pay"];

const Reports = () => {
  const [parties, setParties] = useState([]);
  const [filters, setFilters] = useState({
    partyId: "",
    dateFrom: "",
    dateTo: "",
    type: "All",
    docNo: "",
    narration: "",
    firm: "",
  });
  const [applied, setApplied] = useState(filters);
  const [rows, setRows] = useState(SAMPLE_ROWS);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await api.get("/contacts/parties", { params: { page: 1, limit: 200 } });
        const list = getResponseList(res).map((contact) => {
          const normalized = normalizeContact(contact);
          return { id: normalized.id, name: normalized.name };
        });
        setParties(list);
      } catch (error) {
        console.error("Failed to load parties", error);
      }
    };
    loadParties();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (applied.type !== "All" && row.type !== applied.type) return false;
      if (applied.docNo && !row.docNo.toLowerCase().includes(applied.docNo.toLowerCase())) return false;
      if (applied.narration && !row.narration.toLowerCase().includes(applied.narration.toLowerCase())) return false;
      if (applied.firm && !row.firm.toLowerCase().includes(applied.firm.toLowerCase())) return false;
      if (applied.dateFrom && new Date(row.date) < new Date(applied.dateFrom)) return false;
      if (applied.dateTo && new Date(row.date) > new Date(applied.dateTo)) return false;
      return true;
    });
  }, [rows, applied]);

  const totals = useMemo(() => {
    const debitTotal = filteredRows.reduce((sum, row) => sum + toNumber(row.debit, 0), 0);
    const creditTotal = filteredRows.reduce((sum, row) => sum + toNumber(row.credit, 0), 0);
    const closingBalance = filteredRows.length
      ? filteredRows[filteredRows.length - 1].balance
      : 0;
    return {
      debitTotal,
      creditTotal,
      closingBalance,
    };
  }, [filteredRows]);

  const handleView = () => {
    setApplied(filters);
  };

  const handleRefresh = () => {
    setFilters({
      partyId: "",
      dateFrom: "",
      dateTo: "",
      type: "All",
      docNo: "",
      narration: "",
      firm: "",
    });
    setApplied({
      partyId: "",
      dateFrom: "",
      dateTo: "",
      type: "All",
      docNo: "",
      narration: "",
      firm: "",
    });
    setRows(SAMPLE_ROWS);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Ledger Report</h1>
        <p className="text-gray-600">Filter party ledger entries and view debit/credit balances.</p>
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleView} className="flex items-center gap-2">
            <FaSearch /> View
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <FaPrint /> Print
          </Button>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <FaSyncAlt /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party</label>
            <Select
              value={filters.partyId}
              onChange={(value) => setFilters((prev) => ({ ...prev, partyId: value }))}
              placeholder="Select Party"
            >
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(value) => setFilters((prev) => ({ ...prev, dateFrom: value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(value) => setFilters((prev) => ({ ...prev, dateTo: value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select
              value={filters.type}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
            >
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doc No</label>
            <Input
              value={filters.docNo}
              onChange={(value) => setFilters((prev) => ({ ...prev, docNo: value }))}
              placeholder="Document No"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
            <Input
              value={filters.narration}
              onChange={(value) => setFilters((prev) => ({ ...prev, narration: value }))}
              placeholder="Narration"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firm</label>
            <Input
              value={filters.firm}
              onChange={(value) => setFilters((prev) => ({ ...prev, firm: value }))}
              placeholder="Firm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">V. No</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Doc No</th>
                <th className="px-3 py-2 text-left">Narration</th>
                <th className="px-3 py-2 text-right">Debit Amount</th>
                <th className="px-3 py-2 text-right">Credit Amount</th>
                <th className="px-3 py-2 text-right">Balance</th>
                <th className="px-3 py-2 text-left">C/D</th>
                <th className="px-3 py-2 text-left">Firm</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={`${row.voucherNo}-${idx}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
                  <td className="px-3 py-2">{row.voucherNo}</td>
                  <td className="px-3 py-2">{row.type}</td>
                  <td className="px-3 py-2">{row.docNo}</td>
                  <td className="px-3 py-2">{row.narration}</td>
                  <td className="px-3 py-2 text-right">{toNumber(row.debit, 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{toNumber(row.credit, 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{toNumber(row.balance, 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.cd}</td>
                  <td className="px-3 py-2">{row.firm}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                    No ledger entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-3 text-xs text-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>Total Debit: <span className="font-semibold">{totals.debitTotal.toLocaleString()}</span></div>
            <div>Total Credit: <span className="font-semibold">{totals.creditTotal.toLocaleString()}</span></div>
            <div>Closing Balance: <span className="font-semibold">{toNumber(totals.closingBalance, 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
