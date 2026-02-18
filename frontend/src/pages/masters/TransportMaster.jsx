import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';

const STATIC_TRANSPORTS = [
  { _id: '1', name: 'Fast Logistics', address: '45 Transport Nagar', city: 'Mumbai', pincode: '400002', phone: '022-98765432', mobile: '9123456789' },
  { _id: '2', name: 'Speed Cargo', address: '78 Warehouse Road', city: 'Delhi', pincode: '110002', phone: '011-23456789', mobile: '9123456790' },
  { _id: '3', name: 'Express Movers', address: '12 Logistics Hub', city: 'Bangalore', pincode: '560002', phone: '080-55667788', mobile: '9123456791' }
];

const TransportMaster = () => {
  const { showToast } = useStore();
  const [transports, setTransports] = useState(STATIC_TRANSPORTS);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, transport: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    mobile: ''
  });

  const columns = [
    { key: 'name', label: 'Name', render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span> },
    { key: 'city', label: 'City', render: (value) => <span className="text-xs sm:text-sm">{value}</span> },
    { key: 'mobile', label: 'Mobile', render: (value) => <span className="text-xs sm:text-sm">{value}</span> },
    { key: 'phone', label: 'Phone', render: (value) => <span className="text-xs sm:text-sm">{value || 'N/A'}</span> }
  ];

  const actions = [
    {
      label: <FaEye size={10} className="sm:size-3 md:size-4" />,
      onClick: (transport) => { setSelectedTransport(transport); setIsViewModalOpen(true); },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (transport) => { setSelectedTransport(transport); setFormData(transport); setIsEditModalOpen(true); },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (transport) => setDeleteDialog({ isOpen: true, transport }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditModalOpen) {
      setTransports(transports.map(t => t._id === selectedTransport._id ? { ...selectedTransport, ...formData } : t));
      showToast('Transport updated successfully', 'success');
    } else {
      const newTransport = { _id: Date.now().toString(), ...formData };
      setTransports([...transports, newTransport]);
      showToast('Transport created successfully', 'success');
    }
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' });
    setSelectedTransport(null);
  };

  const handleDelete = () => {
    setTransports(transports.filter(t => t._id !== deleteDialog.transport._id));
    showToast('Transport deleted successfully', 'success');
    setDeleteDialog({ isOpen: false, transport: null });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transport Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage transports</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs sm:text-sm">
          <FaPlus className="text-sm sm:text-base" />
          Add Transport
        </Button>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable columns={columns} data={transports} actions={actions} searchable sortable pagination minWidth="750px" />
      </div>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, transport: null })} onConfirm={handleDelete} itemName={deleteDialog.transport?.name} />

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedTransport(null); }} title="Transport Details" size="lg">
        {selectedTransport && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label><p className="text-sm text-gray-900">{selectedTransport.name}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label><p className="text-sm text-gray-900">{selectedTransport.city}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Pincode</label><p className="text-sm text-gray-900">{selectedTransport.pincode}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label><p className="text-sm text-gray-900">{selectedTransport.phone || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile</label><p className="text-sm text-gray-900">{selectedTransport.mobile}</p></div>
            </div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label><p className="text-sm text-gray-900">{selectedTransport.address}</p></div>
            <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedTransport(null); }}>Close</Button>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedTransport(null); setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' }); }} title={isEditModalOpen ? 'Edit Transport' : 'Add New Transport'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea name="address" value={formData.address} onChange={handleInputChange} required rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter address" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="City" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Pincode" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Phone" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label><input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Mobile" /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedTransport(null); setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' }); }}>Cancel</Button>
            <Button type="submit">{isEditModalOpen ? 'Update Transport' : 'Add Transport'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportMaster;
