import React, { useState, useEffect } from 'react';
import { ApperIcon } from '@/components/ApperIcon';
import { toast } from 'react-toastify';

const AdminOrders = () => {
  const [orders, setOrders] = useState([
    { 
      id: 1, 
      customer: 'John Smith', 
      email: 'john@example.com',
      total: 89.99, 
      status: 'pending', 
      date: '2024-01-15',
      items: 3,
      payment: 'Credit Card'
    },
    { 
      id: 2, 
      customer: 'Sarah Johnson', 
      email: 'sarah@example.com',
      total: 156.50, 
      status: 'processing', 
      date: '2024-01-15',
      items: 2,
      payment: 'PayPal'
    },
    { 
      id: 3, 
      customer: 'Mike Wilson', 
      email: 'mike@example.com',
      total: 234.00, 
      status: 'completed', 
      date: '2024-01-14',
      items: 5,
      payment: 'Credit Card'
    },
    { 
      id: 4, 
      customer: 'Emma Davis', 
      email: 'emma@example.com',
      total: 67.25, 
      status: 'cancelled', 
      date: '2024-01-14',
      items: 1,
      payment: 'Debit Card'
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order #${orderId} status updated to ${newStatus}`);
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Management</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => toast.info('Export all orders')}
            className="btn-secondary flex items-center"
          >
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <ApperIcon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by customer, email, or ID..."
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
              className="input-field min-w-[120px]"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
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

      {/* Orders Table */}
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
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                <tr key={order.id} className="hover:bg-gray-50">
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
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                    <div className="text-sm text-gray-500">{order.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">${order.total}</div>
                    <div className="text-sm text-gray-500">{order.payment}</div>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                      <button
                        onClick={() => toast.info(`Edit order #${order.id}`)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit Order"
                      >
                        <ApperIcon name="Edit" size={16} />
                      </button>
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