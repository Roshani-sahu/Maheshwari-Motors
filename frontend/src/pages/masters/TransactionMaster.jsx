import { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const TRANSACTION_TYPES = {
  BANK_RECEIVED: 'bank_received',
  CASH_RECEIVED: 'cash_received',
  BANK_PAYMENT: 'bank_payment',
  CASH_PAYMENT: 'cash_payment'
};

const BOOKS = {
  CASH: 'cash_book',
  AC: 'ac_book',
  CREDITOR: 'creditor',
  DEBITOR: 'debitor'
};

const INITIAL_FORM = {
  transaction_no: '',
  type: '',
  contact_id: '',
  amount: '',
  bank_id: '',
  date: new Date().toISOString().split('T')[0],
  reference: '',
  remarks: '',
  is_gst: 0
};

const TransactionMaster = () => {
  const { showToast } = useStore();
  const [activeBook, setActiveBook] = useState(BOOKS.CASH);
  const [transactions, setTransactions] = useState([]);
  const [parties, setParties] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, transaction: null });
  const [loading, setLoading] = useState(false);

  const getResponseList = (res) => {
    const data = res?.data?.data;
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  };

  useEffect(() => {
    fetchParties();
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [activeBook]);

  const fetchParties = async () => {
    try {
      const res = await api.get('/contacts');
      setParties(getResponseList(res));
    } catch (error) {
      showToast('Failed to fetch parties', 'error');
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get('/banks');
      setBanks(getResponseList(res));
    } catch (error) {
      showToast('Failed to fetch banks', 'error');
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      const allTransactions = getResponseList(res);
      const bookTypes = getBookTransactionTypes(activeBook);
      const filtered = allTransactions.filter(t => bookTypes.includes(t.type));
      setTransactions(filtered);
    } catch (error) {
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getBookTransactionTypes = (book) => {
    switch (book) {
      case BOOKS.CASH:
        return [TRANSACTION_TYPES.CASH_RECEIVED, TRANSACTION_TYPES.CASH_PAYMENT];
      case BOOKS.AC:
        return [TRANSACTION_TYPES.BANK_RECEIVED, TRANSACTION_TYPES.BANK_PAYMENT];
      case BOOKS.CREDITOR:
        return [TRANSACTION_TYPES.BANK_PAYMENT, TRANSACTION_TYPES.CASH_PAYMENT];
      case BOOKS.DEBITOR:
        return [TRANSACTION_TYPES.BANK_RECEIVED, TRANSACTION_TYPES.CASH_RECEIVED];
      default:
        return [];
    }
  };

  const columns = [
    { key: 'id', label: 'ID', width: '50px', render: (v, r, i) => i + 1 },
    { key: 'transaction_no', label: 'Trans No', width: '100px' },
    { key: 'date', label: 'Date', width: '100px', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'type', label: 'Type', width: '120px', render: (v) => v.replace(/_/g, ' ').toUpperCase() },
    { key: 'contact_id', label: 'Party', width: '150px', render: (v) => parties.find(p => p._id === v)?.name || 'N/A' },
    { key: 'amount', label: 'Amount', width: '100px', render: (v) => `₹${v?.toFixed(2)}` },
    { key: 'bank_id', label: 'Bank', width: '120px', render: (v) => v ? banks.find(b => b._id === v)?.bank_name || 'N/A' : 'N/A' },
    { key: 'reference', label: 'Reference', width: '100px' }
  ];

  const actions = [
    {
      label: <FaEye size={12} />,
      onClick: (t) => { setSelectedTransaction(t); setIsViewModalOpen(true); },
      className: 'bg-green-600 text-white hover:bg-green-700 p-2'
    },
    {
      label: <FaEdit size={12} />,
      onClick: (t) => {
        setSelectedTransaction(t);
        setFormData({
          transaction_no: t.transaction_no,
          type: t.type,
          contact_id: t.contact_id,
          amount: t.amount,
          bank_id: t.bank_id || '',
          date: t.date?.split('T')[0],
          reference: t.reference || '',
          remarks: t.remarks || '',
          is_gst: t.is_gst
        });
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-2'
    },
    {
      label: <FaTrash size={12} />,
      onClick: (t) => setDeleteDialog({ isOpen: true, transaction: t }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-2'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transaction_no || !formData.type || !formData.contact_id || !formData.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const payload = {
      transaction_no: formData.transaction_no,
      type: formData.type,
      contact_id: formData.contact_id,
      amount: Number(formData.amount),
      bank_id: formData.bank_id || null,
      date: formData.date,
      reference: formData.reference,
      remarks: formData.remarks,
      is_gst: formData.is_gst
    };

    try {
      if (isEditModalOpen) {
        await api.put(`/transactions/${selectedTransaction._id}`, payload);
        showToast('Transaction updated successfully', 'success');
      } else {
        await api.post('/transactions', payload);
        showToast('Transaction created successfully', 'success');
      }
      fetchTransactions();
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(INITIAL_FORM);
      setSelectedTransaction(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${deleteDialog.transaction._id}`);
      showToast('Transaction deleted successfully', 'success');
      fetchTransactions();
    } catch (error) {
      showToast('Failed to delete transaction', 'error');
    }
    setDeleteDialog({ isOpen: false, transaction: null });
  };

  const isBankTransaction = formData.type === TRANSACTION_TYPES.BANK_RECEIVED || formData.type === TRANSACTION_TYPES.BANK_PAYMENT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Master</h1>
          <p className="text-gray-600 text-sm">Manage all financial transactions</p>
        </div>
        <Button onClick={() => { setFormData(INITIAL_FORM); setIsAddModalOpen(true); }} className="flex items-center gap-2">
          <FaPlus />Add Transaction
        </Button>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { key: BOOKS.CASH, label: 'Cash Book' },
          { key: BOOKS.AC, label: 'A/C Book' },
          { key: BOOKS.CREDITOR, label: 'Creditor' },
          { key: BOOKS.DEBITOR, label: 'Debitor' }
        ].map(book => (
          <button
            key={book.key}
            onClick={() => setActiveBook(book.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeBook === book.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {book.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        actions={actions}
        searchable={true}
        sortable={true}
        pagination={true}
        loading={loading}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, transaction: null })}
        onConfirm={handleDelete}
        itemName={`Transaction #${deleteDialog.transaction?.transaction_no}`}
      />

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedTransaction(null); }} title="Transaction Details" size="md">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="font-medium">Transaction No:</label><p>{selectedTransaction.transaction_no}</p></div>
              <div><label className="font-medium">Type:</label><p>{selectedTransaction.type.replace(/_/g, ' ').toUpperCase()}</p></div>
              <div><label className="font-medium">Date:</label><p>{new Date(selectedTransaction.date).toLocaleDateString()}</p></div>
              <div><label className="font-medium">Party:</label><p>{parties.find(p => p._id === selectedTransaction.contact_id)?.name || 'N/A'}</p></div>
              <div><label className="font-medium">Amount:</label><p>₹{selectedTransaction.amount?.toFixed(2)}</p></div>
              <div><label className="font-medium">Bank:</label><p>{selectedTransaction.bank_id ? banks.find(b => b._id === selectedTransaction.bank_id)?.bank_name || 'N/A' : 'N/A'}</p></div>
              <div><label className="font-medium">Reference:</label><p>{selectedTransaction.reference || 'N/A'}</p></div>
              <div><label className="font-medium">GST:</label><p>{selectedTransaction.is_gst ? 'Yes' : 'No'}</p></div>
              <div className="col-span-2"><label className="font-medium">Remarks:</label><p>{selectedTransaction.remarks || 'N/A'}</p></div>
            </div>
            <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedTransaction(null); }}>Close</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormData(INITIAL_FORM); }} title={isEditModalOpen ? 'Edit Transaction' : 'Add Transaction'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transaction No *</label>
              <input type="text" name="transaction_no" value={formData.transaction_no} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type *</label>
              <select name="type" value={formData.type} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Type</option>
                {getBookTransactionTypes(activeBook).map(type => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Party *</label>
              <select name="contact_id" value={formData.contact_id} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Party</option>
                {parties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount *</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
            </div>
            {isBankTransaction && (
              <div>
                <label className="block text-sm font-medium mb-1">Bank *</label>
                <select name="bank_id" value={formData.bank_id} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Bank</option>
                  {banks.map(b => <option key={b._id} value={b._id}>{b.bank_name} - {b.account_number}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Reference</label>
              <input type="text" name="reference" value={formData.reference} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" placeholder="Ref/Cheque No" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Transaction</label>
              <select name="is_gst" value={formData.is_gst} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows="2" className="w-full px-3 py-2 border rounded-lg" placeholder="Additional notes" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormData(INITIAL_FORM); }}>Cancel</Button>
            <Button type="submit">{isEditModalOpen ? 'Update' : 'Add'} Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransactionMaster;
