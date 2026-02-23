import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaSave } from 'react-icons/fa';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';
import {
  getResponseList,
  getResponseMeta,
  getEntityId,
  normalizeContact,
  normalizeItem
} from '../../services/apiUtils';

const BillForm = () => {
  const navigate = useNavigate();
  const { showToast } = useStore();

  const [loadedParties, setLoadedParties] = useState([]);
  const [loadedSuppliers, setLoadedSuppliers] = useState([]);
  const [loadedItems, setLoadedItems] = useState([]);
  const [loadedDiscounts, setLoadedDiscounts] = useState({});
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [totalItemsPages, setTotalItemsPages] = useState(1);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const itemDropdownRef = useRef(null);

  const [bill, setBill] = useState({
    contactType: 'party',
    party: '',
    items: [],
    gstType: 0,
    date: new Date().toISOString().split('T')[0],
    itemDetails: {},
    discount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes, iRes, brandRes] = await Promise.all([
          api.get('/contacts/parties', { params: { page: 1, limit: 200 } }),
          api.get('/contacts/suppliers', { params: { page: 1, limit: 200 } }),
          api.get('/items', { params: { page: 1, limit: 50, search: '' } }),
          api.get('/brands', { params: { page: 1, limit: 200 } })
        ]);

        const partiesData = getResponseList(pRes).map((party) => {
          const normalized = normalizeContact(party);
          return { id: normalized.id, name: normalized.name, is_gst: normalized.is_gst };
        });
        const suppliersData = getResponseList(sRes).map((supplier) => {
          const normalized = normalizeContact(supplier);
          return { id: normalized.id, name: normalized.name, is_gst: normalized.is_gst, gstin: supplier.gstin || '' };
        });
        const itemsData = getResponseList(iRes).map((item) => {
          const normalized = normalizeItem(item);
          return {
            ...item,
            id: normalized.id,
            name: normalized.itemName,
            amount: normalized.amount
          };
        });

        setLoadedParties(partiesData);
        setLoadedSuppliers(suppliersData);
        setLoadedItems(itemsData);

        const brandList = getResponseList(brandRes);
        const discountMap = {};
        brandList.forEach((b) => {
          const brandId = getEntityId(b);
          if (brandId) {
            discountMap[brandId] = {
              discount1: b.discount1 || { normal: 0, special: 0 },
              discount2: b.discount2 || { normal: 0, special: 0 }
            };
          }
        });
        setLoadedDiscounts(discountMap);

        const itemsMeta = getResponseMeta(iRes);
        setTotalItemsPages(itemsMeta?.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch data', err);
        showToast('Failed to load data', 'error');
      }
    };
    fetchData();
  }, []);

  const loadItemsPage = async (page) => {
    setIsLoadingItems(true);
    try {
      const response = await api.get('/items', { params: { page, limit: 50, search: itemSearchTerm } });
      const items = getResponseList(response).map((item) => {
        const normalized = normalizeItem(item);
        return {
          ...item,
          id: normalized.id,
          name: normalized.itemName,
          amount: normalized.amount
        };
      });

      setLoadedItems(items);
      setItemsPage(page);

      const meta = getResponseMeta(response);
      setTotalItemsPages(meta?.totalPages || 1);
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
        const searchResults = getResponseList(response).map((item) => {
          const normalized = normalizeItem(item);
          return {
            ...item,
            id: normalized.id,
            name: normalized.itemName,
            amount: normalized.amount
          };
        });

        setLoadedItems(searchResults);
        setItemsPage(1);

        const meta = getResponseMeta(response);
        setTotalItemsPages(meta?.totalPages || 1);
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

  const filteredItems = loadedItems.filter(item => !bill.items.includes(item.id));

  const toggleItemSelection = (itemId) => {
    setBill(prev => {
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
          gstPercent: 0,
          itemDiscount: item?.discount || 0,
          stock: item?.stock || 0,
          type: prev.gstType !== null ? prev.gstType : 0
        };
      }

      return { ...prev, items };
    });
  };

  const calculateItemAmount = (itemId) => {
    const details = bill.itemDetails[itemId] || {};
    const pcs = parseFloat(details.pcs || 1);
    const rate = parseFloat(details.rate || 0);
    const disPercent = parseFloat(details.disPercent || 0);
    const spDis = parseFloat(details.spDis || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    const itemType = details.type !== undefined ? details.type : bill.gstType;

    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent / 100) + spDis;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = itemType === 1 ? (afterDiscount * gstPercent / 100) : 0;

    return {
      baseAmount,
      discountAmount,
      afterDiscount,
      gstAmount
    };
  };

  const updateItemDetail = (itemId, field, value) => {
    setBill(prev => ({
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
    return bill.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.afterDiscount;
    }, 0);
  };

  const handleSave = async () => {
    if (!bill.party) {
      showToast('Please select a party', 'error');
      return;
    }
    if (bill.items.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    try {
      // Create challan
      const challanPayload = {
        challan_type: 'sale',
        date: bill.date,
        contact_id: bill.party,
        items: bill.items.map(itemId => {
          const item = loadedItems.find(i => i.id === itemId);
          const details = bill.itemDetails[itemId] || {};
          return {
            item_id: itemId,
            quantity: Math.max(1, parseFloat(details.pcs || 1)),
            rate: Math.max(0, parseFloat(details.rate || item?.amount || 0)),
            discount: Math.max(0, parseFloat(details.disPercent || 0)),
            special_discount: Math.max(0, parseFloat(details.spDis || 0)),
            gst_percent: Math.max(0, parseFloat(details.gstPercent || 0))
          };
        }),
        discount: 0
      };

      const challanRes = await api.post('/challans', challanPayload);
      console.log(challanRes);
      const challanId = challanRes.data?._id || challanRes.data?.data?.id;

      if (!challanId) {
        throw new Error('Failed to create challan');
      }

      // Convert to bill
      try {
        const payload = {
          contact_id: bill.party,
          challan_ids: [challanId]
        };
        await api.post('/bills', payload);
      } catch (error) {
        console.log('Bill creation error:', error);
      }
      
      showToast('Bill created successfully', 'success');
      navigate('/transactions/bill-list');
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create bill';
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Bill</h1>
        <Button variant="outline" onClick={() => navigate('/transactions/bill-list')}>
          Back to List
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type *</label>
            <select
              value={bill.contactType}
              onChange={(e) => setBill(prev => ({ ...prev, contactType: e.target.value, party: '' }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="party">Party</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {bill.contactType === 'party' ? 'Party' : 'Supplier'} *
            </label>
            <select
              value={bill.party}
              onChange={(e) => {
                const selectedId = e.target.value;
                const contacts = bill.contactType === 'party' ? loadedParties : loadedSuppliers;
                const selected = contacts.find(c => c.id === selectedId);
                setBill(prev => ({ 
                  ...prev, 
                  party: selectedId,
                  gstType: selected ? (selected.is_gst || 0) : prev.gstType
                }));
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select {bill.contactType === 'party' ? 'Party' : 'Supplier'}</option>
              {(bill.contactType === 'party' ? loadedParties : loadedSuppliers).map(contact => (
                <option key={contact.id} value={contact.id}>{contact.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={bill.date}
              onChange={(e) => setBill(prev => ({ ...prev, date: e.target.value }))}
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
                  checked={bill.gstType === 0}
                  onChange={(e) => setBill(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                />
                <span className="text-sm">0</span>
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gstType"
                  value={1}
                  checked={bill.gstType === 1}
                  onChange={(e) => setBill(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
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
                  <th className="px-2 py-2 text-left border-r">Type</th>
                  <th className="px-2 py-2 text-left border-r">Stock</th>
                  <th className="px-2 py-2 text-left border-r">PCS</th>
                  <th className="px-2 py-2 text-left border-r">Rate</th>
                  <th className="px-2 py-2 text-left border-r">Dis %</th>
                  <th className="px-2 py-2 text-left border-r">SP Dis</th>
                  <th className="px-2 py-2 text-left border-r">Item Disc</th>
                  <th className="px-2 py-2 text-left border-r">GST %</th>
                  <th className="px-2 py-2 text-left border-r">GST Amt</th>
                  <th className="px-2 py-2 text-left border-r">Amount</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((itemId, index) => {
                  const item = loadedItems.find(i => i.id === itemId);
                  const details = bill.itemDetails[itemId] || {};
                  const calc = calculateItemAmount(itemId);
                  const itemType = details.type !== undefined ? details.type : bill.gstType;

                  return (
                    <tr key={itemId} className="border-t">
                      <td className="px-2 py-2 border-r">{index + 1}</td>
                      <td className="px-2 py-2 border-r">
                        <span className="text-xs">{item?.name || 'Unknown Item'}</span>
                      </td>
                      <td className="px-2 py-2 border-r">
                        <select
                          value={itemType !== null ? itemType : ''}
                          onChange={(e) => updateItemDetail(itemId, 'type', parseInt(e.target.value))}
                          className="w-12 px-1 py-1 border rounded text-xs"
                        >
                          <option value="">-</option>
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="number"
                          value={details.stock || 0}
                          onChange={(e) => updateItemDetail(itemId, 'stock', e.target.value)}
                          className="w-12 px-1 py-1 border rounded text-xs"
                        />
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
                        <input
                          type="number"
                          step="0.01"
                          value={details.itemDiscount || 0}
                          onChange={(e) => updateItemDetail(itemId, 'itemDiscount', e.target.value)}
                          className="w-16 px-1 py-1 border rounded text-xs"
                        />
                      </td>
                      {itemType === 1 ? (
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
                      ) : (
                        <>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">-</span>
                          </td>
                          <td className="px-2 py-2 border-r">
                            <span className="text-xs">-</span>
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
                {bill.items.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
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

        {bill.items.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Selected Items ({bill.items.length}):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {bill.items.map(itemId => {
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
              <span className="text-sm font-medium w-32">Discount:</span>
              <input
                type="number"
                step="0.01"
                value={bill.discount}
                onChange={(e) => setBill(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Net Amount:</span>
              <input
                type="number"
                value={(calculateTotalAmount() - bill.discount).toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!bill.party || bill.items.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <FaSave />
            Save Bill
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/transactions/bill-list')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillForm;
