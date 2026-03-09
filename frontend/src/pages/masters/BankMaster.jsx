import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, Input } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const BankMaster = () => {
  const { showToast } = useStore();
  const [banks, setBanks] = useState([]);
  const [filterType, setFilterType] = useState(''); // '' means all
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [viewingBank, setViewingBank] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, bank: null });
  const [formData, setFormData] = useState({
    bank_name: '',
    bank_branch: '',
    ifsc_code: '',
    account_number: '',
    account_holder: '',
    upi_id: '',
    // bank_type stays implicitly "firm" on backend
    is_default: false
  });

  const fetchBanks = async (type = filterType) => {
    try {
      const params = { page: 1, limit: 200 };
      if (type) params.bank_type = type;
      const response = await api.get('/banks', { params });
      const data = response.data?.data?.data || response.data?.data || [];
      setBanks(data.map(b => ({ ...b, id: b._id })));
    } catch (error) {
      showToast('Failed to load banks', 'error');
    }
  };

  useEffect(() => {
    fetchBanks();
  }, [filterType]);

  const columns = [
    { key: 'id', label: 'ID', render: (val, row, index) => <span className="text-xs sm:text-sm">{index + 1}</span> },
    { key: 'bank_type', label: 'Type', render: (val) => <span className="text-xs sm:text-sm">{val ? (val.charAt(0).toUpperCase() + val.slice(1)) : 'Firm'}</span> },
    { key: 'bank_name', label: 'Bank Name', render: (val) => <span className="text-xs sm:text-sm font-medium">{val}</span> },
    { key: 'account_number', label: 'Account Number', render: (val) => <span className="text-xs sm:text-sm">{val}</span> },
    { key: 'ifsc_code', label: 'IFSC Code', render: (val) => <span className="text-xs sm:text-sm">{val || '-'}</span> },
    { key: 'is_default', label: 'Default', render: (val) => <span className={`px-2 py-1 text-xs rounded-full ${val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{val ? 'Yes' : 'No'}</span> }
  ];

  const actions = [
    { label: <FaEye size={10} className="sm:size-3 md:size-4" />, onClick: (bank) => { setViewingBank(bank); setIsViewModalOpen(true); }, className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs' },
    { label: <FaEdit size={10} className="sm:size-3 md:size-4" />, onClick: (bank) => { setEditingBank(bank); setFormData(bank); setIsEditModalOpen(true); }, className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs' },
    { label: <FaTrash size={10} className="sm:size-3 md:size-4" />, onClick: (bank) => setDeleteDialog({ isOpen: true, bank }), className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank_name || !formData.account_number) {
      showToast('Bank name and account number are required', 'error');
      return;
    }

    try {
      if (isEditModalOpen) {
        await api.put(`/banks/${editingBank.id}`, formData);
        showToast('Bank updated successfully', 'success');
      } else {
        await api.post('/banks', formData);
        showToast('Bank added successfully', 'success');
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData({ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '', account_holder: '', upi_id: '', is_default: false });
      fetchBanks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/banks/${deleteDialog.bank.id}`);
      showToast('Bank deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, bank: null });
      fetchBanks();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete bank', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bank Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage bank accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm"
          >
            <option value="">All Banks</option>
            <option value="firm">Firm Bank</option>
            <option value="party">Party Bank</option>
            <option value="supplier">Supplier Bank</option>
          </select>
          <Button onClick={() => { setFormData({ bank_name: '', bank_branch: '', ifsc_code: '', account_number: '', account_holder: '', upi_id: '', is_default: false }); setIsAddModalOpen(true); }} className="flex items-center gap-2 text-xs sm:text-sm">
            <FaPlus className="text-sm sm:text-base" />Add Bank
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={banks} actions={actions} searchable sortable pagination />

      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} title={isEditModalOpen ? 'Edit Bank' : 'Add Bank'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
            <Input value={formData.bank_name} onChange={(v) => setFormData({ ...formData, bank_name: v })} placeholder="Enter bank name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
            <Input value={formData.bank_branch} onChange={(v) => setFormData({ ...formData, bank_branch: v })} placeholder="Enter branch name" />
          </div>
          {/* bank_type removed from form; backend will assign default 'firm' */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
            <Input value={formData.ifsc_code} onChange={(v) => setFormData({ ...formData, ifsc_code: v })} placeholder="Enter IFSC code" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
            <Input value={formData.account_number} onChange={(v) => setFormData({ ...formData, account_number: v })} placeholder="Enter account number" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
            <Input value={formData.account_holder} onChange={(v) => setFormData({ ...formData, account_holder: v })} placeholder="Enter account holder name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
            <Input value={formData.upi_id} onChange={(v) => setFormData({ ...formData, upi_id: v })} placeholder="Enter UPI ID" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} className="rounded" />
            <label className="text-sm text-gray-700">Set as default bank</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit">{isEditModalOpen ? 'Update' : 'Add'} Bank</Button>
            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, bank: null })} onConfirm={handleDelete} itemName={deleteDialog.bank?.bank_name} />

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setViewingBank(null); }} title="Bank Details" size="md">
        {viewingBank && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Bank Name</label>
                <p className="text-sm font-medium text-gray-900">{viewingBank.bank_name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Bank Type</label>
                <p className="text-sm text-gray-900">{viewingBank.bank_type ? viewingBank.bank_type.charAt(0).toUpperCase()+viewingBank.bank_type.slice(1) : 'Firm'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Bank Branch</label>
                <p className="text-sm text-gray-900">{viewingBank.bank_branch || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">IFSC Code</label>
                <p className="text-sm text-gray-900">{viewingBank.ifsc_code || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Account Number</label>
                <p className="text-sm text-gray-900">{viewingBank.account_number}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Account Holder</label>
                <p className="text-sm text-gray-900">{viewingBank.account_holder || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">UPI ID</label>
                <p className="text-sm text-gray-900">{viewingBank.upi_id || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Default Bank</label>
                <p className="text-sm text-gray-900">{viewingBank.is_default ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setViewingBank(null); }}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BankMaster;
