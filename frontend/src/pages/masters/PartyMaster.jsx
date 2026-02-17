import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';

import useStore from '../../store';
import { accountAPI } from '../../services/api';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const PartyMaster = () => {
  const { showToast } = useStore(); // Added hook usage
  const [parties, setParties] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, party: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstNo: ''
  });

  // Fetch parties from backend
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const response = await accountAPI.getAll();
        console.log("Parties response:", response);
        const backendParties = (response.data?.data?.data || []).map(p => ({
          id: p._id,
          name: p.name,
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          gstNo: p.gstin || ''
        }));
        setParties(backendParties);
      } catch (error) {
        console.error("Failed to fetch parties", error);
        showToast("Failed to load parties", "error");
      }
    };
    fetchParties();
  }, [showToast]);

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
      key: 'gstNo',
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
       phone: cleanPhone || undefined,
       email: formData.email || undefined,
       address: formData.address || undefined,
       city: formData.city || undefined,
       state: formData.state || undefined,
       gstin: formData.gstNo ? formData.gstNo.toUpperCase() : undefined
    };

    try {
      if (isEditModalOpen) {
        await accountAPI.update(selectedParty.id, payload);
        showToast('Party updated successfully', 'success');
      } else {
        await accountAPI.create(payload);
        showToast('Party created successfully', 'success');
      }
      
      // Refresh list
      const response = await accountAPI.getAll();
      const backendParties = (response.data?.data?.data || []).map(p => ({
        id: p._id,
        name: p.name,
        phone: p.phone || '',
        email: p.email || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        gstNo: p.gstin || ''
      }));
      setParties(backendParties);
      
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstNo: '' });
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
       await accountAPI.delete(deleteDialog.party.id);
       showToast('Party deleted successfully', 'success');
       setParties(parties.filter(p => p.id !== deleteDialog.party.id));
       setDeleteDialog({ isOpen: false, party: null });
    } catch (error) {
       console.error(error);
       showToast('Failed to delete party', 'error');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstNo: '' });
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
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm text-gray-900">{selectedParty.phone}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{selectedParty.email}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <p className="text-sm text-gray-900">{selectedParty.gstNo || 'N/A'}</p>
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
          setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstNo: '' });
        }} 
        title={isEditModalOpen ? 'Edit Party' : 'Add New Party'} 
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter party name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter complete address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  type="text"
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                   <option value="">Select State</option>
                   {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number
            </label>
            <input
              type="text"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="27ABCDE1234F1Z5"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedParty(null);
                setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '', gstNo: '' });
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