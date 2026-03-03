import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaSave, FaPrint, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Button } from "../../components/ui";
import useStore from "../../store";
import { Modal } from "../../components/common";
import api from "../../services/axiosInstance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getResponseData,
  getResponseList,
  getResponseMeta,
  getEntityId,
  normalizeContact,
  normalizeItem,
} from "../../services/apiUtils";

const BillForm = () => {
  const navigate = useNavigate();
  const { showToast, user, selectedFirm } = useStore();
  console.log("Selected firm in BillForm:", selectedFirm);

  const normalizeFirmType = (value) =>
    String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[-\s]/g, "_");

  const getFirmTypeFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token || typeof token !== "string") return "";
    const parts = token.split(".");
    if (parts.length < 2) return "";

    try {
      // JWT payload is base64url encoded JSON
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      const payload = JSON.parse(atob(padded));
      return payload?.firm_type || payload?.firmType || "";
    } catch {
      return "";
    }
  };

  const firmType =
    selectedFirm?.type ||
    (selectedFirm?.id === "GST" ? "GST"
    : selectedFirm?.id === "NON_GST" ? "NON_GST"
    : "") ||
    getFirmTypeFromToken() ||
    user?.current_firm_type ||
    user?.firm_type ||
    user?.firmType ||
    user?.firm_data?.firm_type ||
    "";

  const isFirmGST =
    selectedFirm?.id === "gst" || normalizeFirmType(firmType) === "GST";

  const [loadedParties, setLoadedParties] = useState([]);
  const [loadedSuppliers, setLoadedSuppliers] = useState([]);
  const [loadedAgents, setLoadedAgents] = useState([]);
  const [loadedTransports, setLoadedTransports] = useState([]);
  const [loadedBanks, setLoadedBanks] = useState([]);
  const [loadedItems, setLoadedItems] = useState([]);
  const [loadedDiscounts, setLoadedDiscounts] = useState({});
  const [loadedLabelDiscounts, setLoadedLabelDiscounts] = useState({});
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [totalItemsPages, setTotalItemsPages] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [itemHistoryMap, setItemHistoryMap] = useState({});
  const [showAllCombinedStock, setShowAllCombinedStock] = useState(false);
  const itemDropdownRef = useRef(null);

  const [bill, setBill] = useState({
    contactType: "party",
    party: "",
    items: [],
    gstType: isFirmGST ? 1 : 0,
    date: new Date().toISOString().split("T")[0],
    itemDetails: {},
    discount: 0,
    billNumber: `BL${Date.now()}`,
    transportId: "",
    transportCharge: 0,
    agent: "",
    customerName: "",
    vehicleNo: "",
    printOption: 1,
    from_bank: "",
    to_bank: "",
  });

  const effectiveGstType = isFirmGST ? 1 : bill.gstType;

  // Firm type = GST means this bill must always be GST (gstType = 1),
  // regardless of other state updates (party selection, etc.).
  useEffect(() => {
    if (!isFirmGST) return;
    setBill((prev) => (prev.gstType === 1 ? prev : { ...prev, gstType: 1 }));
  }, [isFirmGST, bill.gstType]);

  const handleGstToggle = () => {
    if (isFirmGST) return;
    setBill((prev) => ({ ...prev, gstType: prev.gstType === 1 ? 0 : 1 }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, iRes, brandRes, aRes, tRes, bRes] = await Promise.all([
          api.get("/contacts/parties", { params: { page: 1, limit: 200 } }),
          api.get("/contacts/suppliers", { params: { page: 1, limit: 200 } }),
          api.get("/items", { params: { page: 1, limit: 50, search: "" } }),
          api.get("/brands", { params: { page: 1, limit: 200 } }),
          api.get("/agents", { params: { page: 1, limit: 200 } }),
          api.get("/transports", { params: { page: 1, limit: 200 } }),
          api.get("/banks", { params: { page: 1, limit: 200 } }),
        ]);

        const partiesData = getResponseList(pRes).map((party) => {
          const normalized = normalizeContact(party);
          return {
            id: normalized.id,
            name: normalized.name,
            is_gst: normalized.is_gst,
            label_id: normalized.label_id,
            transport_charge:
              normalized.transport_charge ||
              party.transport_charge ||
              party.transportCharge ||
              0,
            transport_id:
              normalized.transport_id ||
              party.transport_id ||
              party.transportId ||
              null,
            agent: normalized.agent_id || party.agent || party.agent_id || null,
          };
        });
        const suppliersData = getResponseList(sRes).map((supplier) => {
          const normalized = normalizeContact(supplier);
          return {
            id: normalized.id,
            name: normalized.name,
            is_gst: normalized.is_gst,
            gstin: supplier.gstin || "",
            transport_charge:
              normalized.transport_charge ||
              supplier.transport_charge ||
              supplier.transportCharge ||
              0,
            transport_id:
              normalized.transport_id ||
              supplier.transport_id ||
              supplier.transportId ||
              null,
            agent:
              normalized.agent_id ||
              supplier.agent ||
              supplier.agent_id ||
              null,
          };
        });
        const itemsData = getResponseList(iRes).map((item) => {
          const normalized = normalizeItem(item);
          return {
            ...item,
            id: normalized.id,
            name: normalized.itemName,
            amount: normalized.amount,
            barcode: normalized.barcode,
            type: normalized.type, // 1 = GST, 0 = Non-GST
          };
        });

        setLoadedParties(partiesData);
        setLoadedSuppliers(suppliersData);
        setLoadedItems(isFirmGST ? itemsData.filter((it) => it.type === 1) : itemsData);

        const agentsData = getResponseList(aRes).map((ag) => ({
          id: getEntityId(ag) || ag._id || ag.id,
          name:
            ag.name ||
            ag.agent_name ||
            ag.fullName ||
            ag.contact_name ||
            "Unknown",
        }));
        setLoadedAgents(agentsData);

        const transportsData = getResponseList(tRes).map((tr) => ({
          id: getEntityId(tr) || tr._id || tr.id,
          name: tr.name || tr.transport_name || tr.title || "Unknown",
          charge: tr.charge || tr.transport_charge || tr.transportCharge || 0,
        }));
        setLoadedTransports(transportsData);

        const banksData = getResponseList(bRes).map((b) => ({
          id: getEntityId(b) || b._id || b.id,
          name: b.name || b.bank_name || "Unknown",
        }));
        setLoadedBanks(banksData);

        const brandList = getResponseList(brandRes);
        const discountMap = {};
        brandList.forEach((b) => {
          const brandId = getEntityId(b);
          if (brandId) {
            discountMap[brandId] = {
              discount1: b.discount1 || { normal: 0, special: 0 },
              discount2: b.discount2 || { normal: 0, special: 0 },
            };
          }
        });
        setLoadedDiscounts(discountMap);

        const itemsMeta = getResponseMeta(iRes);
        setTotalItemsPages(itemsMeta?.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch data", err);
        showToast("Failed to load data", "error");
      }
    };
    fetchData();
  }, []);

  const loadItemsPage = async (page) => {
    setIsLoadingItems(true);
    try {
      const response = await api.get("/items", {
        params: { page, limit: 50, search: itemSearchTerm },
      });
      const items = getResponseList(response).map((item) => {
        const normalized = normalizeItem(item);
        return {
          ...item,
          id: normalized.id,
          name: normalized.itemName,
          amount: normalized.amount,
          type: normalized.type,
        };
      });

      setLoadedItems(isFirmGST ? items.filter((it) => it.type === 1) : items);
      setItemsPage(page);

      const meta = getResponseMeta(response);
      setTotalItemsPages(meta?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load items page:", err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    const searchItems = async () => {
      setIsLoadingItems(true);
      try {
        const response = await api.get("/items", {
          params: { page: 1, limit: 50, search: itemSearchTerm },
        });
        const searchResults = getResponseList(response).map((item) => {
          const normalized = normalizeItem(item);
          return {
            ...item,
            id: normalized.id,
            name: normalized.itemName,
            amount: normalized.amount,
            type: normalized.type,
          };
        });

        setLoadedItems(isFirmGST ? searchResults.filter((it) => it.type === 1) : searchResults);
        setItemsPage(1);

        const meta = getResponseMeta(response);
        setTotalItemsPages(meta?.totalPages || 1);
      } catch (err) {
        console.error("Failed to search items:", err);
      } finally {
        setIsLoadingItems(false);
      }
    };

    if (showItemDropdown) {
      const timer = setTimeout(searchItems, 300);
      return () => clearTimeout(timer);
    }
  }, [itemSearchTerm, showItemDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(event.target)
      ) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (bill.contactType !== "party") return;
    if (!bill.party) return;

    const party = loadedParties.find((p) => p.id === bill.party);
    const labelId = party?.label_id;
    if (!labelId) return;
    if (loadedLabelDiscounts[labelId]) return;

    const controller = new AbortController();
    const fetchLabelDiscounts = async () => {
      try {
        const res = await api.get(`/labels/${labelId}`, {
          signal: controller.signal,
        });
        const labelData = getResponseData(res) || {};
        const brandDiscounts = labelData?.brand_discounts || [];
        const discountMap = {};
        brandDiscounts.forEach((entry) => {
          const brandId = getEntityId(entry?.brand_id);
          if (!brandId) return;
          discountMap[brandId] = {
            discount1: entry?.disc1 ||
              entry?.discount1 || { normal: 0, special: 0 },
            discount2: entry?.disc2 ||
              entry?.discount2 || { normal: 0, special: 0 },
          };
        });
        setLoadedLabelDiscounts((prev) => ({
          ...prev,
          [labelId]: discountMap,
        }));
      } catch (error) {
        if (error?.name !== "CanceledError") {
          console.error("Failed to load label discounts", error);
        }
      }
    };

    fetchLabelDiscounts();
    return () => controller.abort();
  }, [bill.contactType, bill.party, loadedParties, loadedLabelDiscounts]);

  // when the current firm is GST only allow GST items (type === 1)
  const filteredItems = loadedItems.filter((item) => {
    if (bill.items.includes(item.id)) return false;
    if (isFirmGST && item.type !== 1) return false;
    return true;
  });
  const round2 = (value) => Number((Number(value) || 0).toFixed(2));

  const toggleItemSelection = async (itemId) => {
    if (bill.items.includes(itemId) && expandedItemId === itemId) {
      setExpandedItemId(null);
    }

    const isAdding = !bill.items.includes(itemId);
    const activeParty = loadedParties.find((p) => p.id === bill.party);
    const activeLabelId = activeParty?.label_id;
    const labelDiscounts =
      activeLabelId ? loadedLabelDiscounts[activeLabelId] : null;

    setBill((prev) => {
      const items =
        prev.items.includes(itemId) ?
          prev.items.filter((i) => i !== itemId)
        : [...prev.items, itemId];

      if (!prev.items.includes(itemId)) {
        const item = loadedItems.find((i) => i.id === itemId);
        const brandId =
          item?.brand_id?._id || item?.brand_id || item?.brand || item?.brandId;
        const discForBrand =
          (labelDiscounts && labelDiscounts[brandId]) ||
          loadedDiscounts[brandId] ||
          {};
        const useDisc =
          ((isFirmGST ? 1 : prev.gstType) === 1 ?
            discForBrand.discount1 || {}
          : discForBrand.discount2 || {}) || {};
        prev.itemDetails[itemId] = {
          pcs: 1,
          rate: item?.amount || 0,
          disPercent: useDisc.normal || 0,
          spDis: useDisc.special || 0,
          gstPercent: item?.gst_percent || 0,
          itemDiscount: item?.discount || 0,
          stock: item?.stock || 0,
          type:
            isFirmGST ? 1
            : prev.gstType !== null ? prev.gstType
            : 0,
          remark: item?.name || "",
          itemName: item?.name || "",
          barcode:
            item?.barcode ||
            item?.barcode_no ||
            item?.barcodeNumber ||
            item?.barcode_value ||
            item?.part_no ||
            "",
        };
      }

      return { ...prev, items };
    });

    // Auto-fetch history when adding item
    if (isAdding) {
      setExpandedItemId(itemId);
      if (
        !itemHistoryMap[itemId]?.rows?.length &&
        !itemHistoryMap[itemId]?.loading
      ) {
        await fetchItemHistory(itemId);
      }
    }
  };

  const calculateItemAmount = (itemId) => {
    const details = bill.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const itemDiscount = parseFloat(details.itemDiscount || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    const itemType =
      details.type !== undefined ? details.type : effectiveGstType;

    const grossAmount = round2(pcs * rate);
    const percentDiscount = round2((grossAmount * disPercent) / 100);
    const discountAmount = round2(percentDiscount + spDis + itemDiscount);
    const taxableAmount = round2(grossAmount - discountAmount);
    const gstAmount = round2(
      itemType === 1 ? (taxableAmount * gstPercent) / 100 : 0,
    );
    const amount = round2(taxableAmount + gstAmount);

    return {
      grossAmount,
      totalDiscount: discountAmount,
      discountAmount,
      taxableAmount,
      gstAmount,
      amount,
      baseAmount: grossAmount,
      afterDiscount: taxableAmount,
    };
  };

  const updateItemDetail = (itemId, field, value) => {
    setBill((prev) => ({
      ...prev,
      itemDetails: {
        ...prev.itemDetails,
        [itemId]: {
          ...prev.itemDetails[itemId],
          [field]: value,
        },
      },
    }));
  };

  const calculateTotalAmount = () => {
    return bill.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.amount;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return bill.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.discountAmount;
    }, 0);
  };

  const formatHistoryDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN");
  };

  const fetchItemHistory = async (itemId) => {
    if (!bill.party) {
      const errorMsg = "Please select party before loading history";
      showToast(errorMsg, "error");
      setItemHistoryMap((prev) => ({
        ...prev,
        [itemId]: { loading: false, rows: [], error: errorMsg },
      }));
      return;
    }

    setItemHistoryMap((prev) => ({
      ...prev,
      [itemId]: { loading: true, rows: [], error: null },
    }));

    try {
      const response = await api.get(`/bills/item/${itemId}/last-sold`, {
        params: {
          contact_id: bill.party,
        },
      });
      const rows = getResponseList(response);

      setItemHistoryMap((prev) => ({
        ...prev,
        [itemId]: { loading: false, rows, error: null },
      }));
    } catch (error) {
      console.error("Failed to load item history:", error);
      const errorMsg =
        error?.response?.data?.message || "Failed to load item history";
      showToast(errorMsg, "error");
      setItemHistoryMap((prev) => ({
        ...prev,
        [itemId]: { loading: false, rows: [], error: errorMsg },
      }));
    }
  };

  const handleToggleHistory = async (itemId) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      return;
    }
    setExpandedItemId(itemId);
    if (
      !itemHistoryMap[itemId]?.rows?.length &&
      !itemHistoryMap[itemId]?.loading
    ) {
      await fetchItemHistory(itemId);
    }
  };

  const LEGACY_handlePrint = () => {
    if (!bill.party || bill.items.length === 0) {
      showToast("Please select a party and add items before printing", "error");
      return;
    }

    const party = (
      bill.contactType === "party" ?
        loadedParties
      : loadedSuppliers).find((c) => c.id === bill.party);

    const printContent = `
      <html>
        <head>
          <title>Bill</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              font-size: 11px;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              width: 100px;
            }
            .info-value {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .amount-section {
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
            }
            .amount-box {
              width: 250px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #ccc;
            }
            .amount-total {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-top: 2px solid #000;
              font-weight: bold;
              font-size: 13px;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              width: 180px;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 40px;
              margin-top: 20px;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BILL</h1>
            <p>${selectedFirm?.name || "Company Name"}</p>
            <p>Bill No: ${bill.billNumber}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date(bill.date).toLocaleDateString("en-IN")}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Party:</div>
              <div class="info-value">${party?.name || ""}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Type:</div>
              <div class="info-value">${effectiveGstType === 1 ? "GST" : "Non-GST"}</div>
            </div>
            ${
              bill.customerName ?
                `
            <div class="info-row">
              <div class="info-label">Customer:</div>
              <div class="info-value">${bill.customerName}</div>
            </div>`
              : ""
            }
            ${
              bill.vehicleNo ?
                `
            <div class="info-row">
              <div class="info-label">Vehicle No:</div>
              <div class="info-value">${bill.vehicleNo}</div>
            </div>`
              : ""
            }
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                ${bill.printOption === 2 ? "<th>Item Name</th>" : "<th>Barcode</th>"}
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map((itemId, index) => {
                  const item = loadedItems.find((i) => i.id === itemId);
                  const details = bill.itemDetails[itemId] || {};
                  const calc = calculateItemAmount(itemId);

                  return `
                  <tr>
                    <td>${index + 1}</td>
                    ${
                      bill.printOption === 2 ?
                        `<td>${item?.name || "Unknown"}</td>`
                      : `<td>${item?.barcode || item?.part_no || "-"}</td>`
                    }
                    <td>${details.pcs || 1}</td>
                    <td>₹${parseFloat(details.rate || 0).toFixed(2)}</td>
                    <td>${details.disPercent || 0}%</td>
                    <td>₹${calc.afterDiscount.toFixed(2)}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="amount-section">
            <div class="amount-box">
              <div class="amount-row">
                <span>Discount:</span>
                <span>₹${calculateTotalDiscount().toFixed(2)}</span>
              </div>
              ${
                bill.transportCharge ?
                  `
              <div class="amount-row">
                <span>Transport:</span>
                <span>₹${parseFloat(bill.transportCharge).toFixed(2)}</span>
              </div>`
                : ""
              }
              <div class="amount-total">
                <span>Total Amount:</span>
                <span>₹${calculateTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              <p>Authorized Signature</p>
            </div>
            <div class="signature">
              <p>Party Signature</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrint = () => {
    if (!bill.party || bill.items.length === 0) {
      showToast("Please select a party and add items before printing", "error");
      return;
    }

    const party = (bill.contactType === "party" ? loadedParties : loadedSuppliers).find((c) => c.id === bill.party);
    const transport = loadedTransports.find((t) => t.id === bill.transportId);
    const agent = loadedAgents.find((a) => a.id === bill.agent);

    const toMandatoryText = (val) => String(val || "--").trim();
    const formatDateDDMMYYYY = (value) => {
      const date = value ? new Date(value) : new Date();
      if (Number.isNaN(date.getTime())) return "";
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = String(date.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    };

    const firmName = selectedFirm?.name || "MAHESHWARI MOTORS";
    const firmAddress = selectedFirm?.address || "52, KHOTODRA GIDC, BEHIND SUB JAIL, RING ROAD, SURAT.";
    const firmPhone = selectedFirm?.phone || "";
    const firmEmail = selectedFirm?.email || "";
    const firmGstin = selectedFirm?.gstin || "";
    const invoiceTitle = "TAX INVOICE";
    const billNo = String(bill.billNumber || "").trim();
    const financialYear = "2024-25";
    const invoiceDate = formatDateDDMMYYYY(bill.date) || formatDateDDMMYYYY(new Date());
    const printOption = Number(bill.printOption ?? 2) || 2;

    const receiverName = party?.name || "CASH BOOK";
    const receiverAddress = party?.address || "";
    const receiverCity = party?.city || "";
    const receiverPin = party?.pin || "";
    const receiverPhone = party?.phone || "";
    const receiverGstin = party?.gstin || "";
    const receiverPan = party?.pan || "";
    const receiverState = party?.state || "";
    const receiverStateCode = party?.state_code || "";

    const consigneeName = receiverName;
    const consigneeAddress = receiverAddress;
    const consigneeCity = receiverCity;
    const consigneePin = receiverPin;
    const consigneeGstin = receiverGstin;
    const consigneePan = receiverPan;
    const consigneeState = receiverState;
    const consigneeStateCode = receiverStateCode;

    const itemRows = bill.items.map((itemId, index) => {
      const item = loadedItems.find((i) => i.id === itemId) || {};
      const details = bill.itemDetails[itemId] || {};
      const calc = calculateItemAmount(itemId);
      const itemName = details.itemName || item?.name || "Item";
      const barcode = details.barcode || item?.barcode || item?.part_no || "";
      const remark = details.remark || "";
      const description = printOption === 2 ? (remark || itemName) : barcode;
      const hsn = item?.hsn || "";
      const qty = Number(details.pcs || 1);
      const rate = Number(details.rate || 0);
      const disPercent = Number(details.disPercent || 0);
      const spDis = Number(details.spDis || 0);
      const taxable = calc.taxableAmount;
      const gstPercent = Number(details.gstPercent || 0);
      const gstAmount = calc.gstAmount;
      const amount = calc.amount;

      return [
        String(index + 1),
        description,
        hsn,
        qty.toFixed(0),
        rate.toFixed(2),
        disPercent.toFixed(2),
        spDis.toFixed(2),
        taxable.toFixed(2),
        gstPercent.toFixed(2),
        gstAmount.toFixed(2),
        amount.toFixed(2),
      ];
    });

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
      while (trimmed.length > 0 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
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
    doc.text(firmName.toUpperCase(), margin + contentWidth / 2, cursorY + 4, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(doc.splitTextToSize(firmAddress, contentWidth - 16), margin + contentWidth / 2, cursorY + 9, { align: "center" });
    doc.text(`Ph.${firmPhone}`, margin + contentWidth / 2, cursorY + 18, { align: "center" });
    doc.text(`Email : ${firmEmail}`, margin + contentWidth / 2, cursorY + 23, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.text(`GSTIN : ${firmGstin}`, margin + contentWidth / 2, cursorY + 28, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...blue);
    doc.text("Original For Recipient [ ]", margin + contentWidth - 2, cursorY + 12, { align: "right" });
    doc.text("Duplicate For Transporter [ ]", margin + contentWidth - 2, cursorY + 18, { align: "right" });
    doc.text("Triplicate For Supplier [ ]", margin + contentWidth - 2, cursorY + 24, { align: "right" });

    cursorY += 31;

    doc.setFillColor(...headerFill);
    doc.rect(margin, cursorY, contentWidth, 7.5, "FD");
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...blue);
    doc.text(invoiceTitle, margin + contentWidth / 2, cursorY + 5.2, { align: "center" });
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
    doc.text("Tax is Payable On Reverse Charge (Y/N) : --", leftX, baseLineY + rowGap * 2);
    doc.text(`State : ${receiverState}`, leftX, baseLineY + rowGap * 3);
    doc.text(`State Code : ${receiverStateCode}`, leftX + 55, baseLineY + rowGap * 3);

    doc.text(`Transport : ${toMandatoryText(transport?.name)}`, rightX, baseLineY);
    doc.text(`Vehicle No. : ${toMandatoryText(bill.vehicleNo)}`, rightX, baseLineY + rowGap);
    doc.text(`Date & Time Of Supply : ${invoiceDate}`, rightX, baseLineY + rowGap * 2);
    doc.text(`Place Of Supply : ${receiverCity}`, rightX, baseLineY + rowGap * 3);

    cursorY += detailSectionHeight;

    doc.setFillColor(...headerFill);
    doc.rect(margin, cursorY, contentWidth, 7.5, "FD");
    doc.line(splitX, cursorY, splitX, cursorY + 7.5);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    doc.text("Details Of Receivers (Billed To)  Recipient", margin + 1.8, cursorY + 5.2);
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
    doc.text(doc.splitTextToSize(receiverAddress, contentWidth * 0.48), leftPartyX, cursorY + 12.5);
    doc.text(`City : ${receiverCity}`, leftPartyX, cursorY + 24.5);
    doc.text(`Pin : ${receiverPin}`, leftPartyX + 32, cursorY + 24.5);
    doc.text(`Phone : ${receiverPhone}`, leftPartyX, cursorY + 29.2);
    doc.text(`GSTIN : ${receiverGstin}`, leftPartyX, cursorY + 34);
    doc.text(`PAN No. : ${receiverPan}`, leftPartyX + 62, cursorY + 34);
    doc.setFont("times", "bold");
    doc.text(`State : ${receiverState}`, leftPartyX, cursorY + 41);
    doc.text(`State Code : ${receiverStateCode}`, leftPartyX + 62, cursorY + 41);

    doc.setFont("times", "bold");
    doc.text(`Name : ${consigneeName}`, rightPartyX, cursorY + 6.5);
    doc.setFont("times", "normal");
    doc.text(doc.splitTextToSize(consigneeAddress, contentWidth * 0.48), rightPartyX, cursorY + 12.5);
    doc.text(`City : ${consigneeCity}`, rightPartyX, cursorY + 24.5);
    doc.text(`Pin : ${consigneePin}`, rightPartyX + 32, cursorY + 24.5);
    doc.text(`GSTIN : ${consigneeGstin}`, rightPartyX, cursorY + 34);
    doc.text(`PAN No. : ${consigneePan}`, rightPartyX + 56, cursorY + 34);
    doc.setFont("times", "bold");
    doc.text(`State : ${consigneeState}`, rightPartyX, cursorY + 41);
    doc.text(`State Code : ${consigneeStateCode}`, rightPartyX + 56, cursorY + 41);

    cursorY += partyBoxHeight;

    doc.rect(margin, cursorY, contentWidth, 8);
    doc.line(splitX, cursorY, splitX, cursorY + 8);
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order No : ${toMandatoryText("")}`, margin + 1.8, cursorY + 5.3);
    doc.text(`Broker : ${toMandatoryText(agent?.name)}`, splitX + 1.8, cursorY + 5.3);
    cursorY += 8;

    autoTable(doc, {
      head: [["Sr.", printOption === 2 ? "Item Description" : "Barcode", "HSN", "Qty.", "Rate", "Dis.%", "Sp.%", "Taxable", "Tax %", "Tax.Amt.", "Amount"]],
      body: itemRows.length ? itemRows : [["1", "--", "--", "0", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00"]],
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

    const formatAmount = (val) => Number(val || 0).toFixed(2);
    const totalQty = bill.items.reduce((sum, itemId) => sum + Number(bill.itemDetails[itemId]?.pcs || 1), 0);
    const totalBeforeTax = bill.items.reduce((sum, itemId) => sum + calculateItemAmount(itemId).taxableAmount, 0);
    const taxTotal = bill.items.reduce((sum, itemId) => sum + calculateItemAmount(itemId).gstAmount, 0);
    const totalAmount = calculateTotalAmount();
    const isGstBill = effectiveGstType === 1;
    const sgstAmount = isGstBill ? taxTotal / 2 : 0;
    const cgstAmount = isGstBill ? taxTotal / 2 : 0;
    const igstAmount = !isGstBill ? taxTotal : 0;
    const transportCharge = Number(bill.transportCharge || 0);
    const firmPan = selectedFirm?.pan || "";
    const bankName = "Bank Name: HDFC BANK";
    const bankAccountNo = "A/c No: 1234567890";

    const numberToWords = (num) => {
      const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      if (num === 0) return "Zero";
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
      if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
      return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
    };
    const amountInWords = numberToWords(Math.round(totalAmount)) + " Rupees Only";

    let summaryY = (doc.lastAutoTable?.finalY || cursorY) + 3.5;
    const summaryHeight = 56;
    const totalRowHeight = 10;
    const midBlockHeight = 20;
    const wordsRowHeight = 8;
    const termsBlockHeight = 28;

    if (summaryY + summaryHeight > pageHeight - margin - 1) {
      doc.addPage();
      drawPageBorder();
      summaryY = margin + 8;
    }

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
    const totalLabelCenter = margin + (tableColumnWidths[0] + tableColumnWidths[1] + tableColumnWidths[2]) / 2;
    doc.text("TOTAL :", totalLabelCenter, summaryY + 5.3, { align: "center" });
    doc.text(String(Math.round(totalQty)), columnRightEdges[3] - 1.2, summaryY + 5.3, { align: "right" });
    doc.text(formatAmount(totalBeforeTax), columnRightEdges[7] - 1.2, summaryY + 5.3, { align: "right" });
    doc.text(formatAmount(taxTotal), columnRightEdges[9] - 1.2, summaryY + 5.3, { align: "right" });
    doc.text(formatAmount(totalAmount), columnRightEdges[10] - 1.2, summaryY + 5.3, { align: "right" });

    const midBlockY = summaryY + totalRowHeight;
    const rightInfoWidth = 58;
    const splitInfoX = summaryRightX - rightInfoWidth;
    doc.setTextColor(0, 0, 0);
    doc.rect(margin, midBlockY, contentWidth, midBlockHeight);
    doc.line(splitInfoX, midBlockY, splitInfoX, midBlockY + midBlockHeight);
    const bankAreaRightX = margin + 58;
    doc.line(bankAreaRightX, midBlockY, bankAreaRightX, midBlockY + midBlockHeight);

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
    doc.text(isGstBill ? "18.00" : "0.00", taxColumnEnds[0] - 0.8, midBlockY + 10.2, { align: "right" });
    doc.text(formatAmount(totalBeforeTax), taxColumnEnds[1] - 0.8, midBlockY + 10.2, { align: "right" });
    doc.text(formatAmount(sgstAmount), taxColumnEnds[2] - 0.8, midBlockY + 10.2, { align: "right" });
    doc.text(formatAmount(cgstAmount), taxColumnEnds[3] - 0.8, midBlockY + 10.2, { align: "right" });
    doc.text(formatAmount(taxTotal), taxColumnEnds[4] - 0.8, midBlockY + 10.2, { align: "right" });

    doc.setFont("times", "bold");
    doc.text("* TOTAL :", taxColumnStarts[0], midBlockY + 15.4);
    doc.text(formatAmount(totalBeforeTax), taxColumnEnds[1] - 0.8, midBlockY + 15.4, { align: "right" });
    doc.text(formatAmount(sgstAmount), taxColumnEnds[2] - 0.8, midBlockY + 15.4, { align: "right" });
    doc.text(formatAmount(cgstAmount), taxColumnEnds[3] - 0.8, midBlockY + 15.4, { align: "right" });
    doc.text(formatAmount(taxTotal), taxColumnEnds[4] - 0.8, midBlockY + 15.4, { align: "right" });

    const rightLabelX = splitInfoX + 2;
    const rightRateRightX = summaryRightX - 15;
    const rightAmountRightX = summaryRightX - 1.6;
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(8.2);
    const beforeTaxLabel = fitTextSingleLine(`Total Amount before Tax${transportCharge ? " (+Tr)" : ""} :`, rightRateRightX - rightLabelX - 1);
    doc.text(beforeTaxLabel, rightLabelX, midBlockY + 5);
    doc.text(formatAmount(totalBeforeTax), rightAmountRightX, midBlockY + 5, { align: "right" });
    doc.text("+ SGST", rightLabelX, midBlockY + 10.2);
    doc.text(isGstBill ? "9.000 %" : "0.000 %", rightRateRightX, midBlockY + 10.2, { align: "right" });
    doc.text(formatAmount(sgstAmount), rightAmountRightX, midBlockY + 10.2, { align: "right" });
    doc.text(isGstBill ? "+ CGST" : "+ IGST", rightLabelX, midBlockY + 15.4);
    doc.text(isGstBill ? "9.000 %" : "18.000 %", rightRateRightX, midBlockY + 15.4, { align: "right" });
    doc.text(formatAmount(isGstBill ? cgstAmount : igstAmount), rightAmountRightX, midBlockY + 15.4, { align: "right" });

    const wordsY = midBlockY + midBlockHeight;
    doc.setFillColor(...headerFill);
    doc.rect(margin, wordsY, contentWidth, wordsRowHeight, "FD");
    const netAmountSectionWidth = 44;
    const netAmountLeftX = summaryRightX - netAmountSectionWidth;
    doc.line(netAmountLeftX, wordsY, netAmountLeftX, wordsY + wordsRowHeight);
    doc.setFont("times", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(0, 0, 0);
    const wordsLine = fitTextSingleLine(`(in Words) : ${amountInWords}`, netAmountLeftX - margin - 3);
    doc.text(wordsLine, margin + 1.8, wordsY + 5.3);
    doc.text("NET AMOUNT :", netAmountLeftX + 2, wordsY + 5.3);
    doc.setTextColor(...blue);
    doc.setFontSize(11);
    doc.text(formatAmount(totalAmount), summaryRightX - 1.8, wordsY + 5.3, { align: "right" });

    const termsY = wordsY + wordsRowHeight;
    const termsSplitX = margin + contentWidth * 0.56;
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
    doc.text("Payment will be accepted by A/c. pay cheque only.", margin + 1.8, termsY + 10.2);
    doc.text("We are not responsible for any lose or damage during transit.", margin + 1.8, termsY + 14.7);
    doc.text("GST Rule Follow.", margin + 1.8, termsY + 19.2);

    doc.setFont("times", "bold");
    doc.setFontSize(8.8);
    doc.text("Electronic Reference Number", termsSplitX + 2, termsY + 5.2);
    const rightSectionWidth = summaryRightX - termsSplitX - 3.5;
    const certLine = fitTextSingleLine("Certified That Particulars Given Above Are True And Correct", rightSectionWidth);
    doc.text(certLine, termsSplitX + 2, termsY + 10.2);
    const rightSectionCenterX = termsSplitX + (summaryRightX - termsSplitX) / 2;
    const leftSectionCenterX = margin + (termsSplitX - margin) / 2;
    doc.setTextColor(...blue);
    doc.setFontSize(11);

    const signatureY = termsY + footerHeight - 6;
    const forLineY = signatureY - 5;
    doc.text(`For : ${firmName.toUpperCase()}`, rightSectionCenterX, forLineY, { align: "center" });
    doc.setFontSize(9.5);
    doc.text("Receiver's Signature", leftSectionCenterX, signatureY, { align: "center" });
    doc.text("Authorised Signatory", rightSectionCenterX, signatureY, { align: "center" });

    const previewUrl = doc.output("bloburl");
    const previewWindow = window.open(previewUrl, "_blank");
    if (!previewWindow) {
      showToast("Popup blocked. Please allow popups for print preview.", "error");
    }
  };

  const handleSave = async () => {
    if (!bill.party) {
      showToast("Please select a party", "error");
      return;
    }
    if (bill.items.length === 0) {
      showToast("Please add at least one item", "error");
      return;
    }

    try {
      const selectedParty = loadedParties.find(
        (party) => party.id === bill.party,
      );
      const grossTotal = round2(
        bill.items.reduce(
          (sum, itemId) => sum + calculateItemAmount(itemId).grossAmount,
          0,
        ),
      );
      const subTotal = round2(
        bill.items.reduce(
          (sum, itemId) => sum + calculateItemAmount(itemId).amount,
          0,
        ),
      );
      const netAmount = round2(calculateTotalAmount());

      // Create challan
      const challanPayload = {
        challan_type: "sale",
        date: bill.date,
        contact_id: bill.party,
        label_id: selectedParty?.label_id || undefined,
        print_option: Number(bill.printOption ?? 2) || 2,
        gross_total: grossTotal,
        sub_total: subTotal,
        discount: 0,
        amount: netAmount,
        items: bill.items.map((itemId) => {
          const item = loadedItems.find((i) => i.id === itemId);
          const details = bill.itemDetails[itemId] || {};
          const calc = calculateItemAmount(itemId);
          const masterIsGst = item?.is_gst ?? 1;
          return {
            item_id: itemId,
            quantity: Math.max(1, parseFloat(details.pcs || 1)),
            rate: Math.max(0, parseFloat(details.rate || item?.amount || 0)),
            discount: Math.max(0, parseFloat(details.disPercent || 0)),
            special_discount: Math.max(0, parseFloat(details.spDis || 0)),
            gst_percent: Math.max(0, parseFloat(details.gstPercent || 0)),
            gross_amount: round2(calc.grossAmount),
            discount_amount: round2(calc.discountAmount),
            total_discount: round2(calc.totalDiscount),
            taxable_amount: round2(calc.taxableAmount),
            gst_amount: round2(calc.gstAmount),
            amount: round2(calc.amount),
            is_gst:
              masterIsGst === 0 ? 0
              : details.type !== undefined && details.type !== null ?
                Number(details.type) === 1 ?
                  1
                : 0
              : effectiveGstType,
          };
        }),
      };

      const challanRes = await api.post("/challans", challanPayload);
      console.log(challanRes);
      const challanId = challanRes.data?.data?._id;

      if (!challanId) {
        throw new Error("Failed to create challan");
      }

      // Convert to bill
      const payload = {
        contact_id: bill.party,
        challan_ids: [challanId],
        amount: netAmount,
        bill_no: bill.billNumber || undefined,
        transport_id: bill.transportId || undefined,
        transport_charge: parseFloat(bill.transportCharge) || 0,
        customer_name: bill.customerName || undefined,
        vehicle_no: bill.vehicleNo || undefined,
      };
      const res = await api.post("/bills", payload);
      console.log("Bill creation response:", res.data);

      showToast("Bill created successfully", "success");
      navigate("/transactions/bill-list");
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error.response?.data?.message || "Failed to create bill";
      showToast(errorMsg, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Bill</h1>
          {/* <input
            type="text"
            value={bill.billNumber}
            onChange={(e) => setBill((prev) => ({ ...prev, billNumber: e.target.value }))}
            className="px-3 py-2 border rounded-md text-sm"
          /> */}
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/transactions/bill-list")}
        >
          Back to List
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Type *
            </label>
            <select
              value={bill.contactType}
              onChange={(e) =>
                setBill((prev) => ({
                  ...prev,
                  contactType: e.target.value,
                  party: "",
                }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="party">Party</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {bill.contactType === "party" ? "Party" : "Supplier"} *
            </label>
            <select
              value={bill.party}
              onChange={(e) => {
                const selectedId = e.target.value;
                const contacts =
                  bill.contactType === "party" ?
                    loadedParties
                  : loadedSuppliers;
                const selected = contacts.find((c) => c.id === selectedId);
                setBill((prev) => ({
                  ...prev,
                  party: selectedId,
                  gstType:
                    isFirmGST ? 1
                    : selected ? selected.is_gst || 0
                    : prev.gstType,
                  transportCharge:
                    selected ?
                      selected.transport_charge || 0
                    : prev.transportCharge,
                  transportId:
                    selected ?
                      selected.transport_id || prev.transportId
                    : prev.transportId,
                  agent: selected ? selected.agent || prev.agent : prev.agent,
                  customerName:
                    selected ?
                      selected.name || prev.customerName
                    : prev.customerName,
                }));
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">
                Select {bill.contactType === "party" ? "Party" : "Supplier"}
              </option>
              {(bill.contactType === "party" ?
                loadedParties
              : loadedSuppliers
              ).map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={bill.date}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <button
              type="button"
              disabled={isFirmGST}
              onClick={handleGstToggle}
              aria-disabled={isFirmGST}
              className={`w-14 h-7 mt-5 flex items-center rounded-full p-1 transition-all duration-300 ${
                effectiveGstType === 1 ? "bg-green-500" : "bg-gray-300"
              } ${!isFirmGST ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                  effectiveGstType === 1 ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Bank
            </label>
            <select
              value={bill.from_bank}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, from_bank: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Bank</option>
              {loadedBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Bank
            </label>
            <select
              value={bill.to_bank}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, to_bank: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Bank</option>
              {loadedBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent
            </label>
            <select
              value={bill.agent}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, agent: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Agent</option>
              {loadedAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport
            </label>
            <select
              value={bill.transportId}
              onChange={(e) => {
                const tid = e.target.value;
                const t = loadedTransports.find((x) => x.id === tid);
                setBill((prev) => ({
                  ...prev,
                  transportId: tid,
                  transportCharge: t ? t.charge : prev.transportCharge,
                }));
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Transport</option>
              {loadedTransports.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transport Charge
            </label>
            <input
              type="number"
              step="0.01"
              value={bill.transportCharge}
              onChange={(e) =>
                setBill((prev) => ({
                  ...prev,
                  transportCharge: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={bill.customerName}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, customerName: e.target.value }))
              }
              placeholder="Enter customer name"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle No
            </label>
            <input
              type="text"
              value={bill.vehicleNo}
              onChange={(e) =>
                setBill((prev) => ({ ...prev, vehicleNo: e.target.value }))
              }
              placeholder="Vehicle number"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <div className="bg-gray-100 px-4 py-2">
            <h3 className="font-medium text-gray-900">
              Rate Information - Add / Less
            </h3>
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search & Add Items:
              </label>
              <div className="relative" ref={itemDropdownRef}>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearchTerm}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                {showItemDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 bg-gray-100 text-xs text-gray-600 sticky top-0 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadItemsPage(itemsPage - 1);
                          }}
                          disabled={itemsPage === 1 || isLoadingItems}
                          className="px-2 py-0.5 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          ←
                        </button>
                        <span>
                          Page {itemsPage} of {totalItemsPages}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadItemsPage(itemsPage + 1);
                          }}
                          disabled={
                            itemsPage === totalItemsPages || isLoadingItems
                          }
                          className="px-2 py-0.5 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          →
                        </button>
                      </div>
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            toggleItemSelection(item.id);
                            setItemSearchTerm("");
                            setShowItemDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <span className="truncate">
                              {item.name}
                              {item.part_no && (
                                <span className="text-gray-400 text-xs ml-1">
                                  ({item.part_no})
                                </span>
                              )}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              ₹{item.amount}
                            </span>
                          </div>
                        </button>
                      ))}
                      {filteredItems.length === 0 && !isLoadingItems && (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No items found
                        </div>
                      )}
                      {isLoadingItems && (
                        <div className="px-3 py-2 text-gray-500 text-sm text-center">
                          Loading...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 border-t-2 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left border-r">SNo</th>
                  <th className="px-2 py-2 text-left border-r">ItemName</th>
                  <th className="px-2 py-2 text-left border-r">Remark</th>
                  <th className="px-2 py-2 text-left border-r">Type</th>
                  <th
                    className="px-2 py-2 text-left border-r hover:bg-gray-100"
                    onDoubleClick={() =>
                      setShowAllCombinedStock((prev) => !prev)
                    }
                  >
                    Stock
                  </th>
                  <th className="px-2 py-2 text-left border-r">PCS</th>
                  <th className="px-2 py-2 text-left border-r">Rate</th>
                  <th className="px-2 py-2 text-left border-r">Dis %</th>
                  <th className="px-2 py-2 text-left border-r">SP Dis</th>
                  <th className="px-2 py-2 text-left border-r">Item Disc</th>
                  <th className="px-2 py-2 text-left border-r">GST %</th>
                  <th className="px-2 py-2 text-left border-r">GST Amt</th>
                  <th className="px-2 py-2 text-left border-r">Amount</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((itemId, index) => {
                  const item = loadedItems.find((i) => i.id === itemId);
                  const details = bill.itemDetails[itemId] || {};
                  const calc = calculateItemAmount(itemId);
                  const itemType =
                    details.type !== undefined ?
                      details.type
                    : effectiveGstType;
                  const displayItemName =
                    details.itemName || item?.name || "Unknown Item";
                  const historyOpen = expandedItemId === itemId;

                  return (
                    <Fragment key={itemId}>
                      <tr className="border-t">
                        <td className="px-2 py-2 border-r">
                          <div className="flex items-center gap-1">
                            <span>{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleHistory(itemId)}
                              className="text-gray-500 hover:text-gray-700"
                              title="View last 4 entries"
                            >
                              {historyOpen ?
                                <FaChevronUp size={10} />
                              : <FaChevronDown size={10} />}
                            </button>
                          </div>
                        </td>
                      <td className="px-2 py-2 border-r">
                        <span className="text-xs">{displayItemName}</span>
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="text"
                          value={details.remark || ""}
                          onChange={(e) =>
                            updateItemDetail(itemId, "remark", e.target.value)
                          }
                          className="w-32 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        {isFirmGST ?
                          <span className="text-xs">1</span>
                        : <select
                            value={itemType !== null ? itemType : ""}
                            onChange={(e) =>
                              updateItemDetail(
                                itemId,
                                "type",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-12 px-1 py-1 border rounded text-xs"
                          >
                            <option value="">-</option>
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                          </select>
                        }
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={
                            showAllCombinedStock ?
                              (
                                (details.physicalStock || 0) +
                                (details.logicalStock || 0)
                              ).toFixed(1)
                            : details.stock || 0
                          }
                          onChange={(e) =>
                            updateItemDetail(itemId, "stock", e.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                          readOnly
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.pcs || 1}
                          onChange={(e) =>
                            updateItemDetail(itemId, "pcs", e.target.value)
                          }
                          className="w-12 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.rate || item?.amount || 0}
                          onChange={(e) =>
                            updateItemDetail(itemId, "rate", e.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.disPercent || 0}
                          onChange={(e) =>
                            updateItemDetail(
                              itemId,
                              "disPercent",
                              e.target.value,
                            )
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.spDis || 0}
                          onChange={(e) =>
                            updateItemDetail(itemId, "spDis", e.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          step="0.01"
                          value={details.itemDiscount || 0}
                          onChange={(e) =>
                            updateItemDetail(
                              itemId,
                              "itemDiscount",
                              e.target.value,
                            )
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      {itemType === 1 ?
                        <>
                          <td className="px-2 py-2 border-r">
                            <input
                              type="number"
                              value={details.gstPercent || 0}
                              onChange={(e) =>
                                updateItemDetail(
                                  itemId,
                                  "gstPercent",
                                  e.target.value,
                                )
                              }
                              className="w-16 px-1 py-1 border rounded text-xs"
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">
                              {calc.gstAmount.toFixed(2)}
                            </span>
                          </td>
                        </>
                      : <>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">-</span>
                          </td>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">-</span>
                          </td>
                        </>
                      }
                      <td className="px-2 py-2 border-r">
                        <span className="text-xs font-medium">
                          {calc.afterDiscount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => toggleItemSelection(itemId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes size={12} />
                        </button>
                      </td>
                    </tr>
                    </Fragment>
                  );
                })}
                {bill.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No items selected. Use the search below to add items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {bill.items.length > 0 && (
          <div className="border rounded-lg bg-gray-50">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <span className="text-sm font-medium text-gray-700">
                Selected Items ({bill.items.length})
              </span>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {bill.items.map((itemId) => {
                  const item = loadedItems.find((i) => i.id === itemId);
                  const details = bill.itemDetails[itemId] || {};
                  const displayItemName =
                    details.itemName || item?.name || "Unknown Item";
                  const isActive = expandedItemId === itemId;
                  return (
                    <span
                      key={itemId}
                      onClick={() => handleToggleHistory(itemId)}
                      className={`px-2 py-1 text-xs rounded flex items-center gap-1 cursor-pointer transition-colors ${
                        isActive ?
                          "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                    >
                      {displayItemName}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(itemId);
                        }}
                        className={
                          isActive ?
                            "text-white hover:text-gray-200"
                          : "text-blue-600 hover:text-blue-800"
                        }
                      >
                        <FaTimes size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>

              {expandedItemId &&
                (() => {
                  const historyState = itemHistoryMap[expandedItemId] || {
                    loading: false,
                    rows: [],
                    error: null,
                  };
                  const historyRows =
                    Array.isArray(historyState.rows) ?
                      historyState.rows.slice(0, 4)
                    : [];
                  const item = loadedItems.find((i) => i.id === expandedItemId);
                  const details = bill.itemDetails[expandedItemId] || {};
                  const displayItemName =
                    details.itemName || item?.name || "Unknown Item";

                  return (
                    <div className="border rounded-lg bg-white">
                      <div className="bg-gray-50 px-3 py-2 border-b">
                        <span className="text-xs font-medium text-gray-700">
                          Last 4 Entries - {displayItemName}
                        </span>
                      </div>
                      {historyState.loading ?
                        <div className="px-3 py-4 text-xs text-gray-500 text-center">
                          Loading history...
                        </div>
                      : historyState.error ?
                        <div className="px-3 py-4 text-xs text-red-600 text-center">
                          {historyState.error}
                        </div>
                      : historyRows.length === 0 ?
                        <div className="px-3 py-4 text-xs text-gray-500 text-center">
                          No history found.
                        </div>
                      : <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-2 text-left border">
                                  Date
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Bill No
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Rate
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Qty
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Amount
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Disc%
                                </th>
                                <th className="px-2 py-2 text-left border">
                                  Sp Disc
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyRows.map((row, rowIndex) => (
                                <tr
                                  key={`history-${rowIndex}`}
                                  className="hover:bg-blue-50 cursor-pointer"
                                  onClick={() => {
                                    updateItemDetail(
                                      expandedItemId,
                                      "rate",
                                      row?.rate || 0,
                                    );
                                    updateItemDetail(
                                      expandedItemId,
                                      "disPercent",
                                      row?.discount || 0,
                                    );
                                    updateItemDetail(
                                      expandedItemId,
                                      "spDis",
                                      row?.special_discount || 0,
                                    );
                                    updateItemDetail(
                                      expandedItemId,
                                      "gstPercent",
                                      row?.gst_percent || 0,
                                    );
                                    showToast("Details filled from history", "success");
                                  }}
                                >
                                  <td className="px-2 py-2 border">
                                    {formatHistoryDate(row?.bill_date || row?.date)}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {row?.bill_no || "-"}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {Number(row?.rate || 0).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {Number(row?.quantity || 0)}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {Number(row?.amount || 0).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {Number(row?.discount || 0).toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2 border">
                                    {Number(row?.special_discount || 0).toFixed(
                                      2,
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      }
                    </div>
                  );
                })()}
            </div>
          </div>
        )}

        {/* {bill.items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              Selected Items ({bill.items.length}):
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {bill.items.map((itemId) => {
                const item = loadedItems.find((i) => i.id === itemId);
                const details = bill.itemDetails[itemId] || {};
                const displayItemName = details.itemName || item?.name || "Unknown Item";
                return (
                  <span
                    key={itemId}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1"
                  >
                    {displayItemName}
                    <button
                      onClick={() => toggleItemSelection(itemId)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Discount:</span>
              <input
                type="number"
                step="0.01"
                value={calculateTotalDiscount().toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-100 cursor-not-allowed text-gray-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Net Amount:</span>
              <input
                type="number"
                value={calculateTotalAmount().toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Print Format:</span>
              <select
                value={bill.printOption}
                onChange={(e) =>
                  setBill((prev) => ({
                    ...prev,
                    printOption: parseInt(e.target.value),
                  }))
                }
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                <option value={1}>Print 1 - Show Barcode</option>
                <option value={2}>Print 2 - Show Item Name</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!bill.party || bill.items.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <FaSave />
            Save Bill
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!bill.party || bill.items.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FaPrint />
            Print Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/transactions/bill-list")}
          >
            Cancel
          </Button>
        </div>
      </div>


    </div>
  );
};

export default BillForm;
