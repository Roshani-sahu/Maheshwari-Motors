import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';

import useStore from '../../store';

import api from '../../services/axiosInstance';

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
  bank_name: '',
  bank_branch: '',
  ifsc_code: '',
  account_number: '',
  transport_charge: '',
  transport_id: '',
  area_id: '',
  agent: ''
};

const PartyMaster = () => {
  const { showToast } = useStore();
  const [parties, setParties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [transports, setTransports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, party: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Extract PAN from GSTIN (characters 3-12)
  const extractPAN = (gstin) => {
    if (!gstin || gstin.length < 15) return '';
    return gstin.substring(2, 12);
  };

  const listFromResponse = (response) => {
    const payload = response?.data?.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  // Fetch parties from backend
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await api.get('/contacts');
        console.log("Parties response:", response);
        const backendParties = listFromResponse(response).map((p) => ({
          id: p._id,
          name: p.name,
          alias: p.alias || '',
          phone: p.phone || '',
          whatsapp_number: p.whatsapp_number || '',
          email: p.email || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          gstin: p.gstin || '',
          contact_type: p.type || 'party',
          is_gst: Number(p.is_gst) === 1 ? 1 : 0,
          category: p.category_id || '',
          cin: p.cin || '',
          reg_number: p.reg_number || '',
          bank_name: p.bank_name || '',
          bank_branch: p.bank_branch || '',
          ifsc_code: p.ifsc_code || '',
          account_number: p.account_number || '',
          transport_charge: p.transport_charge || '',
          transport_id: typeof p.transport_id === 'object' ? (p.transport_id?._id || '') : (p.transport_id || ''),
          area_id: typeof p.area_id === 'object' ? (p.area_id?._id || '') : (p.area_id || ''),
          agent: p.agent_id || ''
        }));
        setParties(backendParties);
      } catch (error) {
        console.error("Failed to fetch parties", error);
        showToast("Failed to load parties", "error");
      }
    };
    fetchParties();
  }, [showToast]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(listFromResponse(response));
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get('/agents');
        setAgents(listFromResponse(response));
      } catch (error) {
        console.error("Failed to fetch agents", error);
      }
    };
    fetchAgents();
  }, []);

  // Fetch transports
  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const response = await api.get('/transports');
        setTransports(listFromResponse(response));
      } catch (error) {
        console.error("Failed to fetch transports", error);
      }
    };
    fetchTransports();
  }, []);

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await api.get('/areas');
        setAreas(listFromResponse(response));
      } catch (error) {
        console.error("Failed to fetch areas", error);
      }
    };
    fetchAreas();
  }, []);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '50px',
      render: (value) => <span className="text-xs sm:text-sm">{value ? value.slice(-4) : ''}</span>
    },
    {
      key: 'name',
      label: 'Party Name',
      width: '180px',
      render: (value) => <span className="text-xs sm:text-sm font-medium truncate">{value}</span>
    },
    {
      key: 'is_gst',
      label: 'Type',
      width: '80px',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 1 ? '1' : '0'}
        </span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '120px',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
    },
    {
      key: 'email',
      label: 'Email',
      width: '160px',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    {
      key: 'gstin',
      label: 'GST No',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value || 'N/A'}</span>,
      width: '130px'
    }
  ];

  const actions = [
    {
      label: <FaEye size={10} className="sm:size-3 md:size-4" />,
      onClick: (party) => {
        setSelectedParty(party);
        setIsViewModalOpen(true);
      },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (party) => {
        setSelectedParty(party);
        setFormData(party);
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (party) => setDeleteDialog({ isOpen: true, party }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize and validate phone strictly to match backend
    let cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(-10);
    }
    
    if (cleanPhone && !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
        showToast('Phone number must be a valid 10-digit Indian number (starts with 6-9)', 'error');
        return;
    }

    const payload = {
       name: formData.name,
       alias: formData.alias || undefined,
       type: 'party',
       is_gst: Number(formData.is_gst) === 1 ? 1 : 0,
       phone: cleanPhone || undefined,
       whatsapp_number: formData.whatsapp_number || undefined,
       email: formData.email || undefined,
       address: formData.address || undefined,
       city: formData.city || undefined,
       state: formData.state || undefined,
       gstin: formData.gstin ? formData.gstin.toUpperCase() : undefined,
       category_id: formData.category || undefined,
       cin: formData.cin || undefined,
       reg_number: formData.reg_number || undefined,
       bank_name: formData.bank_name || undefined,
       bank_branch: formData.bank_branch || undefined,
       ifsc_code: formData.ifsc_code || undefined,
       account_number: formData.account_number || undefined,
       transport_charge: formData.transport_charge || undefined,
       transport_id: formData.transport_id || undefined,
       area_id: formData.area_id || undefined,
       agent_id: formData.agent || undefined
    };

    try {
      if (isEditModalOpen) {
        await api.put(`/contacts/${selectedParty.id}`, payload);
        showToast('Party updated successfully', 'success');
      } else {
        await api.post('/contacts', payload);
        showToast('Party created successfully', 'success');
      }
      
      // Refresh list
      const response = await api.get('/contacts');
      const backendParties = listFromResponse(response).map((p) => ({
        id: p._id,
        name: p.name,
        alias: p.alias || '',
        phone: p.phone || '',
        whatsapp_number: p.whatsapp_number || '',
        email: p.email || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        gstin: p.gstin || '',
        contact_type: p.type || 'party',
        is_gst: Number(p.is_gst) === 1 ? 1 : 0,
        category: p.category_id || '',
        cin: p.cin || '',
        reg_number: p.reg_number || '',
        bank_name: p.bank_name || '',
        bank_branch: p.bank_branch || '',
        ifsc_code: p.ifsc_code || '',
        account_number: p.account_number || '',
        transport_charge: p.transport_charge || '',
        transport_id: typeof p.transport_id === 'object' ? (p.transport_id?._id || '') : (p.transport_id || ''),
        area_id: typeof p.area_id === 'object' ? (p.area_id?._id || '') : (p.area_id || ''),
        agent: p.agent_id || ''
      }));
      setParties(backendParties);
      
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(INITIAL_FORM);
      setSelectedParty(null);
    } catch (error) {
      console.error("Party submit error:", error);
      const msg = error.response?.data?.message || 'Operation failed';
      const details = Array.isArray(error.response?.data?.errors) 
          ? error.response.data.errors.join(', ') 
          : '';
      showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.party) return;
    try {
       await api.delete(`/contacts/${deleteDialog.party.id}`);
       showToast('Party deleted successfully', 'success');
       setParties(parties.filter(p => p.id !== deleteDialog.party.id));
       setDeleteDialog({ isOpen: false, party: null });
    } catch (error) {
       console.error(error);
       const msg = error.response?.data?.message || 'Failed to delete party';
       const details = Array.isArray(error.response?.data?.errors)
         ? error.response.data.errors.join(', ')
         : '';
       showToast(details ? `${msg}: ${details}` : msg, 'error');
    }
  };

  const openAddModal = () => {
    setFormData(INITIAL_FORM);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Party Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">
            Manage customers and suppliers
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <FaPlus className="text-sm sm:text-base" />
          Add Party
        </Button>
      </div>

     

      {/* Parties Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={parties}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          minWidth="750px"
          className="text-xs sm:text-sm"
        />
      </div>

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, party: null })}
        onConfirm={handleDelete}
        itemName={deleteDialog.party?.name}
      />

      {/* View Party Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedParty(null);
        }} 
        title="Party Details" 
        size="lg"
      >
        {selectedParty && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Party Name</label>
                <p className="text-sm text-gray-900">{selectedParty.name}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Alias</label>
                <p className="text-sm text-gray-900">{selectedParty.alias || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm text-gray-900">{selectedParty.phone}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <p className="text-sm text-gray-900">{selectedParty.whatsapp_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{selectedParty.email}</p>
              </div>
              {/* <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-sm text-gray-900">{selectedParty.contact_type || 'party'}</p>
              </div> */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-sm text-gray-900">{selectedParty.is_gst === 1 ? '1' : '0'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Area Mapping</label>
                <p className="text-sm text-gray-900">
                  {areas.find((a) => a._id === selectedParty.area_id)?.city
                    ? `${areas.find((a) => a._id === selectedParty.area_id)?.city} - ${areas.find((a) => a._id === selectedParty.area_id)?.state || ''}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Transport Mapping</label>
                <p className="text-sm text-gray-900">{transports.find((t) => t._id === selectedParty.transport_id)?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Transport Charge</label>
                <p className="text-sm text-gray-900">{selectedParty.transport_charge || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <p className="text-sm text-gray-900">{selectedParty.gstin || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <p className="text-sm text-gray-900 font-mono">{extractPAN(selectedParty.gstin) || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">CIN</label>
                <p className="text-sm text-gray-900">{selectedParty.cin || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reg Number</label>
                <p className="text-sm text-gray-900">{selectedParty.reg_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <p className="text-sm text-gray-900">{selectedParty.bank_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <p className="text-sm text-gray-900">{selectedParty.bank_branch || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <p className="text-sm text-gray-900">{selectedParty.ifsc_code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <p className="text-sm text-gray-900">{selectedParty.account_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900">{categories.find(c => c._id === selectedParty.category)?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Agent</label>
                <p className="text-sm text-gray-900">{agents.find(a => a._id === selectedParty.agent)?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label>
                <p className="text-sm text-gray-900">{selectedParty.city || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">State</label>
                <p className="text-sm text-gray-900">{selectedParty.state || 'N/A'}</p>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
              <p className="text-sm text-gray-900">{selectedParty.address}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedParty(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Party Modal */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedParty(null);
          setFormData(INITIAL_FORM);
        }} 
        title={isEditModalOpen ? 'Edit Party' : 'Add New Party'} 
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter party name" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
            <input type="text" name="alias" value={formData.alias} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter alias (optional)" />
          </div>
          
          <div>
            {/* <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label> */}
            <div className="flex items-center gap-3">
              {/* <span className="text-xs sm:text-sm text-gray-700">Non-GST</span> */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, is_gst: prev.is_gst === 0 ? 1 : 0 }))}
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  formData.is_gst === 1 ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                    formData.is_gst === 1 ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </div>
              {/* <span className="text-xs sm:text-sm text-gray-700">GST</span> */}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="WhatsApp Number" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="contact@example.com" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter complete address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport mapping</label>
              <select name="transport_id" value={formData.transport_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Transport</option>
                {transports.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area mapping</label>
              <select name="area_id" value={formData.area_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Area</option>
                {areas.map((a) => <option key={a._id} value={a._id}>{a.city} - {a.state}</option>)}
              </select>
            </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Charge</label>
              <input type="number" name="transport_charge" value={formData.transport_charge} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input 
                type="text" 
                name="gstin" 
                value={formData.is_gst === 1 ? formData.gstin : ''} 
                onChange={handleInputChange} 
                disabled={formData.is_gst === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
                placeholder="27ABCDE1234F1Z5" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Auto-extracted)</label>
              <input 
                type="text" 
                value={formData.is_gst === 1 ? extractPAN(formData.gstin) || '' : ''} 
                disabled 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono" 
                placeholder="Enter GST to extract PAN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CIN</label>
              <input type="text" name="cin" value={formData.cin} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="CIN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reg Number</label>
              <input type="text" name="reg_number" value={formData.reg_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Registration Number" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Category</option>
              {categories.map(cat => <option className='text-black' key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select name="agent" value={formData.agent} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Agent</option>
              {agents.map(agent => <option key={agent._id} value={agent._id}>{agent.name}</option>)}
            </select>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Bank Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Bank Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <input type="text" name="bank_branch" value={formData.bank_branch} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Branch" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="IFSC Code" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Account Number" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedParty(null);
                setFormData(INITIAL_FORM);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditModalOpen ? 'Update Party' : 'Add Party'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};



                
export default PartyMaster;
