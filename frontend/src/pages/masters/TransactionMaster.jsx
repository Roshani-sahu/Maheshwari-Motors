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
  type: '',
  party_id: '',
  amount: '',
  bank_id: '',
  date: new Date().toISOString().split('T')[0],
  reference: '',
  remarks: ''
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

  // Dummy data
  const DUMMY_PARTIES = [
    { _id: '1', name: 'ABC Motors Pvt Ltd' },
    { _id: '2', name: 'XYZ Auto Parts' },
    { _id: '3', name: 'Sharma Traders' },
    { _id: '4', name: 'Kumar Enterprises' },
    { _id: '5', name: 'Singh Auto Works' }
  ];

  const DUMMY_BANKS = [
    { _id: 'b1', bank_name: 'HDFC Bank', account_number: '1234567890' },
    { _id: 'b2', bank_name: 'ICICI Bank', account_number: '9876543210' },
    { _id: 'b3', bank_name: 'SBI', account_number: '5555666677' },
    { _id: 'b4', bank_name: 'Axis Bank', account_number: '8888999900' }
  ];

  const DUMMY_TRANSACTIONS = [
    {
      id: 't1',
      type: TRANSACTION_TYPES.CASH_RECEIVED,
      party: 'ABC Motors Pvt Ltd',
      party_id: '1',
      amount: 25000,
      bank: 'N/A',
      bank_id: null,
      date: '2024-02-20',
      reference: 'CR001',
      remarks: 'Payment received for invoice #INV001'
    },
    {
      id: 't2',
      type: TRANSACTION_TYPES.BANK_RECEIVED,
      party: 'XYZ Auto Parts',
      party_id: '2',
      amount: 50000,
      bank: 'HDFC Bank',
      bank_id: 'b1',
      date: '2024-02-21',
      reference: 'CHQ12345',
      remarks: 'Cheque payment received'
    },
    {
      id: 't3',
      type: TRANSACTION_TYPES.CASH_PAYMENT,
      party: 'Sharma Traders',
      party_id: '3',
      amount: 15000,
      bank: 'N/A',
      bank_id: null,
      date: '2024-02-22',
      reference: 'CP001',
      remarks: 'Cash payment for supplies'
    },
    {
      id: 't4',
      type: TRANSACTION_TYPES.BANK_PAYMENT,
      party: 'Kumar Enterprises',
      party_id: '4',
      amount: 75000,
      bank: 'ICICI Bank',
      bank_id: 'b2',
      date: '2024-02-23',
      reference: 'NEFT789',
      remarks: 'NEFT transfer for purchase'
    },
    {
      id: 't5',
      type: TRANSACTION_TYPES.CASH_RECEIVED,
      party: 'Singh Auto Works',
      party_id: '5',
      amount: 30000,
      bank: 'N/A',
      bank_id: null,
      date: '2024-02-24',
      reference: 'CR002',
      remarks: 'Cash received against bill'
    },
    {
      id: 't6',
      type: TRANSACTION_TYPES.BANK_RECEIVED,
      party: 'ABC Motors Pvt Ltd',
      party_id: '1',
      amount: 100000,
      bank: 'SBI',
      bank_id: 'b3',
      date: '2024-02-25',
      reference: 'RTGS456',
      remarks: 'RTGS payment received'
    }
  ];

  const getResponseList = (res) => {
    const data = res?.data?.data;
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  };

  useEffect(() => {
    // Use dummy data instead of API calls
    setParties(DUMMY_PARTIES);
    setBanks(DUMMY_BANKS);
    filterTransactionsByBook();
  }, [activeBook]);

  const filterTransactionsByBook = () => {
    const bookTypes = getBookTransactionTypes(activeBook);
    const filtered = DUMMY_TRANSACTIONS.filter(t => bookTypes.includes(t.type));
    setTransactions(filtered);
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
    { key: 'date', label: 'Date', width: '100px', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'type', label: 'Type', width: '120px', render: (v) => v.replace(/_/g, ' ').toUpperCase() },
    { key: 'party', label: 'Party', width: '150px' },
    { key: 'amount', label: 'Amount', width: '100px', render: (v) => `₹${v?.toFixed(2)}` },
    { key: 'bank', label: 'Bank', width: '120px' },
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
          type: t.type,
          party_id: t.party_id,
          amount: t.amount,
          bank_id: t.bank_id || '',
          date: t.date?.split('T')[0],
          reference: t.reference || '',
          remarks: t.remarks || ''
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
    if (!formData.type || !formData.party_id || !formData.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const party = parties.find(p => p._id === formData.party_id);
    const bank = banks.find(b => b._id === formData.bank_id);

    const newTransaction = {
      id: 't' + Date.now(),
      type: formData.type,
      party: party?.name || 'N/A',
      party_id: formData.party_id,
      amount: Number(formData.amount),
      bank: bank?.bank_name || 'N/A',
      bank_id: formData.bank_id || null,
      date: formData.date,
      reference: formData.reference,
      remarks: formData.remarks
    };

    if (isEditModalOpen) {
      DUMMY_TRANSACTIONS.splice(
        DUMMY_TRANSACTIONS.findIndex(t => t.id === selectedTransaction.id),
        1,
        newTransaction
      );
      showToast('Transaction updated successfully', 'success');
    } else {
      DUMMY_TRANSACTIONS.push(newTransaction);
      showToast('Transaction created successfully', 'success');
    }

    filterTransactionsByBook();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setFormData(INITIAL_FORM);
    setSelectedTransaction(null);
  };

  const handleDelete = async () => {
    const index = DUMMY_TRANSACTIONS.findIndex(t => t.id === deleteDialog.transaction.id);
    if (index > -1) {
      DUMMY_TRANSACTIONS.splice(index, 1);
      showToast('Transaction deleted successfully', 'success');
      filterTransactionsByBook();
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
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, transaction: null })}
        onConfirm={handleDelete}
        itemName={`Transaction #${deleteDialog.transaction?.id}`}
      />

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedTransaction(null); }} title="Transaction Details" size="md">
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="font-medium">Type:</label><p>{selectedTransaction.type.replace(/_/g, ' ').toUpperCase()}</p></div>
              <div><label className="font-medium">Date:</label><p>{new Date(selectedTransaction.date).toLocaleDateString()}</p></div>
              <div><label className="font-medium">Party:</label><p>{selectedTransaction.party}</p></div>
              <div><label className="font-medium">Amount:</label><p>₹{selectedTransaction.amount?.toFixed(2)}</p></div>
              <div><label className="font-medium">Bank:</label><p>{selectedTransaction.bank}</p></div>
              <div><label className="font-medium">Reference:</label><p>{selectedTransaction.reference || 'N/A'}</p></div>
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
              <select name="party_id" value={formData.party_id} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg">
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
