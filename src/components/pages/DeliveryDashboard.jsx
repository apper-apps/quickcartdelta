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
  const [currentView, setCurrentView] = useState('queue'); // queue, map, contact, proof, metrics, support, earnings, operational
  const [driverLocation, setDriverLocation] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [earningsData, setEarningsData] = useState({
    basePay: 1200,
    bonuses: 350,
    deductions: 0,
    incentiveProgress: { current: 7, target: 10, reward: 200 }
  });
  const [vehicleData, setVehicleData] = useState({
    fuelEfficiency: 15.2,
    maintenanceAlerts: ['Oil change due in 500km', 'Tire rotation needed'],
    temperatureLog: 4.2,
    coolerCapacity: 85
  });
  const [workingHours, setWorkingHours] = useState(4.5);
  const [fatigueAlert, setFatigueAlert] = useState(false);

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

// Emergency Support & Safety
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
          toast.success('🚨 Emergency help requested. Dispatch has been notified with your location.');
        });
      } else {
        await deliveryService.reportEmergency('current-driver', 'help_needed');
        toast.success('🚨 Emergency help requested. Dispatch has been notified.');
      }
    } catch (error) {
      toast.error('Failed to request help. Please call dispatch directly.');
    }
  };

  // Fatigue monitoring
  useEffect(() => {
    const checkFatigue = () => {
      if (workingHours >= 6) {
        setFatigueAlert(true);
        toast.warning('⚠️ Fatigue Alert: You\'ve been working for 6+ hours. Consider taking a break.');
      }
    };
    
    const interval = setInterval(checkFatigue, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [workingHours]);

  // Auto dark mode (7 PM to 5 AM)
  useEffect(() => {
    const applyDarkMode = () => {
      const hour = new Date().getHours();
      const isDarkTime = hour >= 19 || hour < 5;
      document.documentElement.classList.toggle('dark', isDarkTime);
    };
    
    applyDarkMode();
    const interval = setInterval(applyDarkMode, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
    return icons[priority] || '🟢';
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
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-6 p-2 bg-gray-100 rounded-lg">
      {[
        { key: 'queue', label: 'Queue', icon: 'List' },
        { key: 'map', label: 'Map', icon: 'Map' },
        { key: 'earnings', label: 'Earnings', icon: 'DollarSign' },
        { key: 'operational', label: 'Tools', icon: 'Wrench' },
        { key: 'metrics', label: 'Analytics', icon: 'BarChart3' },
        { key: 'support', label: 'Support', icon: 'HelpCircle' }
      ].map(({ key, label, icon }) => (
        <Button
          key={key}
          variant={currentView === key ? 'primary' : 'ghost'}
          size="sm"
          icon={icon}
          onClick={() => setCurrentView(key)}
          className="flex-1 text-xs"
        >
          {label}
        </Button>
      ))}
    </div>
  );

  // Earnings & Incentives View
  const renderEarningsView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <ApperIcon name="DollarSign" size={24} className="text-green-600" />
        <h2 className="text-2xl font-bold">Earnings & Incentives</h2>
      </div>

      {/* Daily Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">Base Pay</p>
            <p className="text-2xl font-bold text-green-800">₹{earningsData.basePay}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Bonuses</p>
            <p className="text-2xl font-bold text-blue-800">₹{earningsData.bonuses}</p>
            <p className="text-xs text-blue-600">(on-time incentive)</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 mb-1">Deductions</p>
            <p className="text-2xl font-bold text-gray-800">₹{earningsData.deductions}</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Total Earnings Today</span>
            <span className="text-2xl font-bold text-green-700">
              ₹{earningsData.basePay + earningsData.bonuses - earningsData.deductions}
            </span>
          </div>
        </div>
      </div>

      {/* Incentive Tracker */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Incentive Progress</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Progress to Next Bonus</span>
            <span className="font-semibold">
              {earningsData.incentiveProgress.current}/{earningsData.incentiveProgress.target} deliveries
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${(earningsData.incentiveProgress.current / earningsData.incentiveProgress.target) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <ApperIcon name="Target" size={20} className="text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              {earningsData.incentiveProgress.target - earningsData.incentiveProgress.current} more deliveries for ₹{earningsData.incentiveProgress.reward} bonus!
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Goals */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Delivery Target</span>
              <span className="font-semibold">45/50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Rating Goal</span>
              <span className="font-semibold">4.8/5.0</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Operational Tools View
  const renderOperationalView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <ApperIcon name="Wrench" size={24} className="text-blue-600" />
        <h2 className="text-2xl font-bold">Operational Tools</h2>
      </div>

      {/* Vehicle Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="Car" size={20} className="text-blue-600" />
          Vehicle Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fuel Tracker */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Fuel Efficiency</h4>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700">Current Average</span>
                <span className="text-xl font-bold text-green-800">{vehicleData.fuelEfficiency} km/L</span>
              </div>
              <div className="text-sm text-green-600">
                <ApperIcon name="TrendingUp" size={14} className="inline mr-1" />
                +0.8 km/L from last week
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Today's Usage</span>
                <span>12.5L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Distance Covered</span>
                <span>185 km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fuel Cost</span>
                <span>₹1,125</span>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Maintenance Alerts</h4>
            <div className="space-y-2">
              {vehicleData.maintenanceAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ApperIcon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
                  <span className="text-sm text-yellow-800">{alert}</span>
                </div>
              ))}
            </div>
            
            <Button variant="secondary" size="sm" className="w-full" icon="Calendar">
              Schedule Maintenance
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Check */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="Package" size={20} className="text-purple-600" />
          Inventory Monitor
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature Log */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Temperature Control</h4>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700">Current Temperature</span>
                <span className="text-xl font-bold text-blue-800">{vehicleData.temperatureLog}°C</span>
              </div>
              <div className="text-sm text-blue-600">
                <ApperIcon name="Thermometer" size={14} className="inline mr-1" />
                Optimal for perishables
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Target Range</span>
                <span>2°C - 8°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Alert</span>
                <span className="text-green-600">None today</span>
              </div>
            </div>
          </div>

          {/* Cooler Capacity */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Cooler Status</h4>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700">Capacity Used</span>
                <span className="text-xl font-bold text-green-800">{vehicleData.coolerCapacity}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${vehicleData.coolerCapacity}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Available Space</span>
                <span>{100 - vehicleData.coolerCapacity}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Power Status</span>
                <span className="text-green-600">Normal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Status */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="Shield" size={20} className="text-red-600" />
          Safety Dashboard
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${fatigueAlert ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-center">
              <ApperIcon name="Clock" size={24} className={`mx-auto mb-2 ${fatigueAlert ? 'text-red-600' : 'text-green-600'}`} />
              <p className="text-sm text-gray-700 mb-1">Working Hours</p>
              <p className={`text-lg font-bold ${fatigueAlert ? 'text-red-800' : 'text-green-800'}`}>
                {workingHours.toFixed(1)}h
              </p>
              {fatigueAlert && (
                <p className="text-xs text-red-600 mt-1">Break recommended</p>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <ApperIcon name="MapPin" size={24} className="mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-700 mb-1">GPS Status</p>
              <p className="text-lg font-bold text-blue-800">Active</p>
              <p className="text-xs text-blue-600 mt-1">Location tracking on</p>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <Button 
              variant="ghost" 
              className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
              onClick={requestEmergencyHelp}
            >
              <div className="text-center">
                <ApperIcon name="AlertTriangle" size={24} className="mx-auto mb-2" />
                <p className="font-bold">SOS</p>
                <p className="text-xs">Emergency Help</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadDeliveryOrders} />;

return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header with Status Indicators */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ApperIcon name="Truck" size={32} className="text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Delivery Dashboard</h1>
            <p className="text-sm text-gray-600">Driver Mobile Command Center</p>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Online</span>
          </div>
          {fatigueAlert && (
            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full">
              <ApperIcon name="AlertTriangle" size={14} />
              <span>Fatigue Alert</span>
            </div>
          )}
        </div>
      </div>

      {renderNavigation()}

      {loading && <Loading />}
      {error && <Error message={error} onRetry={loadDeliveryOrders} />}

      {!loading && !error && (
        <>
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
          
          {currentView === 'earnings' && renderEarningsView()}
          
          {currentView === 'operational' && renderOperationalView()}
          
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
        </>
      )}
    </div>
  );
}
export default DeliveryDashboard;