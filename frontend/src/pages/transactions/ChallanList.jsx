import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoiceDollar, FaCheck, FaPlus, FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import { DataTable, Modal, DeleteConfirmDialog } from '../../components/common';
import { Button } from '../../components/ui';
import useStore from '../../store';
import api from '../../services/axiosInstance';

const ChallanList = () => {
  const navigate = useNavigate();
  const { showToast, selectedFirm } = useStore();
  const [challans, setChallans] = useState([]);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedChallans, setSelectedChallans] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, challan: null });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/challans', { 
          params: { page: 1, limit: 200, ...(selectedFirm?.id ? { firmId: selectedFirm.id } : {}) } 
        });

        const getList = (res) => {
          const val = res.data;
          if (Array.isArray(val)) return val;
          if (val?.data && Array.isArray(val.data)) return val.data;
          if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
          if (val?.data?.docs && Array.isArray(val.data.docs)) return val.data.docs;
          if (val?.docs && Array.isArray(val.docs)) return val.docs;
          return [];
        };

        const challansData = getList(response).map(c => ({
          id: c._id || c.id,
          challanNo: c.challan_no || c.challanNo,
          date: c.date,
          partyId: c.party_id?._id || c.party_id,
          party: c.party_id?.name || c.party_name || 'Unknown',
          items: c.items?.map(i => (i.item_id?.item_name || i.item_name || 'Item')) || [],
          amount: c.amount,
          gstType: c.is_gst
        }));

        setChallans(challansData);
      } catch (err) {
        console.error('Failed to fetch challans', err);
      }
    };
    fetchData();
  }, [selectedFirm?.id]);

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
      onClick: (challan) => navigate(`/transactions/challans/edit/${challan.id}`),
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
      
      await api.post('/bills', payload);
      showToast('Bill created successfully', 'success');
      
      const cRes = await api.get('/challans', { params: { firmId: selectedFirm?.id } });
      const cVal = cRes.data?.data;
      const cListRaw = Array.isArray(cVal) ? cVal : (cVal?.data || []);

      const activeChallans = cListRaw
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challan List</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Manage delivery challans</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => navigate('/transactions/challans/create')}
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

      <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
        <DataTable
          columns={columns}
          data={challans}
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

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, challan: null })}
        onConfirm={async () => {
          try {
            await api.delete(`/challans/${deleteDialog.challan.id}`);
            showToast('Challan deleted successfully', 'success');
            setChallans(prev => prev.filter(c => c.id !== deleteDialog.challan.id));
            setDeleteDialog({ isOpen: false, challan: null });
          } catch (error) {
            showToast('Failed to delete challan', 'error');
          }
        }}
        itemName={deleteDialog.challan?.challanNo}
      />

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
