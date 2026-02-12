import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaFileInvoiceDollar, FaFilter, FaCheck, FaPlus, FaCheckSquare, FaEdit, FaTrash, FaDownload, FaTimes } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Select, Input } from '../../components/ui';
import { challanAPI, billAPI, accountAPI, itemAPI } from '../../services/api';
import useStore from '../../store';

const ChallanList = () => {
  const { selectedFirm, setLoading, showToast } = useStore();
  const [challans, setChallans] = useState([]);
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
       loadData();
    }
  }, [selectedFirm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const firmId = selectedFirm._id || selectedFirm.id;
      const [challanRes, partyRes, itemRes] = await Promise.all([
          challanAPI.getAll(firmId),
          accountAPI.getAll(firmId),
          itemAPI.getAll() // Assuming items are global or handle firm internally. If firm specific, might need firmId. Checked api.js, itemAPI.getAll() takes no args.
      ]);
      
      setChallans(challanRes.data?.data?.data || []);
      setParties(partyRes.data?.data?.data || []); // Filter for type? Assuming all parties can have challans.
      setItems(itemRes.data?.data?.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: ''
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [newChallan, setNewChallan] = useState({
    party: '',
    items: [], // Array of item IDs
    amount: '',
    gstType: 1
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  const columns = [
    {
      key: 'challan_number',
      label: 'Challan No',
      render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-xs sm:text-sm">{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'party_id',
      label: 'Party',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value?.name || 'N/A'}</span>
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => <span className="text-xs sm:text-sm">{`${value?.length || 0} item(s)`}</span>
    },
    {
      key: 'grand_total',
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{value?.toLocaleString()}</span>
    },
    // GST Type column removed or re-added if field known
  ];

  const actions = [
    {
      label: <FaDownload size={10} className="sm:size-3 md:size-4" />,
      onClick: (challan) => {
          // Simplified PDF generation for demo
          alert(`Download PDF for ${challan.challan_number} (Implementation pending real PDF lib)`);
      },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
        label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
        onClick: async (challan) => {
            if (window.confirm(`Delete challan ${challan.challan_number}?`)) {
                try {
                    setLoading(true);
                    const firmId = selectedFirm._id || selectedFirm.id;
                    await challanAPI.delete(firmId, challan._id);
                    showToast('Challan deleted', 'success');
                    loadData();
                } catch (error) {
                    showToast('Failed to delete challan', 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleConvertToBill = async () => {
    if (selectedChallans.length === 0) return;
    
    // Validate same party
    const firstPartyId = selectedChallans[0].party_id?._id || selectedChallans[0].party_id;
    const sameParty = selectedChallans.every(c => (c.party_id?._id || c.party_id) === firstPartyId);
    if (!sameParty) {
        showToast('All challans must belong to the same party', 'error');
        return;
    }

    setLoading(true);
    try {
        const firmId = selectedFirm._id || selectedFirm.id;
        const payload = {
            party_id: firstPartyId,
            challan_ids: selectedChallans.map(c => c._id),
            // Backend should handle aggregation of items and totals from challans
            date: new Date().toISOString()
        };
        await billAPI.create(firmId, payload);
        showToast('Bill created successfully', 'success');
        setIsConvertModalOpen(false);
        setSelectedChallans([]);
        loadData(); // Reload to see updates (challans might be marked billed)
    } catch (error) {
        showToast(error.response?.data?.message || 'Failed to convert to bill', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleCreateChallan = async () => {
    setLoading(true);
    try {
        const firmId = selectedFirm._id || selectedFirm.id;
        // Map items to backend expected format. Assuming { item_id, quantity: 1, price: item.price }
        // We find the selected item objects
        const selectedItems = newChallan.items.map(itemId => {
            const item = items.find(i => i._id === itemId);
            return {
                item_id: itemId,
                quantity: 1, // Default to 1 as UI doesn't explicitly ask
                price: item?.sale_price || 0,
                tax: item?.tax_slab || 0
            };
        });

        const payload = {
            party_id: newChallan.party,
            items: selectedItems,
            grand_total: parseFloat(newChallan.amount) || 0, // Should be calculated but taking user input if overridden
            date: new Date().toISOString()
        };

        await challanAPI.create(firmId, payload);
        showToast('Challan created successfully', 'success');
        setIsCreateModalOpen(false);
        setNewChallan({ party: '', items: [], amount: '', gstType: 1 });
        loadData();
    } catch (error) {
        showToast(error.response?.data?.message || 'Failed to create challan', 'error');
    } finally {
        setLoading(false);
    }
  };


  const toggleItemSelection = (itemId, isEditing = false) => {
    if (isEditing) {
      // Edit logic not implemented fully in this snippet, placeholder
    } else {
      setNewChallan(prev => {
        const currentItems = prev.items || [];
        if (currentItems.includes(itemId)) {
          return { ...prev, items: currentItems.filter(id => id !== itemId) };
        } else {
          return { ...prev, items: [...currentItems, itemId] };
        }
      });
    }
  };

  const filteredChallans = challans.filter(challan => {
    if (filters.party && !challan.party_id?.name?.toLowerCase().includes(filters.party.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challan List</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage delivery challans</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
          >
            <FaPlus className="text-sm sm:text-base" />
            Create Challan
          </Button>
          <Button 
            onClick={() => setIsConvertModalOpen(true)}
            className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
          >
            <FaFileInvoiceDollar className="text-sm sm:text-base" />
            Convert to Bill
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <FaFilter className="text-gray-500 text-sm sm:text-base" />
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Party
            </label>
            <input
              type="text"
              value={filters.party}
              onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
              placeholder="Search party..."
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({
                dateFrom: '',
                dateTo: '',
                party: ''
              })}
              className="w-full sm:w-auto text-xs sm:text-sm py-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={filteredChallans}
          actions={actions}
          searchable={true}
          sortable={true}
          pagination={true}
          selectable={true}
          onSelectionChange={setSelectedChallans}
          className="text-xs sm:text-sm"
          minWidth="700px"
        />
      </div>

      {/* Convert to Bill Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Challans to Bill"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Select challans to convert into a single bill:</p>
          
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    <input
                      type="checkbox"
                      checked={selectedChallans.length === challans.length && challans.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // ensure all challans are from the same party before selecting all
                          const parties = Array.from(new Set(challans.map(c => c.party_id?._id)));
                          if (parties.length > 1) {
                            alert('Cannot select challans from different parties. Please select challans of the same party only.');
                            return;
                          }
                          setSelectedChallans([...challans]);
                        } else {
                          setSelectedChallans([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Challan No</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Party</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {challans.map(challan => (
                  <tr key={challan._id || challan.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedChallans.some(s => s._id === challan._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // if there are already selected challans enforce same party
                            const firstParty = selectedChallans.length > 0 ? (selectedChallans[0].party_id?._id || selectedChallans[0].party_id) : null;
                            const currentParty = challan.party_id?._id || challan.party_id;

                            if (firstParty && firstParty !== currentParty) {
                              alert('You can only select challans of the same party to convert into a single bill.');
                              return;
                            }
                            setSelectedChallans(prev => [...prev, challan]);
                          } else {
                            setSelectedChallans(prev => prev.filter(s => s._id !== challan._id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">{challan.challan_number}</td>
                    <td className="px-4 py-2 text-sm">{challan.party_id?.name || 'N/A'}</td>
                    <td className="px-4 py-2 text-sm">₹{challan.grand_total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {selectedChallans.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Selected: {selectedChallans.length} challans | 
                Total Amount: ₹{selectedChallans.reduce((sum, c) => sum + (c.grand_total || 0), 0).toLocaleString()}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleConvertToBill}
              disabled={selectedChallans.length === 0}
              className="flex items-center gap-2"
            >
              <FaCheck />
              Convert to Bill
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsConvertModalOpen(false);
                setSelectedChallans([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Challan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Challan"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challan No</label>
            <input
              type="text"
              value={newChallan.challanNo}
              onChange={(e) => setNewChallan(prev => ({ ...prev, challanNo: e.target.value }))}
              placeholder="Auto-generated if empty"
              disabled={true} // Auto-generated usually
              className="w-full px-3 py-2 border rounded-md bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <select
              value={newChallan.party}
              onChange={(e) => setNewChallan(prev => ({ ...prev, party: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            >
              <option value="">Select Party</option>
              {parties.map(party => (
                <option key={party._id} value={party._id}>{party.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
              <div className="space-y-2">
                {items.length > 0 ? items.map(item => (
                  <label key={item._id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={(newChallan.items || []).includes(item._id)}
                      onChange={() => toggleItemSelection(item._id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item.item_name} - ₹{item.sale_price}</span>
                  </label>
                )) : <div className="text-center text-gray-500 text-sm">No items available</div>}
              </div>
            </div>
            {newChallan.items && newChallan.items.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newChallan.items.map(itemId => {
                    const item = items.find(i => i._id === itemId);
                    return item ? (
                      <span key={item._id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {item.item_name}
                        <button onClick={() => toggleItemSelection(item._id)} className="hover:text-blue-900">
                          <FaTimes size={10} />
                        </button>
                      </span>
                    ) : null;
                })}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              value={newChallan.amount}
              onChange={(e) => setNewChallan(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={newChallan.gstType}
              onChange={(e) => setNewChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            >
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateChallan}
              disabled={!newChallan.party || (newChallan.items || []).length === 0 || !newChallan.amount}
              className="flex items-center gap-2"
            >
              <FaPlus />
              Create Challan
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewChallan({ party: '', items: [], amount: '', gstType: 1 });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Challan Modal - Placeholder keeping basic structure but disabled or simplified as edit logic is similar to create */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Challan (Not Implemented)"
        size="sm md:md"
      >
          <div className="p-4 text-center">
              <p>Edit functionality matches Create logic but requires pre-filling. Pending implementation.</p>
              <Button onClick={() => setIsEditModalOpen(false)} className="mt-4">Close</Button>
          </div>
      </Modal>
    </div>
  );
};

export default ChallanList;