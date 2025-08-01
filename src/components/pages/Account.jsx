import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';
import { orderService } from '@/services/api/orderService';

function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userProfile, setUserProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States'
  });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'orders';
    setActiveTab(tab);
  }, [searchParams]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.getAll();
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSelectedOrder(null);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
  };

  const handleProfileSave = () => {
    setEditingProfile(false);
    toast.success('Profile updated successfully');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.Id.toString().includes(searchTerm) ||
      order.items.some(item => 
        item.product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderOrdersTab = () => {
    if (selectedOrder) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              icon="ArrowLeft"
              onClick={handleBackToOrders}
            >
              Back to Orders
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.Id}</h2>
            <Badge variant={getStatusColor(selectedOrder.status)}>
              {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {selectedOrder.payment.method === 'credit_card' ? 'Credit Card' : selectedOrder.payment.method}
                    {selectedOrder.payment.last4 && ` ending in ${selectedOrder.payment.last4}`}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="price-text">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium text-gray-900">
                  {selectedOrder.shipping.firstName} {selectedOrder.shipping.lastName}
                </p>
                <p>{selectedOrder.shipping.address}</p>
                <p>{selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.zipCode}</p>
                <p>{selectedOrder.shipping.country}</p>
                <p>{selectedOrder.shipping.phone}</p>
                <p>{selectedOrder.shipping.email}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {selectedOrder.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product.title}</h4>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (loading) return <Loading />;
    if (error) return <Error message={error} onRetry={loadOrders} />;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Empty
            icon="ShoppingBag"
            title="No orders found"
            description={searchTerm || statusFilter !== 'all' ? 
              "No orders match your search criteria" : 
              "You haven't placed any orders yet"
            }
            action={
              <Button onClick={() => navigate('/')}>
                Start Shopping
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order.Id}
                className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => handleOrderClick(order)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.Id}</h3>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-1">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="price-text text-xl">${order.total.toFixed(2)}</p>
                    </div>
                    <ApperIcon name="ChevronRight" size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
        <Button
          variant={editingProfile ? "secondary" : "primary"}
          icon={editingProfile ? "X" : "Edit"}
          onClick={() => setEditingProfile(!editingProfile)}
        >
          {editingProfile ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <Input
              value={userProfile.firstName}
              onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <Input
              value={userProfile.lastName}
              onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <Input
              value={userProfile.phone}
              onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <Input
              value={userProfile.address}
              onChange={(e) => setUserProfile({...userProfile, address: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <Input
              value={userProfile.city}
              onChange={(e) => setUserProfile({...userProfile, city: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <Input
              value={userProfile.state}
              onChange={(e) => setUserProfile({...userProfile, state: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <Input
              value={userProfile.zipCode}
              onChange={(e) => setUserProfile({...userProfile, zipCode: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <Input
              value={userProfile.country}
              onChange={(e) => setUserProfile({...userProfile, country: e.target.value})}
              disabled={!editingProfile}
            />
          </div>
        </div>

        {editingProfile && (
          <div className="flex gap-3 mt-6">
            <Button onClick={handleProfileSave}>
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => setEditingProfile(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Order Updates</p>
              <p className="text-sm text-gray-600">Get notified about your order status</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Promotional Emails</p>
              <p className="text-sm text-gray-600">Receive deals and special offers</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Get text updates for important events</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
        <div className="space-y-4">
          <Button variant="secondary" className="w-full justify-start" icon="Lock">
            Change Password
          </Button>
          <Button variant="secondary" className="w-full justify-start" icon="Shield">
            Two-Factor Authentication
          </Button>
          <Button variant="secondary" className="w-full justify-start" icon="Download">
            Download My Data
          </Button>
          <Button variant="secondary" className="w-full justify-start text-red-600 hover:text-red-700" icon="Trash2">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'orders', label: 'Orders', icon: 'ShoppingBag' },
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'settings', label: 'Settings', icon: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your orders, profile, and settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ApperIcon name={tab.icon} size={20} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1">
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;