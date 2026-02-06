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

  const [recentChallans] = useState([
    { id: 'CH001', party: 'ABC Motors', amount: 25000, date: '2024-01-15' },
    { id: 'CH002', party: 'XYZ Parts', amount: 18500, date: '2024-01-15' },
    { id: 'CH003', party: 'PQR Auto', amount: 32000, date: '2024-01-14' },
    { id: 'CH004', party: 'LMN Garage', amount: 15000, date: '2024-01-14' },
    { id: 'CH005', party: 'RST Motors', amount: 28000, date: '2024-01-13' }
  ]);

  const [recentBills] = useState([
    { id: 'B001', party: 'ABC Motors', amount: 25000, date: '2024-01-15' },
    { id: 'B002', party: 'XYZ Parts', amount: 18500, date: '2024-01-15' },
    { id: 'B003', party: 'PQR Auto', amount: 32000, date: '2024-01-14' },
    { id: 'B004', party: 'LMN Garage', amount: 15000, date: '2024-01-14' },
    { id: 'B005', party: 'RST Motors', amount: 28000, date: '2024-01-13' }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's your business overview for {selectedFirm?.name || 'your firm'}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaCalendarDay />
          {formatDate(new Date())}
        </div>
      </div>


      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Firms"
          value={dashboardData.totalFirms}
          subtitle="Click to manage"
          icon={FaBuilding}
          color="blue"
          onClick={() => navigate('/masters/firm-master')}
        />
        
         <StatsCard
          title="Total Challans"
          value={dashboardData.todaysChallans}
          subtitle="Today's Challan"
          icon={FaFileInvoiceDollar}
          color="green"
          onClick={() => navigate('/transactions/challan-list')}
        />
        {/* <div className="bg-white p-6 rounded-lg border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between ">
            <div>
              <p className="text-sm font-medium text-gray-600"></p>
            </div>
            <div className="p-3 rounded-full bg-green-50">
              <FaFileInvoiceDollar className="text-xl text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardData.todaysChallans}
          </p>
          
        </div>
         */}
        
        <div className="bg-white p-6 rounded-lg border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bills</p>
              <div className="flex items-center gap-3 mt-2">
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
            <div className="p-3 rounded-full bg-purple-50">
              <FaFileInvoiceDollar className="text-xl text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
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