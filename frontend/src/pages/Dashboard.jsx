import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBuilding,
  FaFileInvoiceDollar, 
  FaExclamationTriangle, 
  FaCalendarDay,
  // FaToggleOn,
  // FaToggleOff
} from 'react-icons/fa';
import useStore from '../store';
import { StatsCard, Toggle } from '../components/common';
import { formatCurrency, formatDate } from '../utils';
import { firmAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedFirm, setLoading, showToast } = useStore();
  
  const [dashboardData, setDashboardData] = useState({
    totalFirms: 0,
    todaysChallans: 0,
    todaysBills: 0,
    thisMonthBills: 0,
    lowStockAlerts: 0
  });

  const [billPeriod, setBillPeriod] = useState('today'); // today | month

  const [recentChallans, setRecentChallans] = useState([]);
  const [recentBills, setRecentBills] = useState([]);

  useEffect(() => {
    if (selectedFirm?._id || selectedFirm?.id) {
       loadDashboardData();
    }
  }, [selectedFirm]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const firmId = selectedFirm._id || selectedFirm.id;
      const response = await firmAPI.getDashboard(firmId);
      const data = response.data?.data;
      if (data) {
        setDashboardData({
            totalFirms: data.totalFirms || 0, // This might differ if dashboard is per firm
            todaysChallans: data.todaysChallans || 0,
            todaysBills: data.todaysBills || 0,
            thisMonthBills: data.thisMonthBills || 0,
            lowStockAlerts: data.lowStockAlerts || 0
        });
        setRecentChallans(data.recentChallans || []);
        setRecentBills(data.recentBills || []);
      }
    } catch (error) {
      // showToast('Failed to load dashboard data', 'error'); 
      // Silently fail or minimal error if backend endpoint is not ready
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
  <StatsCard
    title="Total Firms"
    value={dashboardData.totalFirms}
    subtitle="Click to manage"
    icon={FaBuilding}
    color="blue"
    onClick={() => navigate('/masters/firm-master')}
    className="p-3 sm:p-4 md:p-6"
  />
  
  <StatsCard
    title="Total Challans"
    value={dashboardData.todaysChallans}
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
      {billPeriod === 'today' ? dashboardData.todaysBills : dashboardData.thisMonthBills}
    </p>
  </div>
  
  <StatsCard
    title="Low Stock Alerts"
    value={dashboardData.lowStockAlerts}
    subtitle="Below threshold"
    icon={FaExclamationTriangle}
    color="red"
    onClick={() => navigate('/masters/stock-alert-master')}
    className="p-3 sm:p-4 md:p-6"
  />
</div> 
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Recent Challans</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentChallans.map((challan) => (
              <div key={challan.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{challan.id}</span>
                  <span className="text-gray-600 ml-2">{challan.party}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(challan.amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(challan.date))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Recent Bills</h3>
          </div>
          <div className="p-4 space-y-3">
            {recentBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{bill.id}</span>
                  <span className="text-gray-600 ml-2">{bill.party}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(bill.amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(bill.date))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;