import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Select } from "../../components/ui";
import api from "../../services/axiosInstance";
import { getResponseData, getResponseList, normalizeContact, toNumber } from "../../services/apiUtils";
import { FaPrint, FaSyncAlt, FaSearch } from "react-icons/fa";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiTotals, setApiTotals] = useState({ debit: 0, credit: 0, closing: 0, closingCd: "" });

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
    const hasRows = filteredRows.length > 0;
    const debitTotal = hasRows
      ? filteredRows.reduce((sum, row) => sum + toNumber(row.debit, 0), 0)
      : toNumber(apiTotals.debit, 0);
    const creditTotal = hasRows
      ? filteredRows.reduce((sum, row) => sum + toNumber(row.credit, 0), 0)
      : toNumber(apiTotals.credit, 0);
    const closingBalance = hasRows
      ? filteredRows[filteredRows.length - 1].balance
      : toNumber(apiTotals.closing, 0);
    const closingCd = hasRows
      ? filteredRows[filteredRows.length - 1].cd
      : apiTotals.closingCd || "";
    return { debitTotal, creditTotal, closingBalance, closingCd };
  }, [filteredRows, apiTotals]);

  const handleView = async () => {
    if (!filters.partyId) {
      setRows([]);
      setApplied(filters);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/reports/account-ledger", {
        params: {
          contact_id: filters.partyId,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
        },
      });
      const payload = getResponseData(res) || {};
      const entries = Array.isArray(payload.entries) ? payload.entries : [];
      const mapped = entries.map((entry) => ({
        date: entry.date,
        voucherNo: entry.v_no || entry.voucher_no || entry.vNo || "",
        type: entry.type || "",
        docNo: entry.doc_no || "",
        narration: entry.narration || "",
        debit: toNumber(entry.debit_amount ?? entry.debit, 0),
        credit: toNumber(entry.credit_amount ?? entry.credit, 0),
        balance: toNumber(entry.balance, 0),
        cd: entry.cd || "",
        firm: entry.firm || "",
      }));
      setRows(mapped);
      setApiTotals({
        debit: toNumber(payload.total_debit, 0),
        credit: toNumber(payload.total_credit, 0),
        closing:
          mapped.length > 0
            ? mapped[mapped.length - 1].balance
            : toNumber(payload.closing_balance, 0),
        closingCd:
          mapped.length > 0 ? mapped[mapped.length - 1].cd : payload.closing_cd || "",
      });
      setApplied(filters);
    } catch (error) {
      console.error("Failed to load account ledger", error);
    } finally {
      setLoading(false);
    }
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
    setRows([]);
    setApiTotals({ debit: 0, credit: 0, closing: 0, closingCd: "" });
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
              <option value="">Select Party</option>
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
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                    Loading ledger...
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={`${row.voucherNo}-${idx}`} className="border-b last:border-b-0">
                    <td className="px-3 py-2">
                      {row.date ? new Date(row.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2">{row.voucherNo}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.docNo}</td>
                    <td className="px-3 py-2">{row.narration}</td>
                    <td className="px-3 py-2 text-right">
                      {toNumber(row.debit, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {toNumber(row.credit, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {toNumber(row.balance, 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{row.cd}</td>
                    <td className="px-3 py-2">{row.firm}</td>
                  </tr>
                ))
              )}
              {!loading && filteredRows.length === 0 && (
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
            <div>
              Closing Balance:{" "}
              <span className="font-semibold">
                {toNumber(totals.closingBalance, 0).toLocaleString()} {totals.closingCd}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
