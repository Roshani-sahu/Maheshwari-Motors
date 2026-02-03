import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFileInvoiceDollar, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { DataTable, Button, Select, FormField } from '../ui';
import useStore from '../../store';
import { formatCurrency, formatDate, calculateGST, generateInvoiceNumber } from '../../utils';

const ChallanBillPosting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedFirm, firms, showToast, showConfirm } = useStore();
  
  const [selectedFirm2, setSelectedFirm2] = useState(selectedFirm?.id || '');
  const [selectedParty, setSelectedParty] = useState('');
  const [availableChallans, setAvailableChallans] = useState([]);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [billPreview, setBillPreview] = useState(null);

  // Mock data
  const [parties] = useState([
    { id: 1, name: 'ABC Motors', type: 'Customer', gstNo: '27ABCDE1234F1Z5' },
    { id: 2, name: 'XYZ Parts', type: 'Customer', gstNo: '' },
    { id: 3, name: 'PQR Garage', type: 'Customer', gstNo: '27PQRST5678G2A1' }
  ]);

  const [mockChallans] = useState([
    {
      id: 1,
      challanNo: 'CH001',
      date: '2025-01-15',
      party: 'ABC Motors',
      items: [
        { name: 'Engine Oil 5W-30', quantity: 2, rate: 450, amount: 900 },
        { name: 'Air Filter', quantity: 1, rate: 350, amount: 350 }
      ],
      totalAmount: 1250,
      status: 'Approved',
      firmId: 2
    },
    {
      id: 2,
      challanNo: 'CH002',
      date: '2025-01-15',
      party: 'ABC Motors',
      items: [
        { name: 'Brake Pad Set', quantity: 1, rate: 1200, amount: 1200 }
      ],
      totalAmount: 1200,
      status: 'Approved',
      firmId: 2
    },
    {
      id: 3,
      challanNo: 'CH004',
      date: '2025-01-14',
      party: 'XYZ Parts',
      items: [
        { name: 'Spark Plug Set', quantity: 4, rate: 150, amount: 600 }
      ],
      totalAmount: 600,
      status: 'Approved',
      firmId: 1
    }
  ]);

  useEffect(() => {
    // Load pre-selected challans from navigation state
    if (location.state?.selectedChallans) {
      setSelectedChallans(location.state.selectedChallans);
    }
  }, [location.state]);

  useEffect(() => {
    // Filter available challans based on firm and party
    let filtered = mockChallans.filter(challan => 
      challan.status === 'Approved' &&
      challan.firmId === parseInt(selectedFirm2)
    );

    if (selectedParty) {
      filtered = filtered.filter(challan => challan.party === selectedParty);
    }

    setAvailableChallans(filtered);
  }, [selectedFirm2, selectedParty, mockChallans]);

  useEffect(() => {
    // Generate bill preview when challans are selected
    if (selectedChallans.length > 0) {
      generateBillPreview();
    } else {
      setBillPreview(null);
    }
  }, [selectedChallans, selectedFirm2]);

  const generateBillPreview = () => {
    const party = parties.find(p => p.name === selectedChallans[0]?.party);
    const firm = firms.find(f => f.id === parseInt(selectedFirm2));
    
    if (!party || !firm) return;

    // Combine all items from selected challans
    const allItems = selectedChallans.flatMap(challan => 
      challan.items.map(item => ({
        ...item,
        challanNo: challan.challanNo
      }))
    );

    const subtotal = allItems.reduce((sum, item) => sum + item.amount, 0);
    
    let billData = {
      billNo: generateInvoiceNumber(firm.name.substring(0, 3).toUpperCase(), 'B', 1),
      date: formatDate(new Date()),
      party: party.name,
      partyGst: party.gstNo,
      firm: firm.name,
      firmType: firm.type,
      items: allItems,
      subtotal,
      gstDetails: null,
      total: subtotal
    };

    // Calculate GST if applicable
    if (firm.type === 'GST' && party.gstNo) {
      const gstCalc = calculateGST(subtotal);
      billData.gstDetails = gstCalc;
      billData.total = gstCalc.totalAmount;
    }

    setBillPreview(billData);
  };

  const handleFirmChange = (firmId) => {
    setSelectedFirm2(firmId);
    setSelectedParty('');
    setSelectedChallans([]);
  };

  const handlePartyChange = (partyName) => {
    setSelectedParty(partyName);
    setSelectedChallans([]);
  };

  const handleGenerateBill = () => {
    if (selectedChallans.length === 0) {
      showToast('Please select at least one challan', 'error');
      return;
    }

    const firm = firms.find(f => f.id === parseInt(selectedFirm2));
    const party = parties.find(p => p.name === selectedParty);

    // Validation for GST/Non-GST mixing
    if (firm?.type === 'GST' && !party?.gstNo) {
      showConfirm(
        'This party does not have GST number. Generate Non-GST bill?',
        () => {
          proceedWithBillGeneration();
        }
      );
      return;
    }

    proceedWithBillGeneration();
  };

  const proceedWithBillGeneration = () => {
    // Mock bill generation
    showToast('Bill generated successfully!', 'success');
    
    // Navigate to bill view or list
    setTimeout(() => {
      navigate('/universal-reports');
    }, 1500);
  };

  const challanColumns = [
    {
      key: 'challanNo',
      label: 'Challan No.'
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'items',
      label: 'Items',
      render: (items) => `${items.length} items`
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (value) => formatCurrency(value)
    }
  ];

  const selectedPartyData = parties.find(p => p.name === selectedParty);
  const selectedFirmData = firms.find(f => f.id === parseInt(selectedFirm2));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan to Bill Posting</h1>
          <p className="text-gray-600">Convert approved challans to bills</p>
        </div>
      </div>

      {/* Selection Form */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Select Firm" required>
            <Select
              value={selectedFirm2}
              onChange={handleFirmChange}
              options={firms.map(firm => ({
                value: firm.id.toString(),
                label: `${firm.name} (${firm.type})`
              }))}
              placeholder="Select Firm"
            />
          </FormField>
          
          <FormField label="Select Party" required>
            <Select
              value={selectedParty}
              onChange={handlePartyChange}
              options={parties.map(party => ({
                value: party.name,
                label: `${party.name} ${party.gstNo ? '(GST)' : '(Non-GST)'}`
              }))}
              placeholder="Select Party"
              disabled={!selectedFirm2}
            />
          </FormField>
        </div>

        {/* GST Warning */}
        {selectedFirmData?.type === 'GST' && selectedPartyData && !selectedPartyData.gstNo && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Warning: GST firm selected but party has no GST number. Bill will be generated as Non-GST.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Available Challans */}
      {selectedParty && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">
              Available Challans for {selectedParty}
            </h3>
          </div>
          
          {availableChallans.length > 0 ? (
            <DataTable
              data={availableChallans}
              columns={challanColumns}
              selectable={true}
              onSelectionChange={setSelectedChallans}
              className="border-0"
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              No approved challans found for the selected party and firm.
            </div>
          )}
        </div>
      )}

      {/* Bill Preview */}
      {billPreview && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Bill Preview</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Bill Details</h4>
                <p className="text-sm text-gray-600">Bill No: {billPreview.billNo}</p>
                <p className="text-sm text-gray-600">Date: {billPreview.date}</p>
                <p className="text-sm text-gray-600">Firm: {billPreview.firm} ({billPreview.firmType})</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Party Details</h4>
                <p className="text-sm text-gray-600">Name: {billPreview.party}</p>
                <p className="text-sm text-gray-600">
                  GST: {billPreview.partyGst || 'Not Available'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-left">Challan</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {billPreview.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-gray-600">{item.challanNo}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.rate)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">{formatCurrency(billPreview.subtotal)}</span>
                  </div>
                  
                  {billPreview.gstDetails && (
                    <>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">CGST (9%):</span>
                        <span className="text-sm">{formatCurrency(billPreview.gstDetails.cgst)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">SGST (9%):</span>
                        <span className="text-sm">{formatCurrency(billPreview.gstDetails.sgst)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between py-2 border-t font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(billPreview.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/challan-list')}
        >
          <FaTimes className="mr-2 text-xs" />
          Cancel
        </Button>
        
        <Button
          onClick={handleGenerateBill}
          disabled={selectedChallans.length === 0}
        >
          <FaFileInvoiceDollar className="mr-2 text-xs" />
          Generate Bill
        </Button>
      </div>
    </div>
  );
};

export default ChallanBillPosting;