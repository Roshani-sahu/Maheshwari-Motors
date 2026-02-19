import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTimes, FaSave } from 'react-icons/fa';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const ChallanForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, selectedFirm } = useStore();
  const isEditMode = !!id;

  const [loadedParties, setLoadedParties] = useState([]);
  const [loadedItems, setLoadedItems] = useState([]);
  const [loadedDiscounts, setLoadedDiscounts] = useState({});
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [totalItemsPages, setTotalItemsPages] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const itemDropdownRef = useRef(null);

  const [challan, setChallan] = useState({
    party: '',
    items: [],
    gstType: 0,
    date: new Date().toISOString().split('T')[0],
    itemDetails: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, iRes, brandRes] = await Promise.all([
          api.get('/contacts', { params: { page: 1, limit: 200, type: 'party' } }),
          api.get('/items', { params: { page: 1, limit: 50, search: '' } }),
          api.get('/brands', { params: { page: 1, limit: 200 } })
        ]);

        const getList = (res) => {
          const val = res.data;
          if (Array.isArray(val)) return val;
          if (val?.data && Array.isArray(val.data)) return val.data;
          if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
          if (val?.data?.docs && Array.isArray(val.data.docs)) return val.data.docs;
          if (val?.docs && Array.isArray(val.docs)) return val.docs;
          return [];
        };

        const partiesData = getList(pRes).map(p => ({ id: p._id || p.id, name: p.name }));
        const itemsData = getList(iRes).map(i => ({
          ...i,
          id: i._id || i.id,
          name: i.item_name || i.name,
          amount: i.amount || i.rate || 0
        }));

        setLoadedParties(partiesData);
        setLoadedItems(itemsData);

        const brandList = getList(brandRes);
        const discountMap = {};
        brandList.forEach((b) => {
          if (b?._id) {
            discountMap[b._id] = {
              discount1: b.discount1 || { normal: 0, special: 0 },
              discount2: b.discount2 || { normal: 0, special: 0 }
            };
          }
        });
        setLoadedDiscounts(discountMap);

        const itemsResponse = iRes.data?.data || iRes.data;
        setTotalItemsPages(itemsResponse?.totalPages || 1);

        if (isEditMode) {
          const challanRes = await api.get(`/challans/${id}`);
          const challanData = challanRes.data?.data || challanRes.data || {};
          setChallan({
            party: challanData.contact_id?._id || challanData.contact_id || challanData.party_id?._id || challanData.party_id,
            items: challanData.items?.map(i => i.item_id?._id || i.item_id) || [],
            gstType: challanData.is_gst,
            date: new Date(challanData.date).toISOString().split('T')[0],
            itemDetails: {}
          });
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        showToast('Failed to load data', 'error');
      }
    };
    fetchData();
  }, [selectedFirm?.id, id, isEditMode]);

  const loadItemsPage = async (page) => {
    setIsLoadingItems(true);
    try {
      const response = await api.get('/items', { params: { page, limit: 50, search: itemSearchTerm } });
      const getList = (res) => {
        const val = res.data;
        if (Array.isArray(val)) return val;
        if (val?.data && Array.isArray(val.data)) return val.data;
        if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
        if (val?.data?.docs && Array.isArray(val.data.docs)) return val.data.docs;
        if (val?.docs && Array.isArray(val.docs)) return val.docs;
        return [];
      };

      const items = getList(response).map(i => ({
        ...i,
        id: i._id || i.id,
        name: i.item_name || i.name,
        amount: i.amount || i.rate || 0
      }));

      setLoadedItems(items);
      setItemsPage(page);

      const itemsResponse = response.data?.data || response.data;
      setTotalItemsPages(itemsResponse?.totalPages || Math.ceil(itemsResponse?.total / 50) || 1);
    } catch (err) {
      console.error('Failed to load items page:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    const searchItems = async () => {
      setIsLoadingItems(true);
      try {
        const response = await api.get('/items', { params: { page: 1, limit: 50, search: itemSearchTerm } });
        const getList = (res) => {
          const val = res.data;
          if (Array.isArray(val)) return val;
          if (val?.data && Array.isArray(val.data)) return val.data;
          if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
          if (val?.data?.docs && Array.isArray(val.data.docs)) return val.data.docs;
          if (val?.docs && Array.isArray(val.docs)) return val.docs;
          return [];
        };

        const searchResults = getList(response).map(i => ({
          ...i,
          id: i._id || i.id,
          name: i.item_name || i.name,
          amount: i.amount || i.rate || 0
        }));

        setLoadedItems(searchResults);
        setItemsPage(1);

        const itemsResponse = response.data?.data || response.data;
        setTotalItemsPages(itemsResponse?.totalPages || Math.ceil(itemsResponse?.total / 50) || 1);
      } catch (err) {
        console.error('Failed to search items:', err);
      } finally {
        setIsLoadingItems(false);
      }
    };

    if (showItemDropdown) {
      const timer = setTimeout(searchItems, 300);
      return () => clearTimeout(timer);
    }
  }, [itemSearchTerm, showItemDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = loadedItems.filter(item => !challan.items.includes(item.id));

  const toggleItemSelection = (itemId) => {
    setChallan(prev => {
      const items = prev.items.includes(itemId)
        ? prev.items.filter(i => i !== itemId)
        : [...prev.items, itemId];

      if (!prev.items.includes(itemId)) {
        const item = loadedItems.find(i => i.id === itemId);
        const brandId = item?.brand_id?._id || item?.brand_id || item?.brand || item?.brandId;
        const discForBrand = loadedDiscounts[brandId] || {};
        const useDisc = (prev.gstType === 1 ? (discForBrand.discount1 || {}) : (discForBrand.discount2 || {})) || {};
        prev.itemDetails[itemId] = {
          pcs: 1,
          rate: item?.amount || 0,
          disPercent: useDisc.normal || 0,
          spDis: useDisc.special || 0,
          gstPercent: 0
        };
      }

      return { ...prev, items };
    });
  };

  const calculateItemAmount = (itemId) => {
    const details = challan.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);

    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent / 100) + spDis;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = challan.gstType === 1 ? (afterDiscount * gstPercent / 100) : 0;
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
    setChallan(prev => ({
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
    return challan.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.afterDiscount;
    }, 0);
  };

  const handleSave = async () => {
    try {
      const totalAmount = calculateTotalAmount();
      const payload = {
        challan_type: 'sale',
        date: challan.date,
        contact_id: challan.party,
        is_gst: challan.gstType,
        items: challan.items.map(itemId => {
          const item = loadedItems.find(i => i.id === itemId);
          const details = challan.itemDetails[itemId] || {};
          return {
            item_id: itemId,
            quantity: parseFloat(details.pcs || 1),
            rate: parseFloat(details.rate || item?.amount || 0),
            discount: parseFloat(details.disPercent || 0),
            special_discount: parseFloat(details.spDis || 0),
            gst_percent: parseFloat(details.gstPercent || 0),
            is_gst: challan.gstType
          };
        }),
        discount: 0
      };

      if (isEditMode) {
        await api.put(`/challans/${id}`, payload);
        showToast('Challan updated successfully', 'success');
      } else {
        await api.post('/challans', payload);
        showToast('Challan created successfully', 'success');
      }

      navigate('/transactions/challan-list');
    } catch (error) {
      console.error(error);
      showToast(`Failed to ${isEditMode ? 'update' : 'create'} challan`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Challan' : 'Create Challan'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/transactions/challan-list')}>
          Back to List
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <select
              value={challan.party}
              onChange={(e) => setChallan(prev => ({ ...prev, party: e.target.value }))}
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
              value={challan.date}
              onChange={(e) => setChallan(prev => ({ ...prev, date: e.target.value }))}
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
                  checked={challan.gstType === 0}
                  onChange={(e) => setChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                />
                <span className="text-sm">0</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gstType"
                  value={1}
                  checked={challan.gstType === 1}
                  onChange={(e) => setChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                />
                <span className="text-sm">1</span>
              </label>
            </div>
          </div>
        </div>

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
                  {challan.gstType === 1 && (
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
                {challan.items.map((itemId, index) => {
                  const item = loadedItems.find(i => i.id === itemId);
                  const details = challan.itemDetails[itemId] || {};
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
                      {challan.gstType === 1 && (
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
                        <span className="text-xs font-medium">{calc.afterDiscount.toFixed(2)}</span>
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
                {challan.items.length === 0 && (
                  <tr>
                    <td colSpan={challan.gstType === 1 ? 14 : 12} className="px-4 py-8 text-center text-gray-500">
                      No items selected. Use the search below to add items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 bg-gray-100 text-xs text-gray-600 sticky top-0 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadItemsPage(itemsPage - 1);
                          }}
                          disabled={itemsPage === 1 || isLoadingItems}
                          className="px-2 py-0.5 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          ←
                        </button>
                        <span>Page {itemsPage} of {totalItemsPages}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadItemsPage(itemsPage + 1);
                          }}
                          disabled={itemsPage === totalItemsPages || isLoadingItems}
                          className="px-2 py-0.5 bg-white border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                        >
                          →
                        </button>
                      </div>
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
                      ))}
                      {filteredItems.length === 0 && !isLoadingItems && (
                        <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>
                      )}
                      {isLoadingItems && (
                        <div className="px-3 py-2 text-gray-500 text-sm text-center">Loading...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {challan.items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Selected Items ({challan.items.length}):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {challan.items.map(itemId => {
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

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!challan.party || challan.items.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <FaSave />
            {isEditMode ? 'Update' : 'Save'} Challan
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/transactions/challan-list')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallanForm;
