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
import useStore from '../../store';
import { StatsCard, Toggle } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils';

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
      if (!user || user.role === 'admin') {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        let currentFirmId = selectedFirm?.id;
        
        // Fallback for firm selection
        const api = (await import('../../services/axiosInstance')).default;
        
        if (!currentFirmId) {
             const response = await api.get('/auth/me');
             const userProfile = response.data?.data;
             // Construct firms from profile
             const firms = [];
             if (userProfile?.gst_firm) firms.push({ ...userProfile.gst_firm, id: 'gst', type: 'GST' });
             if (userProfile?.nongst_firm) firms.push({ ...userProfile.nongst_firm, id: 'nongst', type: 'NON_GST' });

             if (firms.length > 0) {
                 const defaultFirm = firms[0];
                 setFirm(defaultFirm);
                 currentFirmId = defaultFirm.id;
             }
        }
        
        // Determine is GST mode
        const isGst = (selectedFirm?.type === 'GST' || selectedFirm?.id === 'gst' || currentFirmId === 'gst');

        // Fetch General Dashboard Data (Big Object), Items (for stock), and Alert Count
        const [dashboardRes, itemRes, alertCountRes] = await Promise.all([
             api.get('/dashboard'),
             api.get('/items', { params: { firmId: currentFirmId } }),
             api.get('/stock-alerts/count')
        ]);
        
        const data = dashboardRes.data?.data || {};
        const items = Array.isArray(itemRes.data?.data) ? itemRes.data.data : (Array.isArray(itemRes.data) ? itemRes.data : []);
        // Get alert count safely
        const alertCountVal = alertCountRes?.data?.data?.count || 0;

        // Counts based on Firm Selection
        let totalChallans = 0;
        let totalBills = 0;
        
        if (isGst) {
            totalChallans = data.counts?.gst_challans || 0;
            totalBills = data.counts?.gst_bills || 0;
        } else {
            totalChallans = data.counts?.nongst_challans || 0;
            totalBills = data.counts?.nongst_bills || 0;
        }

        setDashboardData({
            totalFirms: 2, 
            todaysChallans: totalChallans, // Using Total as per API availability
            todaysBills: totalBills,
            thisMonthBills: totalBills, // API gives total, not monthly sep. Reusing total.
            lowStockAlerts: alertCountVal
        });
        
        // Recent Lists - Backend returns mixed, we filter
        /*
        const filterRecent = (list) => (list || []).filter(item => {
             // item.is_gst might be 1/0 or string '1'/'0'
             const itemIsGstVal = Number(item.is_gst);
             const itemIsGst = itemIsGstVal === 1;
             return itemIsGst === isGst;
        });

        const recentC = filterRecent(data.recent_challans);
        const recentB = filterRecent(data.recent_bills);
        */
        
        // Use raw data to ensure transactions show up (Backend returns global list for user)
        const recentC = data.recent_challans || [];
        const recentB = data.recent_bills || [];
        
        setRecentChallans(recentC);
        setRecentBills(recentB);
        
        // Update Store
        setItems(items);

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, selectedFirm, billPeriod, setItems, setFirm]);

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
                  <div className="font-medium text-gray-900">{formatCurrency(challan.amount || 0)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(challan.date))}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${challan.converted_to_bill ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {challan.converted_to_bill ? 'Converted' : 'Not Converted'}
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
                  <span className="text-gray-600 ml-2">{bill.party_id?.name || bill.party_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(bill.amount || 0)}</div>
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