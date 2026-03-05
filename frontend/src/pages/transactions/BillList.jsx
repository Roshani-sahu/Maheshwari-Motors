import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  // FaEye,
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
import {
  getResponseData,
  getResponseList,
  normalizeBill,
} from "../../services/apiUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BillList = () => {
  const navigate = useNavigate();
  const { showToast, selectedFirm } = useStore();
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        let allBills = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 50) {
          const response = await api.get("/bills", {
            params: { page, limit: 100 },
          });
          const data = response?.data?.data;

          let pageData = [];
          if (Array.isArray(data)) {
            pageData = data;
            hasMore = false;
          } else {
            pageData = data?.data || [];
            if (data?.meta?.hasNextPage) {
              page++;
            } else {
              hasMore = false;
            }
          }
          allBills = [...allBills, ...pageData];
        }

        setBills(
          allBills.map(normalizeBill).sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date);
            const dateB = new Date(b.createdAt || b.date);
            return dateB - dateA;
          }),
        );
      } catch (error) {
        console.error("Failed to fetch bills", error);
        showToast(
          error?.response?.data?.message || "Failed to load bills",
          "error",
        );
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
      const response = await api.get(`/bills/${bill.id}`);
      billData = getResponseData(response) || billData;
    } catch (error) {
      console.error("Failed to fetch bill details for PDF:", error);
      showToast("Failed to load bill details for PDF", "error");
      return;
    }

    const challans =
      Array.isArray(billData?.challan_ids) ?
        billData.challan_ids.filter(Boolean)
      : [];
    if (challans.length === 0) {
      showToast("No challan found in this bill", "error");
      return;
    }

    const toMandatoryText = (value, fallback = "--") => {
      if (value === 0) return "0";
      if (value === null || value === undefined) return fallback;
      const text = String(value).trim();
      return text ? text : fallback;
    };

    const toNumberValue = (value, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const formatDateDDMMYYYY = (value) => {
      const date = value ? new Date(value) : new Date();
      if (Number.isNaN(date.getTime())) return "--";
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const formatAmount = (value) => toNumberValue(value, 0).toFixed(2);

    const extractStateCode = (gstinValue) => {
      const gstin = String(gstinValue || "").trim();
      const code = gstin.slice(0, 2);
      return /^\d{2}$/.test(code) ? code : "--";
    };

    const extractPan = (gstinValue) => {
      const gstin = String(gstinValue || "").trim();
      return gstin.length >= 12 ? gstin.slice(2, 12) : "--";
    };

    const extractPincode = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "--";
      const match = raw.match(/\b\d{6}\b/);
      return match ? match[0] : "--";
    };

    const resolvePan = (...values) => {
      for (const value of values) {
        const text = String(value || "")
          .trim()
          .toUpperCase();
        if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(text)) return text;
      }
      return "--";
    };

    const resolvePartyPincode = (party = {}) => {
      const candidates = [
        party?.pincode,
        party?.pin,
        party?.zip,
        party?.postal_code,
        party?.area_id?.pincode,
        party?.area?.pincode,
        party?.area,
        party?.address,
      ];
      for (const candidate of candidates) {
        const parsed = extractPincode(candidate);
        if (parsed !== "--") return parsed;
      }
      return "--";
    };

    const firmName = toMandatoryText(selectedFirm?.name || "MAHESHWARI MOTORS");
    const firmAddress = toMandatoryText(
      selectedFirm?.address ||
        "52, KHATODARA GIDC, BEHIND SUB JAIL, RING ROAD, SURAT.",
    );
    const firmPhone = toMandatoryText(
      selectedFirm?.phone || selectedFirm?.mobile || "02612633010, 7203801010",
    );
    const firmEmail = toMandatoryText(
      selectedFirm?.email || "kbc_mywords@yahoo.com",
    );
    const firmGstin = toMandatoryText(
      selectedFirm?.gstin ||
        selectedFirm?.GSTIN ||
        selectedFirm?.gst ||
        "24AGPPC7454F1ZO",
    );
    const firmPan = extractPan(firmGstin);
    const bankName = toMandatoryText(
      selectedFirm?.bank_name ||
        selectedFirm?.bankName ||
        "PRIME CO OP BANK LTD",
    );
    const bankAccountNo = toMandatoryText(
      selectedFirm?.account_number ||
        selectedFirm?.accountNumber ||
        "10032001002995",
    );
n     // suggest a different default title based on contact type
    const defaultTitle = billData?.contact_id
      ? billData.contact_id.type === "supplier"
        ? "PURCHASE TAX INVOICE"
        : "SALE TAX INVOICE"
      : "TAX INVOICE";
    const invoiceTitleInput = window.prompt("Enter bill title", defaultTitle);
    const invoiceTitle = toMandatoryText(
      invoiceTitleInput,
      defaultTitle,
    ).toUpperCase();

    const invoiceDateObj =
      billData?.date ? new Date(billData.date) : new Date();
    const invoiceDate = formatDateDDMMYYYY(invoiceDateObj);
    const financialYearStart =
      invoiceDateObj.getMonth() >= 3 ?
        invoiceDateObj.getFullYear()
      : invoiceDateObj.getFullYear() - 1;
    const financialYear = `${financialYearStart}-${financialYearStart + 1}`;

    const contact = billData?.contact_id || {};
    const transport = billData?.transport_id || {};

    const receiverName = toMandatoryText(
      billData?.customer_name || contact?.name || bill?.party || "CASH BOOK",
    );
    const receiverAddress = toMandatoryText(contact?.address);
    const receiverCity = toMandatoryText(contact?.city);
    const receiverState = toMandatoryText(contact?.state || "GUJARAT");
    const receiverGstin = toMandatoryText(contact?.gstin);
    const receiverStateCode = extractStateCode(contact?.gstin);
    const receiverPhone = toMandatoryText(contact?.phone);
    const receiverPin = resolvePartyPincode(contact);
    const receiverPan = resolvePan(
      contact?.pan_number,
      contact?.pan,
      contact?.reg_number,
      extractPan(contact?.gstin),
    );

    const consigneeName = toMandatoryText(
      billData?.customer_name || contact?.name,
    );
    const consigneeAddress = toMandatoryText(
      billData?.shipping_address || contact?.address,
    );
    const consigneeCity = toMandatoryText(
      billData?.shipping_city || contact?.city,
    );
    const consigneeState = toMandatoryText(
      billData?.shipping_state || contact?.state,
    );
    const consigneeGstin = toMandatoryText(
      billData?.shipping_gstin || contact?.gstin,
    );
    const consigneeStateCode = extractStateCode(
      billData?.shipping_gstin || contact?.gstin,
    );
    const consigneePin = (() => {
      const candidates = [
        billData?.shipping_pincode,
        billData?.shipping_pin,
        billData?.shipping_zip,
        billData?.shipping_postal_code,
        billData?.shipping_address,
        resolvePartyPincode(contact),
      ];
      for (const candidate of candidates) {
        const parsed = extractPincode(candidate);
        if (parsed !== "--") return parsed;
      }
      return "--";
    })();
    const consigneePan = resolvePan(
      billData?.shipping_pan,
      billData?.shipping_pan_no,
      billData?.shipping_reg_no,
      extractPan(billData?.shipping_gstin || contact?.gstin),
      receiverPan,
    );

    const billNo = toMandatoryText(
      billData?.bill_no || billData?.billNo || bill?.billNo,
    );
    const challanNos = challans
      .map((challan) => challan?.challan_no || challan?.challanNo || "")
      .filter(Boolean)
      .join(", ");

    const printOption =
      Number(
        challans.find((challan) => Number(challan?.print_option ?? 0) > 0)
          ?.print_option ??
          billData?.print_option ??
          2,
      ) || 2;

    const parsedItems = challans.flatMap((challan) => {
      const challanItems = Array.isArray(challan?.items) ? challan.items : [];
      return challanItems.map((item) => {
        const itemRef = item?.item_id || {};
        const itemName =
          itemRef?.item_name || itemRef?.name || item?.item_name || "";
        const barcode =
          itemRef?.barcode ||
          itemRef?.barcode_no ||
          itemRef?.barcodeNumber ||
          itemRef?.barcode_value ||
          itemRef?.part_no ||
          item?.barcode ||
          item?.part_no ||
          "";
        const remark = item?.remark || item?.remarks || "";

        const description =
          printOption === 2 ?
            toMandatoryText(remark || itemName, "Item")
          : toMandatoryText(barcode, "-");
        const hsn = toMandatoryText(
          itemRef?.hsn || itemRef?.hsn_code || item?.hsn || item?.hsn_code,
        );

        const quantity = toNumberValue(item?.quantity, 0);
        const rate = toNumberValue(item?.rate, 0);
        const discount = toNumberValue(item?.discount, 0);
        const specialDiscount = toNumberValue(item?.special_discount, 0);
        const taxable = toNumberValue(item?.taxable_amount, 0);
        const taxPercent = toNumberValue(item?.gst_percent, 0);
        const taxAmount = toNumberValue(item?.gst_amount, 0);
        const amount = toNumberValue(item?.amount, 0);

        return {
          description,
          hsn,
          quantity,
          rate,
          discount,
          specialDiscount,
          taxable,
          taxPercent,
          taxAmount,
          amount,
        };
      });
    });

    const itemRows = parsedItems.map((item, index) => [
      String(index + 1),
      item.description,
      item.hsn,
      String(item.quantity),
      formatAmount(item.rate),
      formatAmount(item.discount),
      formatAmount(item.specialDiscount),
      formatAmount(item.taxable),
      formatAmount(item.taxPercent),
      formatAmount(item.taxAmount),
      formatAmount(item.amount),
    ]);

    const taxableTotal = parsedItems.reduce(
      (sum, item) => sum + item.taxable,
      0,
    );
    const taxTotal = parsedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalFromItems = parsedItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalQty = parsedItems.reduce((sum, item) => sum + item.quantity, 0);
    const transportCharge = toNumberValue(billData?.transport_charge, 0);
    const totalAmount = toNumberValue(billData?.amount, totalFromItems);
    const isGstBill = Number(billData?.is_gst ?? bill?.gstType ?? 1) === 1;
    const sgstAmount = isGstBill ? taxTotal / 2 : 0;
    const cgstAmount = isGstBill ? taxTotal / 2 : 0;
    const igstAmount = isGstBill ? 0 : taxTotal;
    const totalBeforeTax = taxableTotal;

    const amountInWords = (() => {
      const ones = [
        "",
        "ONE",
        "TWO",
        "THREE",
        "FOUR",
        "FIVE",
        "SIX",
        "SEVEN",
        "EIGHT",
        "NINE",
        "TEN",
        "ELEVEN",
        "TWELVE",
        "THIRTEEN",
        "FOURTEEN",
        "FIFTEEN",
        "SIXTEEN",
        "SEVENTEEN",
        "EIGHTEEN",
        "NINETEEN",
      ];
      const tens = [
        "",
        "",
        "TWENTY",
        "THIRTY",
        "FORTY",
        "FIFTY",
        "SIXTY",
        "SEVENTY",
        "EIGHTY",
        "NINETY",
      ];
      const convertTwoDigits = (num) => {
        if (num < 20) return ones[num];
        const ten = Math.floor(num / 10);
        const unit = num % 10;
        return `${tens[ten]}${unit ? ` ${ones[unit]}` : ""}`.trim();
      };
      const convertThreeDigits = (num) => {
        const hundred = Math.floor(num / 100);
        const rest = num % 100;
        if (!hundred) return convertTwoDigits(rest);
        return `${ones[hundred]} HUNDRED${rest ? ` ${convertTwoDigits(rest)}` : ""}`;
      };
      const toWordsIndian = (num) => {
        if (num === 0) return "ZERO";
        const crore = Math.floor(num / 10000000);
        const lakh = Math.floor((num % 10000000) / 100000);
        const thousand = Math.floor((num % 100000) / 1000);
        const hundred = num % 1000;
        const parts = [];
        if (crore) parts.push(`${convertTwoDigits(crore)} CRORE`);
        if (lakh) parts.push(`${convertTwoDigits(lakh)} LAKH`);
        if (thousand) parts.push(`${convertTwoDigits(thousand)} THOUSAND`);
        if (hundred) parts.push(convertThreeDigits(hundred));
        return parts.join(" ").trim();
      };

      const rupees = Math.floor(toNumberValue(totalAmount, 0));
      const paise = Math.round((toNumberValue(totalAmount, 0) - rupees) * 100);
      const rupeesText = toWordsIndian(rupees);
      if (paise > 0) {
        return `${rupeesText} RUPEES AND ${toWordsIndian(paise)} PAISE ONLY`;
      }
      return `${rupeesText} ONLY`;
    })();

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;
    const blue = [0, 0, 190];
    const headerFill = [203, 239, 243];
    const fitTextSingleLine = (text, maxWidth) => {
      const source = String(text || "");
      if (!source) return "";
      if (doc.getTextWidth(source) <= maxWidth) return source;
      let trimmed = source;
      while (
        trimmed.length > 0 &&
        doc.getTextWidth(`${trimmed}...`) > maxWidth
      ) {
        trimmed = trimmed.slice(0, -1);
      }
      return trimmed ? `${trimmed}...` : "";
    };

    const drawPageBorder = () => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);
      doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);
    };

    drawPageBorder();

    let cursorY = margin + 2;

    doc.setFont("times", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...blue);
    doc.text(firmName.toUpperCase(), margin + contentWidth / 2, cursorY + 4, {
      align: "center",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      doc.splitTextToSize(firmAddress, contentWidth - 16),
      margin + contentWidth / 2,
      cursorY + 9,
      {
        align: "center",
      },
    );

    doc.text(`Ph.${firmPhone}`, margin + contentWidth / 2, cursorY + 18, {
      align: "center",
    });
    doc.text(`Email : ${firmEmail}`, margin + contentWidth / 2, cursorY + 23, {
      align: "center",
    });

    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.text(`GSTIN : ${firmGstin}`, margin + contentWidth / 2, cursorY + 28, {
      align: "center",
    });

    doc.setFont("times", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...blue);
    doc.text(
      "Original For Recipient [ ]",
      margin + contentWidth - 2,
      cursorY + 12,
      { align: "right" },
    );
    doc.text(
      "Duplicate For Transporter [ ]",
      margin + contentWidth - 2,
      cursorY + 18,
      { align: "right" },
    );
    doc.text(
      "Triplicate For Supplier [ ]",
      margin + contentWidth - 2,
      cursorY + 24,
      { align: "right" },
    );

    cursorY += 31;

    doc.setFillColor(...headerFill);
    doc.rect(margin, cursorY, contentWidth, 7.5, "FD");
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...blue);
    doc.text(invoiceTitle, margin + contentWidth / 2, cursorY + 5.2, {
      align: "center",
    });
    cursorY += 7.5;

    const detailSectionHeight = 32;
    const splitX = margin + contentWidth * 0.53;
    doc.setTextColor(0, 0, 0);
    doc.rect(margin, cursorY, contentWidth, detailSectionHeight);
    doc.line(splitX, cursorY, splitX, cursorY + detailSectionHeight);

    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    const leftX = margin + 1.8;
    const rightX = splitX + 1.8;
    const baseLineY = cursorY + 6;
    const rowGap = 6;

    doc.text(`Invoice No : ${billNo} (${financialYear})`, leftX, baseLineY);
    doc.text(`Invoice Date : ${invoiceDate}`, leftX, baseLineY + rowGap);
    doc.text(
      "Tax is Payable On Reverse Charge (Y/N) : --",
      leftX,
      baseLineY + rowGap * 2,
    );
    doc.text(`State : ${receiverState}`, leftX, baseLineY + rowGap * 3);
    doc.text(
      `State Code : ${receiverStateCode}`,
      leftX + 55,
      baseLineY + rowGap * 3,
    );

    doc.text(
      `Transport : ${toMandatoryText(transport?.name)}`,
      rightX,
      baseLineY,
    );
    doc.text(
      `Vehicle No. : ${toMandatoryText(billData?.vehicle_number)}`,
      rightX,
      baseLineY + rowGap,
    );
    doc.text(
      `Date & Time Of Supply : ${invoiceDate}`,
      rightX,
      baseLineY + rowGap * 2,
    );
    doc.text(
      `Place Of Supply : ${receiverCity}`,
      rightX,
      baseLineY + rowGap * 3,
    );

    cursorY += detailSectionHeight;

    doc.setFillColor(...headerFill);
    doc.rect(margin, cursorY, contentWidth, 7.5, "FD");
    doc.line(splitX, cursorY, splitX, cursorY + 7.5);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    doc.text(
      "Details Of Receivers (Billed To)  Recipient",
      margin + 1.8,
      cursorY + 5.2,
    );
    doc.text("Details Of Consignee (Shipped To)", splitX + 1.8, cursorY + 5.2);
    cursorY += 7.5;

    const partyBoxHeight = 52;
    doc.setTextColor(0, 0, 0);
    doc.rect(margin, cursorY, contentWidth, partyBoxHeight);
    doc.line(splitX, cursorY, splitX, cursorY + partyBoxHeight);

    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    const leftPartyX = margin + 1.8;
    const rightPartyX = splitX + 1.8;

    doc.text(`Name : ${receiverName}`, leftPartyX, cursorY + 6.5);
    doc.setFont("times", "normal");
    doc.text(
      doc.splitTextToSize(receiverAddress, contentWidth * 0.48),
      leftPartyX,
      cursorY + 12.5,
    );
    doc.text(`City : ${receiverCity}`, leftPartyX, cursorY + 24.5);
    doc.text(`Pin : ${receiverPin}`, leftPartyX + 32, cursorY + 24.5);
    doc.text(`Phone : ${receiverPhone}`, leftPartyX, cursorY + 29.2);
    doc.text(`GSTIN : ${receiverGstin}`, leftPartyX, cursorY + 34);
    doc.text(`PAN No. : ${receiverPan}`, leftPartyX + 62, cursorY + 34);
    doc.setFont("times", "bold");
    doc.text(`State : ${receiverState}`, leftPartyX, cursorY + 41);
    doc.text(
      `State Code : ${receiverStateCode}`,
      leftPartyX + 62,
      cursorY + 41,
    );

    doc.setFont("times", "bold");
    doc.text(`Name : ${consigneeName}`, rightPartyX, cursorY + 6.5);
    doc.setFont("times", "normal");
    doc.text(
      doc.splitTextToSize(consigneeAddress, contentWidth * 0.48),
      rightPartyX,
      cursorY + 12.5,
    );
    doc.text(`City : ${consigneeCity}`, rightPartyX, cursorY + 24.5);
    doc.text(`Pin : ${consigneePin}`, rightPartyX + 32, cursorY + 24.5);
    doc.text(`GSTIN : ${consigneeGstin}`, rightPartyX, cursorY + 34);
    doc.text(`PAN No. : ${consigneePan}`, rightPartyX + 56, cursorY + 34);
    doc.setFont("times", "bold");
    doc.text(`State : ${consigneeState}`, rightPartyX, cursorY + 41);
    doc.text(
      `State Code : ${consigneeStateCode}`,
      rightPartyX + 56,
      cursorY + 41,
    );

    cursorY += partyBoxHeight;

    doc.rect(margin, cursorY, contentWidth, 8);
    doc.line(splitX, cursorY, splitX, cursorY + 8);
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Order No : ${toMandatoryText(challanNos)}`,
      margin + 1.8,
      cursorY + 5.3,
    );
    doc.text(
      `Broker : ${toMandatoryText(billData?.broker_name || billData?.agent_name)}`,
      splitX + 1.8,
      cursorY + 5.3,
    );
    cursorY += 8;

    autoTable(doc, {
      head: [
        [
          "Sr.",
          printOption === 2 ? "Item Description" : "Barcode",
          "HSN",
          "Qty.",
          "Rate",
          "Dis.%",
          "Sp.%",
          "Taxable",
          "Tax %",
          "Tax.Amt.",
          "Amount",
        ],
      ],
      body:
        itemRows.length ? itemRows : (
          [
            [
              "1",
              "--",
              "--",
              "0",
              "0.00",
              "0.00",
              "0.00",
              "0.00",
              "0.00",
              "0.00",
              "0.00",
            ],
          ]
        ),
      startY: cursorY,
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 8.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        cellPadding: { top: 1, right: 1.2, bottom: 1, left: 1.2 },
      },
      headStyles: {
        fillColor: headerFill,
        textColor: blue,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "left" },
        1: { cellWidth: 56, halign: "left" },
        2: { cellWidth: 16, halign: "left" },
        3: { cellWidth: 11, halign: "right" },
        4: { cellWidth: 15, halign: "right" },
        5: { cellWidth: 12, halign: "right" },
        6: { cellWidth: 12, halign: "right" },
        7: { cellWidth: 17, halign: "right" },
        8: { cellWidth: 12, halign: "right" },
        9: { cellWidth: 17, halign: "right" },
        10: { cellWidth: 20, halign: "right" },
      },
    });

    let summaryY = (doc.lastAutoTable?.finalY || cursorY) + 3.5;
    const summaryHeight = 56;
    if (summaryY + summaryHeight > pageHeight - margin - 1) {
      doc.addPage();
      drawPageBorder();
      summaryY = margin + 8;
    }

    const totalRowHeight = 10;
    const midBlockHeight = 18;
    const wordsRowHeight = 8;
    const termsBlockHeight = 22;
    const summaryRightX = margin + contentWidth;
    const tableColumnWidths = [8, 56, 16, 11, 15, 12, 12, 17, 12, 17, 20];
    const columnRightEdges = [];
    let runningX = margin;
    tableColumnWidths.forEach((width) => {
      runningX += width;
      columnRightEdges.push(runningX);
    });

    doc.setFillColor(...headerFill);
    doc.rect(margin, summaryY, contentWidth, totalRowHeight, "FD");
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    const totalLabelCenter =
      margin +
      (tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2]) / 2;
    doc.text("TOTAL :", totalLabelCenter, summaryY + 5.3, { align: "center" });
    doc.text(
      String(Math.round(totalQty)),
      columnRightEdges[3] - 1.2,
      summaryY + 5.3,
      { align: "right" },
    );
    doc.text(
      formatAmount(totalBeforeTax),
      columnRightEdges[7] - 1.2,
      summaryY + 5.3,
      { align: "right" },
    );
    doc.text(
      formatAmount(taxTotal),
      columnRightEdges[9] - 1.2,
      summaryY + 5.3,
      { align: "right" },
    );
    doc.text(
      formatAmount(totalAmount),
      columnRightEdges[10] - 1.2,
      summaryY + 5.3,
      { align: "right" },
    );

    const midBlockY = summaryY + totalRowHeight;
    const rightInfoWidth = 58;
    const splitInfoX = summaryRightX - rightInfoWidth;
    doc.setTextColor(0, 0, 0);
    doc.rect(margin, midBlockY, contentWidth, midBlockHeight);
    doc.line(splitInfoX, midBlockY, splitInfoX, midBlockY + midBlockHeight);
    const bankAreaRightX = margin + 58;
    doc.line(
      bankAreaRightX,
      midBlockY,
      bankAreaRightX,
      midBlockY + midBlockHeight,
    );

    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text(bankName, margin + 1.8, midBlockY + 5.3);
    doc.text(bankAccountNo, margin + 1.8, midBlockY + 10.3);
    doc.text(`PAN No. : ${firmPan}`, margin + 1.8, midBlockY + 15.3);

    const taxGridLeftX = bankAreaRightX + 2;
    const taxColumnWidths = [12, 18, 11, 11, 11];
    const taxColumnStarts = [];
    const taxColumnEnds = [];
    let taxCursorX = taxGridLeftX;
    taxColumnWidths.forEach((width) => {
      taxColumnStarts.push(taxCursorX);
      taxColumnEnds.push(taxCursorX + width);
      taxCursorX += width;
    });

    doc.setFont("times", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...blue);
    const taxHeaders = ["Tax%", "Taxable%", "SGST", "CGST", "Tax Amt."];
    taxHeaders.forEach((header, idx) => {
      const centerX = taxColumnStarts[idx] + taxColumnWidths[idx] / 2;
      doc.text(header, centerX, midBlockY + 5, { align: "center" });
    });
    doc.text(
      isGstBill ? "18.00" : "0.00",
      taxColumnEnds[0] - 0.8,
      midBlockY + 10.2,
      { align: "right" },
    );
    doc.text(
      formatAmount(totalBeforeTax),
      taxColumnEnds[1] - 0.8,
      midBlockY + 10.2,
      { align: "right" },
    );
    doc.text(
      formatAmount(sgstAmount),
      taxColumnEnds[2] - 0.8,
      midBlockY + 10.2,
      { align: "right" },
    );
    doc.text(
      formatAmount(cgstAmount),
      taxColumnEnds[3] - 0.8,
      midBlockY + 10.2,
      { align: "right" },
    );
    doc.text(formatAmount(taxTotal), taxColumnEnds[4] - 0.8, midBlockY + 10.2, {
      align: "right",
    });

    doc.setFont("times", "bold");
    doc.text("* TOTAL :", taxColumnStarts[0], midBlockY + 15.4);
    doc.text(
      formatAmount(totalBeforeTax),
      taxColumnEnds[1] - 0.8,
      midBlockY + 15.4,
      { align: "right" },
    );
    doc.text(
      formatAmount(sgstAmount),
      taxColumnEnds[2] - 0.8,
      midBlockY + 15.4,
      { align: "right" },
    );
    doc.text(
      formatAmount(cgstAmount),
      taxColumnEnds[3] - 0.8,
      midBlockY + 15.4,
      { align: "right" },
    );
    doc.text(formatAmount(taxTotal), taxColumnEnds[4] - 0.8, midBlockY + 15.4, {
      align: "right",
    });

    const rightLabelX = splitInfoX + 2;
    const rightRateRightX = summaryRightX - 15;
    const rightAmountRightX = summaryRightX - 1.6;
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(8.2);
    const beforeTaxLabel = fitTextSingleLine(
      `Total Amount before Tax${transportCharge ? " (+Tr)" : ""} :`,
      rightRateRightX - rightLabelX - 1,
    );
    doc.text(beforeTaxLabel, rightLabelX, midBlockY + 5);
    doc.text(formatAmount(totalBeforeTax), rightAmountRightX, midBlockY + 5, {
      align: "right",
    });
    doc.text("+ SGST", rightLabelX, midBlockY + 10.2);
    doc.text(
      isGstBill ? "9.000 %" : "0.000 %",
      rightRateRightX,
      midBlockY + 10.2,
      { align: "right" },
    );
    doc.text(formatAmount(sgstAmount), rightAmountRightX, midBlockY + 10.2, {
      align: "right",
    });
    doc.text(isGstBill ? "+ CGST" : "+ IGST", rightLabelX, midBlockY + 15.4);
    doc.text(
      isGstBill ? "9.000 %" : "18.000 %",
      rightRateRightX,
      midBlockY + 15.4,
      { align: "right" },
    );
    doc.text(
      formatAmount(isGstBill ? cgstAmount : igstAmount),
      rightAmountRightX,
      midBlockY + 15.4,
      {
        align: "right",
      },
    );

    const wordsY = midBlockY + midBlockHeight;
    doc.setFillColor(...headerFill);
    doc.rect(margin, wordsY, contentWidth, wordsRowHeight, "FD");
    const netAmountSectionWidth = 44;
    const netAmountLeftX = summaryRightX - netAmountSectionWidth;
    doc.line(netAmountLeftX, wordsY, netAmountLeftX, wordsY + wordsRowHeight);
    doc.setFont("times", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(0, 0, 0);
    const wordsLine = fitTextSingleLine(
      `(in Words) : ${amountInWords}`,
      netAmountLeftX - margin - 3,
    );
    doc.text(wordsLine, margin + 1.8, wordsY + 5.3);
    doc.text("NET AMOUNT :", netAmountLeftX + 2, wordsY + 5.3);
    doc.setTextColor(...blue);
    doc.setFontSize(11);
    doc.text(formatAmount(totalAmount), summaryRightX - 1.8, wordsY + 5.3, {
      align: "right",
    });

    const termsY = wordsY + wordsRowHeight;
    const termsSplitX = margin + contentWidth * 0.56;

    // allow the bottom footer (terms + signatures) to expand to the very bottom of the page
    const availableFooter = pageHeight - margin - termsY;
    const footerHeight = Math.max(termsBlockHeight, availableFooter);

    doc.setTextColor(0, 0, 0);
    doc.rect(margin, termsY, contentWidth, footerHeight);
    doc.line(termsSplitX, termsY, termsSplitX, termsY + footerHeight);

    doc.setFont("times", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(...blue);
    doc.text("Term & Condition :-", margin + 1.8, termsY + 5.2);
    doc.setFont("times", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8.8);
    doc.text(
      "Payment will be accepted by A/c. pay cheque only.",
      margin + 1.8,
      termsY + 10.2,
    );
    doc.text(
      "We are not responsible for any lose or damage during transit.",
      margin + 1.8,
      termsY + 14.7,
    );
    doc.text("GST Rule Follow.", margin + 1.8, termsY + 19.2);

    doc.setFont("times", "bold");
    doc.setFontSize(8.8);
    doc.text("Electronic Reference Number", termsSplitX + 2, termsY + 5.2);
    const rightSectionWidth = summaryRightX - termsSplitX - 3.5;
    const certLine = fitTextSingleLine(
      "Certified That Particulars Given Above Are True And Correct",
      rightSectionWidth,
    );
    doc.text(certLine, termsSplitX + 2, termsY + 10.2);
    const rightSectionCenterX = termsSplitX + (summaryRightX - termsSplitX) / 2;
    const leftSectionCenterX = margin + (termsSplitX - margin) / 2;
    doc.setTextColor(...blue);
    doc.setFontSize(11);

    // move the signature block down to the bottom of the footer area
    const signatureY = termsY + footerHeight - 6; // 6mm up from bottom
    const forLineY = signatureY - 5;
    doc.text(`For : ${firmName.toUpperCase()}`, rightSectionCenterX, forLineY, {
      align: "center",
    });
    doc.setFontSize(9.5);
    doc.text("Receiver's Signature", leftSectionCenterX, signatureY, {
      align: "center",
    });
    doc.text("Authorised Signatory", rightSectionCenterX, signatureY, {
      align: "center",
    });

    const safeBillNo = String(billNo || bill?.billNo || bill?.id).replace(
      /[^\w-]+/g,
      "_",
    );
    doc.save(`${firmName.replace(/[^\w-]+/g, "_")}_Invoice_${safeBillNo}.pdf`);
  };

  const columns = [
    {
      key: "billNo",
      label: "Bill No",
      render: (value) => (
        <span className="text-xs sm:text-sm font-medium">{value}</span>
      ),
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
                <p><span class="label">Party:</span> ${bill.customer_name || bill.party || "-"}</p>
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
      !((bill.party || bill.customer_name || "").toLowerCase().includes(filters.party.toLowerCase()))
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
            showToast(
              error?.response?.data?.message || "Failed to delete bill",
              "error",
            );
          }
        }}
        itemName={deleteDialog.bill?.billNo}
      />
    </div>
  );
};

export default BillList;
