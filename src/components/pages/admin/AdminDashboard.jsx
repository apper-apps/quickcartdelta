import React, { useState, useEffect } from 'react';
import { ApperIcon } from '@/components/ApperIcon';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalOrders: 156,
    totalRevenue: 23450.50,
    totalProducts: 89,
    totalUsers: 342,
    pendingOrders: 12,
    lowStockItems: 7
  });
  
  const [recentOrders, setRecentOrders] = useState([
    { id: 1, customer: 'John Smith', total: 89.99, status: 'pending', time: '2 min ago' },
    { id: 2, customer: 'Sarah Johnson', total: 156.50, status: 'processing', time: '15 min ago' },
    { id: 3, customer: 'Mike Wilson', total: 234.00, status: 'completed', time: '1 hour ago' }
  ]);

  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, type: 'warning', message: '7 products are running low on stock', priority: 'medium' },
    { id: 2, type: 'info', message: 'Daily backup completed successfully', priority: 'low' },
    { id: 3, type: 'error', message: 'Payment gateway latency detected', priority: 'high' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'refresh':
        toast.info('Dashboard data refreshed');
        break;
      case 'export':
        toast.success('Report exported successfully');
        break;
      case 'settings':
        toast.info('Opening system settings');
        break;
      default:
        toast.info(`Executing ${action}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuickAction('refresh')}
            className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ApperIcon name="RefreshCw" size={20} />
          </button>
          <button
            onClick={() => handleQuickAction('export')}
            className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ApperIcon name="Download" size={20} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="ShoppingCart" size={20} className="text-blue-600" />
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="DollarSign" size={20} className="text-green-600" />
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="Package" size={20} className="text-purple-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</div>
          <div className="text-sm text-gray-600">Products</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="Users" size={20} className="text-indigo-600" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</div>
          <div className="text-sm text-gray-600">Users</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="Clock" size={20} className="text-yellow-600" />
            <span className="text-xs text-gray-500">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.pendingOrders}</div>
          <div className="text-sm text-gray-600">Orders</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
            <span className="text-xs text-gray-500">Alert</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.lowStockItems}</div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <button 
                onClick={() => toast.info('Navigate to orders page')}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{order.customer}</div>
                    <div className="text-sm text-gray-600">${order.total} • {order.time}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <button 
                    onClick={() => toast.info(`View order #${order.id}`)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded"
                  >
                    <ApperIcon name="ExternalLink" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
              <button 
                onClick={() => toast.info('Mark all as read')}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Mark All Read
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start">
                    <ApperIcon 
                      name={alert.type === 'error' ? 'AlertCircle' : alert.type === 'warning' ? 'AlertTriangle' : 'Info'} 
                      size={16} 
                      className="mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs mt-1 opacity-75">Priority: {alert.priority}</div>
                    </div>
                    <button 
                      onClick={() => toast.success('Alert dismissed')}
                      className="ml-2 opacity-50 hover:opacity-100"
                    >
                      <ApperIcon name="X" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => handleQuickAction('add-product')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:brightness-110 transition-all duration-200"
          >
            <ApperIcon name="Plus" size={20} className="mr-2" />
            Add Product
          </button>
          <button 
            onClick={() => handleQuickAction('process-orders')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:brightness-110 transition-all duration-200"
          >
            <ApperIcon name="CheckCircle" size={20} className="mr-2" />
            Process Orders
          </button>
          <button 
            onClick={() => handleQuickAction('view-analytics')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:brightness-110 transition-all duration-200"
          >
            <ApperIcon name="BarChart3" size={20} className="mr-2" />
            Analytics
          </button>
          <button 
            onClick={() => handleQuickAction('settings')}
            className="flex items-center justify-center p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:brightness-110 transition-all duration-200"
          >
            <ApperIcon name="Settings" size={20} className="mr-2" />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;