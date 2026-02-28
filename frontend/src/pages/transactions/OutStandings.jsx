import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Textarea } from "../../components/ui";
import useStore from "../../store";
import api from "../../services/axiosInstance";
import { getEntityId, getResponseList, normalizeContact, toNumber } from "../../services/apiUtils";
import { FaCalculator, FaLayerGroup, FaMoneyBillWave } from "react-icons/fa";

const PAYMENT_TYPES = [
  {
    value: "bank_transaction_received_amount",
    label: "Bank Transaction Received Amount",
    hint: "Payment received from party via bank.",
  },
  {
    value: "cash_payment_received_amount",
    label: "Cash Payment Received Amount",
    hint: "Payment received from party in cash.",
  },
  {
    value: "bank_transfer_payment_given",
    label: "Bank Transfer Payment Given",
    hint: "Payment returned to supplier via bank transfer.",
  },
  {
    value: "cash_payment_given",
    label: "Cash Payment Given",
    hint: "Payment returned to supplier in cash.",
  },
];

const BANK_REQUIRED = new Set([
  "bank_transaction_received_amount",
  "bank_transfer_payment_given",
]);

const OutStandings = () => {
  const { showToast } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [parties, setParties] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [contactType, setContactType] = useState("party");
  const [selectedContact, setSelectedContact] = useState("");
  const [bills, setBills] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [payment, setPayment] = useState({
    amount: "",
    payment_type: "bank_transaction_received_amount",
    bank_id: "",
    reference_no: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
    apply_remaining_to_balance: true,
  });

  const contacts = contactType === "party" ? parties : suppliers;
  const selectedContactDetails = contacts.find((c) => c.id === selectedContact);
  const selectedPaymentType = PAYMENT_TYPES.find((p) => p.value === payment.payment_type);
  const isBankRequired = BANK_REQUIRED.has(payment.payment_type);

  const billMap = useMemo(
    () => new Map(bills.map((bill) => [bill.id, bill])),
    [bills],
  );

  const totals = useMemo(() => {
    const totalAmount = toNumber(payment.amount, 0);
    const allocatedAmount = bills.reduce((sum, bill) => {
      return sum + toNumber(allocations[bill.id], 0);
    }, 0);
    const totalDue = bills.reduce((sum, bill) => sum + toNumber(bill.due, 0), 0);
    const remaining = Number((totalAmount - allocatedAmount).toFixed(2));
    return {
      totalAmount,
      allocatedAmount,
      totalDue,
      remaining,
    };
  }, [payment.amount, allocations, bills]);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [partyRes, supplierRes, bankRes] = await Promise.all([
          api.get("/contacts/parties", { params: { page: 1, limit: 200 } }),
          api.get("/contacts/suppliers", { params: { page: 1, limit: 200 } }),
          api.get("/banks"),
        ]);

        const mappedParties = getResponseList(partyRes).map((contact) => {
          const normalized = normalizeContact(contact);
          return {
            id: normalized.id,
            name: normalized.name,
            balance: toNumber(contact?.balance ?? contact?.balance_amount, 0),
            raw: contact,
          };
        });

        const mappedSuppliers = getResponseList(supplierRes).map((contact) => {
          const normalized = normalizeContact(contact);
          return {
            id: normalized.id,
            name: normalized.name,
            balance: toNumber(contact?.balance ?? contact?.balance_amount, 0),
            raw: contact,
          };
        });

        const mappedBanks = getResponseList(bankRes).map((bank) => ({
          id: getEntityId(bank) || bank._id,
          name: bank.bank_name || bank.name || "Bank",
          account: bank.account_number || bank.accountNo || "",
        }));

        setParties(mappedParties);
        setSuppliers(mappedSuppliers);
        setBanks(mappedBanks);
      } catch (error) {
        console.error("Failed to load base data", error);
        showToast("Failed to load parties/banks", "error");
      }
    };

    loadBaseData();
  }, [showToast]);

  useEffect(() => {
    setSelectedContact("");
    setBills([]);
    setAllocations({});
    setPayment((prev) => ({
      ...prev,
      payment_type:
        contactType === "supplier" ?
          "bank_transfer_payment_given"
        : "bank_transaction_received_amount",
    }));
  }, [contactType]);

  useEffect(() => {
    if (!selectedContact) {
      setBills([]);
      setAllocations({});
      return;
    }

    const fetchBills = async () => {
      try {
        setLoadingBills(true);
        const response = await api.get(`/bills/contact/${selectedContact}`, {
          params: { page: 1, limit: 200, payment_status: "due" },
        });

        const list = getResponseList(response).map((bill) => {
          const amount = toNumber(bill.amount ?? bill.total_amount, 0);
          const paidAmount = toNumber(bill.paid_amount ?? bill.paidAmount, 0);
          const dueAmount = toNumber(bill.balance ?? amount - paidAmount, 0);
          return {
            id: getEntityId(bill) || bill._id,
            billNo: bill.bill_no || bill.billNo || bill.id || "-",
            date: bill.date,
            amount,
            paidAmount,
            due: Number(dueAmount.toFixed(2)),
            status: bill.payment_status || "due",
          };
        });

        const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
        setBills(sorted);

        const nextAllocations = {};
        sorted.forEach((bill) => {
          nextAllocations[bill.id] = "";
        });
        setAllocations(nextAllocations);
      } catch (error) {
        console.error("Failed to fetch bills", error);
        showToast("Failed to load bills", "error");
      } finally {
        setLoadingBills(false);
      }
    };

    fetchBills();
  }, [selectedContact, showToast]);

  const updateAllocation = (billId, value) => {
    const bill = billMap.get(billId);
    if (!bill) return;
    if (value === "") {
      setAllocations((prev) => ({ ...prev, [billId]: "" }));
      return;
    }
    const numeric = toNumber(value, 0);
    const fallbackDue = Math.max(
      0,
      toNumber(bill.amount, 0) - toNumber(bill.paidAmount, 0),
    );
    const dueCap =
      Number.isFinite(bill.due) && bill.due > 0 ? bill.due : fallbackDue;
    const capped = dueCap > 0 ? Math.max(0, Math.min(numeric, dueCap)) : Math.max(0, numeric);
    setAllocations((prev) => ({ ...prev, [billId]: capped }));
  };

  const handleSettleFull = (billId) => {
    const bill = billMap.get(billId);
    if (!bill) return;
    setAllocations((prev) => ({ ...prev, [billId]: bill.due }));
  };

  const handleClearAllocations = () => {
    const nextAllocations = {};
    bills.forEach((bill) => {
      nextAllocations[bill.id] = "";
    });
    setAllocations(nextAllocations);
  };

  const handleAutoAllocate = () => {
    const totalAmount = toNumber(payment.amount, 0);
    if (totalAmount <= 0) {
      showToast("Enter payment amount first", "warning");
      return;
    }
    let remaining = totalAmount;
    const nextAllocations = {};
    bills.forEach((bill) => {
      const settle = Math.min(remaining, bill.due);
      nextAllocations[bill.id] = settle > 0 ? Number(settle.toFixed(2)) : 0;
      remaining = Number((remaining - settle).toFixed(2));
    });
    setAllocations(nextAllocations);
  };

  const handleSubmit = async () => {
    const totalAmount = toNumber(payment.amount, 0);
    if (!selectedContact) {
      showToast("Select a party/supplier", "warning");
      return;
    }
    if (totalAmount <= 0) {
      showToast("Payment amount must be greater than 0", "warning");
      return;
    }
    if (isBankRequired && !payment.bank_id) {
      showToast("Select a bank for this payment type", "warning");
      return;
    }
    if (totals.allocatedAmount <= 0) {
      showToast("Allocate payment to at least one bill", "warning");
      return;
    }
    if (totals.allocatedAmount > totals.totalAmount + 0.009) {
      showToast("Allocated total cannot exceed payment amount", "warning");
      return;
    }
    if (totals.remaining > 0 && !payment.apply_remaining_to_balance) {
      showToast("Remaining amount must be allocated or marked as unsettled", "warning");
      return;
    }

    const allocationsPayload = bills
      .map((bill) => ({
        bill_id: bill.id,
        amount: toNumber(allocations[bill.id], 0),
      }))
      .filter((row) => row.amount > 0);

    if (allocationsPayload.length === 0) {
      showToast("Allocate payment to at least one bill", "warning");
      return;
    }

    const payload = {
      contact_id: selectedContact,
      total_amount: totalAmount,
      payment_type: payment.payment_type,
      bank_id: payment.bank_id || undefined,
      reference_no: payment.reference_no || undefined,
      note: payment.note || undefined,
      date: payment.date,
      allocations: allocationsPayload,
      apply_remaining_to_balance: payment.apply_remaining_to_balance,
    };

    try {
      setLoading(true);
      const response = await api.post("/bills/settlements", payload);
      const result = response?.data?.data || response?.data;

      if (result?.contact) {
        const contactId = getEntityId(result.contact) || result.contact._id;
        const nextBalance = toNumber(result.contact.balance, 0);
        if (contactId) {
          if (contactType === "party") {
            setParties((prev) =>
              prev.map((c) => (c.id === contactId ? { ...c, balance: nextBalance } : c)),
            );
          } else {
            setSuppliers((prev) =>
              prev.map((c) => (c.id === contactId ? { ...c, balance: nextBalance } : c)),
            );
          }
        }
      }

      showToast("Bills settled successfully", "success");
      handleClearAllocations();
      setPayment((prev) => ({ ...prev, amount: "", reference_no: "", note: "" }));
      if (selectedContact) {
        const refreshed = await api.get(`/bills/contact/${selectedContact}`, {
          params: { page: 1, limit: 200, payment_status: "due" },
        });
        const list = getResponseList(refreshed).map((bill) => {
          const amount = toNumber(bill.amount ?? bill.total_amount, 0);
          const paidAmount = toNumber(bill.paid_amount ?? bill.paidAmount, 0);
          const dueAmount = toNumber(bill.balance ?? amount - paidAmount, 0);
          return {
            id: getEntityId(bill) || bill._id,
            billNo: bill.bill_no || bill.billNo || bill.id || "-",
            date: bill.date,
            amount,
            paidAmount,
            due: Number(dueAmount.toFixed(2)),
            status: bill.payment_status || "due",
          };
        });
        setBills(list);
      }
    } catch (error) {
      console.error("Failed to settle bills", error);
      showToast(error?.response?.data?.message || "Failed to settle bills", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">OutStandings</h1>
        <p className="text-gray-600">Settle payments against bills and manage unsettled balances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-gray-800">
            <FaMoneyBillWave className="text-blue-600" />
            <h3 className="font-semibold">Payment Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
              <Select value={contactType} onChange={setContactType}>
                <option value="party">Party</option>
                <option value="supplier">Supplier</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {contactType === "party" ? "Party" : "Supplier"} *
              </label>
              <Select
                value={selectedContact}
                onChange={setSelectedContact}
                placeholder={`Select ${contactType}`}
              >
                {(contacts || []).map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
              <Input
                type="number"
                value={payment.amount}
                onChange={(value) => setPayment((prev) => ({ ...prev, amount: value }))}
                placeholder="Enter total amount"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Return Type *</label>
              <Select
                value={payment.payment_type}
                onChange={(value) => setPayment((prev) => ({ ...prev, payment_type: value }))}
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Received: bank/cash received from party. Given: bank/cash paid to supplier.
              </p>
              {selectedPaymentType?.hint && (
                <p className="text-xs text-gray-500 mt-1">{selectedPaymentType.hint}</p>
              )}
            </div>
            {isBankRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank *</label>
                <Select
                  value={payment.bank_id}
                  onChange={(value) => setPayment((prev) => ({ ...prev, bank_id: value }))}
                  placeholder="Select bank"
                >
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}{bank.account ? ` - ${bank.account}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
              <Input
                value={payment.reference_no}
                onChange={(value) => setPayment((prev) => ({ ...prev, reference_no: value }))}
                placeholder="NEFT/UPI/Cheque reference"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <Input
                type="date"
                value={payment.date}
                onChange={(value) => setPayment((prev) => ({ ...prev, date: value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <Textarea
                value={payment.note}
                onChange={(value) => setPayment((prev) => ({ ...prev, note: value }))}
                placeholder="Optional note"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={payment.apply_remaining_to_balance}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, apply_remaining_to_balance: e.target.checked }))
                }
              />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Add remaining amount to {contactType === "party" ? "party" : "supplier"} balance (unsettled)
                </p>
                <p className="text-xs text-gray-500">
                  This keeps the remaining amount unsettled for later verbal settlement.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="flex items-center gap-2 text-gray-800">
            <FaCalculator className="text-green-600" />
            <h3 className="font-semibold">Summary</h3>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Total Due (Bills)</span>
              <span className="font-semibold">Rs {totals.totalDue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Amount</span>
              <span className="font-semibold">Rs {totals.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Allocated</span>
              <span className="font-semibold">Rs {totals.allocatedAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Remaining</span>
              <span className={`font-semibold ${totals.remaining < 0 ? "text-red-600" : "text-blue-600"}`}>
                Rs {totals.remaining.toLocaleString()}
              </span>
            </div>
            {selectedContactDetails && (
              <div className="flex items-center justify-between">
                <span>Current Balance</span>
                <span className="font-semibold">Rs {toNumber(selectedContactDetails.balance, 0).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading || loadingBills || bills.length === 0}
            >
              Settle Bills
            </Button>
            {totals.remaining > 0 && !payment.apply_remaining_to_balance && (
              <p className="text-xs text-red-600 mt-2">
                Remaining amount must be allocated to a bill or marked as unsettled.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-gray-800">
            <FaLayerGroup className="text-purple-600" />
            <h3 className="font-semibold">Bills to Settle</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoAllocate} disabled={loadingBills}>
              Auto Allocate
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAllocations} disabled={loadingBills}>
              Clear
            </Button>
          </div>
        </div>

        {loadingBills ? (
          <div className="text-sm text-gray-600">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="text-sm text-gray-600">
            {selectedContact ? "No due bills available." : "Select a party/supplier to view bills."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2">Bill No</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-right px-3 py-2">Paid</th>
                  <th className="text-right px-3 py-2">Due</th>
                  <th className="text-left px-3 py-2">Allocate</th>
                  <th className="text-left px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium text-gray-900">{bill.billNo}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {bill.date ? new Date(bill.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">Rs {bill.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">Rs {bill.paidAmount.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">Rs {bill.due.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocations[bill.id] === 0 ? "" : allocations[bill.id] ?? ""}
                        onChange={(value) => updateAllocation(bill.id, value)}
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettleFull(bill.id)}
                      >
                        Full Due
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutStandings;
