import React, { useState } from 'react';
import { FaEye, FaFileInvoiceDollar, FaFilter, FaCheck, FaPlus, FaCheckSquare } from 'react-icons/fa';
import { DataTable, Modal } from '../../components/common';
import { Button, Select, Input } from '../../components/ui';

const ChallanList = () => {
  const [challans, setChallans] = useState([
    {
      id: 1,
      challanNo: 'CH001',
      date: '2024-01-15',
      party: 'ABC Motors',
      items: ['Engine Oil', 'Brake Pads'],
      amount: 25000,
      gstFlag: 0 // GST
    },
    {
      id: 2,
      challanNo: 'CH002',
      date: '2024-01-15',
      party: 'XYZ Parts',
      items: ['Air Filter', 'Spark Plugs'],
      amount: 18500,
      gstFlag: 1 // NON-GST
    },
    {
      id: 3,
      challanNo: 'CH003',
      date: '2024-01-14',
      party: 'PQR Auto',
      items: ['Transmission Fluid'],
      amount: 32000,
      gstFlag: 0 // GST
    }
  ]);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    party: '',
    gstType: 'all' // all, gst, non-gst
  });

  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [newChallan, setNewChallan] = useState({
    challanNo: '',
    party: '',
    items: '',
    amount: '',
    gstFlag: 0
  });

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
      key: 'gstFlag',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'View',
      onClick: (challan) => {
        setSelectedChallan(challan);
        setIsViewModalOpen(true);
      },
      className: 'bg-blue-600 text-white hover:bg-blue-700'
    }
  ];

  const handleConvertToBill = () => {
    if (selectedChallans.length === 0) {
      alert('Please select challans to convert');
      return;
    }
    
    // Create bill from selected challans
    const totalAmount = selectedChallans.reduce((sum, challan) => sum + challan.amount, 0);
    const billNo = `B${String(Date.now()).slice(-3)}`;
    
    console.log('Converting challans to bill:', {
      billNo,
      challans: selectedChallans.map(c => c.challanNo),
      totalAmount
    });
    
    // Remove converted challans
    setChallans(prev => prev.filter(challan => 
      !selectedChallans.some(selected => selected.id === challan.id)
    ));
    
    setSelectedChallans([]);
    setIsConvertModalOpen(false);
    alert(`Bill ${billNo} created successfully!`);
  };

  const handleCreateChallan = () => {
    const challan = {
      id: challans.length + 1,
      challanNo: newChallan.challanNo || `CH${String(Date.now()).slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      party: newChallan.party,
      items: newChallan.items.split(',').map(item => item.trim()),
      amount: parseFloat(newChallan.amount) || 0,
      gstFlag: parseInt(newChallan.gstFlag)
    };
    
    setChallans(prev => [...prev, challan]);
    setNewChallan({ challanNo: '', party: '', items: '', amount: '', gstFlag: 0 });
    setIsCreateModalOpen(false);
    alert(`Challan ${challan.challanNo} created successfully!`);
  };

  // Apply filters
  const filteredChallans = challans.filter(challan => {
    if (filters.gstType !== 'all') {
      const isGst = filters.gstType === 'gst';
      if ((challan.gstFlag === 0) !== isGst) return false;
    }
    
    if (filters.party && !challan.party.toLowerCase().includes(filters.party.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <Select
              value={filters.gstType}
              onChange={(value) => setFilters(prev => ({ ...prev, gstType: value }))}
            >
              <option value="all">All</option>
              <option value="gst">GST</option>
              <option value="non-gst">Non GST</option>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => setFilters({
                dateFrom: '',
                dateTo: '',
                party: '',
                gstType: 'all'
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <DataTable
        columns={columns}
        data={filteredChallans}
        actions={actions}
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Challan Details - ${selectedChallan?.challanNo}`}
        size="lg"
      >
        {selectedChallan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Challan No</label>
                <p className="text-gray-900">{selectedChallan.challanNo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{new Date(selectedChallan.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Party</label>
                <p className="text-gray-900">{selectedChallan.party}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-gray-900">₹{selectedChallan.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedChallan.gstFlag === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedChallan.gstFlag}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
              <ul className="list-disc list-inside space-y-1">
                {selectedChallan.items.map((item, index) => (
                  <li key={index} className="text-gray-900">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
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
            <Input
              value={newChallan.challanNo}
              onChange={(value) => setNewChallan(prev => ({ ...prev, challanNo: value }))}
              placeholder="Auto-generated if empty"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <Input
              value={newChallan.party}
              onChange={(value) => setNewChallan(prev => ({ ...prev, party: value }))}
              placeholder="Enter party name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items *</label>
            <Input
              value={newChallan.items}
              onChange={(value) => setNewChallan(prev => ({ ...prev, items: value }))}
              placeholder="Enter items separated by commas"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <Input
              type="number"
              value={newChallan.amount}
              onChange={(value) => setNewChallan(prev => ({ ...prev, amount: value }))}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select
              value={newChallan.gstFlag}
              onChange={(value) => setNewChallan(prev => ({ ...prev, gstFlag: parseInt(value) }))}
            >
              <option value={0}>0 </option>
              <option value={1}>1 </option>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateChallan}
              disabled={!newChallan.party || !newChallan.items || !newChallan.amount}
              className="flex items-center gap-2"
            >
              <FaPlus />
              Create Challan
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewChallan({ challanNo: '', party: '', items: '', amount: '', gstFlag: 0 });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChallanList;