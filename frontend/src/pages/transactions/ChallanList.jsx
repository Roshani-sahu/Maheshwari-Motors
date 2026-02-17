import { useState, useEffect, useRef } from 'react';
import { FaFileInvoiceDollar, FaCheck, FaPlus, FaEdit, FaTrash, FaDownload, FaTimes } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button, } from '../../components/ui';
import useStore from '../../store';
import { challanAPI, accountAPI, itemAPI, billAPI } from '../../services/api';

const ChallanList = () => {
  const { showToast, selectedFirm } = useStore();
  const [challans, setChallans] = useState([]);
  const [loadedParties, setLoadedParties] = useState([]);
  const [loadedItems, setLoadedItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.debug("🔄 Fetching initial data for ChallanList...", { firmId: selectedFirm?.id });
        
        // Pass limit to ensure we get all items for the dropdown
        // Also pass firmId to ensure we get items for the selected firm
        // Try multiple params to force backend to return all data
        const [pRes, iRes, cRes] = await Promise.all([
           accountAPI.getAll(selectedFirm?.id),
           itemAPI.getAll({ 
             limit: 20000, 
             pageSize: 20000,
             pagination: false,
             firmId: selectedFirm?.id 
           }), 
           challanAPI.getAll(selectedFirm?.id)
        ]);
        
        console.debug("✅ Raw API Responses:", { parties: pRes, items: iRes, challans: cRes });

        // Robust data extraction helper
        const getList = (res) => {
            const val = res.data;
            if (Array.isArray(val)) return val;
            if (val?.data && Array.isArray(val.data)) return val.data;
            if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
            if (val?.data?.docs && Array.isArray(val.data.docs)) return val.data.docs; // Handle mongoose-paginate
            if (val?.docs && Array.isArray(val.docs)) return val.docs;
            return [];
        };

        const partiesData = getList(pRes).map(p => ({ id: p._id || p.id, name: p.name }));
        const itemsData = getList(iRes).map(i => ({ 
            ...i, // Keep all backend fields (e.g. part_no, stock, unit, etc.)
            id: i._id || i.id, 
            name: i.item_name || i.name, 
            amount: i.amount || i.rate || 0 
        }));
        
        // Log to verify item count and structure
        console.debug(`📦 Loaded ${itemsData.length} items for dropdown. Sample:`, itemsData[0]);

        const challansData = getList(cRes).map(c => ({
           id: c._id || c.id,
           challanNo: c.challan_no || c.challanNo,
           date: c.date,
           partyId: c.party_id?._id || c.party_id,
           party: c.party_id?.name || c.party_name || 'Unknown',
           items: c.items?.map(i => (i.item_id?.item_name || i.item_name || 'Item')) || [],
           amount: c.amount,
           gstType: c.is_gst
        }));

        setLoadedParties(partiesData);
        setLoadedItems(itemsData);
        setChallans(challansData);

        console.debug("🧩 State Updated:", { parties: partiesData.length, items: itemsData.length, challans: challansData.length });

    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };
    fetchData();
  }, [selectedFirm?.id]); // ✅ Refetch when selectedFirm changes

  // Filters state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: '',
    gstType: 'all'
  });

  // Modal and Form states
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  
  const [newChallan, setNewChallan] = useState({
    challanNo: '',
    party: '',
    items: [],
    amount: '',
    gstType: 0,
    date: new Date().toISOString().split('T')[0],
    itemDetails: {} 
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, challan: null });
  
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [editItemSearchTerm, setEditItemSearchTerm] = useState('');
  const [showEditItemDropdown, setShowEditItemDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const itemDropdownRef = useRef(null);
  const editItemDropdownRef = useRef(null);

  // Derived state: filteredItems relies on loadedItems, itemSearchTerm, and newChallan
  const filteredItems = loadedItems.filter(item => {
    const search = itemSearchTerm.trim().toLowerCase();
    const notSelected = !newChallan.items.includes(item.id);
  
    // Robust search: check name, part_no, and hsn_code
    const matchesSearch =
      !search ||
      (item.name && item.name.toLowerCase().includes(search)) ||
      (item.part_no && item.part_no.toLowerCase().includes(search)) ||
      (item.hsn_code && item.hsn_code.toLowerCase().includes(search));
  
    return notSelected && matchesSearch;
  });
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
      if (editItemDropdownRef.current && !editItemDropdownRef.current.contains(event.target)) {
        setShowEditItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Data comes from loadedParties and loadedItems

  const columns = [
    {
      key: 'challanNo',
      label: 'Challan No',
      render: (value) => <span className="text-xs sm:text-sm font-medium">{value}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => <span className="text-xs sm:text-sm">{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'party',
      label: 'Party',
      render: (value) => <span className="text-xs sm:text-sm truncate">{value}</span>
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => <span className="text-xs sm:text-sm">{`${value.length} item(s)`}</span>
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span className="text-xs sm:text-sm">₹{value.toLocaleString()}</span>
    },
    {
      key: 'gstType',
      label: 'Type',
      render: (value) => (
        <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: <FaEdit size={10} className="sm:size-3 md:size-4" />,
      onClick: (challan) => {
        // Pre-fill with existing data and initialize items
        const itemDetails = {};
        const itemIds = loadedItems.slice(0, 2).map(item => {
          itemDetails[item.id] = {
            pcs: 1,
            rate: item.amount || 0,
            disPercent: 0,
            spDis: 0,
            gstPercent: 0
          };
          return item.id;
        });
        
        setEditingChallan({
          ...challan,
          partyId: challan.partyId,
          items: itemIds,
          itemDetails: itemDetails
        });
        setIsEditModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaTrash size={10} className="sm:size-3 md:size-4" />,
      onClick: (challan) => setDeleteDialog({ isOpen: true, challan }),
      className: 'bg-red-600 text-white hover:bg-red-700 p-1 sm:p-1.5 md:p-2 text-xs'
    },
    {
      label: <FaDownload size={10} className="sm:size-3 md:size-4" />,
      onClick: (challan) => {
        // Generate PDF
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
          <html>
            <head>
              <title>Challan ${challan.challanNo}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .info { margin: 20px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; }
                .items { margin-top: 20px; }
                .items ul { list-style: none; padding: 0; }
                .items li { padding: 5px 0; border-bottom: 1px solid #eee; }
              </style>
            </head>
            <body>
              <h1>Challan Details</h1>
              <div class="info">
                <p><span class="label">Challan No:</span> ${challan.challanNo}</p>
                <p><span class="label">Date:</span> ${new Date(challan.date).toLocaleDateString()}</p>
                <p><span class="label">Party:</span> ${challan.party}</p>
                <p><span class="label">Amount:</span> ₹${challan.amount.toLocaleString()}</p>
                <p><span class="label">Type:</span> ${challan.gstType}</p>
              </div>
              <div class="items">
                <h3>Items:</h3>
                <ul>
                  ${challan.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      },
      className: 'bg-green-600 text-white hover:bg-green-700 p-1 sm:p-1.5 md:p-2 text-xs'
    }
  ];

  const handleConvertToBill = async () => {
    if (selectedChallans.length === 0) {
      alert('Please select challans to convert');
      return;
    }
    
    const firstPartyId = selectedChallans[0].partyId;
    if (selectedChallans.some(c => c.partyId !== firstPartyId)) {
        setValidationError('All selected challans must belong to the same party');
        return;
    }

    try {
        const payload = {
            party_id: firstPartyId,
            challan_ids: selectedChallans.map(c => c.id)
        };
        
        await billAPI.create(payload);
        showToast('Bill created successfully', 'success');
        
        const cRes = await challanAPI.getAll();
        const cVal = cRes.data?.data;
        const cList = Array.isArray(cVal) ? cVal : (cVal?.data || []);

        const activeChallans = cList
            .filter(c => c.status !== 'Converted')
            .map(c => ({
               id: c._id,
               challanNo: c.challan_no,
               date: c.date,
               partyId: c.party_id?._id,
               party: c.party_id?.name || 'Unknown',
               items: c.items?.map(i => i.item_id?.item_name || 'Item') || [],
               amount: c.amount,
               gstType: c.is_gst
            }));
        setChallans(activeChallans);
        
        setIsConvertModalOpen(false);
        setSelectedChallans([]);
    } catch (error) {
        console.error(error);
        showToast('Failed to convert challans', 'error');
    }
  };

  const handleCreateChallan = async () => {
    try {
      const totalAmount = calculateTotalAmount();
      const payload = {
         date: newChallan.date,
         party_id: newChallan.party,
         items: newChallan.items.map(itemId => {
             const item = loadedItems.find(i => i.id === itemId);
             const details = newChallan.itemDetails[itemId] || {};
             const calc = calculateItemAmount(itemId);
             return {
                 item_id: itemId,
                 quantity: parseFloat(details.pcs || 1),
                 rate: parseFloat(details.rate || item?.amount || 0),
                 amount: calc.finalAmount,
                 gross_amount: calc.finalAmount
             };
         }),
         amount: totalAmount,
         gross_total: totalAmount,
         sub_total: totalAmount,
         is_gst: newChallan.gstType
      };

      await challanAPI.create(payload);
      showToast('Challan created successfully', 'success');
      
      // Refresh
      const cRes = await challanAPI.getAll();
      const cVal = cRes.data?.data;
      const cListRaw = Array.isArray(cVal) ? cVal : (cVal?.data || []);

      const cList = cListRaw.map(c => ({
           id: c._id,
           challanNo: c.challan_no,
           date: c.date,
           partyId: c.party_id?._id,
           party: c.party_id?.name || 'Unknown',
           items: c.items?.map(i => i.item_id?.item_name || 'Item') || [],
           amount: c.amount,
           gstType: c.is_gst,
           vehicleNo: c.vehicle_no
      }));
      setChallans(cList);
      
      setNewChallan({ 
        challanNo: '', 
        party: '', 
        items: [], 
        amount: '', 
        gstType: 0,
        date: new Date().toISOString().split('T')[0],
        itemDetails: {}
      });
      setIsCreateModalOpen(false);

    } catch (error) {
       console.error(error);
       showToast('Failed to create challan', 'error');
    }
  };

  const handleEditChallan = async () => {
    try {
      const totalAmount = calculateEditTotalAmount();
      const payload = {
         date: editingChallan.date,
         party_id: editingChallan.partyId,
         items: editingChallan.items.map(itemId => {
             const item = loadedItems.find(i => i.id === itemId);
             const details = editingChallan.itemDetails[itemId] || {};
             const calc = calculateEditItemAmount(itemId);
             return {
                 item_id: itemId,
                 quantity: parseFloat(details.pcs || 1),
                 rate: parseFloat(details.rate || item?.amount || 0),
                 amount: calc.finalAmount,
                 gross_amount: calc.finalAmount
             };
         }),
         amount: totalAmount,
         gross_total: totalAmount,
         sub_total: totalAmount,
         is_gst: editingChallan.gstType
      };

      await challanAPI.update(editingChallan.id, payload);
      showToast('Challan updated successfully', 'success');
      
      // Refresh
      const cRes = await challanAPI.getAll();
      const cVal = cRes.data?.data;
      const cListRaw = Array.isArray(cVal) ? cVal : (cVal?.data || []);

      const cList = cListRaw.map(c => ({
           id: c._id,
           challanNo: c.challan_no,
           date: c.date,
           partyId: c.party_id?._id,
           party: c.party_id?.name || 'Unknown',
           items: c.items?.map(i => i.item_id?.item_name || 'Item') || [],
           amount: c.amount,
           gstType: c.is_gst
      }));
      setChallans(cList);
      
      setIsEditModalOpen(false);
      setEditingChallan(null);

    } catch (error) {
       console.error(error);
       showToast('Failed to update challan', 'error');
    }
  };

  const toggleItemSelection = (itemId, isEditing = false) => {
    if (isEditing) {
      setEditingChallan(prev => {
        const items = prev.items.includes(itemId)
          ? prev.items.filter(i => i !== itemId)
          : [...prev.items, itemId];
        
        // Initialize item details when adding
        if (!prev.items.includes(itemId)) {
          const item = loadedItems.find(i => i.id === itemId);
          prev.itemDetails = prev.itemDetails || {};
          prev.itemDetails[itemId] = {
            pcs: 1,
            rate: item?.amount || 0,
            disPercent: 0,
            spDis: 0,
            gstPercent: 0
          };
        }
        
        return { ...prev, items };
      });
    } else {
      setNewChallan(prev => {
        const items = prev.items.includes(itemId)
          ? prev.items.filter(i => i !== itemId)
          : [...prev.items, itemId];
        
        // Initialize item details when adding
        if (!prev.items.includes(itemId)) {
          const item = loadedItems.find(i => i.id === itemId);
          prev.itemDetails[itemId] = {
            pcs: 1,
            rate: item?.amount || 0,
            disPercent: 0,
            spDis: 0,
            gstPercent: 0
          };
        }
        
        return { ...prev, items };
      });
    }
  };

  const calculateEditItemAmount = (itemId) => {
    const details = editingChallan.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    
    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent / 100) + spDis;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = editingChallan.gstType === 1 ? (afterDiscount * gstPercent / 100) : 0;
    const finalAmount = afterDiscount + gstAmount;
    
    return {
      baseAmount,
      discountAmount,
      afterDiscount,
      gstAmount,
      finalAmount
    };
  };

  const updateEditItemDetail = (itemId, field, value) => {
    setEditingChallan(prev => ({
      ...prev,
      itemDetails: {
        ...prev.itemDetails,
        [itemId]: {
          ...prev.itemDetails[itemId],
          [field]: value
        }
      }
    }));
  };

  const calculateEditTotalAmount = () => {
    return editingChallan.items.reduce((total, itemId) => {
      const calc = calculateEditItemAmount(itemId);
      return total + calc.finalAmount;
    }, 0);
  };

  const calculateItemAmount = (itemId) => {
    const details = newChallan.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    
    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent / 100) + spDis;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = newChallan.gstType === 1 ? (afterDiscount * gstPercent / 100) : 0;
    const finalAmount = afterDiscount + gstAmount;
    
    return {
      baseAmount,
      discountAmount,
      afterDiscount,
      gstAmount,
      finalAmount
    };
  };

  const updateItemDetail = (itemId, field, value) => {
    setNewChallan(prev => ({
      ...prev,
      itemDetails: {
        ...prev.itemDetails,
        [itemId]: {
          ...prev.itemDetails[itemId],
          [field]: value
        }
      }
    }));
  };

  const calculateTotalAmount = () => {
    return newChallan.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.finalAmount;
    }, 0);
  };

  const filteredChallans = challans.filter(challan => {
    if (filters.party && !challan.party.toLowerCase().includes(filters.party.toLowerCase())) {
      return false;
    }
    if (filters.gstType !== 'all' && challan.gstType !== parseInt(filters.gstType)) {
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
                          const parties = Array.from(new Set(challans.map(c => c.party)));
                          if (parties.length > 1) {
                            setValidationError('Cannot select challans from different parties. Please select challans of the same party only.');
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
                  <tr key={challan.id} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedChallans.some(s => s.id === challan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedChallans.length > 0 && selectedChallans[0].party !== challan.party) {
                              setValidationError('You can only select challans of the same party to convert into a single bill.');
                              return;
                            }
                            setSelectedChallans(prev => [...prev, challan]);
                          } else {
                            setSelectedChallans(prev => prev.filter(s => s.id !== challan.id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm">{challan.challanNo}</td>
                    <td className="px-4 py-2 text-sm">{challan.party}</td>
                    <td className="px-4 py-2 text-sm">₹{challan.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {selectedChallans.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Selected: {selectedChallans.length} challans | 
                Total Amount: ₹{selectedChallans.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}
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
        title="CHALLAN ENTRY"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
              <select
                value={newChallan.party}
                onChange={(e) => setNewChallan(prev => ({ ...prev, party: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select Party</option>
                {loadedParties.map(party => (
                  <option key={party.id} value={party.id}>{party.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={newChallan.date}
                onChange={(e) => setNewChallan(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1">
                  <input 
                    type="radio" 
                    name="gstType" 
                    value={0}
                    checked={newChallan.gstType === 0}
                    onChange={(e) => setNewChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                  />
                  <span className="text-sm">0</span>
                </label>
                <label className="flex items-center gap-1">
                  <input 
                    type="radio" 
                    name="gstType" 
                    value={1}
                    checked={newChallan.gstType === 1}
                    onChange={(e) => setNewChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                  />
                  <span className="text-sm">1</span>
                </label>
              </div>
            </div>
          </div>

          {/* Search & Add Items Section */}
          <div className="border rounded-lg ">
            <div className="bg-gray-100 px-4 py-2">
              <h3 className="font-medium text-gray-900">Search & Add Items</h3>
            </div>
            <div className="p-4">
              <div className="relative" ref={itemDropdownRef} >
                <input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearchTerm}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                {showItemDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
                    {loadedItems
                      .filter(item => 
                        !newChallan.items.includes(item.id) &&
                        (itemSearchTerm === '' || item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
                      )
                      .map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            toggleItemSelection(item.id);
                            setItemSearchTerm('');
                            setShowItemDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="text-gray-500 text-xs ml-2">₹{item.amount}</span>
                          </div>
                        </button>
                      ))
                    }
                    {loadedItems.filter(item => 
                      !newChallan.items.includes(item.id) &&
                      (itemSearchTerm === '' || item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table Section */}
          <div className="border rounded-lg">
            <div className="bg-gray-100 px-4 py-2">
              <h3 className="font-medium text-gray-900">Rate Information - Add / Less</h3>
            </div>
            
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left border-r">SNo</th>
                    <th className="px-2 py-2 text-left border-r">ItemName</th>
                    <th className="px-2 py-2 text-left border-r">MRP</th>
                    <th className="px-2 py-2 text-left border-r">Stock</th>
                    <th className="px-2 py-2 text-left border-r">Type</th>
                    <th className="px-2 py-2 text-left border-r">PCS</th>
                    <th className="px-2 py-2 text-left border-r">Rate</th>
                    <th className="px-2 py-2 text-left border-r">Dis %</th>
                    <th className="px-2 py-2 text-left border-r">SP Dis</th>
                    <th className="px-2 py-2 text-left border-r">Disc Amt</th>
                    {newChallan.gstType === 1 && (
                      <>
                        <th className="px-2 py-2 text-left border-r">GST %</th>
                        <th className="px-2 py-2 text-left border-r">GST Amt</th>
                      </>
                    )}
                    <th className="px-2 py-2 text-left border-r">Amount</th>
                    <th className="px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {newChallan.items.map((itemId, index) => {
                    const item = loadedItems.find(i => i.id === itemId);
                    const details = newChallan.itemDetails[itemId] || {};
                    const calc = calculateItemAmount(itemId);
                    
                    return (
                      <tr key={itemId} className="border-t">
                        <td className="px-2 py-2 border-r">{index + 1}</td>
                        <td className="px-2 py-2 border-r">
                          <span className="text-xs">{item?.name || 'Unknown Item'}</span>
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input 
                            type="number" 
                            value={details.rate || item?.amount || 0} 
                            onChange={(e) => updateItemDetail(itemId, 'rate', e.target.value)}
                            className="w-16 px-1 py-1 border rounded text-xs" 
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input type="number" defaultValue="5.00" className="w-16 px-1 py-1 border rounded text-xs" />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input type="text" defaultValue="1" className="w-12 px-1 py-1 border rounded text-xs" />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input 
                            type="number" 
                            value={details.pcs || 1} 
                            onChange={(e) => updateItemDetail(itemId, 'pcs', e.target.value)}
                            className="w-12 px-1 py-1 border rounded text-xs" 
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input 
                            type="number" 
                            value={details.rate || item?.amount || 0} 
                            onChange={(e) => updateItemDetail(itemId, 'rate', e.target.value)}
                            className="w-16 px-1 py-1 border rounded text-xs" 
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input 
                            type="number" 
                            value={details.disPercent || 0} 
                            onChange={(e) => updateItemDetail(itemId, 'disPercent', e.target.value)}
                            className="w-16 px-1 py-1 border rounded text-xs" 
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input 
                            type="number" 
                            value={details.spDis || 0} 
                            onChange={(e) => updateItemDetail(itemId, 'spDis', e.target.value)}
                            className="w-16 px-1 py-1 border rounded text-xs" 
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <span className="text-xs">{calc.discountAmount.toFixed(2)}</span>
                        </td>
                        {newChallan.gstType === 1 && (
                          <>
                            <td className="px-2 py-2 border-r">
                              <input 
                                type="number" 
                                value={details.gstPercent || 0} 
                                onChange={(e) => updateItemDetail(itemId, 'gstPercent', e.target.value)}
                                className="w-16 px-1 py-1 border rounded text-xs" 
                              />
                            </td>
                            <td className="px-2 py-2 border-r">
                              <span className="text-xs">{calc.gstAmount.toFixed(2)}</span>
                            </td>
                          </>
                        )}
                        <td className="px-2 py-2 border-r">
                          <span className="text-xs font-medium">{calc.finalAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-2 py-2">
                          <button 
                            onClick={() => toggleItemSelection(itemId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {newChallan.items.length === 0 && (
                    <tr>
                      <td colSpan={newChallan.gstType === 1 ? 14 : 12} className="px-4 py-8 text-center text-gray-500">
                        No items selected. Use the search above to add items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>


            {/* Add Item Section */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search & Add Items:</label>
                <div className="relative" ref={itemDropdownRef}>
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={itemSearchTerm}
                    onChange={(e) => {
                      setItemSearchTerm(e.target.value);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  {showItemDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                      {filteredItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                                toggleItemSelection(item.id);
                                setItemSearchTerm('');
                                setShowItemDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b last:border-b-0"
                          >
                            <div className="flex justify-between items-center">
                              <span className="truncate">
                                {item.name} 
                                {item.part_no && <span className="text-gray-400 text-xs ml-1">({item.part_no})</span>}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">₹{item.amount}</span>
                            </div>
                          </button>
                        ))
                      }
                      {filteredItems.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selected Items Preview */}
              {newChallan.items.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">Selected Items:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newChallan.items.map(itemId => {
                      const item = loadedItems.find(i => i.id === itemId);
                      return (
                        <span key={itemId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1">
                          {item?.name}
                          <button
                            onClick={() => toggleItemSelection(itemId)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Selected Items Preview */}
          {newChallan.items.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Selected Items ({newChallan.items.length}):</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {newChallan.items.map(itemId => {
                  const item = loadedItems.find(i => i.id === itemId);
                  return (
                    <span key={itemId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1">
                      {item?.name}
                      <button
                        onClick={() => toggleItemSelection(itemId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes size={10} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-32">Net Amount:</span>
                <input 
                  type="number"
                  value={calculateTotalAmount().toFixed(2)}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleCreateChallan}
              disabled={!newChallan.party || newChallan.items.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <FaPlus />
              Save Challan
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewChallan({ 
                  challanNo: '', 
                  party: '', 
                  items: [], 
                  amount: '', 
                  gstType: 0,
                  date: new Date().toISOString().split('T')[0],
                  itemDetails: {}
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="bg-red-50 text-red-600 hover:bg-red-100"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {/* Edit Challan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="EDIT CHALLAN"
        size="6xl"
      >
        {editingChallan && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
                <select
                  value={editingChallan.partyId || ''}
                  onChange={(e) => setEditingChallan(prev => ({ ...prev, partyId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select Party</option>
                  {loadedParties.map(party => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={editingChallan.date ? new Date(editingChallan.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingChallan(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1">
                    <input 
                      type="radio" 
                      name="editGstType" 
                      value={0}
                      checked={editingChallan.gstType === 0}
                      onChange={(e) => setEditingChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                    />
                    <span className="text-sm">0</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input 
                      type="radio" 
                      name="editGstType" 
                      value={1}
                      checked={editingChallan.gstType === 1}
                      onChange={(e) => setEditingChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                    />
                    <span className="text-sm">1</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2">
                <h3 className="font-medium text-gray-900">Rate Information - Add / Less</h3>
              </div>
              
              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left border-r">SNo</th>
                      <th className="px-2 py-2 text-left border-r">ItemName</th>
                      <th className="px-2 py-2 text-left border-r">MRP</th>
                      <th className="px-2 py-2 text-left border-r">Stock</th>
                      <th className="px-2 py-2 text-left border-r">Type</th>
                      <th className="px-2 py-2 text-left border-r">PCS</th>
                      <th className="px-2 py-2 text-left border-r">Rate</th>
                      <th className="px-2 py-2 text-left border-r">Dis %</th>
                      <th className="px-2 py-2 text-left border-r">SP Dis</th>
                      <th className="px-2 py-2 text-left border-r">Disc Amt</th>
                      {editingChallan.gstType === 1 && (
                        <>
                          <th className="px-2 py-2 text-left border-r">GST %</th>
                          <th className="px-2 py-2 text-left border-r">GST Amt</th>
                        </>
                      )}
                      <th className="px-2 py-2 text-left border-r">Amount</th>
                      <th className="px-2 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingChallan.items.map((itemId, index) => {
                      const item = loadedItems.find(i => i.id === itemId);
                      const details = editingChallan.itemDetails[itemId] || {};
                      const calc = calculateEditItemAmount(itemId);
                      
                      return (
                        <tr key={itemId} className="border-t">
                          <td className="px-2 py-2 border-r">{index + 1}</td>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">{item?.name || 'Unknown Item'}</span>
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input 
                              type="number" 
                              value={details.rate || item?.amount || 0} 
                              onChange={(e) => updateEditItemDetail(itemId, 'rate', e.target.value)}
                              className="w-16 px-1 py-1 border rounded text-xs" 
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input type="number" defaultValue="5.00" className="w-16 px-1 py-1 border rounded text-xs" />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input type="text" defaultValue="1" className="w-12 px-1 py-1 border rounded text-xs" />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input 
                              type="number" 
                              value={details.pcs || 1} 
                              onChange={(e) => updateEditItemDetail(itemId, 'pcs', e.target.value)}
                              className="w-12 px-1 py-1 border rounded text-xs" 
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input 
                              type="number" 
                              value={details.rate || item?.amount || 0} 
                              onChange={(e) => updateEditItemDetail(itemId, 'rate', e.target.value)}
                              className="w-16 px-1 py-1 border rounded text-xs" 
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input 
                              type="number" 
                              value={details.disPercent || 0} 
                              onChange={(e) => updateEditItemDetail(itemId, 'disPercent', e.target.value)}
                              className="w-16 px-1 py-1 border rounded text-xs" 
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <input 
                              type="number" 
                              value={details.spDis || 0} 
                              onChange={(e) => updateEditItemDetail(itemId, 'spDis', e.target.value)}
                              className="w-16 px-1 py-1 border rounded text-xs" 
                            />
                          </td>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">{calc.discountAmount.toFixed(2)}</span>
                          </td>
                          {editingChallan.gstType === 1 && (
                            <>
                              <td className="px-2 py-2 border-r">
                                <input 
                                  type="number" 
                                  value={details.gstPercent || 0} 
                                  onChange={(e) => updateEditItemDetail(itemId, 'gstPercent', e.target.value)}
                                  className="w-16 px-1 py-1 border rounded text-xs" 
                                />
                              </td>
                              <td className="px-2 py-2 border-r">
                                <span className="text-xs">{calc.gstAmount.toFixed(2)}</span>
                              </td>
                            </>
                          )}
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs font-medium">{calc.finalAmount.toFixed(2)}</span>
                          </td>
                          <td className="px-2 py-2">
                            <button 
                              onClick={() => toggleItemSelection(itemId, true)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Item Section */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search & Add Items:</label>
                  <div className="relative" ref={editItemDropdownRef}>
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={editItemSearchTerm}
                      onChange={(e) => {
                        setEditItemSearchTerm(e.target.value);
                        setShowEditItemDropdown(true);
                      }}
                      onFocus={() => setShowEditItemDropdown(true)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                    {showEditItemDropdown && (
                      <div className="fixed z-[9999] bg-white border rounded-md shadow-xl max-h-80 overflow-y-auto" 
                           style={{
                             top: editItemDropdownRef.current?.getBoundingClientRect().bottom + window.scrollY + 4 || 0,
                             left: editItemDropdownRef.current?.getBoundingClientRect().left + window.scrollX || 0,
                             width: editItemDropdownRef.current?.getBoundingClientRect().width || 300
                           }}>
                        {loadedItems
                          .filter(item => 
                            !editingChallan.items.includes(item.id) &&
                            item.name.toLowerCase().includes(editItemSearchTerm.toLowerCase())
                          )
                          .map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                toggleItemSelection(item.id, true);
                                setEditItemSearchTerm('');
                                setShowEditItemDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <span className="truncate">{item.name}</span>
                                <span className="text-gray-500 text-xs ml-2">₹{item.amount}</span>
                              </div>
                            </button>
                          ))
                        }
                        {loadedItems.filter(item => 
                          !editingChallan.items.includes(item.id) &&
                          item.name.toLowerCase().includes(editItemSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>
                        )}

                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selected Items Preview */}
                {editingChallan.items.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">Selected Items:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingChallan.items.map(itemId => {
                        const item = loadedItems.find(i => i.id === itemId);
                        return (
                          <span key={itemId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1">
                            {item?.name}
                            <button
                              onClick={() => toggleItemSelection(itemId, true)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FaTimes size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Totals Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-32">Net Amount:</span>
                  <input 
                    type="number"
                    value={calculateEditTotalAmount().toFixed(2)}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleEditChallan}
                disabled={!editingChallan.partyId || editingChallan.items.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FaEdit />
                Update Challan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingChallan(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, challan: null })}
        onConfirm={async () => {
             try {
                 await challanAPI.delete(deleteDialog.challan.id);
                 showToast('Challan deleted successfully', 'success');
                 setChallans(prev => prev.filter(c => c.id !== deleteDialog.challan.id));
                 setDeleteDialog({ isOpen: false, challan: null });
             } catch (error) {
                 showToast('Failed to delete challan', 'error');
             }
        }}
        itemName={deleteDialog.challan?.challanNo}
      />

      {/* Validation Error Modal */}
      <Modal
        isOpen={!!validationError}
        onClose={() => setValidationError('')}
        title="Error"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">{validationError}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setValidationError('')}
              className="w-full"
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChallanList;