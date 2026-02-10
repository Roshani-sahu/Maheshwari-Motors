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
  
  const [dashboardData, setDashboardData] = useState({
    totalFirms: 3,
    todaysChallans: 12,
    todaysBills: 8,
    thisMonthBills: 32,
    lowStockAlerts: 15
  });

  const [billPeriod, setBillPeriod] = useState('today'); // today | month

const { challans, bills } = useStore();

// Dummy fallbacks for dashboard when store has fewer items
const dummyChallans = [
  { id: 'CHD101', challanNo: 'CHD101', party: 'Demo Motors', amount: 12500, date: '2025-02-09', status: 'Generated' },
  { id: 'CHD102', challanNo: 'CHD102', party: 'Sample Autos', amount: 9800, date: '2025-02-08', status: 'Generated' },
  { id: 'CHD103', challanNo: 'CHD103', party: 'Test Garage', amount: 7600, date: '2025-02-07', status: 'Billed' }
];

const dummyBills = [
  { id: 'BD101', billNo: 'BD101', party: 'Demo Motors', amount: 12500, date: '2025-02-09' },
  { id: 'BD102', billNo: 'BD102', party: 'Sample Autos', amount: 9800, date: '2025-02-08' }
];

const maxItems = 5;

const storeRecentChallans = (challans || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
let recentChallans = storeRecentChallans.slice(0, maxItems);
if (recentChallans.length < maxItems) {
  const needed = maxItems - recentChallans.length;
  const toAdd = dummyChallans
    .filter(dc => !recentChallans.some(rc => (rc.challanNo || rc.id) === (dc.challanNo || dc.id)))
    .slice(0, needed);
  recentChallans = [...recentChallans, ...toAdd];
}

const storeRecentBills = (bills || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
let recentBills = storeRecentBills.slice(0, maxItems);
if (recentBills.length < maxItems) {
  const needed = maxItems - recentBills.length;
  const toAdd = dummyBills
    .filter(db => !recentBills.some(rb => (rb.billNo || rb.id) === (db.billNo || db.id)))
    .slice(0, needed);
  recentBills = [...recentBills, ...toAdd];
}

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
              <div key={challan.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{challan.challanNo || challan.id}</span>
                  <span className="text-gray-600 ml-2">{challan.party}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{formatCurrency(challan.amount)}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(challan.date))}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${challan.status === 'Billed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {challan.status === 'Billed' ? 'Converted' : 'Not Converted'}
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
              <div key={bill.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{bill.billNo || bill.id}</span>
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