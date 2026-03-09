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
  is_gst: 0,
  cin: '',
  reg_number: '',
  bank_id: '',
  transport_charge: '',
  transport_id: '',
  area_id: '',
  agent: '',
  label_id: ''
};

const PartyMaster = () => {
  const { showToast } = useStore();
  const [parties, setParties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [transports, setTransports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [banks, setBanks] = useState([]);
  const [labels, setLabels] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, party: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [validationModal, setValidationModal] = useState({ isOpen: false, errors: [] });

  // Extract PAN from GSTIN (characters 3-12)
  const extractPAN = (gstin) => {
    if (!gstin || gstin.length < 15) return '';
    return gstin.substring(2, 12);
  };

  const mapParty = (contact) => {
    const normalized = normalizeContact(contact);
    const bankId = typeof contact.bank_id === 'object' ? getEntityId(contact.bank_id) : contact.bank_id;
    const labelId = getEntityId(contact.label_id);
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
      contact_type: normalized.type || 'party',
      is_gst: normalized.is_gst,
      category: normalized.category_id,
      cin: normalized.cin,
      reg_number: normalized.reg_number,
      bank_id: bankId,
      bank_details: typeof contact.bank_id === 'object' ? contact.bank_id : null,
      transport_charge: normalized.transport_charge,
      transport_id: normalized.transport_id,
      area_id: normalized.area_id,
      agent: normalized.agent_id,
      label_id: labelId
    };
  };

  // Fetch parties from backend
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await api.get('/contacts/parties', { params: { page: 1, limit: 200 } });
        console.log('Party data:', getResponseList(response));
        setParties(getResponseList(response).map(mapParty));
      } catch (error) {
        console.error("Failed to fetch parties", error);
        showToast("Failed to load parties", "error");
      }
    };
    fetchParties();
  }, [showToast]);

  // Fetch categories and labels
  useEffect(() => {
    const fetchCategoriesAndLabels = async () => {
      try {
        const [catRes, labelRes] = await Promise.all([
          api.get('/categories'),
          api.get('/labels', { params: { page: 1, limit: 200 } })
        ]);
        
        const cats = getResponseList(catRes);
        setCategories(cats);
        
        const labelsData = getResponseList(labelRes).map(label => ({
          _id: getEntityId(label),
          name: label.name || label.label_name,
          category_id: getEntityId(label.category_id)
        }));
        setLabels(labelsData);
      } catch (error) {
        console.error("Failed to fetch categories/labels", error);
      }
    };
    fetchCategoriesAndLabels();
  }, []);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get('/agents');
        setAgents(getResponseList(response));
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
        setTransports(getResponseList(response));
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
        setAreas(getResponseList(response));
      } catch (error) {
        console.error("Failed to fetch areas", error);
      }
    };
    fetchAreas();
  }, []);

  // Fetch banks
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
    {
      key: 'id',
      label: 'ID',
      width: '50px',
      render: (value, row, index) => <span className="text-xs sm:text-sm">{index + 1}</span>
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
        setFormData({
          name: party.name || '',
          alias: party.alias || '',
          phone: party.phone || '',
          whatsapp_number: party.whatsapp_number || '',
          email: party.email || '',
          address: party.address || '',
          city: party.city || '',
          state: party.state || '',
          gstin: party.gstin || '',
          is_gst: party.is_gst || 0,
          cin: party.cin || '',
          reg_number: party.reg_number || '',
          bank_id: party.bank_id || '',
          transport_charge: party.transport_charge || '',
          transport_id: party.transport_id || '',
          area_id: party.area_id || '',
          agent: party.agent || '',
          label_id: party.label_id || ''
        });
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
    
    const errors = [];
    if (!formData.name?.trim()) errors.push('Party Name is required');
    if (!formData.phone?.trim()) errors.push('Phone Number is required');
    if (!formData.email?.trim()) errors.push('Email is required');
    if (!formData.address?.trim()) errors.push('Address is required');
    if (!formData.city?.trim()) errors.push('City is required');
    if (!formData.state?.trim()) errors.push('State is required');
    // category is optional now, no validation check
    if (!formData.transport_id) errors.push('Transport is required');
    if (!formData.area_id) errors.push('Area is required');
    // agent is optional per user request (was previously required)
    
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

    const payload = {
      name: formData.name,
      type: 'party',
      is_gst: Number(formData.is_gst) === 1 ? 1 : 0
    };
    if (formData.alias) payload.alias = formData.alias;
    if (cleanPhone) payload.phone = cleanPhone;
    if (formData.whatsapp_number) payload.whatsapp_number = formData.whatsapp_number;
    if (formData.email) payload.email = formData.email;
    if (formData.address) payload.address = formData.address;
    if (formData.city) payload.city = formData.city;
    if (formData.state) payload.state = formData.state;
    if (formData.gstin) payload.gstin = formData.gstin.toUpperCase();
    if (formData.cin) payload.cin = formData.cin;
    if (formData.reg_number) payload.reg_number = formData.reg_number;
    if (formData.bank_id) payload.bank_id = formData.bank_id;
    if (formData.transport_charge) payload.transport_charge = formData.transport_charge;
    else payload.transport_charge = 0;
    if (formData.transport_id) payload.transport_id = formData.transport_id;
    if (formData.area_id) payload.area_id = formData.area_id;
    if (formData.agent) payload.agent_id = formData.agent;
    if (formData.label_id && formData.label_id !== '') payload.label_id = formData.label_id;

    console.log('Submitting payload:', payload);

    try {
      if (isEditModalOpen) {
        console.log('Editing party:', selectedParty.id);
        await api.put(`/contacts/${selectedParty.id}`, payload);
        showToast('Party updated successfully', 'success');
      } else {
        console.log('Creating new party');
        await api.post('/contacts', payload);
        showToast('Party created successfully', 'success');
      }
      
      // Refresh list
      const response = await api.get('/contacts/parties', { params: { page: 1, limit: 200 } });
      setParties(getResponseList(response).map(mapParty));
      
      // after a successful save we reset form; when adding we keep the modal open so user can add more
      setFormData(INITIAL_FORM);
      setSelectedParty(null);
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }
      // do not automatically close add modal to allow consecutive entries
    } catch (error) {
      console.error("Party submit error:", error);
      console.error("Error response:", error.response?.data);
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Debitors ( Saler) Master</h1>
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
                  {areas.find((a) => getEntityId(a) === selectedParty.area_id)?.city
                    ? `${areas.find((a) => getEntityId(a) === selectedParty.area_id)?.city} - ${areas.find((a) => getEntityId(a) === selectedParty.area_id)?.state || ''}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Transport Mapping</label>
                <p className="text-sm text-gray-900">{transports.find((t) => getEntityId(t) === selectedParty.transport_id)?.name || 'N/A'}</p>
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
                <p className="text-sm text-gray-900">{selectedParty.bank_details?.bank_name || banks.find(b => getEntityId(b) === selectedParty.bank_id)?.bank_name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <p className="text-sm text-gray-900">{selectedParty.bank_details?.bank_branch || banks.find(b => getEntityId(b) === selectedParty.bank_id)?.bank_branch || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <p className="text-sm text-gray-900">{selectedParty.bank_details?.ifsc_code || banks.find(b => getEntityId(b) === selectedParty.bank_id)?.ifsc_code || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <p className="text-sm text-gray-900">{selectedParty.bank_details?.account_number || banks.find(b => getEntityId(b) === selectedParty.bank_id)?.account_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900">{categories.find(c => getEntityId(c) === selectedParty.category)?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Agent</label>
                <p className="text-sm text-gray-900">{agents.find(a => getEntityId(a) === selectedParty.agent)?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Label</label>
                <p className="text-sm text-gray-900">{labels.find(l => l._id === selectedParty.label_id)?.name || 'N/A'}</p>
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

      {/* Validation Error Modal */}
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

                  <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter party name" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
            <input type="text" name="alias" value={formData.alias} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter alias (optional)" />
          </div>
          
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
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input 
                type="text" 
                name="gstin" 
                value={formData.gstin} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="27ABCDE1234F1Z5" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (Auto-extracted)</label>
              <input 
                type="text" 
                value={extractPAN(formData.gstin) || ''} 
                disabled 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono" 
                placeholder="Enter GST to extract PAN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="WhatsApp Number" />
            </div>
          </div>
          

                  <div className="grid grid-cols-2 gap-4">


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="contact@example.com" />
          </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Charge</label>
              <input type="number" name="transport_charge" value={formData.transport_charge} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter complete address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* optional category field */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Category</option>
                {categories.length === 0 && <option disabled>No categories available</option>}
                {categories.map((cat) => <option key={getEntityId(cat)} value={getEntityId(cat)}>{cat.name || cat.category_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport mapping *</label>
              <select name="transport_id" value={formData.transport_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Transport</option>
                {transports.map((t) => <option key={getEntityId(t)} value={getEntityId(t)}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area mapping *</label>
              <select name="area_id" value={formData.area_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Area</option>
                {areas.map((a) => <option key={getEntityId(a)} value={getEntityId(a)}>{a.city} - {a.state}</option>)}
              </select>
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


        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <select 
              name="label_id" 
              value={formData.label_id} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Label</option>
              {labels.length === 0 && <option disabled>No labels available</option>}
              {labels.map((label, index) => <option key={`${label._id}-${index}`} value={label._id}>{label.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label> {/* optional field now */}
            <select name="agent" value={formData.agent} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Agent</option>
              {agents.length === 0 && <option disabled>No agents available</option>}
              {agents.map(agent => <option key={getEntityId(agent)} value={getEntityId(agent)}>{agent.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select name="bank_id" value={formData.bank_id} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Bank</option>
              {banks.map(bank => <option key={getEntityId(bank)} value={getEntityId(bank)}>{bank.bank_name} - {bank.account_number}</option>)}
            </select>
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
