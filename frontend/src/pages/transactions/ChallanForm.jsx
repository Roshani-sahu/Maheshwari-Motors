import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTimes, FaSave, FaPrint } from 'react-icons/fa';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';
import {
  getResponseData,
  getResponseList,
  getResponseMeta,
  getEntityId,
  normalizeContact,
  normalizeItem,
  normalizeChallan
} from '../../services/apiUtils';

const ChallanForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast, selectedFirm } = useStore();
  const isEditMode = !!id;

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

  const [challan, setChallan] = useState({
    contactType: 'party',
    party: '',
    items: [],
    gstType: null,
    date: new Date().toISOString().split('T')[0],
    itemDetails: {},
    discount: 0,
    printOption: 1
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
            amount: normalized.amount,
            barcode: normalized.barcode
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

        if (isEditMode) {
          const challanRes = await api.get(`/challans/${id}`);
          const challanData = getResponseData(challanRes) || {};
          const normalizedChallan = normalizeChallan(challanData);
          const itemDetails = {};
          (challanData?.items || []).forEach((item) => {
            const itemId = getEntityId(item?.item_id || item);
            if (!itemId) return;
            itemDetails[itemId] = {
              pcs: item?.quantity || 1,
              rate: item?.rate || 0,
              disPercent: item?.discount || 0,
              spDis: item?.special_discount || 0,
              gstPercent: item?.gst_percent || 0
            };
          });

          const dateValue = challanData?.date
            ? new Date(challanData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          setChallan({
            contactType: challan.contactType,
            party: normalizedChallan.partyId,
            items: (challanData?.items || []).map((item) => getEntityId(item?.item_id || item)).filter(Boolean),
            gstType: normalizedChallan.gstType,
            date: dateValue,
            itemDetails,
            discount: challan.discount,
            printOption: challanData?.print_option || 1
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
      const items = getResponseList(response).map((item) => {
        const normalized = normalizeItem(item);
        return {
          ...item,
          id: normalized.id,
          name: normalized.itemName,
          amount: normalized.amount,
          barcode: normalized.barcode
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
            amount: normalized.amount,
            barcode: normalized.barcode
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
          gstPercent: 0,
          itemDiscount: item?.discount || 0,
          stock: item?.stock || 0,
          type: prev.gstType !== null ? prev.gstType : 0,
          remark: item?.name || '',
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
    const itemDiscount = parseFloat(details.itemDiscount || 0);
    const gstPercent = parseFloat(details.gstPercent || 0);
    const itemType = details.type !== undefined ? details.type : challan.gstType;

    const baseAmount = pcs * rate;
    const discountAmount = (baseAmount * disPercent / 100) + spDis + itemDiscount;
    const afterDiscount = baseAmount - discountAmount;
    const gstAmount = itemType === 1 ? (afterDiscount * gstPercent / 100) : 0;
    const finalAmount = afterDiscount + gstAmount;

    return {
      baseAmount,
      discountAmount,
      afterDiscount,
      gstAmount,
      finalAmount
    };
  };

  const calculateSubtotal = () => {
    return challan.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.baseAmount;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return challan.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.discountAmount;
    }, 0);
  };

  const calculateTotalGst = () => {
    return challan.items.reduce((total, itemId) => {
      const calc = calculateItemAmount(itemId);
      return total + calc.gstAmount;
    }, 0);
  };

  const calculateNetAmount = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const totalGst = calculateTotalGst();
    const extraDiscount = parseFloat(challan.discount || 0);
    return subtotal - totalDiscount - extraDiscount + totalGst;
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
      const payload = {
        challan_type: 'sale',
        date: challan.date,
        contact_id: challan.party,
        is_gst: challan.gstType,
        print_option: challan.printOption,
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
        discount: parseFloat(calculateTotalDiscount().toFixed(2))
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

  const handlePrint = () => {
    if (challan.party === '' || challan.items.length === 0) {
      showToast('Please select a party and add items before printing', 'error');
      return;
    }

    const party = (challan.contactType === 'party' ? loadedParties : loadedSuppliers).find(c => c.id === challan.party);
    
    const printContent = `
      <html>
        <head>
          <title>Challan</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              font-size: 11px;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              width: 100px;
            }
            .info-value {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .amount-section {
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
            }
            .amount-box {
              width: 250px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #ccc;
            }
            .amount-total {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-top: 2px solid #000;
              font-weight: bold;
              font-size: 13px;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              width: 180px;
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 40px;
              margin-top: 20px;
            }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CHALLAN</h1>
            <p>${selectedFirm?.name || 'Company Name'}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Date:</div>
              <div class="info-value">${new Date(challan.date).toLocaleDateString('en-IN')}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Party:</div>
              <div class="info-value">${party?.name || ''}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Type:</div>
              <div class="info-value">${challan.gstType === 1 ? 'GST' : 'Non-GST'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                ${challan.printOption === 2 ? '<th>Item Name</th>' : '<th>Barcode</th>'}
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${challan.items.map((itemId, index) => {
                const item = loadedItems.find(i => i.id === itemId);
                const details = challan.itemDetails[itemId] || {};
                const calc = calculateItemAmount(itemId);
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    ${challan.printOption === 2 
                      ? `<td>${item?.name || 'Unknown'}</td>` 
                      : `<td>${item?.barcode || '-'}</td>`
                    }
                    <td>${details.pcs || 1}</td>
                    <td>₹${parseFloat(details.rate || 0).toFixed(2)}</td>
                    <td>${details.disPercent || 0}%</td>
                    <td>₹${calc.afterDiscount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="amount-section">
            <div class="amount-box">
              <div class="amount-row">
                <span>Subtotal:</span>
                <span>₹${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div class="amount-row">
                <span>Discount:</span>
                <span>₹${calculateTotalDiscount().toFixed(2)}</span>
              </div>
              <div class="amount-total">
                <span>Total Amount:</span>
                <span>₹${calculateNetAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              <p>Authorized Signature</p>
            </div>
            <div class="signature">
              <p>Party Signature</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type *</label>
            <select
              value={challan.contactType}
              onChange={(e) => setChallan(prev => ({ ...prev, contactType: e.target.value, party: '' }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="party">Party</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {challan.contactType === 'party' ? 'Party' : 'Supplier'} *
            </label>
            <select
              value={challan.party}
              onChange={(e) => {
                const selectedId = e.target.value;
                const contacts = challan.contactType === 'party' ? loadedParties : loadedSuppliers;
                const selected = contacts.find(c => c.id === selectedId);
                setChallan(prev => ({ 
                  ...prev, 
                  party: selectedId,
                  gstType: selected ? (selected.is_gst || 0) : prev.gstType
                }));
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select {challan.contactType === 'party' ? 'Party' : 'Supplier'}</option>
              {(challan.contactType === 'party' ? loadedParties : loadedSuppliers).map(contact => (
                <option key={contact.id} value={contact.id}>{contact.name}</option>
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
            <div className="flex items-center gap-3 mt-2">
              <div 
                onClick={() => setChallan(prev => ({ ...prev, gstType: prev.gstType === 0 ? 1 : 0 }))}
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  challan.gstType === 1 ? 'bg-green-500' : challan.gstType === 0 ? 'bg-gray-300' : 'bg-gray-200'
                }`}
              >
                <div 
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                    challan.gstType === 1 ? 'translate-x-7' : 'translate-x-0'
                  }`} 
                />
              </div>
              <span className="text-sm text-gray-600">{challan.gstType === null ? '-' : challan.gstType}</span>
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
                  <th className="px-2 py-2 text-left border-r">Remark</th>
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
                {challan.items.map((itemId, index) => {
                  const item = loadedItems.find(i => i.id === itemId);
                  const details = challan.itemDetails[itemId] || {};
                  const calc = calculateItemAmount(itemId);
                  const itemType = details.type !== undefined ? details.type : challan.gstType;

                  return (
                    <tr key={itemId} className="border-t">
                      <td className="px-2 py-2 border-r">{index + 1}</td>
                      <td className="px-2 py-2 border-r">
                        <span className="text-xs">{item?.name || 'Unknown Item'}</span>
                      </td>
                      <td className="px-2 py-2 border-r">
                        <input
                          type="text"
                          value={details.remark || ''}
                          onChange={(e) => updateItemDetail(itemId, 'remark', e.target.value)}
                          className="w-32 px-1 py-1 border rounded text-xs"
                        />
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
                {challan.items.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
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
              <span className="text-sm font-medium w-32">Discount:</span>
              <input
                type="number"
                step="0.01"
                value={calculateTotalDiscount().toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Net Amount:</span>
              <input
                type="number"
                value={calculateNetAmount().toFixed(2)}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-32">Print Format:</span>
              <select
                value={challan.printOption}
                onChange={(e) => setChallan(prev => ({ ...prev, printOption: parseInt(e.target.value) }))}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                <option value={1}>Print 1 - Show Barcode</option>
                <option value={2}>Print 2 - Show Item Name</option>
              </select>
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
            onClick={handlePrint}
            disabled={!challan.party || challan.items.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FaPrint />
            Print Preview
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
