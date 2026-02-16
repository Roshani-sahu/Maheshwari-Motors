import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding,
  FaFileInvoiceDollar, 
  FaExclamationTriangle, 
  FaCalendarDay,
  FaArrowRight,
  // FaToggleOn,
  // FaToggleOff
} from 'react-icons/fa';
import useStore from '../store';
import { StatsCard, Toggle } from '../components/common';
import { formatCurrency, formatDate } from '../utils';

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedFirm } = useStore();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [billPeriod, setBillPeriod] = useState('today'); // today | month

  /* REMOVED DUMMY DATA */

  const { 
    challans, setChallans, 
    bills, setBills, 
    setItems, // to update global state
    user, setFirm,
  } = useStore();

  // Redirect Admin to User Master
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/masters/user-master');
    }
  }, [user, navigate]);

  const [recentChallans, setRecentChallans] = useState([]);
  const [recentBills, setRecentBills] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Avoid fetching if no user or if user is admin (who shouldn't see this dashboard data)
      if (!user || user.role === 'admin') {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Ensure firm selection
        let currentFirmId = selectedFirm?.id;
        if (!currentFirmId) {
             // Fallback: Default to 'gst' or fetch from profile
             // For simplify, let's assume 'gst' is safe default if not set, 
             // or fetch firms.
             const firmRes = await import('../services/api').then(m => m.firmAPI.getAll());
             if (firmRes.data.data?.length > 0) {
                 const defaultFirm = firmRes.data.data[0];
                 setFirm(defaultFirm);
                 currentFirmId = defaultFirm.id;
             }
        }

        // Fetch All Data
        const api = await import('../services/api');
        const [challanRes, billRes, itemRes] = await Promise.all([
            api.challanAPI.getAll(currentFirmId),
            api.billAPI.getAll(currentFirmId),
            api.itemAPI.getAll(currentFirmId)
        ]);

        const fetchedChallans = Array.isArray(challanRes.data?.data) ? challanRes.data.data : (Array.isArray(challanRes.data) ? challanRes.data : []);
        const fetchedBills = Array.isArray(billRes.data?.data) ? billRes.data.data : (Array.isArray(billRes.data) ? billRes.data : []);
        const fetchedItems = Array.isArray(itemRes.data?.data) ? itemRes.data.data : (Array.isArray(itemRes.data) ? itemRes.data : []);

        // Update Store
        setChallans(fetchedChallans); // The store expects arrays
        setBills(fetchedBills);
        setItems(fetchedItems);

        // Calculate Dashboard Stats
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();

        const todaysChallansCount = fetchedChallans.filter(c => (c.created_at || c.date)?.startsWith(todayStr)).length;
        const todaysBillsCount = fetchedBills.filter(b => (b.created_at || b.date)?.startsWith(todayStr)).length;
        const monthBillsCount = fetchedBills.filter(b => new Date(b.created_at || b.date).getMonth() === currentMonth).length;
        
        // Low Stock Logic: stock < threshold (default threshold is 0 if undefined, or check item logic)
        // Adjust logic based on your Item model: threshold is optional. Maybe default to 5?
        const lowStockCount = fetchedItems.filter(item => {
             const limit = item.threshold || 5; 
             const stock = item.physical_stock || (item.gst_stock + item.nongst_stock) || 0;
             return stock < limit;
        }).length;

        setDashboardData({
            totalFirms: 2, 
            todaysChallans: todaysChallansCount,
            todaysBills: todaysBillsCount,
            thisMonthBills: monthBillsCount,
            lowStockAlerts: lowStockCount
        });

        // Set Local Recent Lists (Sorted by Date Descending)
        setRecentChallans([...fetchedChallans].sort((a,b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 5));
        setRecentBills([...fetchedBills].sort((a,b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 5));

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedFirm, setChallans, setBills, setItems, setFirm]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
     {/* Header */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
    <p className="text-gray-600 text-xs sm:text-sm">
      Welcome back! Here's your business overview for {selectedFirm?.name || 'your firm'}.
    </p>
  </div>
  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
    <FaCalendarDay className="text-sm sm:text-base" />
    {formatDate(new Date())}
  </div>
</div>

     {/* Top 4 Stat Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

  
  <StatsCard
    title="Total Challans"
    value={dashboardData?.todaysChallans || 0}
    subtitle="Today's Challan"
    icon={FaFileInvoiceDollar}
    color="green"
    onClick={() => navigate('/transactions/challan-list')}
    className="p-3 sm:p-4 md:p-6"
  />
  
  {/* Custom Bill Card */}
  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border-l-2 sm:border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bills</p>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
          <Toggle
            checked={billPeriod === 'month'}
            onChange={() => setBillPeriod(billPeriod === 'today' ? 'month' : 'today')}
            size="sm"
          />
          <span className="text-xs text-gray-500">
            {billPeriod === 'today' ? 'Today' : 'This Month'}
          </span>
        </div>
      </div>
      <div className="p-2 sm:p-3 rounded-full bg-purple-50">
        <FaFileInvoiceDollar className="text-sm sm:text-base md:text-xl text-purple-600" />
      </div>
    </div>
    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
      {billPeriod === 'today' ? (dashboardData?.todaysBills || 0) : (dashboardData?.thisMonthBills || 0)}
    </p>
  </div>
  
  <StatsCard
    title="Low Stock Alerts"
    value={dashboardData?.lowStockAlerts || 0}
    subtitle="Below threshold"
    icon={FaExclamationTriangle}
    color="red"
    onClick={() => navigate('/inventory/stock-alert-master')}
    className="p-3 sm:p-4 md:p-6"
  />
</div> 
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Recent Challans</h3>
            <button 
              onClick={() => navigate('/transactions/challan-list')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View
              <FaArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {recentChallans.map((challan) => (
              <div key={challan._id || challan.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{challan.challan_no || challan.id}</span>
                  <span className="text-gray-600 ml-2">{challan.party_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(challan.total_amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(challan.date))}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${challan.is_billed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {challan.is_billed ? 'Converted' : 'Not Converted'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Recent Bills</h3>
            <button 
              onClick={() => navigate('/transactions/bill-list')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View
              <FaArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {recentBills.map((bill) => (
              <div key={bill._id || bill.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{bill.bill_no || bill.id}</span>
                  <span className="text-gray-600 ml-2">{bill.party_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(bill.total_amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(bill.date))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;