import React, { useState, useEffect } from 'react';
import { deliveryService } from '@/services/api/deliveryService';
import { routeOptimizer } from '@/services/api/routeOptimizer';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import DeliveryMap from '@/components/molecules/DeliveryMap';
import CustomerContact from '@/components/molecules/CustomerContact';
import ProofOfDelivery from '@/components/molecules/ProofOfDelivery';
import DeliveryMetrics from '@/components/molecules/DeliveryMetrics';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentView, setCurrentView] = useState('queue'); // queue, map, contact, proof, metrics
  const [driverLocation, setDriverLocation] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  useEffect(() => {
    loadDeliveryOrders();
    getCurrentLocation();
    // Set up real-time updates
    const interval = setInterval(loadDeliveryOrders, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDeliveryOrders = async () => {
    try {
      setLoading(true);
      const deliveryOrders = await deliveryService.getDeliveryQueue();
      setOrders(deliveryOrders);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  };

  const optimizeRoute = async () => {
    try {
      if (!driverLocation) {
        toast.error('Location required for route optimization');
        return;
      }
      
      const pendingOrders = orders.filter(o => 
        ['ready_for_pickup', 'picked_up'].includes(o.deliveryStatus)
      );
      
      if (pendingOrders.length === 0) {
        toast.info('No orders available for route optimization');
        return;
      }

      const route = await routeOptimizer.optimizeRoute(driverLocation, pendingOrders);
      setOptimizedRoute(route);
      toast.success(`Route optimized for ${route.stops.length} deliveries`);
    } catch (err) {
      toast.error('Failed to optimize route');
    }
  };

  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      await deliveryService.updateOrderStatus(orderId, newStatus, driverLocation, notes);
      await loadDeliveryOrders();
      
      const statusMessages = {
        'picked_up': 'Order marked as picked up',
        'in_transit': 'Started delivery route',
        'delivered': 'Order marked as delivered',
        'delivery_failed': 'Delivery issue reported'
      };
      
      toast.success(statusMessages[newStatus] || 'Order status updated');
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ready_for_pickup': 'ready-pickup',
      'picked_up': 'picked-up',
      'in_transit': 'in-transit',
      'delivered': 'delivered'
    };
    return colors[status] || 'default';
  };

  const getPriorityIcon = (priority) => {
    return priority === 'urgent' ? '🔴' : '🟢';
  };

  const renderOrderQueue = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Delivery Queue</h2>
        <div className="flex gap-2">
          <Button 
            onClick={optimizeRoute}
            icon="Route"
            variant="delivery"
            disabled={orders.length === 0}
          >
            Optimize Route
          </Button>
          <Button 
            onClick={loadDeliveryOrders}
            icon="RotateCcw"
            variant="ghost"
          >
            Refresh
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ApperIcon name="Package" size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No deliveries pending</h3>
          <p className="text-gray-500">Check back later for new orders</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.Id} className="card p-4 border-l-4 border-l-primary">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getPriorityIcon(order.priority)}</span>
                  <div>
                    <h3 className="font-semibold">Order #{order.Id}</h3>
                    <p className="text-sm text-gray-600">{order.customer?.name}</p>
                  </div>
                </div>
                <Badge variant={getStatusColor(order.deliveryStatus)}>
                  {order.deliveryStatus?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-medium">{order.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Window</p>
                  <p className="text-sm font-medium">
                    {order.deliveryWindow ? 
                      `${new Date(order.deliveryWindow.start).toLocaleTimeString()} - ${new Date(order.deliveryWindow.end).toLocaleTimeString()}` 
                      : 'ASAP'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p className="text-sm font-medium">{order.items?.length || 0} items</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {order.deliveryStatus === 'ready_for_pickup' && (
                  <Button 
                    size="sm" 
                    variant="success"
                    icon="Check"
                    onClick={() => updateOrderStatus(order.Id, 'picked_up')}
                  >
                    Mark Picked Up
                  </Button>
                )}
                
                {order.deliveryStatus === 'picked_up' && (
                  <Button 
                    size="sm" 
                    variant="delivery"
                    icon="Truck"
                    onClick={() => updateOrderStatus(order.Id, 'in_transit')}
                  >
                    Start Delivery
                  </Button>
                )}
                
                {order.deliveryStatus === 'in_transit' && (
                  <Button 
                    size="sm" 
                    variant="success"
                    icon="CheckCircle"
                    onClick={() => {
                      setSelectedOrder(order);
                      setCurrentView('proof');
                    }}
                  >
                    Mark Delivered
                  </Button>
                )}

                <Button 
                  size="sm" 
                  variant="ghost"
                  icon="Phone"
                  onClick={() => {
                    setSelectedOrder(order);
                    setCurrentView('contact');
                  }}
                >
                  Contact
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost"
                  icon="MapPin"
                  onClick={() => {
                    setSelectedOrder(order);
                    setCurrentView('map');
                  }}
                >
                  Navigate
                </Button>

                <Button 
                  size="sm" 
                  variant="danger"
                  icon="AlertTriangle"
                  onClick={() => updateOrderStatus(order.Id, 'delivery_failed', 'Issue reported by driver')}
                >
                  Report Issue
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNavigation = () => (
    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
      {[
        { key: 'queue', label: 'Queue', icon: 'List' },
        { key: 'map', label: 'Map', icon: 'Map' },
        { key: 'metrics', label: 'Metrics', icon: 'BarChart3' }
      ].map(({ key, label, icon }) => (
        <Button
          key={key}
          variant={currentView === key ? 'primary' : 'ghost'}
          size="sm"
          icon={icon}
          onClick={() => setCurrentView(key)}
          className="flex-1"
        >
          {label}
        </Button>
      ))}
    </div>
  );

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadDeliveryOrders} />;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ApperIcon name="Truck" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Delivery Dashboard</h1>
      </div>

      {renderNavigation()}

      {currentView === 'queue' && renderOrderQueue()}
      
      {currentView === 'map' && (
        <DeliveryMap 
          orders={orders}
          driverLocation={driverLocation}
          optimizedRoute={optimizedRoute}
          selectedOrder={selectedOrder}
          onOrderSelect={setSelectedOrder}
        />
      )}
      
      {currentView === 'contact' && selectedOrder && (
        <CustomerContact 
          order={selectedOrder}
          onClose={() => {
            setCurrentView('queue');
            setSelectedOrder(null);
          }}
        />
      )}
      
      {currentView === 'proof' && selectedOrder && (
        <ProofOfDelivery 
          order={selectedOrder}
          onComplete={(proofData) => {
            updateOrderStatus(selectedOrder.Id, 'delivered', 'Delivery completed with proof');
            setCurrentView('queue');
            setSelectedOrder(null);
          }}
          onCancel={() => {
            setCurrentView('queue');
            setSelectedOrder(null);
          }}
        />
      )}
      
      {currentView === 'metrics' && (
        <DeliveryMetrics />
      )}
    </div>
  );
};

export default DeliveryDashboard;