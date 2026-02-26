import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';
import { getResponseList, getEntityId, normalizeContact } from '../../services/apiUtils';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const INITIAL_FORM = {
  name: '',
  alias: '',
  phone: '',
  whatsapp_number: '',
  email: '',
  address: '',
  city: '',
  state: '',
  gstin: '',
  category: '',
  is_gst: 0,
  cin: '',
  reg_number: '',
  bank_id: '',
  signature: null
};

const AddSupplier = () => {
  const { showToast } = useStore();
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, supplier: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [validationModal, setValidationModal] = useState({ isOpen: false, errors: [] });
  const [signatureFile, setSignatureFile] = useState(null);

  const extractPAN = (gstin) => {
    if (!gstin || gstin.length < 15) return '';
    return gstin.substring(2, 12);
  };

  const mapSupplier = (contact) => {
    const normalized = normalizeContact(contact);
    const bankId = typeof contact.bank_id === 'object' ? getEntityId(contact.bank_id) : contact.bank_id;
    return {
      id: normalized.id,
      name: normalized.name,
      alias: normalized.alias,
      phone: normalized.phone,
      whatsapp_number: normalized.whatsapp_number,
      email: normalized.email,
      address: normalized.address,
      city: normalized.city,
      state: normalized.state,
      gstin: normalized.gstin,
      is_gst: normalized.is_gst,
      category: normalized.category_id,
      cin: normalized.cin,
      reg_number: normalized.reg_number,
      bank_id: bankId,
      bank_details: typeof contact.bank_id === 'object' ? contact.bank_id : null,
      signature: contact.signature
    };
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get('/contacts/suppliers', { params: { page: 1, limit: 200 } });
        setSuppliers(getResponseList(response).map(mapSupplier));
      } catch {
        showToast("Failed to load suppliers", "error");
      }
    };
    fetchSuppliers();
  }, [showToast]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(getResponseList(response));
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await api.get('/banks');
        setBanks(getResponseList(response));
      } catch (error) {
        console.error("Failed to fetch banks", error);
      }
    };
    fetchBanks();
  }, []);

  const columns = [
    { key: 'id', label: 'ID', width: '50px', render: (value, row, index) => <span className="text-xs sm:text-sm">{index + 1}</span> },
    { key: 'name', label: 'Supplier Name', width: '180px', render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span> },
    { key: 'is_gst', label: 'Type', width: '80px', render: (value) => <span className={`px-2 py-1 text-xs rounded-full ${value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{value === 1 ? '1' : '0'}</span> },
    { key: 'phone', label: 'Phone', width: '120px', render: (value) => <span className="text-xs sm:text-sm">{value}</span> },
    { key: 'email', label: 'Email', width: '160px', render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span> },
    { key: 'gstin', label: 'GST No', render: (value) => <span className="text-xs sm:text-sm truncate">{value || 'N/A'}</span>, width: '130px' }
  ];

  const actions = [
    { label: <FaEye size={10} className="sm:size-3 md:size-4" />, onClick: (supplier) => { setSelectedSupplier(supplier); setIsViewModalOpen(true); }, className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs' },
    { label: <FaEdit size={10} className="sm:size-3 md:size-4" />, onClick: (supplier) => { setSelectedSupplier(supplier); setFormData(supplier); setIsEditModalOpen(true); }, className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs' },
    { label: <FaTrash size={10} className="sm:size-3 md:size-4" />, onClick: (supplier) => setDeleteDialog({ isOpen: true, supplier }), className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs' }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    setSignatureFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = [];
    if (!formData.name?.trim()) errors.push('Supplier Name is required');
    if (!formData.phone?.trim()) errors.push('Phone Number is required');
    if (!formData.email?.trim()) errors.push('Email is required');
    if (!formData.address?.trim()) errors.push('Address is required');
    if (!formData.city?.trim()) errors.push('City is required');
    if (!formData.state?.trim()) errors.push('State is required');
    if (!formData.category) errors.push('Category is required');
    
    let cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
    if (cleanPhone && !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      errors.push('Phone number must be a valid 10-digit Indian number (starts with 6-9)');
    }
    
    if (errors.length > 0) {
      setValidationModal({ isOpen: true, errors });
      showToast('Please fill all required fields', 'error');
      return;
    }

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('type', 'supplier');
    payload.append('is_gst', Number(formData.is_gst) === 1 ? 1 : 0);
    if (formData.alias) payload.append('alias', formData.alias);
    if (cleanPhone) payload.append('phone', cleanPhone);
    if (formData.whatsapp_number) payload.append('whatsapp_number', formData.whatsapp_number);
    if (formData.email) payload.append('email', formData.email);
    if (formData.address) payload.append('address', formData.address);
    if (formData.city) payload.append('city', formData.city);
    if (formData.state) payload.append('state', formData.state);
    if (formData.gstin) payload.append('gstin', formData.gstin.toUpperCase());
    if (formData.category) payload.append('category_id', formData.category);
    if (formData.cin) payload.append('cin', formData.cin);
    if (formData.reg_number) payload.append('reg_number', formData.reg_number);
    if (formData.bank_id) payload.append('bank_id', formData.bank_id);
    if (signatureFile) payload.append('signature', signatureFile);

    try {
      if (isEditModalOpen) {
        const jsonPayload = {
          name: formData.name,
          type: 'supplier',
          is_gst: Number(formData.is_gst) === 1 ? 1 : 0
        };
        if (formData.alias) jsonPayload.alias = formData.alias;
        if (cleanPhone) jsonPayload.phone = cleanPhone;
        if (formData.whatsapp_number) jsonPayload.whatsapp_number = formData.whatsapp_number;
        if (formData.email) jsonPayload.email = formData.email;
        if (formData.address) jsonPayload.address = formData.address;
        if (formData.city) jsonPayload.city = formData.city;
        if (formData.state) jsonPayload.state = formData.state;
        if (formData.gstin) jsonPayload.gstin = formData.gstin.toUpperCase();
        if (formData.category) jsonPayload.category_id = formData.category;
        if (formData.cin) jsonPayload.cin = formData.cin;
        if (formData.reg_number) jsonPayload.reg_number = formData.reg_number;
        if (formData.bank_id) jsonPayload.bank_id = formData.bank_id;
        await api.put(`/contacts/${selectedSupplier.id}`, jsonPayload);
        showToast('Supplier updated successfully', 'success');
      } else {
        await api.post('/contacts', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Supplier created successfully', 'success');
      }
      
      const response = await api.get('/contacts/suppliers', { params: { page: 1, limit: 200 } });
      setSuppliers(getResponseList(response).map(mapSupplier));
      
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(INITIAL_FORM);
      setSelectedSupplier(null);
      setSignatureFile(null);
    } catch (error) {
      const msg = error.response?.data?.message || 'Operation failed';
      const details = Array.isArray(error.response?.data?.errors) ? error.response.data.errors.join(', ') : '';
      showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.supplier) return;
    try {
      await api.delete(`/contacts/${deleteDialog.supplier.id}`);
      showToast('Supplier deleted successfully', 'success');
      setSuppliers(suppliers.filter(s => s.id !== deleteDialog.supplier.id));
      setDeleteDialog({ isOpen: false, supplier: null });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete supplier';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Supplier Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage suppliers</p>
        </div>
        <Button onClick={() => { setFormData(INITIAL_FORM); setIsAddModalOpen(true); }} className="flex items-center gap-2 text-xs sm:text-sm">
          <FaPlus className="text-sm sm:text-base" />Add Supplier
        </Button>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable columns={columns} data={suppliers} actions={actions} searchable sortable pagination minWidth="750px" className="text-xs sm:text-sm" />
      </div>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, supplier: null })} onConfirm={handleDelete} itemName={deleteDialog.supplier?.name} />

      <div className={validationModal.isOpen ? 'relative z-[9999]' : ''}>
        <Modal
          isOpen={validationModal.isOpen}
          onClose={() => setValidationModal({ isOpen: false, errors: [] })}
          title="Validation Failed"
          size="sm"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
              <ul className="list-disc list-inside space-y-1">
                {validationModal.errors.map((error, index) => (
                  <li key={index} className="text-red-700 text-sm">{error}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setValidationModal({ isOpen: false, errors: [] })}>
                OK
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedSupplier(null); }} title="Supplier Details" size="lg">
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Supplier Name</label><p className="text-sm text-gray-900">{selectedSupplier.name}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Alias</label><p className="text-sm text-gray-900">{selectedSupplier.alias || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label><p className="text-sm text-gray-900">{selectedSupplier.phone}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label><p className="text-sm text-gray-900">{selectedSupplier.whatsapp_number || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label><p className="text-sm text-gray-900">{selectedSupplier.email}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label><p className="text-sm text-gray-900">{selectedSupplier.is_gst === 1 ? '1' : '0'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label><p className="text-sm text-gray-900">{selectedSupplier.gstin || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PAN Number</label><p className="text-sm text-gray-900 font-mono">{extractPAN(selectedSupplier.gstin) || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">CIN</label><p className="text-sm text-gray-900">{selectedSupplier.cin || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reg Number</label><p className="text-sm text-gray-900">{selectedSupplier.reg_number || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label><p className="text-sm text-gray-900">{selectedSupplier.bank_details?.bank_name || banks.find(b => getEntityId(b) === selectedSupplier.bank_id)?.bank_name || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Branch</label><p className="text-sm text-gray-900">{selectedSupplier.bank_details?.bank_branch || banks.find(b => getEntityId(b) === selectedSupplier.bank_id)?.bank_branch || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label><p className="text-sm text-gray-900">{selectedSupplier.bank_details?.ifsc_code || banks.find(b => getEntityId(b) === selectedSupplier.bank_id)?.ifsc_code || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label><p className="text-sm text-gray-900">{selectedSupplier.bank_details?.account_number || banks.find(b => getEntityId(b) === selectedSupplier.bank_id)?.account_number || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label><p className="text-sm text-gray-900">{categories.find(c => getEntityId(c) === selectedSupplier.category)?.name || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label><p className="text-sm text-gray-900">{selectedSupplier.city || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label><p className="text-sm text-gray-900">{selectedSupplier.state || 'N/A'}</p></div>
            </div>
            <div className="md:col-span-2"><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label><p className="text-sm text-gray-900">{selectedSupplier.address}</p></div>
            {selectedSupplier.signature && (
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Signature</label>
                <img src={selectedSupplier.signature} alt="Signature" className="w-32 h-16 object-contain border rounded" />
              </div>
            )}
            <div className="flex gap-3 pt-4"><Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedSupplier(null); }}>Close</Button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedSupplier(null); setFormData(INITIAL_FORM); }} title={isEditModalOpen ? 'Edit Supplier' : 'Add New Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter supplier name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Alias</label><input type="text" name="alias" value={formData.alias} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter alias (optional)" /></div>
          <div><div className="flex items-center gap-3"><div onClick={() => setFormData((prev) => ({ ...prev, is_gst: prev.is_gst === 0 ? 1 : 0 }))} className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${formData.is_gst === 1 ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${formData.is_gst === 1 ? 'translate-x-7' : 'translate-x-0'}`} /></div></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label><input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="WhatsApp Number" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="contact@example.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address *</label><textarea name="address" value={formData.address} onChange={handleInputChange} required rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter complete address" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="City" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State *</label><select name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select State</option>{INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label><input type="text" name="gstin" value={formData.is_gst === 1 ? formData.gstin : ''} onChange={handleInputChange} disabled={formData.is_gst === 0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="27ABCDE1234F1Z5" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Auto-extracted)</label><input type="text" value={formData.is_gst === 1 ? extractPAN(formData.gstin) || '' : ''} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono" placeholder="Enter GST to extract PAN" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">CIN</label><input type="text" name="cin" value={formData.cin} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="CIN" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reg Number</label><input type="text" name="reg_number" value={formData.reg_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Registration Number" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select Category</option>{categories.map(cat => <option className='text-black' key={getEntityId(cat)} value={getEntityId(cat)}>{cat.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank</label><select name="bank_id" value={formData.bank_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select Bank</option>{banks.map(bank => <option key={getEntityId(bank)} value={getEntityId(bank)}>{bank.bank_name} - {bank.account_number}</option>)}</select></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureChange}
              className="w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-1.5 file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedSupplier(null); setFormData(INITIAL_FORM); }}>Cancel</Button>
            <Button type="submit">{isEditModalOpen ? 'Update Supplier' : 'Add Supplier'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddSupplier;
