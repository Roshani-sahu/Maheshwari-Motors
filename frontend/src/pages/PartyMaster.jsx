import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../components/common';
import { Button } from '../components/ui';

const PartyMaster = () => {
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
    gstNo: ''
  });

  // Initialize with sample data
  useEffect(() => {
    setParties([
      {
        id: 1,
        name: 'ABC Motors Pvt Ltd',
      
        phone: '+91 98765 43210',
        email: 'contact@abcmotors.com',
        address: 'Mumbai, Maharashtra',
        gstNo: '27ABCDE1234F1Z5'
      },
      {
        id: 2,
        name: 'XYZ Auto Parts',
       
        phone: '+91 87654 32109',
        email: 'info@xyzauto.com',
        address: 'Delhi, India',
        gstNo: '07XYZAB5678G2Y4'
      }
    ]);
  }, []);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '50px',
      render: (value) => <span className="text-xs sm:text-sm">{value}</span>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditModalOpen) {
      setParties(parties.map(party => 
        party.id === selectedParty.id ? { ...formData, id: selectedParty.id } : party
      ));
      setIsEditModalOpen(false);
    } else {
      const newParty = {
        id: parties.length + 1,
        ...formData
      };
      setParties([...parties, newParty]);
      setIsAddModalOpen(false);
    }
    setFormData({ name: '', phone: '', email: '', address: '', gstNo: '' });
    setSelectedParty(null);
  };

  const handleDelete = () => {
    setParties(parties.filter(party => party.id !== deleteDialog.party.id));
    setDeleteDialog({ isOpen: false, party: null });
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', address: '', gstNo: '' });
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
          setFormData({ name: '', phone: '', email: '', address: '', gstNo: '' });
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
                setFormData({ name: '', phone: '', email: '', address: '', gstNo: '' });
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