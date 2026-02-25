import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaFileInvoiceDollar,
  FaFilter,
  FaLink,
  FaEdit,
  FaTrash,
  FaDownload,
  FaPlus,
} from "react-icons/fa";
import { DataTable, Modal, DeleteConfirmDialog } from "../../components/common";
import { Button } from "../../components/ui";
import useStore from "../../store";
import api from "../../services/axiosInstance"; //
import { getResponseData, getResponseList, normalizeBill } from "../../services/apiUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillList = () => {
  const navigate = useNavigate();
  const { showToast, selectedFirm } = useStore();
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await api.get("/bills");
        setBills(getResponseList(response).map(normalizeBill));
      } catch (error) {
        console.error("Failed to fetch bills", error);
      }
    };
    fetchBills();
  }, []);

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    party: "",
    gstType: "all",
  });

  const [selectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    bill: null,
  });

  const generateBillPDF = async (bill) => {
    if (!bill?.id) {
      showToast("Invalid bill selected", "error");
      return;
    }

    let billData = bill?.raw || {};
    try {
      const res = await api.get(`/bills/${bill.id}`);
      billData = getResponseData(res) || billData;
    } catch (err) {
      console.error("Failed to fetch bill details for PDF:", err);
      showToast("Failed to load bill details for PDF", "error");
      return;
    }

    const challan = Array.isArray(billData?.challan_ids) ? billData.challan_ids[0] : null;
    if (!challan) {
      showToast("No challan found in this bill", "error");
      return;
    }

    const firmName = selectedFirm?.name || "MAHESHWARI MOTORS";
    const firmAddress =
      selectedFirm?.address || "52, KHOTODRA GIDC, BEHIND SUB JAIL, RING ROAD, SURAT.";

    const partyName =
      billData?.contact_id?.name || bill?.party || challan?.contact_id?.name || "CASH BOOK";
    const billNo = billData?.bill_no || billData?.billNo || bill?.billNo || "";
    const billDate = billData?.date ? new Date(billData.date) : new Date();
    const printOption = Number(challan?.print_option ?? 2) || 2;
    const totalAmount = Number(billData?.amount ?? challan?.amount ?? 0) || 0;

    const items = Array.isArray(challan?.items) ? challan.items : [];
    const rowsFromItems = items.map((item, index) => {
      const itemRef = item?.item_id || {};
      const itemName = itemRef?.item_name || itemRef?.name || item?.item_name || "Item";
      const barcode =
        itemRef?.barcode ||
        itemRef?.barcode_no ||
        itemRef?.barcodeNumber ||
        itemRef?.barcode_value ||
        item?.barcode ||
        "";

      const description = printOption === 2
        ? String(itemName).trim() || "Item"
        : String(barcode).trim() || "-";
      const quantity = Number(item?.quantity ?? 0) || 0;
      const rate = Number(item?.rate ?? 0) || 0;
      const discount = Number(item?.discount ?? 0) || 0;
      const specialDiscount = Number(item?.special_discount ?? 0) || 0;
      const amount = Number(item?.amount ?? 0) || 0;

      return [
        String(index + 1),
        description,
        quantity ? String(quantity) : "",
        rate.toFixed(2),
        discount.toFixed(2),
        specialDiscount.toFixed(2),
        amount.toFixed(2),
      ];
    });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(firmName.toUpperCase(), pageWidth / 2, margin + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(firmAddress, pageWidth / 2, margin + 13, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("BILL", pageWidth / 2, margin + 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Bill No.: ${billNo}`, margin + 4, margin + 28);
    doc.text(`Date: ${billDate.toLocaleDateString("en-IN")}`, pageWidth - margin - 4, margin + 28, {
      align: "right",
    });
    doc.text(`Party: ${partyName}`, margin + 4, margin + 35);
    doc.text(
      `Challan No.: ${challan?.challan_no || challan?.challanNo || ""}`,
      pageWidth - margin - 4,
      margin + 35,
      { align: "right" },
    );

    const head = [
      [
        "Sr.",
        printOption === 2 ? "Item Name" : "Barcode",
        "Qty.",
        "Rate",
        "Disc (%)",
        "Sp.Dis (%)",
        "Amount",
      ],
    ];

    autoTable(doc, {
      head,
      body: rowsFromItems.length ? rowsFromItems : [["", "", "", "", "", "", ""]],
      startY: margin + 42,
      margin: { left: margin },
      tableWidth: pageWidth - margin * 2,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 72 },
        2: { cellWidth: 12, halign: "right" },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 16, halign: "right" },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
      },
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, pageWidth - margin - 4, pageHeight - margin - 8, {
      align: "right",
    });

    const fileSafeBillNo = String(billNo || bill?.billNo || bill?.id).replace(/\s+/g, "_");
    doc.save(
      `${firmName.replace(/\s+/g, "_")}_Bill_${fileSafeBillNo}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const columns = [
    {
      key: "billNo",
      label: "Bill No",
      render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (value) => (
        <span className="text-xs sm:text-sm">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "party",
      label: "Party",
      render: (value) => (
        <span className="text-xs sm:text-sm truncate">{value}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) => (
        <span className="text-xs sm:text-sm">₹{value.toLocaleString()}</span>
      ),
    },
    {
      key: "linkedChallans",
      label: "Linked Challans",
      render: (value) => (
        <div className="flex items-center gap-1">
          <FaLink className="text-gray-400 text-xs" />
          <span className="text-xs sm:text-sm">{value.length} challan(s)</span>
        </div>
      ),
    },
    {
      key: "gstType",
      label: "Type",
      render: (value) => (
        <span
          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
            value === 1 ?
              "bg-green-100 text-green-800"
            : "bg-blue-100 text-blue-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: () => {
        showToast("Edit feature pending", "info");
      },
      className:
        "bg-gray-400 text-white cursor-not-allowed p-1 sm:p-1.5 md:p-2 text-xs",
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (bill) => setDeleteDialog({ isOpen: true, bill }),
      className:
        "bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs",
    },
    {
      label: <FaDownload size={10} className="sm:size-3 md:size-4" />,
      onClick: (bill) => {
        generateBillPDF(bill);
        /* Legacy print preview
        // Generate PDF
        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write(`
          <html>
            <head>
              <title>Bill ${bill.billNo}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .info { margin: 20px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; }
                .challans { margin-top: 20px; }
                .challans ul { list-style: none; padding: 0; }
                .challans li { padding: 5px 0; border-bottom: 1px solid #eee; }
              </style>
            </head>
            <body>
              <h1>Bill Details</h1>
              <div class="info">
                <p><span class="label">Bill No:</span> ${bill.billNo}</p>
                <p><span class="label">Date:</span> ${new Date(bill.date).toLocaleDateString()}</p>
                <p><span class="label">Party:</span> ${bill.party}</p>
                <p><span class="label">Amount:</span> ₹${bill.amount.toLocaleString()}</p>
                <p><span class="label">Type:</span> ${bill.gstType}</p>
              </div>
              <div class="challans">
                <h3>Linked Challans:</h3>
                <ul>
                  ${bill.linkedChallans.map((challan) => `<li>${challan}</li>`).join("")}
                </ul>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        */
      },
      className:
        "bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs",
    },
  ];

  // Apply filters
  const filteredBills = bills.filter((bill) => {
    if (
      filters.party &&
      !bill.party.toLowerCase().includes(filters.party.toLowerCase())
    )
      return false;
    if (filters.gstType !== "all" && bill.gstType !== parseInt(filters.gstType))
      return false;
    if (filters.dateFrom && new Date(bill.date) < new Date(filters.dateFrom))
      return false;
    if (filters.dateTo && new Date(bill.date) > new Date(filters.dateTo))
      return false;
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Bill List
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            View and manage final bills
          </p>
        </div>
        <Button
          onClick={() => navigate("/transactions/bills/create")}
          className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
        >
          <FaPlus className="text-sm sm:text-base" />
          Create Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-blue-500">
          <h3 className="text-xs sm:text-sm font-medium text-blue-800">
            Total Bills
          </h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">
            {bills.length}
          </p>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-2 sm:border-l-4 border-l-green-500">
          <h3 className="text-xs sm:text-sm font-medium text-green-800">
            Total Amount
          </h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">
            ₹{bills.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <FaFilter className="text-gray-500 text-sm sm:text-base" />
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search party..."
            value={filters.party}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, party: e.target.value }))
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
          />
          <select
            value={filters.gstType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, gstType: e.target.value }))
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="1">1</option>
            <option value="0">0</option>
          </select>
          {/* <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            placeholder="From Date"
            className="text-xs sm:text-sm py-1.5 sm:py-2"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            placeholder="To Date"
            className="text-xs sm:text-sm py-1.5 sm:py-2"
          /> */}
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                dateFrom: "",
                dateTo: "",
                party: "",
                gstType: "all",
              })
            }
            className="text-xs sm:text-sm py-1.5 sm:py-2"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={filteredBills}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          className="text-xs sm:text-sm"
          minWidth="700px"
        />
      </div>

      {/* View Bill Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Bill Details - ${selectedBill?.billNo}`}
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bill No
                </label>
                <p className="text-gray-900 font-medium">
                  {selectedBill.billNo}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <p className="text-gray-900">
                  {new Date(selectedBill.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Party
                </label>
                <p className="text-gray-900">{selectedBill.party}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <p className="text-gray-900 font-bold">
                  ₹{selectedBill.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linked Challans
              </label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {selectedBill.linkedChallans.map((challan, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {challan}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button className="flex items-center gap-2">
                <FaFileInvoiceDollar />
                Print Bill
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, bill: null })}
        onConfirm={async () => {
          try {
            await api.delete(`/bills/${deleteDialog.bill.id}`);
            showToast("Bill deleted successfully", "success");
            setBills((prev) =>
              prev.filter((b) => b.id !== deleteDialog.bill.id),
            );
            setDeleteDialog({ isOpen: false, bill: null });
          } catch (error) {
            console.error(error);
            showToast("Failed to delete bill", "error");
          }
        }}
        itemName={deleteDialog.bill?.billNo}
      />
    </div>
  );
};

export default BillList;
