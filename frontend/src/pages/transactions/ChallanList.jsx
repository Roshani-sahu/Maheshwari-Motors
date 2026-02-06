import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaFileInvoiceDollar, FaFilter, FaCheck, FaPlus, FaCheckSquare, FaEdit, FaTrash, FaDownload, FaTimes } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Select, Input } from '../../components/ui';
import useStore from '../../store';

const ChallanList = () => {
  const { addBill, addTransaction, removeChallans } = useStore();
  const [challans, setChallans] = useState([
    {
      id: 1,
      challanNo: 'CH001',
      date: '2024-01-15',
      party: 'ABC Motors',
      items: ['Engine Oil', 'Brake Pads'],
      amount: 25000,
      gstType: 1 // 1 = GST, 0 = NON-GST
    },
    {
      id: 2,
      challanNo: 'CH002',
      date: '2024-01-15',
      party: 'XYZ Parts',
      items: ['Air Filter', 'Spark Plugs'],
      amount: 18500,
      gstType: 0
    },
    {
      id: 3,
      challanNo: 'CH003',
      date: '2024-01-14',
      party: 'PQR Auto',
      items: ['Transmission Fluid'],
      amount: 32000,
      gstType: 1
    }
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: ''
  });

  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [newChallan, setNewChallan] = useState({
    challanNo: '',
    party: '',
    items: [],
    amount: '',
    gstType: 1
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  const parties = ['ABC Motors', 'XYZ Parts', 'PQR Auto', 'LMN Garage', 'RST Motors'];
  const availableItems = ['Engine Oil', 'Brake Pads', 'Air Filter', 'Spark Plugs', 'Transmission Fluid', 'Coolant', 'Battery'];

  const columns = [
    {
      key: 'challanNo',
      label: 'Challan No'
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'party',
      label: 'Party'
    },
    {
      key: 'items',
      label: 'Items',
      render: (value) => `${value.length} item(s)`
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `₹${value.toLocaleString()}`
    },
    {
      key: 'gstType',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, challan) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingChallan({...challan});
              setIsEditModalOpen(true);
            }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete challan ${challan.challanNo}?`)) {
                setChallans(prev => prev.filter(c => c.id !== challan.id));
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <FaTrash size={14} />
          </button>
          <button
            onClick={() => {
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
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Download"
          >
            <FaDownload size={14} />
          </button>
        </div>
      )
    }
  ];

  const handleConvertToBill = () => {
    if (selectedChallans.length === 0) {
      alert('Please select challans to convert');
      return;
    }
    
    const totalAmount = selectedChallans.reduce((sum, challan) => sum + challan.amount, 0);
    const billNo = `B${String(Date.now()).slice(-3)}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('Converting challans:', selectedChallans);
    
    // Create bill
    const newBill = {
      id: Date.now(),
      billNo: billNo,
      date: currentDate,
      party: selectedChallans[0].party,
      amount: totalAmount,
      linkedChallans: selectedChallans.map(c => c.challanNo),
      gstType: selectedChallans[0].gstType
    };
    
    console.log('New bill:', newBill);
    addBill(newBill);
    
    // Add transactions
    selectedChallans.forEach(challan => {
      const transaction = {
        id: Date.now() + Math.random(),
        transactionId: `TXN${String(Date.now()).slice(-6)}`,
        type: 'Bill',
        firm: 'Current Firm',
        amount: challan.amount,
        date: currentDate,
        party: challan.party,
        gstType: challan.gstType
      };
      console.log('New transaction:', transaction);
      addTransaction(transaction);
    });
    
    // Remove converted challans
    const challanIds = selectedChallans.map(c => c.id);
    setChallans(prev => prev.filter(challan => !challanIds.includes(challan.id)));
    
    setSelectedChallans([]);
    setIsConvertModalOpen(false);
    alert(`Bill ${billNo} created successfully! Check Bill List and Transaction History.`);
  };

  const handleCreateChallan = () => {
    const challan = {
      id: challans.length + 1,
      challanNo: newChallan.challanNo || `CH${String(Date.now()).slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      party: newChallan.party,
      items: newChallan.items,
      amount: parseFloat(newChallan.amount) || 0,
      gstType: parseInt(newChallan.gstType)
    };
    
    setChallans(prev => [...prev, challan]);
    setNewChallan({ challanNo: '', party: '', items: [], amount: '', gstType: 1 });
    setIsCreateModalOpen(false);
    alert(`Challan ${challan.challanNo} created successfully!`);
  };

  const handleEditChallan = () => {
    setChallans(prev => prev.map(c => 
      c.id === editingChallan.id ? {...editingChallan, amount: parseFloat(editingChallan.amount)} : c
    ));
    setIsEditModalOpen(false);
    setEditingChallan(null);
    alert('Challan updated successfully!');
  };

  const toggleItemSelection = (item, isEditing = false) => {
    if (isEditing) {
      setEditingChallan(prev => {
        const items = prev.items.includes(item)
          ? prev.items.filter(i => i !== item)
          : [...prev.items, item];
        return { ...prev, items };
      });
    } else {
      setNewChallan(prev => {
        const items = prev.items.includes(item)
          ? prev.items.filter(i => i !== item)
          : [...prev.items, item];
        return { ...prev, items };
      });
    }
  };

  const filteredChallans = challans.filter(challan => {
    if (filters.party && !challan.party.toLowerCase().includes(filters.party.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan List</h1>
          <p className="text-gray-600">Manage delivery challans</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FaPlus />
            Create Challan
          </Button>
          <Button 
            onClick={() => setIsConvertModalOpen(true)}
            className="flex items-center gap-2"
          >
            <FaFileInvoiceDollar />
            Convert to Bill
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party
            </label>
            <input
              type="text"
              value={filters.party}
              onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
              placeholder="Search party..."
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredChallans}
        searchable={true}
        sortable={true}
        pagination={true}
        selectable={true}
        onSelectionChange={setSelectedChallans}
      />

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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <select
              value={newChallan.party}
              onChange={(e) => setNewChallan(prev => ({ ...prev, party: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Party</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
              <div className="space-y-2">
                {availableItems.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={newChallan.items.includes(item)}
                      onChange={() => toggleItemSelection(item)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            {newChallan.items.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {newChallan.items.map(item => (
                  <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {item}
                    <button onClick={() => toggleItemSelection(item)} className="hover:text-blue-900">
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={newChallan.gstType}
              onChange={(e) => setNewChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}>
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1</option>
              <option value={0}>0</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateChallan}
              disabled={!newChallan.party || newChallan.items.length === 0 || !newChallan.amount}
              className="flex items-center gap-2"
            >
              <FaPlus />
              Create Challan
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewChallan({ challanNo: '', party: '', items: [], amount: '', gstType: 1 });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Challan Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Challan"
        size="md"
      >
        {editingChallan && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan No</label>
              <input
                type="text"
                value={editingChallan.challanNo}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
              <select
                value={editingChallan.party}
                onChange={(e) => setEditingChallan(prev => ({ ...prev, party: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Party</option>
                {parties.map(party => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                <div className="space-y-2">
                  {availableItems.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={editingChallan.items.includes(item)}
                        onChange={() => toggleItemSelection(item, true)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              {editingChallan.items.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editingChallan.items.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {item}
                      <button onClick={() => toggleItemSelection(item, true)} className="hover:text-blue-900">
                        <FaTimes size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                value={editingChallan.amount}
                onChange={(e) => setEditingChallan(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={editingChallan.gstType}
                onChange={(e) => setEditingChallan(prev => ({ ...prev, gstType: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1</option>
                <option value={0}>0</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleEditChallan}
                disabled={!editingChallan.party || editingChallan.items.length === 0 || !editingChallan.amount}
                className="flex items-center gap-2"
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
    </div>
  );
};

export default ChallanList;
