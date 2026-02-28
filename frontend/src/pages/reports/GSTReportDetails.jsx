import React, { useMemo, useState } from "react";
import { Button, Input, Select } from "../../components/ui";
import { toNumber } from "../../services/apiUtils";
import { FaPrint } from "react-icons/fa";

const GST_REPORT_TYPES = ["Purchase", "Return", "Sale"];

const GST_SAMPLE_ROWS = [
  {
    date: "2026-02-03",
    vno: "3",
    acName: "EMS AUTOMOBILES",
    gstin: "24AAPHF0642G1ZI",
    itemName: "PISTON RING ECO SPORT",
    hsnCode: "8708",
    pcs: 1,
    rate: 1440.75,
    dis: 0,
    spDis: 0,
    taxableAmount: 1440.75,
    gstPercent: 18,
    gstAmount: 259.33,
    sgstAmount: 129.67,
    cgstAmount: 129.67,
    igstAmount: 0,
    net: 1700.08,
  },
  {
    date: "2026-02-03",
    vno: "GT4400",
    acName: "RUSHABH AUTO PARTS",
    gstin: "24APXPM9435M1ZX",
    itemName: "STUD KIT WAGONR",
    hsnCode: "8708",
    pcs: 4,
    rate: 324.0,
    dis: 50.0,
    spDis: 0,
    taxableAmount: 648.0,
    gstPercent: 18,
    gstAmount: 116.64,
    sgstAmount: 70.02,
    cgstAmount: 70.02,
    igstAmount: 0,
    net: 764.64,
  },
];

const GSTReportDetails = () => {
  const [filters, setFilters] = useState({
    type: "Purchase",
    book: "PURCHASE BOOK (GST)",
    dateFrom: "",
    dateTo: "",
    acName: "",
    gstin: "",
    hsnCode: "",
  });
  const [rows] = useState(GST_SAMPLE_ROWS);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.acName && !row.acName.toLowerCase().includes(filters.acName.toLowerCase())) return false;
      if (filters.gstin && !row.gstin.toLowerCase().includes(filters.gstin.toLowerCase())) return false;
      if (filters.hsnCode && !row.hsnCode.toLowerCase().includes(filters.hsnCode.toLowerCase())) return false;
      if (filters.dateFrom && new Date(row.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(row.date) > new Date(filters.dateTo)) return false;
      return true;
    });
  }, [rows, filters]);

  const totals = useMemo(() => {
    const taxable = filteredRows.reduce((sum, row) => sum + toNumber(row.taxableAmount, 0), 0);
    const gst = filteredRows.reduce((sum, row) => sum + toNumber(row.gstAmount, 0), 0);
    const sgst = filteredRows.reduce((sum, row) => sum + toNumber(row.sgstAmount, 0), 0);
    const cgst = filteredRows.reduce((sum, row) => sum + toNumber(row.cgstAmount, 0), 0);
    const igst = filteredRows.reduce((sum, row) => sum + toNumber(row.igstAmount, 0), 0);
    const net = filteredRows.reduce((sum, row) => sum + toNumber(row.net, 0), 0);
    return { taxable, gst, sgst, cgst, igst, net };
  }, [filteredRows]);

  return (
    <div className="space-y-6">
      <style>{`
        .gst-print-header { display: none; }
        @media print {
          .gst-print-hide { display: none !important; }
          .gst-print-header { display: block; }
          .gst-print-table th, .gst-print-table td { border: 1px solid #d1d5db; }
          .gst-print-table { border-collapse: collapse; width: 100%; font-size: 10px; }
          .gst-print-summary { border-top: 1px solid #d1d5db; margin-top: 8px; padding-top: 6px; font-size: 10px; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 gst-print-hide">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Report Details</h1>
          <p className="text-gray-600">GST bill wise report sale/purchase.</p>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <FaPrint /> Print
        </Button>
      </div>

      <div className="gst-print-header">
        <div className="text-lg font-semibold">GST Report Details</div>
        <div className="text-xs text-gray-600">GST bill wise report sale/purchase.</div>
        <div className="mt-2 text-xs text-gray-700">
          <span className="font-semibold">Type:</span> {filters.type}{" "}
          <span className="font-semibold ml-3">Book:</span> {filters.book || "-"}{" "}
          <span className="font-semibold ml-3">From:</span> {formatDate(filters.dateFrom)}{" "}
          <span className="font-semibold ml-3">To:</span> {formatDate(filters.dateTo)}
        </div>
        <div className="mt-1 text-xs text-gray-700">
          <span className="font-semibold">A/c Name:</span> {filters.acName || "-"}{" "}
          <span className="font-semibold ml-3">GSTIN:</span> {filters.gstin || "-"}{" "}
          <span className="font-semibold ml-3">HSN:</span> {filters.hsnCode || "-"}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 gst-print-hide">
        <h3 className="font-medium text-gray-900 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select
              value={filters.type}
              onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
            >
              {GST_REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
            <Input
              value={filters.book}
              onChange={(value) => setFilters((prev) => ({ ...prev, book: value }))}
              placeholder="PURCHASE BOOK (GST)"
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">A/c Name</label>
            <Input
              value={filters.acName}
              onChange={(value) => setFilters((prev) => ({ ...prev, acName: value }))}
              placeholder="Account Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <Input
              value={filters.gstin}
              onChange={(value) => setFilters((prev) => ({ ...prev, gstin: value }))}
              placeholder="GSTIN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
            <Input
              value={filters.hsnCode}
              onChange={(value) => setFilters((prev) => ({ ...prev, hsnCode: value }))}
              placeholder="HSN Code"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs gst-print-table">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-left">Vno</th>
                <th className="px-2 py-2 text-left">AcName</th>
                <th className="px-2 py-2 text-left">GSTIN</th>
                <th className="px-2 py-2 text-left">ItemName</th>
                <th className="px-2 py-2 text-left">HSNCode</th>
                <th className="px-2 py-2 text-right">Pcs</th>
                <th className="px-2 py-2 text-right">Rate</th>
                <th className="px-2 py-2 text-right">Dis%</th>
                <th className="px-2 py-2 text-right">SpDis%</th>
                <th className="px-2 py-2 text-right">Taxable Amount</th>
                <th className="px-2 py-2 text-right">Gst%</th>
                <th className="px-2 py-2 text-right">Gst Amount</th>
                <th className="px-2 py-2 text-right">SGST Amount</th>
                <th className="px-2 py-2 text-right">CGST Amount</th>
                <th className="px-2 py-2 text-right">IGST Amount</th>
                <th className="px-2 py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={`${row.vno}-${idx}`} className="border-b last:border-b-0">
                  <td className="px-2 py-1">{formatDate(row.date)}</td>
                  <td className="px-2 py-1">{row.vno}</td>
                  <td className="px-2 py-1">{row.acName}</td>
                  <td className="px-2 py-1">{row.gstin}</td>
                  <td className="px-2 py-1">{row.itemName}</td>
                  <td className="px-2 py-1">{row.hsnCode}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.pcs, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.rate, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.dis, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.spDis, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.taxableAmount, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.gstPercent, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.gstAmount, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.sgstAmount, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.cgstAmount, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.igstAmount, 0).toLocaleString()}</td>
                  <td className="px-2 py-1 text-right">{toNumber(row.net, 0).toLocaleString()}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={17}>
                    No GST report entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-3 text-xs text-gray-700 gst-print-summary">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>Taxable: <span className="font-semibold">{totals.taxable.toLocaleString()}</span></div>
            <div>GST: <span className="font-semibold">{totals.gst.toLocaleString()}</span></div>
            <div>SGST: <span className="font-semibold">{totals.sgst.toLocaleString()}</span></div>
            <div>CGST: <span className="font-semibold">{totals.cgst.toLocaleString()}</span></div>
            <div>IGST: <span className="font-semibold">{totals.igst.toLocaleString()}</span></div>
            <div>Net: <span className="font-semibold">{totals.net.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTReportDetails;
