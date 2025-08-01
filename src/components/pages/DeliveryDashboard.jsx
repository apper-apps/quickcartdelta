import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deliveryService } from "@/services/api/deliveryService";
import { routeOptimizer } from "@/services/api/routeOptimizer";
import ApperIcon from "@/components/ApperIcon";
import CustomerContact from "@/components/molecules/CustomerContact";
import ProofOfDelivery from "@/components/molecules/ProofOfDelivery";
import DeliveryMetrics from "@/components/molecules/DeliveryMetrics";
import DeliveryMap from "@/components/molecules/DeliveryMap";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
const DeliveryDashboard = () => {
const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentView, setCurrentView] = useState('queue'); // queue, map, contact, proof, metrics, support
  const [driverLocation, setDriverLocation] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
useEffect(() => {
    loadDeliveryOrders();
    getCurrentLocation();
    initializeVoiceCommands();
    // Set up real-time updates
    const interval = setInterval(loadDeliveryOrders, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Voice Commands Setup
  const initializeVoiceCommands = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceEnabled(true);
    }
  };

  const startVoiceCommand = () => {
    if (!voiceEnabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      processVoiceCommand(command);
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      toast.error('Voice command failed. Please try again.');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (command) => {
    if (command.includes('navigate to next delivery')) {
      const nextOrder = orders.find(o => o.deliveryStatus === 'picked_up' || o.deliveryStatus === 'ready_for_pickup');
      if (nextOrder) {
        setSelectedOrder(nextOrder);
        setCurrentView('map');
        toast.success('Navigating to next delivery');
      } else {
        toast.info('No pending deliveries found');
      }
    } else if (command.includes('call customer')) {
      const customerName = command.replace('call customer', '').trim();
      const order = orders.find(o => o.customer?.name.toLowerCase().includes(customerName.toLowerCase()));
      if (order) {
        setSelectedOrder(order);
        setCurrentView('contact');
        toast.success(`Calling customer ${order.customer.name}`);
      } else {
        toast.error('Customer not found');
      }
    } else {
      toast.info('Command not recognized. Try "Navigate to next delivery" or "Call customer [name]"');
    }
  };

  // Emergency Support
  const requestEmergencyHelp = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          
          await deliveryService.reportEmergency('current-driver', 'help_needed', location);
          toast.success('Emergency help requested. Dispatch has been notified with your location.');
        });
      } else {
        await deliveryService.reportEmergency('current-driver', 'help_needed');
        toast.success('Emergency help requested. Dispatch has been notified.');
      }
    } catch (error) {
      toast.error('Failed to request help. Please call dispatch directly.');
    }
  };

  const callDispatchHotline = () => {
    const dispatchNumber = '+1-800-DISPATCH';
    window.open(`tel:${dispatchNumber}`, '_self');
    toast.info('Calling dispatch hotline...');
  };

  const reportIssue = async (orderId, issueType, description = '') => {
    try {
      await deliveryService.reportDeliveryIssue(orderId, issueType, description, driverLocation);
      toast.success('Issue reported successfully');
      loadDeliveryOrders(); // Refresh orders
    } catch (error) {
      toast.error('Failed to report issue');
    }
  };

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
    const icons = {
      'urgent': '🔴',
      'high': '🟡',
      'normal': '🟢'
    };
};
    return icons[priority] || '🟢';
  };
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

                <div className="relative">
                  <Button 
                    size="sm" 
                    variant="danger"
                    icon="AlertTriangle"
                    onClick={(e) => {
                      e.preventDefault();
                      const rect = e.target.getBoundingClientRect();
                      const dropdown = document.getElementById(`issue-dropdown-${order.Id}`);
                      if (dropdown) {
                        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                        dropdown.style.top = `${rect.bottom + 5}px`;
                        dropdown.style.left = `${rect.left}px`;
                      }
                    }}
                  >
                    Report Issue
                  </Button>
                  
                  <div 
                    id={`issue-dropdown-${order.Id}`}
                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-48"
                    style={{ display: 'none' }}
                  >
                    <div className="space-y-1">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        onClick={() => {
                          reportIssue(order.Id, 'address_incorrect', 'Address information is incorrect or incomplete');
                          document.getElementById(`issue-dropdown-${order.Id}`).style.display = 'none';
                        }}
                      >
                        📍 Address Incorrect
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        onClick={() => {
                          reportIssue(order.Id, 'customer_unavailable', 'Customer is not available at delivery location');
                          document.getElementById(`issue-dropdown-${order.Id}`).style.display = 'none';
                        }}
                      >
                        👤 Customer Unavailable
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        onClick={() => {
                          reportIssue(order.Id, 'package_damaged', 'Package appears to be damaged during transport');
                          document.getElementById(`issue-dropdown-${order.Id}`).style.display = 'none';
                        }}
                      >
                        📦 Package Damaged
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSupportSystem = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Support System</h2>
      
      {/* Emergency Protocols */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
          Emergency Protocols
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="error"
            icon="HelpCircle"
            onClick={requestEmergencyHelp}
            className="h-16 text-lg"
          >
            🚨 Help Needed
          </Button>
          
          <Button
            variant="warning"
            icon="Phone"
            onClick={callDispatchHotline}
            className="h-16 text-lg"
          >
            📞 Call Dispatch
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Emergency Help:</strong> Shares your live location with dispatch center and triggers immediate response protocol.
          </p>
        </div>
      </div>

      {/* Voice Commands */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="Mic" size={20} className="text-blue-600" />
          Voice Commands
        </h3>
        
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant={isListening ? "error" : "success"}
            icon={isListening ? "MicOff" : "Mic"}
            onClick={startVoiceCommand}
            disabled={!voiceEnabled}
          >
            {isListening ? 'Stop Listening' : 'Start Voice Command'}
          </Button>
          
          {!voiceEnabled && (
            <p className="text-sm text-gray-500">Voice commands not available in this browser</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Available Commands:</p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• "Navigate to next delivery" - Opens map for next pending order</li>
              <li>• "Call customer [name]" - Opens contact screen for specific customer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Location */}
      {driverLocation && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ApperIcon name="MapPin" size={20} className="text-green-600" />
            Current Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
              <p className="text-sm text-gray-500">Latitude</p>
              <p className="font-mono text-sm">{driverLocation.lat?.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Longitude</p>
              <p className="font-mono text-sm">{driverLocation.lng?.toFixed(6)}</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {driverLocation.timestamp ? new Date(driverLocation.timestamp).toLocaleTimeString() : 'Unknown'}
          </p>
        </div>
      )}
    </div>
  );

const renderNavigation = () => (
    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
      {[
        { key: 'queue', label: 'Queue', icon: 'List' },
        { key: 'map', label: 'Map', icon: 'Map' },
        { key: 'metrics', label: 'Analytics', icon: 'BarChart3' },
        { key: 'support', label: 'Support', icon: 'HelpCircle' }
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
      
      {currentView === 'support' && renderSupportSystem()}
    </div>
  );
}
export default DeliveryDashboard;