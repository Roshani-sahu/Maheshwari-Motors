import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaSave, FaEye, FaPrint } from "react-icons/fa";
import { Button } from "../../components/ui";
import useStore from "../../store";
import { Modal } from '../../components/common';
import api from "../../services/axiosInstance";
import {
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
    const firm_type = localStorage.getItem("firm_type");
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
    (selectedFirm?.id === "GST" ? "GST" : selectedFirm?.id === "NON_GST" ? "NON_GST" : "") ||
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
  const [loadedItems, setLoadedItems] = useState([]);
  const [loadedDiscounts, setLoadedDiscounts] = useState({});
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [totalItemsPages, setTotalItemsPages] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [viewItemModal, setViewItemModal] = useState({ isOpen: false, data: null });
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
        const [pRes, sRes, iRes, brandRes, aRes, tRes] = await Promise.all([
          api.get("/contacts/parties", { params: { page: 1, limit: 200 } }),
          api.get("/contacts/suppliers", { params: { page: 1, limit: 200 } }),
          api.get("/items", { params: { page: 1, limit: 50, search: "" } }),
          api.get("/brands", { params: { page: 1, limit: 200 } }),
          api.get("/agents", { params: { page: 1, limit: 200 } }),
          api.get("/transports", { params: { page: 1, limit: 200 } }),
        ]);

        const partiesData = getResponseList(pRes).map((party) => {
          const normalized = normalizeContact(party);
          return {
            id: normalized.id,
            name: normalized.name,
            is_gst: normalized.is_gst,
            transport_charge: normalized.transport_charge || party.transport_charge || party.transportCharge || 0,
            transport_id: normalized.transport_id || party.transport_id || party.transportId || null,
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
            transport_charge: normalized.transport_charge || supplier.transport_charge || supplier.transportCharge || 0,
            transport_id: normalized.transport_id || supplier.transport_id || supplier.transportId || null,
            agent: normalized.agent_id || supplier.agent || supplier.agent_id || null,
          };
        });
        const itemsData = getResponseList(iRes).map((item) => {
          const normalized = normalizeItem(item);
          return {
            ...item,
            id: normalized.id,
            name: normalized.itemName,
            amount: normalized.amount,
          };
        });

        setLoadedParties(partiesData);
        setLoadedSuppliers(suppliersData);
        setLoadedItems(itemsData);

        const agentsData = getResponseList(aRes).map((ag) => ({
          id: getEntityId(ag) || ag._id || ag.id,
          name: ag.name || ag.agent_name || ag.fullName || ag.contact_name || "Unknown",
        }));
        setLoadedAgents(agentsData);

        const transportsData = getResponseList(tRes).map((tr) => ({
          id: getEntityId(tr) || tr._id || tr.id,
          name: tr.name || tr.transport_name || tr.title || "Unknown",
          charge: tr.charge || tr.transport_charge || tr.transportCharge || 0,
        }));
        setLoadedTransports(transportsData);

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
        };
      });

      setLoadedItems(items);
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
          };
        });

        setLoadedItems(searchResults);
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

  const filteredItems = loadedItems.filter(
    (item) => !bill.items.includes(item.id),
  );

  const toggleItemSelection = (itemId) => {
    setBill((prev) => {
      const items =
        prev.items.includes(itemId) ?
          prev.items.filter((i) => i !== itemId)
        : [...prev.items, itemId];

      if (!prev.items.includes(itemId)) {
        const item = loadedItems.find((i) => i.id === itemId);
      const brandId =
          item?.brand_id?._id || item?.brand_id || item?.brand || item?.brandId;
        const discForBrand = loadedDiscounts[brandId] || {};
        const useDisc =
          ((isFirmGST ? 1 : prev.gstType) === 1 ?
            discForBrand.discount1 || {}
          : discForBrand.discount2 || {}) || {};
        prev.itemDetails[itemId] = {
          pcs: 1,
          rate: item?.amount || 0,
          disPercent: useDisc.normal || 0,
          spDis: useDisc.special || 0,
          gstPercent: 0,
          itemDiscount: item?.discount || 0,
          stock: item?.stock || 0,
          type: isFirmGST ? 1 : (prev.gstType !== null ? prev.gstType : 0),
        };
      }

      return { ...prev, items };
    });
  };

  const calculateItemAmount = (itemId) => {
    const details = bill.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    const itemType = details.type !== undefined ? details.type : effectiveGstType;

    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent) / 100 + spDis;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = itemType === 1 ? (afterDiscount * gstPercent) / 100 : 0;

    return {
      baseAmount,
      discountAmount,
      afterDiscount,
      gstAmount,
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
      return total + calc.afterDiscount;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return bill.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.discountAmount;
    }, 0);
  };

  const handleViewLastSold = async (itemId) => {
    try {
      const res = await api.get(`/items/${itemId}/last-sold`);
      if (res.data?.success && res.data?.data) {
        setViewItemModal({ isOpen: true, data: res.data.data });
      } else {
        showToast("No previous sale found", "info");
      }
    } catch (err) {
      console.error("Failed to fetch last sold:", err);
      showToast("Failed to fetch last sold details", "error");
    }
  };

  const handlePrint = () => {
    if (!bill.party || bill.items.length === 0) {
      showToast('Please select a party and add items before printing', 'error');
      return;
    }

    const party = (bill.contactType === 'party' ? loadedParties : loadedSuppliers).find(c => c.id === bill.party);
    
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
            <p>${selectedFirm?.name || 'Company Name'}</p>
            <p>Bill No: ${bill.billNumber}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date(bill.date).toLocaleDateString('en-IN')}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Party:</div>
              <div class="info-value">${party?.name || ''}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Type:</div>
              <div class="info-value">${effectiveGstType === 1 ? 'GST' : 'Non-GST'}</div>
            </div>
            ${bill.customerName ? `
            <div class="info-row">
              <div class="info-label">Customer:</div>
              <div class="info-value">${bill.customerName}</div>
            </div>` : ''}
            ${bill.vehicleNo ? `
            <div class="info-row">
              <div class="info-label">Vehicle No:</div>
              <div class="info-value">${bill.vehicleNo}</div>
            </div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                ${bill.printOption === 2 ? '<th>Item Name</th>' : '<th>Barcode</th>'}
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((itemId, index) => {
                const item = loadedItems.find(i => i.id === itemId);
                const details = bill.itemDetails[itemId] || {};
                const calc = calculateItemAmount(itemId);
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    ${bill.printOption === 2 
                      ? `<td>${item?.name || 'Unknown'}</td>` 
                      : `<td>${item?.barcode || item?.part_no || '-'}</td>`
                    }
                    <td>${details.pcs || 1}</td>
                    <td>₹${parseFloat(details.rate || 0).toFixed(2)}</td>
                    <td>${details.disPercent || 0}%</td>
                    <td>₹${calc.afterDiscount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="amount-section">
            <div class="amount-box">
              <div class="amount-row">
                <span>Discount:</span>
                <span>₹${calculateTotalDiscount().toFixed(2)}</span>
              </div>
              ${bill.transportCharge ? `
              <div class="amount-row">
                <span>Transport:</span>
                <span>₹${parseFloat(bill.transportCharge).toFixed(2)}</span>
              </div>` : ''}
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

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
      // Create challan
      const challanPayload = {
        challan_type: "sale",
        date: bill.date,
        contact_id: bill.party,
        items: bill.items.map((itemId) => {
          const item = loadedItems.find((i) => i.id === itemId);
          const details = bill.itemDetails[itemId] || {};
          return {
            item_id: itemId,
            quantity: Math.max(1, parseFloat(details.pcs || 1)),
            rate: Math.max(0, parseFloat(details.rate || item?.amount || 0)),
            discount: Math.max(0, parseFloat(details.disPercent || 0)),
            special_discount: Math.max(0, parseFloat(details.spDis || 0)),
            gst_percent: Math.max(0, parseFloat(details.gstPercent || 0)),
          };
        }),
          discount: calculateTotalDiscount(),
          transport_id: bill.transportId || undefined,
          transport_charge: parseFloat(bill.transportCharge) || 0,
          agent_id: bill.agent || undefined,
          customer_name: bill.customerName || undefined,
          vehicle_no: bill.vehicleNo || undefined,
          bill_no: bill.billNumber || undefined,
      };

      const challanRes = await api.post("/challans", challanPayload);
      console.log(challanRes);
      const challanId = challanRes.data?.data?._id;

      if (!challanId) {
        throw new Error("Failed to create challan");
      }

      // Convert to bill
      try {
        const payload = {
          contact_id: bill.party,
          challan_ids: [challanId],
          delivered_amount: 0,
          bill_no: bill.billNumber || undefined,
          transport_id: bill.transportId || undefined,
          transport_charge: parseFloat(bill.transportCharge) || 0,
          agent_id: bill.agent || undefined,
          customer_name: bill.customerName || undefined,
          vehicle_no: bill.vehicleNo || undefined,
        };
        const res = await api.post("/bills", payload);
        console.log(res);
      } catch (error) {
        console.log("Bill creation error:", error, error.response.data);
      }

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
          <input
            type="text"
            value={bill.billNumber}
            onChange={(e) => setBill((prev) => ({ ...prev, billNumber: e.target.value }))}
            className="px-3 py-2 border rounded-md text-sm"
          />
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
                  gstType: isFirmGST ? 1 : (selected ? selected.is_gst || 0 : prev.gstType),
                  transportCharge: selected ? selected.transport_charge || 0 : prev.transportCharge,
                  transportId: selected ? selected.transport_id || prev.transportId : prev.transportId,
                  agent: selected ? selected.agent || prev.agent : prev.agent,
                  customerName: selected ? selected.name || prev.customerName : prev.customerName,
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
                effectiveGstType === 1 ? 'bg-green-500' : 'bg-gray-300'
              } ${!isFirmGST ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                  effectiveGstType === 1 ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select
              value={bill.agent}
              onChange={(e) => setBill((prev) => ({ ...prev, agent: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Agent</option>
              {loadedAgents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
            <select
              value={bill.transportId}
              onChange={(e) => {
                const tid = e.target.value;
                const t = loadedTransports.find((x) => x.id === tid);
                setBill((prev) => ({ ...prev, transportId: tid, transportCharge: t ? t.charge : prev.transportCharge }));
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select Transport</option>
              {loadedTransports.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Charge</label>
            <input
              type="number"
              step="0.01"
              value={bill.transportCharge}
              onChange={(e) => setBill((prev) => ({ ...prev, transportCharge: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input
              type="text"
              value={bill.customerName}
              onChange={(e) => setBill((prev) => ({ ...prev, customerName: e.target.value }))}
              placeholder="Enter customer name"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label>
            <input
              type="text"
              value={bill.vehicleNo}
              onChange={(e) => setBill((prev) => ({ ...prev, vehicleNo: e.target.value }))}
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

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left border-r">SNo</th>
                  <th className="px-2 py-2 text-left border-r">ItemName</th>
                  <th className="px-2 py-2 text-left border-r">Type</th>
                  <th className="px-2 py-2 text-left border-r">Stock</th>
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
                    details.type !== undefined ? details.type : effectiveGstType;

                  return (
                    <tr key={itemId} className="border-t">
                      <td className="px-2 py-2 border-r">{index + 1}</td>
                      <td className="px-2 py-2 border-r">
                        <span className="text-xs">
                          {item?.name || "Unknown Item"}
                        </span>
                      </td>
                      <td className="px-2 py-2 border-r">
                        {isFirmGST ? (
                          <span className="text-xs">1</span>
                        ) : (
                          <select
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
                        )}
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.stock || 0}
                          onChange={(e) =>
                            updateItemDetail(itemId, "stock", e.target.value)
                          }
                          className="w-12 px-1 py-1 border rounded text-xs"
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
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewLastSold(itemId)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            onClick={() => toggleItemSelection(itemId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bill.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No items selected. Use the search below to add items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
        </div>

        {bill.items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              Selected Items ({bill.items.length}):
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {bill.items.map((itemId) => {
                const item = loadedItems.find((i) => i.id === itemId);
                return (
                  <span
                    key={itemId}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1"
                  >
                    {item?.name}
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Discount:</span>
              <input
                type="number"
                step="0.01"
                value={calculateTotalDiscount().toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
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
                onChange={(e) => setBill(prev => ({ ...prev, printOption: parseInt(e.target.value) }))}
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

      <Modal
        isOpen={viewItemModal.isOpen}
        onClose={() => setViewItemModal({ isOpen: false, data: null })}
        title="Last Sold Details"
        size="lg"
      >
        {viewItemModal.data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Challan No:</p>
                <p className="text-sm">{viewItemModal.data.challan_no}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Date:</p>
                <p className="text-sm">{new Date(viewItemModal.data.challan_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Contact:</p>
                <p className="text-sm">{viewItemModal.data.contact?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Phone:</p>
                <p className="text-sm">{viewItemModal.data.contact?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">GST Type:</p>
                <p className="text-sm">{viewItemModal.data.is_gst === 1 ? 'GST' : 'Non-GST'}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Item Details:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Quantity:</p>
                  <p className="text-sm">{viewItemModal.data.item?.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Rate:</p>
                  <p className="text-sm">₹{viewItemModal.data.item?.rate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Discount:</p>
                  <p className="text-sm">{viewItemModal.data.item?.discount}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">GST:</p>
                  <p className="text-sm">{viewItemModal.data.item?.gst_percent}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillForm;
