import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaFileInvoiceDollar, 
  FaExclamationTriangle, 
  FaWallet, 
  FaBoxes,
  FaChartLine,
  FaArrowRight,
  FaCalendarDay
} from 'react-icons/fa';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils';

const DashboardWidget = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  onClick, 
  trend 
}) => (
  <div 
    className={`bg-white p-6 rounded-lg border-l-4 ${color} cursor-pointer hover:shadow-md transition-shadow`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <FaArrowRight className={`transform ${
              trend.direction === 'up' ? '-rotate-45' : 'rotate-45'
            }`} />
            {trend.value}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`text-xl ${color.replace('border-l-', 'text-')}`} />
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, onClick, color }) => (
  <div 
    className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="text-white" />
      </div>
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white rounded-lg border">
    <div className="p-4 border-b">
      <h3 className="font-medium text-gray-900">Recent Activity</h3>
    </div>
    <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-3 text-sm">
          <div className={`w-2 h-2 rounded-full ${activity.color}`} />
          <span className="text-gray-600">{activity.time}</span>
          <span className="text-gray-900">{activity.description}</span>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { selectedFirm } = state;
  
  const [dashboardData, setDashboardData] = useState({
    todaysChallans: 12,
    pendingChallans: 8,
    pendingBills: 5,
    stockAlerts: 15,
    outstandingPayments: 125000,
    gstSummary: {
      collected: 45000,
      paid: 38000,
      balance: 7000
    }
  });

  const [recentActivities] = useState([
    { time: '10:30 AM', description: 'Challan #CH001 created for ABC Motors', color: 'bg-green-500' },
    { time: '09:45 AM', description: 'Payment received from XYZ Parts', color: 'bg-blue-500' },
    { time: '09:15 AM', description: 'Bill #B001 generated', color: 'bg-purple-500' },
    { time: '08:30 AM', description: 'Stock updated for Engine Oil', color: 'bg-yellow-500' },
    { time: '08:00 AM', description: 'Daily backup completed', color: 'bg-gray-500' }
  ]);

  const quickActions = [
    {
      title: 'New Challan',
      description: 'Create delivery challan',
      icon: FaFileInvoiceDollar,
      color: 'bg-blue-600',
      onClick: () => navigate('/generate-challan')
    },
    {
      title: 'New Sale',
      description: 'Record sale transaction',
      icon: FaWallet,
      color: 'bg-green-600',
      onClick: () => navigate('/sale-entry')
    },
    {
      title: 'Stock Check',
      description: 'View inventory status',
      icon: FaBoxes,
      color: 'bg-purple-600',
      onClick: () => navigate('/inventory-reports')
    },
    {
      title: 'Reports',
      description: 'Generate business reports',
      icon: FaChartLine,
      color: 'bg-orange-600',
      onClick: () => navigate('/universal-reports')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with {selectedFirm?.name || 'your business'} today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaCalendarDay />
          {formatDate(new Date())}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="Today's Challans"
          value={dashboardData.todaysChallans}
          subtitle="2 pending approval"
          icon={FaFileInvoiceDollar}
          color="border-l-blue-500"
          onClick={() => navigate('/challan-list')}
          trend={{ direction: 'up', value: '+15%' }}
        />
        
        <DashboardWidget
          title="Pending Bills"
          value={dashboardData.pendingBills}
          subtitle="Ready to generate"
          icon={FaExclamationTriangle}
          color="border-l-yellow-500"
          onClick={() => navigate('/challan-posting')}
        />
        
        <DashboardWidget
          title="Outstanding Payments"
          value={formatCurrency(dashboardData.outstandingPayments)}
          subtitle="From 8 customers"
          icon={FaWallet}
          color="border-l-red-500"
          onClick={() => navigate('/payment-status')}
          trend={{ direction: 'down', value: '-5%' }}
        />
        
        <DashboardWidget
          title="Stock Alerts"
          value={dashboardData.stockAlerts}
          subtitle="Below reorder level"
          icon={FaBoxes}
          color="border-l-purple-500"
          onClick={() => navigate('/inventory-reports')}
        />
      </div>

      {/* GST Summary (only for GST firms) */}
      {selectedFirm?.type === 'GST' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-gray-900 mb-4">GST Summary - Current Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">GST Collected</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(dashboardData.gstSummary.collected)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">GST Paid</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(dashboardData.gstSummary.paid)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(dashboardData.gstSummary.balance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
};

export default Dashboard;