import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { DataTable, DeleteConfirmDialog, Modal } from "../../components/common";
import { Button } from "../../components/ui";
import useStore from "../../store";
import api from "../../services/axiosInstance";
import {
  getEntityId,
  getResponseData,
  getResponseList,
  normalizeBill,
  normalizeChallan,
  normalizeContact,
  normalizeItem,
  toNumber,
} from "../../services/apiUtils";

const getToday = () => new Date().toISOString().split("T")[0];

const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const clampPercent = (value) => {
  const parsed = toNumber(value, 0);
  return Math.min(100, Math.max(0, parsed));
};

const createEmptyItem = () => ({
  item_id: "",
  quantity: 1,
  rate: 0,
  discount: 0,
  special_discount: 0,
  gst_percent: 0,
  gst_amount: 0,
  taxable_amount: 0,
  amount: 0,
  is_damaged: false,
  is_gst: 1,
});

const getInitialFormData = () => ({
  return_no: "Auto Generated",
  date: getToday(),
  return_type: "sale_return",
  contact_id: "",
  bill_id: "",
  challan_id: "",
  items: [createEmptyItem()],
  total_amount: 0,
  note: "",
});

const calculateItemLine = (item) => {
  const quantity = Math.max(1, toNumber(item.quantity, 1));
  const rate = Math.max(0, toNumber(item.rate, 0));
  const discount = clampPercent(item.discount);
  const specialDiscount = clampPercent(item.special_discount);
  const gstPercent = clampPercent(item.gst_percent);
  const isGst = toNumber(item.is_gst, 1) === 1 ? 1 : 0;

  const gross = quantity * rate;
  const afterDiscount = gross * (1 - discount / 100);
  const afterSpecialDiscount = afterDiscount * (1 - specialDiscount / 100);
  const taxableAmount = roundToTwo(afterSpecialDiscount);
  const gstAmount =
    isGst === 1 ? roundToTwo(taxableAmount * (gstPercent / 100)) : 0;
  const amount = roundToTwo(taxableAmount + gstAmount);

  return {
    ...item,
    quantity,
    rate,
    discount,
    special_discount: specialDiscount,
    gst_percent: gstPercent,
    gst_amount: gstAmount,
    taxable_amount: taxableAmount,
    amount,
    is_damaged: item.is_damaged === true,
    is_gst: isGst,
  };
};

const buildReferenceItemsFromLines = (lines = [], fallbackItems = []) => {
  const fallbackMap = new Map(fallbackItems.map((item) => [item.id, item]));
  const itemMap = new Map();

  for (const line of lines) {
    const itemRef = line?.item_id || {};
    const itemId = getEntityId(itemRef);
    if (!itemId) continue;

    const fallback = fallbackMap.get(itemId);
    const quantity = Math.max(0, toNumber(line?.quantity, 0));
    const rate = toNumber(line?.rate, toNumber(fallback?.rate, 0));
    const gstPercent = toNumber(
      line?.gst_percent,
      toNumber(fallback?.gst_percent, 0),
    );
    const name =
      itemRef?.item_name ||
      itemRef?.name ||
      fallback?.name ||
      `Item ${itemId.slice(-6)}`;

    if (itemMap.has(itemId)) {
      const existing = itemMap.get(itemId);
      existing.billed_quantity = roundToTwo(existing.billed_quantity + quantity);
      if (existing.rate <= 0 && rate > 0) existing.rate = rate;
      if (existing.gst_percent <= 0 && gstPercent > 0) {
        existing.gst_percent = gstPercent;
      }
      continue;
    }

    itemMap.set(itemId, {
      id: itemId,
      name,
      rate,
      gst_percent: gstPercent,
      billed_quantity: roundToTwo(quantity),
      already_returned: 0,
      returnable_quantity: roundToTwo(quantity),
    });
  }

  return Array.from(itemMap.values());
};

const applyReturnedQuantities = (baseItems = [], returnDocs = []) => {
  const returnedMap = new Map();

  for (const doc of returnDocs) {
    for (const line of doc?.items || []) {
      const itemId = getEntityId(line?.item_id);
      if (!itemId) continue;
      const existing = returnedMap.get(itemId) || 0;
      returnedMap.set(itemId, existing + Math.max(0, toNumber(line?.quantity, 0)));
    }
  }

  return baseItems
    .map((item) => {
      const alreadyReturned = roundToTwo(returnedMap.get(item.id) || 0);
      const returnableQuantity = roundToTwo(
        Math.max(0, item.billed_quantity - alreadyReturned),
      );

      return {
        ...item,
        already_returned: alreadyReturned,
        returnable_quantity: returnableQuantity,
      };
    })
    .filter((item) => item.returnable_quantity > 0);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
};

const ReturnMaster = () => {
  const { showToast, selectedFirm } = useStore();

  const [returns, setReturns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [bills, setBills] = useState([]);
  const [challans, setChallans] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState([]);
  const [referenceItems, setReferenceItems] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    returnId: "",
    itemName: "",
  });
  const [previewDialog, setPreviewDialog] = useState({
    isOpen: false,
    loading: false,
    data: null,
  });

  const fetchReturns = useCallback(async () => {
    const response = await api.get("/returns", { params: { page: 1, limit: 200 } });
    const rows = getResponseList(response).map((entry) => ({
      id: getEntityId(entry),
      return_no: entry?.return_no || "-",
      return_type: entry?.return_type || "-",
      date: entry?.date || null,
      contact_name: entry?.contact_id?.name || "-",
      bill_no: entry?.bill_id?.bill_no || "-",
      challan_no: entry?.challan_id?.challan_no || "-",
      total_amount: toNumber(entry?.total_amount, 0),
      items_count: Array.isArray(entry?.items) ? entry.items.length : 0,
    }));
    setReturns(rows);
  }, []);

  const fetchFormOptions = useCallback(async () => {
    const [contactsRes, billsRes, itemsRes, challansRes] = await Promise.all([
      api.get("/contacts", { params: { page: 1, limit: 500 } }),
      api.get("/bills", { params: { page: 1, limit: 500 } }),
      api.get("/items", { params: { page: 1, limit: 500 } }),
      api.get("/challans/purchase", { params: { page: 1, limit: 500 } }),
    ]);

    const contactRows = getResponseList(contactsRes)
      .map((contact) => {
        const normalized = normalizeContact(contact);
        return {
          id: normalized.id,
          name: normalized.name || "Unknown",
        };
      })
      .filter((entry) => entry.id);
    setContacts(contactRows);

    const billRows = getResponseList(billsRes)
      .map((bill) => {
        const normalized = normalizeBill(bill);
        return {
          id: normalized.id,
          bill_no: normalized.billNo || bill?.bill_no || "-",
          contact_id: normalized.partyId || getEntityId(bill?.contact_id),
          contact_name: normalized.party || bill?.contact_id?.name || "-",
          date: normalized.date,
          amount: normalized.amount,
        };
      })
      .filter((entry) => entry.id);
    setBills(billRows);

    const itemRows = getResponseList(itemsRes)
      .map((item) => {
        const normalized = normalizeItem(item);
        return {
          id: normalized.id,
          name: normalized.itemName || "Unknown",
          rate: normalized.amount,
          gst_percent: normalized.gst_percent,
        };
      })
      .filter((entry) => entry.id);
    setItemsCatalog(itemRows);

    const challanRows = getResponseList(challansRes)
      .map((challan) => {
        const normalized = normalizeChallan(challan);
        return {
          id: normalized.id,
          challan_no: normalized.challanNo || challan?.challan_no || "-",
          contact_id: normalized.partyId || getEntityId(challan?.contact_id),
          contact_name: normalized.party || challan?.contact_id?.name || "-",
          date: normalized.date,
          amount: normalized.amount,
        };
      })
      .filter((entry) => entry.id);
    setChallans(challanRows);
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchReturns(), fetchFormOptions()]);
    } catch (error) {
      console.error("Failed to load Return Master data:", error);
      showToast(error?.response?.data?.message || "Failed to load return data", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchFormOptions, fetchReturns, showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, selectedFirm?.id]);

  const isSaleReturn = formData.return_type === "sale_return";

  const filteredBills = useMemo(() => {
    if (!formData.contact_id) return bills;
    return bills.filter((bill) => bill.contact_id === formData.contact_id);
  }, [bills, formData.contact_id]);

  const filteredChallans = useMemo(() => {
    if (!formData.contact_id) return challans;
    return challans.filter((challan) => challan.contact_id === formData.contact_id);
  }, [challans, formData.contact_id]);

  const loadReferenceItemsForBill = useCallback(
    async (billId) => {
      if (!billId) {
        setReferenceItems([]);
        return;
      }

      setReferenceLoading(true);
      try {
        const [billRes, billReturnsRes] = await Promise.all([
          api.get(`/bills/${billId}`),
          api.get(`/returns/bill/${billId}`),
        ]);

        const billDoc = getResponseData(billRes) || {};
        const billContactId = getEntityId(billDoc?.contact_id);
        const challans = Array.isArray(billDoc?.challan_ids) ? billDoc.challan_ids : [];
        const challanLines = challans.flatMap((challan) =>
          Array.isArray(challan?.items) ? challan.items : [],
        );

        const baseItems = buildReferenceItemsFromLines(challanLines, itemsCatalog);
        const returnDocs = getResponseList(billReturnsRes);
        const returnableItems = applyReturnedQuantities(baseItems, returnDocs);
        const returnableMap = new Map(returnableItems.map((item) => [item.id, item]));

        setReferenceItems(returnableItems);

        setFormData((prev) => {
          const nextItems = prev.items.map((line) => {
            if (!line.item_id) return line;

            const ref = returnableMap.get(line.item_id);
            if (!ref) {
              return createEmptyItem();
            }

            const clampedQty = Math.min(
              Math.max(1, toNumber(line.quantity, 1)),
              ref.returnable_quantity,
            );

            return {
              ...line,
              quantity: clampedQty,
              rate: toNumber(line.rate, 0) > 0 ? line.rate : ref.rate,
              gst_percent:
                toNumber(line.gst_percent, 0) > 0 ? line.gst_percent : ref.gst_percent,
            };
          });

          const hasAnySelected = nextItems.some((line) => Boolean(line.item_id));
          const items = hasAnySelected ? nextItems : [createEmptyItem()];

          return {
            ...prev,
            contact_id: billContactId || prev.contact_id,
            items,
          };
        });
      } catch (error) {
        console.error("Failed to load bill reference items:", error);
        showToast(error?.response?.data?.message || "Failed to load bill items", "error");
        setReferenceItems([]);
      } finally {
        setReferenceLoading(false);
      }
    },
    [itemsCatalog, showToast],
  );

  const loadReferenceItemsForChallan = useCallback(
    async (challanId) => {
      if (!challanId) {
        setReferenceItems([]);
        return;
      }

      setReferenceLoading(true);
      try {
        const [challanRes, challanReturnsRes] = await Promise.all([
          api.get(`/challans/${challanId}`),
          api.get(`/returns/challan/${challanId}`),
        ]);

        const challanDoc = getResponseData(challanRes) || {};
        const challanContactId = getEntityId(challanDoc?.contact_id);
        const challanLines = Array.isArray(challanDoc?.items) ? challanDoc.items : [];

        const baseItems = buildReferenceItemsFromLines(challanLines, itemsCatalog);
        const returnDocs = getResponseList(challanReturnsRes);
        const returnableItems = applyReturnedQuantities(baseItems, returnDocs);
        const returnableMap = new Map(returnableItems.map((item) => [item.id, item]));

        setReferenceItems(returnableItems);

        setFormData((prev) => {
          const nextItems = prev.items.map((line) => {
            if (!line.item_id) return line;

            const ref = returnableMap.get(line.item_id);
            if (!ref) {
              return createEmptyItem();
            }

            const clampedQty = Math.min(
              Math.max(1, toNumber(line.quantity, 1)),
              ref.returnable_quantity,
            );

            return {
              ...line,
              quantity: clampedQty,
              rate: toNumber(line.rate, 0) > 0 ? line.rate : ref.rate,
              gst_percent:
                toNumber(line.gst_percent, 0) > 0 ? line.gst_percent : ref.gst_percent,
            };
          });

          const hasAnySelected = nextItems.some((line) => Boolean(line.item_id));
          const items = hasAnySelected ? nextItems : [createEmptyItem()];

          return {
            ...prev,
            contact_id: challanContactId || prev.contact_id,
            items,
          };
        });
      } catch (error) {
        console.error("Failed to load challan reference items:", error);
        showToast(
          error?.response?.data?.message || "Failed to load challan items",
          "error",
        );
        setReferenceItems([]);
      } finally {
        setReferenceLoading(false);
      }
    },
    [itemsCatalog, showToast],
  );

  useEffect(() => {
    if (!isAddModalOpen) return;
    if (formData.return_type === "sale_return") {
      if (!formData.bill_id) {
        setReferenceItems([]);
        return;
      }
      loadReferenceItemsForBill(formData.bill_id);
      return;
    }
    if (!formData.challan_id) {
      setReferenceItems([]);
      return;
    }
    loadReferenceItemsForChallan(formData.challan_id);
  }, [
    formData.bill_id,
    formData.challan_id,
    formData.return_type,
    isAddModalOpen,
    loadReferenceItemsForBill,
    loadReferenceItemsForChallan,
  ]);

  const handleReturnTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      return_type: value,
      contact_id: "",
      bill_id: "",
      challan_id: "",
      items: [createEmptyItem()],
      total_amount: 0,
    }));
    setReferenceItems([]);
  };

  const handleContactChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      contact_id: value,
      bill_id: prev.return_type === "sale_return" ? "" : prev.bill_id,
      challan_id: prev.return_type === "purchase_return" ? "" : prev.challan_id,
      items: [createEmptyItem()],
      total_amount: 0,
    }));
    setReferenceItems([]);
  };

  const columns = [
    {
      key: "serial",
      label: "ID",
      render: (_val, _row, index) => <span className="text-xs sm:text-sm">{index + 1}</span>,
    },
    {
      key: "return_no",
      label: "Return No",
      render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (value) => <span className="text-xs sm:text-sm">{formatDate(value)}</span>,
    },
    {
      key: "return_type",
      label: "Type",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            value === "sale_return"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {value === "sale_return" ? "Sale Return" : "Purchase Return"}
        </span>
      ),
    },
    {
      key: "contact_name",
      label: "Contact",
      render: (value) => <span className="text-xs sm:text-sm">{value || "-"}</span>,
    },
    {
      key: "reference",
      label: "Reference",
      render: (_val, row) => (
        <span className="text-xs sm:text-sm">
          {row.return_type === "sale_return" ? row.bill_no : row.challan_no}
        </span>
      ),
    },
    {
      key: "items_count",
      label: "Items",
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>,
    },
    {
      key: "total_amount",
      label: "Total Amount",
      render: (value) => <span className="text-xs sm:text-sm">Rs {toNumber(value, 0).toFixed(2)}</span>,
    },
  ];

  const actions = [
    {
      label: <FaEye size={10} className="sm:size-3 md:size-4" />,
      onClick: async (entry) => {
        setPreviewDialog({ isOpen: true, loading: true, data: null });
        try {
          const response = await api.get(`/returns/${entry.id}`);
          const data = getResponseData(response);
          setPreviewDialog({ isOpen: true, loading: false, data });
        } catch (error) {
          console.error("Failed to load return preview:", error);
          showToast(
            error?.response?.data?.message || "Failed to load return preview",
            "error",
          );
          setPreviewDialog({ isOpen: false, loading: false, data: null });
        }
      },
      className: "bg-slate-600 text-white hover:bg-slate-700 p-1 sm:p-1.5 md:p-2 text-xs",
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (entry) =>
        setDeleteDialog({
          isOpen: true,
          returnId: entry.id,
          itemName: entry.return_no,
        }),
      className: "bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs",
    },
  ];

  const openAddModal = () => {
    setFormData(getInitialFormData());
    setReferenceItems([]);
    setIsAddModalOpen(true);
  };

  const updateItems = (updater) => {
    setFormData((prev) => {
      const nextItems = updater(prev.items.map((item) => ({ ...item })));
      const recalculatedItems = nextItems.map(calculateItemLine);
      const totalAmount = roundToTwo(
        recalculatedItems.reduce((sum, item) => sum + toNumber(item.amount, 0), 0),
      );

      return {
        ...prev,
        items: recalculatedItems,
        total_amount: totalAmount,
      };
    });
  };

  const handleItemFieldChange = (index, field, value) => {
    updateItems((items) => {
      const currentItem = items[index];
      if (!currentItem) return items;

      if (field === "item_id") {
        currentItem.item_id = value;
        const selectedItem = referenceItems.find((item) => item.id === value);
        if (selectedItem) {
          currentItem.rate = toNumber(selectedItem.rate, 0);
          currentItem.gst_percent = toNumber(selectedItem.gst_percent, 0);
          currentItem.quantity = Math.min(
            Math.max(1, toNumber(currentItem.quantity, 1)),
            selectedItem.returnable_quantity,
          );
        } else {
          currentItem.rate = 0;
          currentItem.gst_percent = 0;
          currentItem.quantity = 1;
        }
        return items;
      }

      if (field === "is_damaged") {
        currentItem.is_damaged = value === true;
        return items;
      }

      if (field === "is_gst") {
        currentItem.is_gst = Number(value) === 1 ? 1 : 0;
        return items;
      }

      if (field === "quantity") {
        const ref = referenceItems.find((item) => item.id === currentItem.item_id);
        const parsedQty = Math.max(1, toNumber(value, 1));
        currentItem.quantity = ref ? Math.min(parsedQty, ref.returnable_quantity) : parsedQty;
        return items;
      }

      currentItem[field] = toNumber(value, 0);
      return items;
    });
  };

  const handleAddItem = () => {
    updateItems((items) => [...items, createEmptyItem()]);
  };

  const handleRemoveItem = (index) => {
    updateItems((items) => {
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
      return nextItems.length > 0 ? nextItems : [createEmptyItem()];
    });
  };

  const validateForm = () => {
    if (!formData.date) {
      showToast("Please select return date", "error");
      return false;
    }

    if (formData.return_type === "sale_return") {
      if (!formData.bill_id) {
        showToast("Please select bill for return", "error");
        return false;
      }
    } else if (!formData.challan_id) {
      showToast("Please select purchase challan for return", "error");
      return false;
    }

    if (referenceLoading) {
      showToast("Bill items are still loading, please wait", "error");
      return false;
    }

    const selectedItems = formData.items.filter((item) => item.item_id);
    if (selectedItems.length === 0) {
      showToast("Please select at least one item", "error");
      return false;
    }

    const refMap = new Map(referenceItems.map((item) => [item.id, item]));
    for (const line of selectedItems) {
      const ref = refMap.get(line.item_id);
      if (!ref) {
        showToast("Selected item is not part of this bill", "error");
        return false;
      }
      const qty = toNumber(line.quantity, 0);
      if (qty > ref.returnable_quantity + 0.0001) {
        showToast(
          `Return quantity exceeds returnable qty for '${ref.name}'. Max: ${ref.returnable_quantity}`,
          "error",
        );
        return false;
      }
    }

    const hasInvalidQty = selectedItems.some(
      (item) => toNumber(item.quantity, 0) <= 0,
    );
    if (hasInvalidQty) {
      showToast("Item quantity should be greater than 0", "error");
      return false;
    }

    return true;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving || !validateForm()) return;

    const processedItems = formData.items
      .filter((item) => item.item_id)
      .map(calculateItemLine)
      .map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        special_discount: item.special_discount,
        gst_percent: item.gst_percent,
        is_damaged: item.is_damaged,
        is_gst: item.is_gst,
      }));

    const payload = {
      date: formData.date,
      items: processedItems,
      note: formData.note?.trim() || "",
    };

    const endpoint =
      formData.return_type === "sale_return" ? "/returns/sale" : "/returns/purchase";
    if (formData.return_type === "sale_return") {
      payload.bill_id = formData.bill_id;
    } else {
      payload.challan_id = formData.challan_id;
    }

    setSaving(true);
    try {
      await api.post(endpoint, payload);
      showToast("Return created successfully", "success");
      setIsAddModalOpen(false);
      await fetchReturns();
    } catch (error) {
      console.error("Failed to create return:", error);
      showToast(error?.response?.data?.message || "Failed to create return", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReturn = async () => {
    if (!deleteDialog.returnId) return;
    try {
      await api.delete(`/returns/${deleteDialog.returnId}`);
      showToast("Return deleted successfully", "success");
      setDeleteDialog({ isOpen: false, returnId: "", itemName: "" });
      await fetchReturns();
    } catch (error) {
      console.error("Failed to delete return:", error);
      showToast(error?.response?.data?.message || "Failed to delete return", "error");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Return Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Manage sale and purchase return entries
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="flex items-center gap-2 text-xs sm:text-sm"
          disabled={loading}
        >
          <FaPlus className="text-sm sm:text-base" />
          Add Return
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={returns}
        actions={actions}
        searchable
        sortable
        pagination
      />

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Return"
        size="6xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return No</label>
              <input
                type="text"
                value={formData.return_no}
                readOnly
                className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, date: event.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
              <select
                value={formData.return_type}
                onChange={(event) => handleReturnTypeChange(event.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="sale_return">Sale Return</option>
                <option value="purchase_return">Purchase Return</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <select
                value={formData.contact_id}
                onChange={(event) => handleContactChange(event.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isSaleReturn ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill</label>
                <select
                  value={formData.bill_id}
                  onChange={(event) => {
                    const selectedBillId = event.target.value;
                    const selectedBill = bills.find((bill) => bill.id === selectedBillId);
                    setFormData((prev) => ({
                      ...prev,
                      bill_id: selectedBillId,
                      challan_id: "",
                      contact_id: selectedBill?.contact_id || prev.contact_id,
                      items: [createEmptyItem()],
                      total_amount: 0,
                    }));
                    setReferenceItems([]);
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select Bill</option>
                  {filteredBills.map((bill) => (
                    <option key={bill.id} value={bill.id}>
                      {bill.bill_no} - {bill.contact_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Challan
                </label>
                <select
                  value={formData.challan_id}
                  onChange={(event) => {
                    const selectedChallanId = event.target.value;
                    const selectedChallan = challans.find(
                      (challan) => challan.id === selectedChallanId,
                    );
                    setFormData((prev) => ({
                      ...prev,
                      challan_id: selectedChallanId,
                      bill_id: "",
                      contact_id: selectedChallan?.contact_id || prev.contact_id,
                      items: [createEmptyItem()],
                      total_amount: 0,
                    }));
                    setReferenceItems([]);
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select Challan</option>
                  {filteredChallans.map((challan) => (
                    <option key={challan.id} value={challan.id}>
                      {challan.challan_no} - {challan.contact_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border rounded-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
              <h3 className="font-medium text-gray-900">Items</h3>
              <Button type="button" size="sm" onClick={handleAddItem}>
                Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left border-r">SNo</th>
                    <th className="px-2 py-2 text-left border-r">Item</th>
                    <th className="px-2 py-2 text-left border-r">Qty</th>
                    <th className="px-2 py-2 text-left border-r">Rate</th>
                    <th className="px-2 py-2 text-left border-r">Dis %</th>
                    <th className="px-2 py-2 text-left border-r">SP Dis %</th>
                    <th className="px-2 py-2 text-left border-r">GST %</th>
                    <th className="px-2 py-2 text-left border-r">Taxable</th>
                    <th className="px-2 py-2 text-left border-r">GST Amt</th>
                    <th className="px-2 py-2 text-left border-r">Amount</th>
                    <th className="px-2 py-2 text-left border-r">Damaged</th>
                    <th className="px-2 py-2 text-left border-r">GST Type</th>
                    <th className="px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={`item-row-${index}`} className="border-t">
                      <td className="px-2 py-2 border-r">{index + 1}</td>
                      <td className="px-2 py-2 border-r min-w-[220px]">
                        <select
                          value={item.item_id}
                          onChange={(event) =>
                            handleItemFieldChange(index, "item_id", event.target.value)
                          }
                          disabled={!formData.bill_id || referenceLoading}
                          className="w-full px-2 py-1 border rounded text-xs disabled:bg-gray-100"
                        >
                          <option value="">
                            {referenceLoading
                              ? "Loading bill items..."
                              : formData.bill_id
                                ? "Select Item"
                                : "Select Bill First"}
                          </option>
                          {referenceItems.map((refItem) => (
                            <option key={refItem.id} value={refItem.id}>
                              {refItem.name} (Max {refItem.returnable_quantity})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            handleItemFieldChange(index, "quantity", event.target.value)
                          }
                          disabled={!item.item_id}
                          className="w-16 px-1 py-1 border rounded text-xs disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(event) =>
                            handleItemFieldChange(index, "rate", event.target.value)
                          }
                          className="w-20 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(event) =>
                            handleItemFieldChange(index, "discount", event.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.special_discount}
                          onChange={(event) =>
                            handleItemFieldChange(
                              index,
                              "special_discount",
                              event.target.value,
                            )
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.gst_percent}
                          onChange={(event) =>
                            handleItemFieldChange(index, "gst_percent", event.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-2 border-r text-xs">
                        {toNumber(item.taxable_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 border-r text-xs">
                        {toNumber(item.gst_amount, 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 border-r text-xs font-medium">
                        {toNumber(item.amount, 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="checkbox"
                          checked={item.is_damaged === true}
                          onChange={(event) =>
                            handleItemFieldChange(index, "is_damaged", event.target.checked)
                          }
                        />
                      </td>
                      <td className="px-2 py-2 border-r">
                        <select
                          value={item.is_gst}
                          onChange={(event) =>
                            handleItemFieldChange(index, "is_gst", event.target.value)
                          }
                          className="w-16 px-1 py-1 border rounded text-xs"
                        >
                          <option value={1}>1</option>
                          <option value={0}>0</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Item"
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.note}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, note: event.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Enter note"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <input
                type="number"
                value={toNumber(formData.total_amount, 0).toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Return"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, returnId: "", itemName: "" })}
        onConfirm={handleDeleteReturn}
        itemName={deleteDialog.itemName || "this return"}
      />

      <Modal
        isOpen={previewDialog.isOpen}
        onClose={() => setPreviewDialog({ isOpen: false, loading: false, data: null })}
        title="Return Preview"
        size="6xl"
      >
        {previewDialog.loading ? (
          <div className="py-10 text-center text-sm text-gray-600">Loading preview...</div>
        ) : (
          (() => {
            const data = previewDialog.data || {};
            const returnType = data?.return_type === "sale_return" ? "Sale Return" : "Purchase Return";
            const refNo =
              data?.return_type === "sale_return"
                ? data?.bill_id?.bill_no || "-"
                : data?.challan_id?.challan_no || "-";
            const items = Array.isArray(data?.items) ? data.items : [];

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Return No</div>
                    <div className="font-medium text-gray-900">{data?.return_no || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Return Type</div>
                    <div className="font-medium text-gray-900">{returnType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="font-medium text-gray-900">{formatDate(data?.date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Contact</div>
                    <div className="font-medium text-gray-900">{data?.contact_id?.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Reference</div>
                    <div className="font-medium text-gray-900">{refNo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Amount</div>
                    <div className="font-medium text-gray-900">
                      Rs {toNumber(data?.total_amount, 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-100 border-b text-sm font-medium text-gray-900">
                    Items
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left border-r">SNo</th>
                          <th className="px-2 py-2 text-left border-r">Item</th>
                          <th className="px-2 py-2 text-left border-r">Qty</th>
                          <th className="px-2 py-2 text-left border-r">Rate</th>
                          <th className="px-2 py-2 text-left border-r">Dis %</th>
                          <th className="px-2 py-2 text-left border-r">SP Dis %</th>
                          <th className="px-2 py-2 text-left border-r">GST %</th>
                          <th className="px-2 py-2 text-left border-r">Taxable</th>
                          <th className="px-2 py-2 text-left border-r">GST Amt</th>
                          <th className="px-2 py-2 text-left border-r">Amount</th>
                          <th className="px-2 py-2 text-left border-r">Damaged</th>
                          <th className="px-2 py-2 text-left">GST Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-3 py-4 text-center text-gray-500">
                              No items available.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => {
                            const itemRef = item?.item_id || {};
                            const itemName =
                              itemRef?.item_name ||
                              itemRef?.name ||
                              item?.item_name ||
                              item?.name ||
                              "-";
                            return (
                              <tr key={`preview-item-${index}`} className="border-t">
                                <td className="px-2 py-2 border-r">{index + 1}</td>
                                <td className="px-2 py-2 border-r">{itemName}</td>
                                <td className="px-2 py-2 border-r">{toNumber(item?.quantity, 0)}</td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.rate, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.discount, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.special_discount, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.gst_percent, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.taxable_amount, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.gst_amount, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {toNumber(item?.amount, 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-2 border-r">
                                  {item?.is_damaged ? "Yes" : "No"}
                                </td>
                                <td className="px-2 py-2">
                                  {Number(item?.is_gst ?? 1) === 1 ? "1" : "0"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {data?.note ? (
                  <div className="text-sm">
                    <div className="text-xs text-gray-500">Note</div>
                    <div className="text-gray-800">{data.note}</div>
                  </div>
                ) : null}
              </div>
            );
          })()
        )}
      </Modal>
    </div>
  );
};

export default ReturnMaster;
