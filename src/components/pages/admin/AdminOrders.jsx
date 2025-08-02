import React, { useState, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';
import Badge from '@/components/atoms/Badge';
import { toast } from 'react-toastify';
import { deliveryService } from '@/services/api/deliveryService';
const AdminOrders = () => {
  const [orders, setOrders] = useState([
    { 
      id: 1, 
      customer: 'John Smith', 
      email: 'john@example.com',
      phone: '+91-9876543210',
      total: 89.99, 
      status: 'pending', 
      date: '2024-01-15',
      items: 3,
      payment: 'COD',
      codAmount: 89.99,
      codCollected: false,
      assignedDriver: 'DRV001'
    },
    { 
      id: 2, 
      customer: 'Sarah Johnson', 
      email: 'sarah@example.com',
      phone: '+91-9876543211',
      total: 156.50, 
      status: 'delivered', 
      date: '2024-01-15',
      items: 2,
      payment: 'COD',
      codAmount: 156.50,
      codCollected: true,
      codCollectedAmount: 150.00,
      codDiscrepancy: 6.50,
      discrepancyStatus: 'pending_verification',
      customerVerificationSent: true,
      agentDeductionProcessed: false,
      assignedDriver: 'DRV002'
    },
    { 
      id: 3, 
      customer: 'Mike Wilson', 
      email: 'mike@example.com',
      phone: '+91-9876543212',
      total: 234.00, 
      status: 'delivered', 
      date: '2024-01-14',
      items: 5,
      payment: 'COD',
      codAmount: 234.00,
      codCollected: true,
      codCollectedAmount: 180.00,
      codDiscrepancy: 54.00,
      discrepancyStatus: 'auto_deducted',
      customerVerificationSent: true,
      agentDeductionProcessed: true,
      agentDeductionAmount: 54.00,
      assignedDriver: 'DRV001'
    },
    { 
      id: 4, 
      customer: 'Emma Davis', 
      email: 'emma@example.com',
      phone: '+91-9876543213',
      total: 67.25, 
      status: 'cancelled', 
      date: '2024-01-14',
      items: 1,
      payment: 'Credit Card'
    },
    {
      id: 5,
      customer: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91-9876543214',
      total: 320.00,
      status: 'delivered',
      date: '2024-01-15',
      items: 4,
      payment: 'COD',
      codAmount: 320.00,
      codCollected: true,
      codCollectedAmount: 100.00,
      codDiscrepancy: 220.00,
      discrepancyStatus: 'escalated',
      customerVerificationSent: true,
      agentDeductionProcessed: true,
      agentDeductionAmount: 220.00,
      assignedDriver: 'DRV003'
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showDiscrepancyPanel, setShowDiscrepancyPanel] = useState(false);

  // Get orders with discrepancies for quick analysis
  const discrepancyOrders = orders.filter(order => order.codDiscrepancy > 0);
  const pendingVerifications = discrepancyOrders.filter(order => order.discrepancyStatus === 'pending_verification');
  const escalatedCases = discrepancyOrders.filter(order => order.discrepancyStatus === 'escalated');

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'discrepancy' && order.codDiscrepancy > 0) ||
                         (filter === 'pending_verification' && order.discrepancyStatus === 'pending_verification') ||
                         (filter === 'escalated' && order.discrepancyStatus === 'escalated') ||
                         order.status === filter;
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone?.includes(searchTerm) ||
                         order.id.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDiscrepancyBadgeVariant = (discrepancyStatus, amount) => {
    if (!discrepancyStatus || amount === 0) return null;
    
    switch (discrepancyStatus) {
      case 'pending_verification': return 'warning';
      case 'auto_deducted': return 'success';
      case 'escalated': return 'error';
      case 'resolved': return 'success';
      default: return 'secondary';
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order #${orderId} status updated to ${newStatus}`);
  };

  const handleDiscrepancyResolution = (orderId, resolution) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { 
        ...order, 
        discrepancyStatus: resolution,
        resolvedAt: new Date().toISOString()
      } : order
    ));
    
    const resolutionMessages = {
      'customer_confirmed': 'Customer confirmed amount - discrepancy resolved',
      'agent_error': 'Agent error acknowledged - refund initiated',
      'system_error': 'System error identified - amount corrected',
      'escalated': 'Case escalated to management for review'
    };
    
    toast.success(resolutionMessages[resolution] || 'Discrepancy resolved');
  };

  const handleBulkDiscrepancyAction = (action) => {
    const discrepancyOrderIds = selectedOrders.filter(id => 
      orders.find(o => o.id === id)?.codDiscrepancy > 0
    );
    
    if (discrepancyOrderIds.length === 0) {
      toast.warning('Please select orders with discrepancies');
      return;
    }

    switch (action) {
      case 'send_verification':
        discrepancyOrderIds.forEach(id => {
          const order = orders.find(o => o.id === id);
          if (order && !order.customerVerificationSent) {
            // Send verification SMS
            toast.success(`Verification SMS sent to ${order.customer}`);
          }
        });
        break;
      case 'escalate':
        setOrders(orders.map(order => 
          discrepancyOrderIds.includes(order.id) 
            ? { ...order, discrepancyStatus: 'escalated' }
            : order
        ));
        toast.success(`${discrepancyOrderIds.length} cases escalated to management`);
        break;
      case 'bulk_resolve':
        setOrders(orders.map(order => 
          discrepancyOrderIds.includes(order.id) 
            ? { ...order, discrepancyStatus: 'resolved' }
            : order
        ));
        toast.success(`${discrepancyOrderIds.length} discrepancies marked as resolved`);
        break;
    }
    setSelectedOrders([]);
  };

  const handleBulkAction = (action) => {
    if (selectedOrders.length === 0) {
      toast.warning('Please select orders first');
      return;
    }

    switch (action) {
      case 'process':
        setOrders(orders.map(order => 
          selectedOrders.includes(order.id) && order.status === 'pending' 
            ? { ...order, status: 'processing' } 
            : order
        ));
        toast.success(`${selectedOrders.length} orders marked as processing`);
        break;
      case 'complete':
        setOrders(orders.map(order => 
          selectedOrders.includes(order.id) && order.status === 'processing' 
            ? { ...order, status: 'completed' } 
            : order
        ));
        toast.success(`${selectedOrders.length} orders completed`);
        break;
      case 'export':
        toast.success(`Exported ${selectedOrders.length} orders`);
        break;
      default:
        toast.info(`Bulk action: ${action}`);
    }
    setSelectedOrders([]);
  };
const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const handleDispatchBackup = async () => {
    try {
      // Determine most urgent zone based on current orders
      const urgentZones = filteredOrders
        .filter(order => order.priority === 'urgent' || order.status === 'pending')
        .reduce((acc, order) => {
          const zone = order.deliveryZone || 'Downtown';
          acc[zone] = (acc[zone] || 0) + 1;
          return acc;
        }, {});

      const mostUrgentZone = Object.entries(urgentZones)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Downtown';

      const zoneId = { 'Downtown': 1, 'Midtown': 2, 'Uptown': 3, 'Brooklyn': 4, 'Queens': 5 }[mostUrgentZone] || 1;

      const result = await deliveryService.executeZoneAction(zoneId, 'assign_backup');
      
      toast.success(`✅ ${result.message}`, {
        position: "top-right",
        autoClose: 4000
      });

      // Show impact details
      setTimeout(() => {
        toast.info(`📈 Impact: ${result.impact}`, {
          position: "top-right",
          autoClose: 6000
        });
      }, 1000);

    } catch (error) {
      toast.error('❌ Failed to dispatch backup personnel', {
        position: "top-right",
        autoClose: 3000
      });
      console.error('Backup dispatch error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header with Discrepancy Analytics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Management</h1>
          <p className="text-gray-600">Manage orders and handle COD discrepancies</p>
        </div>
<div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setShowDiscrepancyPanel(!showDiscrepancyPanel)}
            className="btn-secondary flex items-center"
          >
            <ApperIcon name="AlertTriangle" size={16} className="mr-2" />
            Discrepancies ({discrepancyOrders.length})
          </button>
          <button
            onClick={handleDispatchBackup}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center"
          >
            <ApperIcon name="Users" size={16} className="mr-2" />
            Dispatch Backup
          </button>
          <button
            onClick={() => toast.info('Export all orders')}
            className="btn-secondary flex items-center"
          >
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Discrepancy Overview Panel */}
      {showDiscrepancyPanel && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-800">COD Discrepancy Overview</h3>
            <button
              onClick={() => setShowDiscrepancyPanel(false)}
              className="text-red-600 hover:text-red-800"
            >
              <ApperIcon name="X" size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{discrepancyOrders.length}</div>
              <div className="text-sm text-gray-600">Total Cases</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{pendingVerifications.length}</div>
              <div className="text-sm text-gray-600">Pending Verification</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{escalatedCases.length}</div>
              <div className="text-sm text-gray-600">Escalated</div>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{discrepancyOrders.reduce((sum, order) => sum + (order.codDiscrepancy || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <ApperIcon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, email, phone, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field min-w-[160px]"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="discrepancy">Has Discrepancy</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="escalated">Escalated Cases</option>
            </select>
          </div>
        </div>

        {/* Enhanced Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('process')}
                  className="btn-primary text-sm py-1 px-3"
                >
                  Mark Processing
                </button>
                <button
                  onClick={() => handleBulkAction('complete')}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleBulkDiscrepancyAction('send_verification')}
                  className="bg-yellow-500 text-white text-sm py-1 px-3 rounded hover:bg-yellow-600"
                >
                  Send Verification
                </button>
                <button
                  onClick={() => handleBulkDiscrepancyAction('escalate')}
                  className="bg-red-500 text-white text-sm py-1 px-3 rounded hover:bg-red-600"
                >
                  Escalate
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Export Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment & COD
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discrepancy
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 ${order.codDiscrepancy > 0 ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    <div className="text-sm text-gray-500">{order.items} item{order.items > 1 ? 's' : ''}</div>
                    {order.assignedDriver && (
                      <div className="text-xs text-blue-600">{order.assignedDriver}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                    {order.phone && (
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">₹{order.total}</div>
                    <div className="text-sm text-gray-500">{order.payment}</div>
                    {order.payment === 'COD' && (
                      <div className="text-xs">
                        {order.codCollected ? (
                          <span className="text-green-600">
                            Collected: ₹{order.codCollectedAmount}
                          </span>
                        ) : (
                          <span className="text-yellow-600">
                            Due: ₹{order.codAmount}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {order.codDiscrepancy > 0 ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-red-600">
                          ₹{order.codDiscrepancy}
                        </div>
                        <Badge variant={getDiscrepancyBadgeVariant(order.discrepancyStatus, order.codDiscrepancy)}>
                          {order.discrepancyStatus?.replace('_', ' ') || 'Detected'}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs">
                          {order.customerVerificationSent && (
                            <span className="text-blue-600" title="Customer SMS sent">📱</span>
                          )}
                          {order.agentDeductionProcessed && (
                            <span className="text-red-600" title="Agent deducted">💰</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {order.date}
                  </td>
                  <td className="px-4 py-4">
<div className="flex items-center space-x-2">
                      <button
                        onClick={() => toast.info(`View order #${order.id} details`)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="View Details"
                      >
                        <ApperIcon name="Eye" size={16} />
                      </button>
                      {order.codDiscrepancy > 0 && (
                        <div className="relative group">
                          <button
                            className="p-1 hover:bg-red-200 rounded text-red-600"
                            title="Resolve Discrepancy"
                          >
                            <ApperIcon name="AlertTriangle" size={16} />
                          </button>
                          <div className="absolute right-0 top-8 hidden group-hover:block bg-white border rounded-lg shadow-lg z-10 min-w-[200px]">
                            <div className="p-2">
                              <button
                                onClick={() => handleDiscrepancyResolution(order.id, 'customer_confirmed')}
                                className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                              >
                                Customer Confirmed
                              </button>
                              <button
                                onClick={() => handleDiscrepancyResolution(order.id, 'agent_error')}
                                className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                              >
                                Agent Error
                              </button>
                              <button
                                onClick={() => handleDiscrepancyResolution(order.id, 'system_error')}
                                className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                              >
                                System Error
                              </button>
                              <button
                                onClick={() => handleDiscrepancyResolution(order.id, 'escalated')}
                                className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm text-red-600"
                              >
                                Escalate to Manager
                              </button>
                              <button
                                onClick={() => handleDispatchBackup()}
                                className="block w-full text-left px-2 py-1 hover:bg-blue-100 text-sm text-blue-600 border-t border-gray-200 mt-1 pt-2"
                              >
                                <ApperIcon name="Users" size={14} className="inline mr-1" />
                                Request Backup Support
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => toast.info(`Print order #${order.id}`)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Print"
                      >
                        <ApperIcon name="Printer" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <ApperIcon name="ShoppingCart" size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter' : 'Orders will appear here once customers start placing them'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;