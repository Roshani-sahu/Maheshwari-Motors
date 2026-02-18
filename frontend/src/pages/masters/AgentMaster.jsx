import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';

const STATIC_AGENTS = [
  { _id: '1', name: 'Rajesh Kumar', address: '123 MG Road', city: 'Mumbai', pincode: '400001', phone: '022-12345678', mobile: '9876543210' },
  { _id: '2', name: 'Amit Sharma', address: '456 Park Street', city: 'Delhi', pincode: '110001', phone: '011-87654321', mobile: '9876543211' },
  { _id: '3', name: 'Priya Singh', address: '789 Brigade Road', city: 'Bangalore', pincode: '560001', phone: '080-11223344', mobile: '9876543212' }
];

const AgentMaster = () => {
  const { showToast } = useStore();
  const [agents, setAgents] = useState(STATIC_AGENTS);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, agent: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
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
      onClick: (agent) => { setSelectedAgent(agent); setIsViewModalOpen(true); },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (agent) => { setSelectedAgent(agent); setFormData(agent); setIsEditModalOpen(true); },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (agent) => setDeleteDialog({ isOpen: true, agent }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditModalOpen) {
      setAgents(agents.map(a => a._id === selectedAgent._id ? { ...selectedAgent, ...formData } : a));
      showToast('Agent updated successfully', 'success');
    } else {
      const newAgent = { _id: Date.now().toString(), ...formData };
      setAgents([...agents, newAgent]);
      showToast('Agent created successfully', 'success');
    }
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' });
    setSelectedAgent(null);
  };

  const handleDelete = () => {
    setAgents(agents.filter(a => a._id !== deleteDialog.agent._id));
    showToast('Agent deleted successfully', 'success');
    setDeleteDialog({ isOpen: false, agent: null });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Master</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage agents</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 text-xs sm:text-sm">
          <FaPlus className="text-sm sm:text-base" />
          Add Agent
        </Button>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable columns={columns} data={agents} actions={actions} searchable sortable pagination minWidth="750px" />
      </div>

      <DeleteConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, agent: null })} onConfirm={handleDelete} itemName={deleteDialog.agent?.name} />

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedAgent(null); }} title="Agent Details" size="lg">
        {selectedAgent && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label><p className="text-sm text-gray-900">{selectedAgent.name}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">City</label><p className="text-sm text-gray-900">{selectedAgent.city}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Pincode</label><p className="text-sm text-gray-900">{selectedAgent.pincode}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label><p className="text-sm text-gray-900">{selectedAgent.phone || 'N/A'}</p></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile</label><p className="text-sm text-gray-900">{selectedAgent.mobile}</p></div>
            </div>
            <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label><p className="text-sm text-gray-900">{selectedAgent.address}</p></div>
            <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedAgent(null); }}>Close</Button>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedAgent(null); setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' }); }} title={isEditModalOpen ? 'Edit Agent' : 'Add New Agent'} size="md">
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
            <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedAgent(null); setFormData({ name: '', address: '', city: '', pincode: '', phone: '', mobile: '' }); }}>Cancel</Button>
            <Button type="submit">{isEditModalOpen ? 'Update Agent' : 'Add Agent'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgentMaster;
