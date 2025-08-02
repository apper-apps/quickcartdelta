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

function DeliveryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [orders, setOrders] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeView, setActiveView] = useState('operational');
  const [currentView, setCurrentView] = useState('assignment');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
const [emergencyMode, setEmergencyMode] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [fatigueAlert, setFatigueAlert] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [workingHours, setWorkingHours] = useState(5.5);
  const [selectedZone, setSelectedZone] = useState(null);
  const [alertFilter, setAlertFilter] = useState('all');
  const [vehicleMetrics, setVehicleMetrics] = useState({
    speed: 0,
    fuel: 85,
    temperature: 72,
    mileage: 245.8
  });
  const [vehicleData, setVehicleData] = useState({
    fuelEfficiency: 18.5,
    temperatureLog: 4,
    coolerCapacity: 75,
    maintenanceAlerts: [
      'Oil change due in 500km',
      'Tire pressure check needed'
    ]
  });
  const [earningsData, setEarningsData] = useState({
    basePay: 1850,
    bonuses: 420,
    deductions: 125,
    incentiveProgress: {
      current: 18,
      target: 25,
      reward: 500
    }
  });
const [settlementData, setSettlementData] = useState(null);
  // Assignment & COD Management State
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('manual'); // manual, proximity, capacity, skill
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [codBalances, setCodBalances] = useState({});
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [codTransactions, setCodTransactions] = useState([]);
  const [digitalReceipts, setDigitalReceipts] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);

  // Team Management State (for supervisors)
  const [teamData, setTeamData] = useState({
    drivers: [],
    zones: [],
    heatmap: [],
    alerts: []
  })
  const [isTeamLeader, setIsTeamLeader] = useState(true) // Enable assignment features

  // Testing Protocol State
  const [testingMode, setTestingMode] = useState(false)
  const [testScenarios, setTestScenarios] = useState({
    weatherConditions: 'clear',
    networkCondition: 'strong',
    deviceCompatibility: true,
    consecutiveFailures: 0
  })
  const [performanceMetrics, setPerformanceMetrics] = useState({
    deliveryTimeReduction: 0,
    firstAttemptSuccess: 0,
    customerSatisfaction: 0,
    totalDeliveries: 0,
    onTimeDeliveries: 0
  })

useEffect(() => {
    loadDeliveryOrders();
    loadAvailableDrivers();
loadCodBalances();
    loadSettlementData();
    getCurrentLocation();
    initializeTestingProtocols();
    monitorPerformanceMetrics();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadDeliveryOrders();
      loadAvailableDrivers();
      loadSettlementData();
      syncAssignments();
    }, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orders.length > 0 && currentLocation) {
      optimizeRoute()
    }
  }, [orders, currentLocation])

  // Testing Protocols Initialization
  function initializeTestingProtocols() {
    // Device compatibility testing
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      connection: navigator.connection?.effectiveType || 'unknown'
    }

    // Simulate different testing scenarios
    if (testingMode) {
      simulateTestingScenarios()
    }

    // Monitor network connectivity
    window.addEventListener('online', () => setNetworkStatus('online'))
    window.addEventListener('offline', () => setNetworkStatus('offline'))
  }

  function simulateTestingScenarios() {
    const scenarios = [
      { weather: 'heavy_rain', network: 'weak', description: 'Heavy rain with poor network' },
      { weather: 'clear', network: 'dead_zone', description: 'Dead zone network coverage' },
      { weather: 'snow', network: 'strong', description: 'Snow conditions with good network' }
    ]

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)]
    setTestScenarios(prev => ({
      ...prev,
      weatherConditions: randomScenario.weather,
      networkCondition: randomScenario.network
    }))

    toast.info(`Testing Scenario: ${randomScenario.description}`)
  }

  function monitorPerformanceMetrics() {
    const interval = setInterval(() => {
      if (orders.length > 0) {
        calculateSuccessMetrics()
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  function calculateSuccessMetrics() {
    const deliveredOrders = orders.filter(order => order.status === 'delivered')
    const totalOrders = orders.length
    const firstAttemptSuccesses = deliveredOrders.filter(order => 
      order.delivery?.firstAttemptSuccess === true
    ).length

    const avgSatisfaction = deliveredOrders.reduce((sum, order) => 
      sum + (order.delivery?.satisfaction?.rating || 0), 0
    ) / (deliveredOrders.length || 1)

    const avgDeliveryTime = deliveredOrders.reduce((sum, order) => 
      sum + (order.delivery?.actualTime || 0), 0
    ) / (deliveredOrders.length || 1)

    const estimatedTime = deliveredOrders.reduce((sum, order) => 
      sum + (order.delivery?.estimatedTime || 0), 0
    ) / (deliveredOrders.length || 1)

    const timeReduction = estimatedTime > 0 ? 
      ((estimatedTime - avgDeliveryTime) / estimatedTime) * 100 : 0

    setPerformanceMetrics({
      deliveryTimeReduction: Math.max(0, timeReduction),
      firstAttemptSuccess: totalOrders > 0 ? (firstAttemptSuccesses / totalOrders) * 100 : 0,
      customerSatisfaction: avgSatisfaction,
      totalDeliveries: deliveredOrders.length,
      onTimeDeliveries: deliveredOrders.filter(order => 
        (order.delivery?.actualTime || 0) <= (order.delivery?.estimatedTime || 0)
      ).length
    })
  }

  // Voice Commands Setup
  function initializeVoiceCommands() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase()
      processVoiceCommand(command)
    }

    recognition.onerror = (event) => {
      console.log('Voice recognition error:', event.error)
      setVoiceEnabled(false)
    }

    setVoiceEnabled(true)
  }

  function startVoiceCommand() {
    if (!voiceEnabled) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.start()
  }

  function processVoiceCommand(command) {
    if (command.includes('next delivery')) {
      const nextOrder = orders.find(order => order.status === 'ready_for_pickup' || order.status === 'picked_up')
      if (nextOrder) {
        setSelectedOrder(nextOrder)
        toast.success(`Selected delivery for ${nextOrder.shipping.firstName}`)
      }
    } else if (command.includes('emergency')) {
      requestEmergencyHelp()
    } else if (command.includes('contact customer')) {
      if (selectedOrder) {
        setShowContactModal(true)
      }
    } else if (command.includes('testing mode')) {
      setTestingMode(!testingMode)
      toast.info(`Testing mode ${!testingMode ? 'enabled' : 'disabled'}`)
    }
  }

async function requestEmergencyHelp() {
    setEmergencyMode(true);
    setSosActive(true);
    
    try {
      if (navigator.geolocation) {
        // Get initial location
        navigator.geolocation.getCurrentPosition(async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          
          await deliveryService.reportEmergency('current-driver', 'sos_activated', location);
          toast.success('🚨 SOS ACTIVATED - Live location sharing enabled. Dispatch notified.');
          
          // Start continuous location sharing
          const watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const updatedLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString(),
                accuracy: position.coords.accuracy
              };
              
              // Update location every 10 seconds during SOS
              await deliveryService.reportEmergency('current-driver', 'location_update', updatedLocation);
            },
            (error) => {
              console.warn('Location tracking error:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
          
          setLocationWatchId(watchId);
          
          // Auto-deactivate SOS after 30 minutes for safety
          setTimeout(() => {
            deactivateSOS();
          }, 30 * 60 * 1000);
          
        }, (error) => {
          throw new Error('Location access denied');
        });
      } else {
        await deliveryService.reportEmergency('current-driver', 'sos_no_location');
        toast.success('🚨 SOS ACTIVATED - Dispatch has been notified (location unavailable).');
      }
    } catch (error) {
      toast.error('Failed to activate SOS. Please call dispatch directly.');
      setSosActive(false);
    } finally {
      setEmergencyMode(false);
    }
  }

  function deactivateSOS() {
    if (locationWatchId) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
    setSosActive(false);
    toast.info('SOS deactivated - Location sharing stopped.');
  }

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
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString()
          };
          setDriverLocation(location);
          setCurrentLocation(location);
        },
        (error) => {
          console.warn('Location access denied:', error);
        }
      );
    }
  };

  // Assignment System Functions
  const loadAvailableDrivers = async () => {
    try {
      const drivers = await deliveryService.getTeamDrivers();
      setAvailableDrivers(drivers.map(driver => ({
        ...driver,
        capacity: 8,
        currentLoad: driver.activeDeliveries || 0,
        skills: ['standard', 'perishables', 'valuables'].slice(0, Math.floor(Math.random() * 3) + 1),
        codBalance: codBalances[driver.Id] || 0
      })));
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const loadCodBalances = async () => {
    // Mock COD balances - in real app would come from service
    const balances = {
      1: 3200,
      2: 1850,
      3: 950,
      4: 2100,
      5: 750
    };
    setCodBalances(balances);
};

  const loadSettlementData = async () => {
    try {
      const settlement = await deliveryService.getCodSettlement();
      setSettlementData(settlement);
    } catch (error) {
      console.error('Error loading settlement data:', error);
      toast.error('Failed to load COD settlement data');
    }
  };

  const syncAssignments = async () => {
    // Simulate real-time assignment syncing
    try {
      // In real app, would sync with backend and push notifications
      console.log('Syncing assignments with delivery personnel apps...');
      
      // Also sync COD settlement data
      await loadSettlementData();
    } catch (error) {
      console.error('Assignment sync failed:', error);
    }
  };

  const assignOrderToDriver = async (orderId, driverId, assignmentType = 'manual') => {
    try {
      const order = orders.find(o => o.Id === orderId);
      const driver = availableDrivers.find(d => d.Id === driverId);
      
      if (!order || !driver) {
        toast.error('Invalid order or driver selection');
        return;
      }

      if (driver.currentLoad >= driver.capacity) {
        toast.error(`${driver.name} is at full capacity (${driver.capacity} deliveries)`);
        return;
      }

      // Update order with assignment
      await deliveryService.assignOrderToDriver(orderId, driverId, {
        assignmentType,
        assignedAt: new Date().toISOString(),
        estimatedDeliveryTime: calculateETA(order, driver)
      });

      // Update driver load
      setAvailableDrivers(prev => prev.map(d => 
        d.Id === driverId 
          ? { ...d, currentLoad: d.currentLoad + 1 }
          : d
      ));

      // Add to assignment history
      setAssignmentHistory(prev => [...prev, {
        orderId,
        driverId,
        driverName: driver.name,
        assignmentType,
        timestamp: new Date().toISOString(),
        orderValue: order.codAmount || order.total
      }]);

      toast.success(`Order #${orderId} assigned to ${driver.name}`);
      await loadDeliveryOrders();
      
      // Simulate push notification to driver app
      setTimeout(() => {
        toast.info(`📱 Push notification sent to ${driver.name}`);
      }, 1000);

    } catch (error) {
      toast.error('Failed to assign order');
      console.error('Assignment error:', error);
    }
  };

  const autoAssignOrder = async (orderId, method = 'proximity') => {
    const order = orders.find(o => o.Id === orderId);
    if (!order) return;

    let selectedDriver;
    const availableForAssignment = availableDrivers.filter(d => 
      d.status === 'active' && d.currentLoad < d.capacity
    );

    switch (method) {
      case 'proximity':
        // Find nearest driver (mock calculation)
        selectedDriver = availableForAssignment.reduce((nearest, driver) => {
          const distance = calculateDistance(order.deliveryAddress, driver.location);
          return distance < (nearest.distance || Infinity) 
            ? { ...driver, distance } 
            : nearest;
        }, {});
        break;

      case 'capacity':
        // Find driver with most available capacity
        selectedDriver = availableForAssignment.reduce((best, driver) => 
          (driver.capacity - driver.currentLoad) > ((best.capacity || 0) - (best.currentLoad || 0))
            ? driver : best
        , {});
        break;

      case 'skill':
        // Find driver with required skills
        const requiredSkills = order.items?.some(item => item.category === 'perishables') 
          ? ['perishables'] 
          : ['standard'];
        selectedDriver = availableForAssignment.find(driver => 
          requiredSkills.every(skill => driver.skills.includes(skill))
        ) || availableForAssignment[0];
        break;

      default:
        selectedDriver = availableForAssignment[0];
    }

    if (selectedDriver) {
      await assignOrderToDriver(orderId, selectedDriver.Id, method);
    } else {
      toast.warning('No available drivers for auto-assignment');
    }
  };

  const calculateDistance = (address, location) => {
    // Mock distance calculation - in real app would use mapping service
    return Math.random() * 10 + 1; // 1-11 km
  };

  const calculateETA = (order, driver) => {
    // Mock ETA calculation
    const baseTime = 30; // 30 minutes base
    const distance = calculateDistance(order.deliveryAddress, driver.location);
    return baseTime + (distance * 3); // 3 mins per km
  };

  const recordCodTransaction = async (orderId, collectedAmount, dueAmount) => {
    const transaction = {
      id: Date.now(),
      orderId,
      collectedAmount,
      dueAmount,
      timestamp: new Date().toISOString(),
      driverId: orders.find(o => o.Id === orderId)?.assignedDriver,
      status: 'completed'
    };

    setCodTransactions(prev => [...prev, transaction]);
    
    // Generate digital receipt
    const receipt = {
      id: `RCP-${orderId}-${Date.now()}`,
      orderId,
      amount: collectedAmount,
      generatedAt: new Date().toISOString(),
      downloadUrl: `#receipt-${orderId}` // Mock URL
    };

    setDigitalReceipts(prev => [...prev, receipt]);
    toast.success(`COD recorded: ₹${collectedAmount}. Digital receipt generated.`);
  };

const optimizeRoute = async () => {
    try {
      if (!driverLocation && !currentLocation) {
        toast.error('Location required for route optimization');
        return;
      }
      
      const location = driverLocation || currentLocation;
      const pendingOrders = orders.filter(o => 
        ['ready_for_pickup', 'picked_up'].includes(o.deliveryStatus)
      );
      
      if (pendingOrders.length === 0) {
        toast.info('No orders available for route optimization');
        return;
      }

      const route = await routeOptimizer.optimizeRoute(location, pendingOrders);
      setOptimizedRoute(route);
      toast.success(`Route optimized for ${route?.stops?.length || pendingOrders.length} deliveries`);
    } catch (err) {
      console.error('Route optimization error:', err);
      toast.error('Failed to optimize route');
    }
  };

const updateOrderStatus = async (orderId, newStatus, notes = '', codData = null) => {
    try {
      await deliveryService.updateOrderStatus(orderId, newStatus, driverLocation, notes);
      
      // Handle COD recording for delivered orders
      if (newStatus === 'delivered' && codData) {
        await recordCodTransaction(orderId, codData.collectedAmount, codData.dueAmount);
      }
      
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

const renderAssignmentView = () => (
    <div className="space-y-6">
      {/* Central Command Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">City Heatmap</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{orders.length}</p>
              <p className="text-blue-100">Active Orders</p>
            </div>
            <ApperIcon name="Map" size={32} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Personnel Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{availableDrivers.filter(d => d.status === 'active').length}</p>
              <p className="text-green-100">Available Drivers</p>
            </div>
            <ApperIcon name="Users" size={32} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">COD Dashboard</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">₹{Object.values(codBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}</p>
              <p className="text-purple-100">Total COD Due</p>
            </div>
            <ApperIcon name="DollarSign" size={32} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Assignment Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">Order Assignment System</h2>
          <div className="flex gap-2">
            <select 
              value={assignmentMode} 
              onChange={(e) => setAssignmentMode(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="manual">Manual Assignment</option>
              <option value="proximity">Proximity-Based</option>
              <option value="capacity">Capacity-Based</option>
              <option value="skill">Skill-Based</option>
            </select>
            <Button 
              size="sm" 
              variant="primary" 
              icon="Zap"
              onClick={() => {
                const unassignedOrders = orders.filter(o => !o.assignedDriver);
                unassignedOrders.forEach(order => autoAssignOrder(order.Id, assignmentMode));
              }}
              disabled={orders.filter(o => !o.assignedDriver).length === 0}
            >
              Auto-Assign All
            </Button>
          </div>
        </div>

        {/* Driver Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {availableDrivers.map((driver) => (
            <div key={driver.Id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    driver.status === 'active' ? 'bg-green-500' :
                    driver.status === 'break' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium">{driver.name}</span>
                </div>
                <Badge variant={driver.status === 'active' ? 'success' : 'warning'}>
                  {driver.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Load: {driver.currentLoad}/{driver.capacity} deliveries</p>
                <p>Vehicle: Bike 🛵 (Cooler: 8°C)</p>
                <p>COD: ₹{driver.codBalance?.toLocaleString()}</p>
                <p>Rating: {driver.rating}/5 ⭐</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Cards with Assignment */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ApperIcon name="Package" size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders pending assignment</h3>
            <p className="text-gray-500">New orders will appear here for assignment</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.Id} className="card p-6 border-l-4 border-l-primary">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {order.priority === 'urgent' ? '🔴' : order.priority === 'high' ? '🟡' : '🟢'}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">ORDER #{order.Id} {order.priority === 'urgent' ? '(Urgent)' : ''}</h3>
                    <p className="text-gray-600">📍 {order.deliveryAddress}</p>
                  </div>
                </div>
                <Badge variant={getStatusColor(order.deliveryStatus)}>
                  {order.deliveryStatus?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">💰 COD Amount</p>
                  <p className="text-lg font-bold text-primary">₹{order.codAmount || order.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">🕒 Delivery Window</p>
                  <p className="text-sm font-medium">
                    {order.deliveryWindow ? 
                      `${new Date(order.deliveryWindow.start).toLocaleTimeString()} - ${new Date(order.deliveryWindow.end).toLocaleTimeString()}` 
                      : '4:30-5:30 PM'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">📦 Items</p>
                  <p className="text-sm font-medium">{order.items?.length || Math.floor(Math.random() * 5) + 1} items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">🛵 Assigned Driver</p>
                  <p className="text-sm font-medium">
                    {order.assignedDriver ? 
                      availableDrivers.find(d => d.Id === order.assignedDriver)?.name || 'Unknown' :
                      'Not assigned'
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!order.assignedDriver ? (
                  <>
                    <select 
                      className="px-3 py-1 border rounded-lg text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          assignOrderToDriver(order.Id, parseInt(e.target.value));
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">🛵 Assign to Driver</option>
                      {availableDrivers
                        .filter(d => d.status === 'active' && d.currentLoad < d.capacity)
                        .map(driver => (
                          <option key={driver.Id} value={driver.Id}>
                            {driver.name} ({driver.currentLoad}/{driver.capacity})
                          </option>
                        ))
                      }
                    </select>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      icon="Zap"
                      onClick={() => autoAssignOrder(order.Id, assignmentMode)}
                    >
                      Auto-Assign
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
      
      {/* Emergency Support */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
          Emergency Support
        </h3>
        
        <div className="space-y-4">
<Button
            variant="error"
            size="lg"
            icon={sosActive ? "AlertTriangle" : "Phone"}
            onClick={sosActive ? deactivateSOS : requestEmergencyHelp}
            className={`w-full ${sosActive ? 'animate-pulse bg-red-600 hover:bg-red-700' : ''}`}
            disabled={emergencyMode}
          >
            {emergencyMode ? 'Activating SOS...' : sosActive ? '🚨 SOS ACTIVE - Tap to Deactivate' : '🚨 Activate SOS Emergency'}
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            icon="Phone"
            onClick={callDispatchHotline}
            className="w-full"
          >
            📞 Call Dispatch
          </Button>
        </div>
        
<div className={`mt-4 p-3 rounded-lg border ${sosActive ? 'bg-red-100 border-red-300 animate-pulse' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-red-800">
            <strong>{sosActive ? 'SOS ACTIVE:' : 'SOS Emergency:'}</strong> {sosActive ? 'Live location is being shared with dispatch. Help is on the way.' : 'Activates live location sharing with dispatch center and triggers immediate response protocol.'}
          </p>
          {sosActive && (
            <div className="mt-2 flex items-center space-x-2 text-xs text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Location sharing active</span>
            </div>
          )}
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
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <p>• "Next delivery" - Select next order</p>
          <p>• "Emergency" - Request help</p>
          <p>• "Contact customer" - Open contact modal</p>
          <p>• "Testing mode" - Toggle testing</p>
        </div>
      </div>
      
      {/* Current Location */}
      {driverLocation && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ApperIcon name="MapPin" size={20} className="text-green-600" />
            Current Location
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
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
  function renderTestingDashboard() {
    const deviceTests = [
      { device: 'Samsung Galaxy S21', os: 'Android 13', status: 'passed', issues: 0 },
      { device: 'iPhone 14 Pro', os: 'iOS 17.1', status: 'passed', issues: 0 },
      { device: 'Google Pixel 7', os: 'Android 14', status: 'failed', issues: 2 },
      { device: 'iPhone 13 Mini', os: 'iOS 16.5', status: 'passed', issues: 0 },
      { device: 'Samsung Note 20', os: 'Android 12', status: 'warning', issues: 1 }
    ]

    const weatherScenarios = [
      { condition: 'Heavy Rain', tested: true, success: 85, issues: ['GPS accuracy reduced', 'Longer delivery times'] },
      { condition: 'Snow Conditions', tested: true, success: 78, issues: ['Route optimization needed', 'Safety concerns'] },
      { condition: 'Extreme Heat', tested: false, success: 0, issues: [] },
      { condition: 'Clear Weather', tested: true, success: 96, issues: [] }
    ]

    return (
      <div className="space-y-6">
        <div className="testing-header">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Testing Protocol Dashboard</h2>
            <div className="flex space-x-2">
              <Button
                variant={testingMode ? 'primary' : 'secondary'}
                onClick={() => {
                  setTestingMode(!testingMode)
                  if (!testingMode) simulateTestingScenarios()
                }}
              >
                <ApperIcon name="Play" size={16} />
                {testingMode ? 'Stop Testing' : 'Start Testing'}
              </Button>
              <Button variant="secondary" onClick={() => toast.info('Test report generated')}>
                <ApperIcon name="Download" size={16} />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Device Compatibility Testing */}
        <div className="testing-section">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="Smartphone" size={20} className="mr-2" />
            Device Compatibility Testing
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {deviceTests.map((test, index) => (
              <div key={index} className="device-test-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{test.device}</h4>
                    <p className="text-sm text-gray-600">{test.os}</p>
                  </div>
                  <div className={`test-status ${test.status}`}>
                    <ApperIcon 
                      name={test.status === 'passed' ? 'CheckCircle' : test.status === 'failed' ? 'XCircle' : 'AlertTriangle'} 
                      size={20} 
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={test.status === 'passed' ? 'success' : test.status === 'failed' ? 'error' : 'warning'}>
                    {test.issues} issues found
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Scenario Testing */}
        <div className="testing-section">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="Cloud" size={20} className="mr-2" />
            Weather Scenario Testing
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {weatherScenarios.map((scenario, index) => (
              <div key={index} className="weather-test-card">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{scenario.condition}</h4>
                  <div className={`test-status ${scenario.tested ? 'passed' : 'pending'}`}>
                    <ApperIcon name={scenario.tested ? 'CheckCircle' : 'Clock'} size={20} />
                  </div>
                </div>
                {scenario.tested && (
                  <div className="mt-2">
                    <div className="success-rate">
                      <span className="text-sm">Success Rate: </span>
                      <span className={`font-bold ${scenario.success >= 90 ? 'text-green-600' : scenario.success >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {scenario.success}%
                      </span>
                    </div>
                    {scenario.issues.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-600">Issues:</p>
                        <ul className="text-xs text-red-600">
                          {scenario.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Network Coverage Testing */}
        <div className="testing-section">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ApperIcon name="Wifi" size={20} className="mr-2" />
            Network Coverage Testing
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="network-test-card">
              <h4 className="font-medium">Strong Signal</h4>
              <div className="network-strength strong">
                <div className="signal-bars">
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                </div>
              </div>
              <p className="text-sm text-green-600">98% Success Rate</p>
            </div>
            <div className="network-test-card">
              <h4 className="font-medium">Weak Signal</h4>
              <div className="network-strength weak">
                <div className="signal-bars">
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
              <p className="text-sm text-yellow-600">76% Success Rate</p>
            </div>
            <div className="network-test-card">
              <h4 className="font-medium">Dead Zone</h4>
              <div className="network-strength dead">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
              <p className="text-sm text-red-600">12% Success Rate</p>
            </div>
          </div>
        </div>

        {/* Current Test Scenario */}
        {testingMode && (
          <div className="current-test-scenario">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ApperIcon name="Activity" size={20} className="mr-2" />
              Current Test Scenario
            </h3>
            <div className="scenario-details">
              <div className="flex flex-wrap gap-4">
                <div className="scenario-item">
                  <span className="label">Weather:</span>
                  <Badge variant={testScenarios.weatherConditions === 'clear' ? 'success' : 'warning'}>
                    {testScenarios.weatherConditions.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="scenario-item">
                  <span className="label">Network:</span>
                  <Badge variant={testScenarios.networkCondition === 'strong' ? 'success' : testScenarios.networkCondition === 'weak' ? 'warning' : 'error'}>
                    {testScenarios.networkCondition}
                  </Badge>
                </div>
                <div className="scenario-item">
                  <span className="label">Device Compatible:</span>
                  <Badge variant={testScenarios.deviceCompatibility ? 'success' : 'error'}>
                    {testScenarios.deviceCompatibility ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

// Note: This function is duplicated and will be replaced by the complete version below
  // Keeping this stub to prevent reference errors during compilation
  const loadTeamDataStub = async () => {
    console.warn('Using stub loadTeamData - will be replaced by complete implementation');
  };

  const handleZoneActionStub = async (zoneId, action) => {
    console.warn('Using stub handleZoneAction - will be replaced by complete implementation');
  };

const renderNavigation = () => (
<div className="grid grid-cols-4 lg:grid-cols-8 gap-2 mb-6 p-2 bg-gray-100 rounded-lg">
      {[
        { key: 'assignment', label: 'Assignment', icon: 'UserCheck' },
        { key: 'queue', label: 'Queue', icon: 'List' },
        { key: 'map', label: 'Map', icon: 'Map' },
        { key: 'team', label: 'Team', icon: 'Users' },
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
{/* Daily Settlement Report */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Daily Settlement Report</h3>
          <Badge variant={settlementData?.status === 'complete' ? 'success' : settlementData?.status === 'shortage' ? 'error' : 'warning'}>
            {settlementData?.status === 'complete' ? 'Complete' : settlementData?.status === 'shortage' ? 'Shortage' : 'Pending'}
          </Badge>
        </div>

        {settlementData ? (
          <div className="space-y-4">
            {/* Agent Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Agent</p>
                  <p className="font-semibold text-lg">{settlementData.agentName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Settlement Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expected COD</p>
                    <p className="text-xl font-bold text-blue-600">₹ {settlementData.expectedAmount.toLocaleString()}</p>
                  </div>
                  <ApperIcon name="Calculator" size={24} className="text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Received</p>
                    <p className="text-xl font-bold text-green-600">₹ {settlementData.collectedAmount.toLocaleString()}</p>
                  </div>
                  <ApperIcon name="Wallet" size={24} className="text-green-500" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Shortage</p>
                    <p className={`text-xl font-bold ${settlementData.shortage === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹ {settlementData.shortage.toLocaleString()}
                    </p>
                  </div>
                  {settlementData.shortage === 0 ? (
                    <ApperIcon name="CheckCircle" size={24} className="text-green-500" />
                  ) : (
                    <ApperIcon name="AlertTriangle" size={24} className="text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`p-4 rounded-lg border-l-4 ${
              settlementData.shortage === 0 
                ? 'bg-green-50 border-green-400' 
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-center space-x-2">
                {settlementData.shortage === 0 ? (
                  <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
                ) : (
                  <ApperIcon name="AlertCircle" size={20} className="text-red-600" />
                )}
                <span className={`font-medium ${
                  settlementData.shortage === 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {settlementData.shortage === 0 
                    ? '✅ All COD amounts collected successfully' 
                    : `❌ Shortage of ₹${settlementData.shortage.toLocaleString()} detected`
                  }
                </span>
              </div>
            </div>

            {/* Settlement Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-700">Settlement Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total COD Orders:</span>
                  <span className="font-medium">{settlementData.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed COD Orders:</span>
                  <span className="font-medium">{settlementData.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Rate:</span>
                  <span className="font-medium">{settlementData.collectionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Settlement Time:</span>
                  <span className="font-medium">{settlementData.settlementTime}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={() => {
                  toast.success('Settlement report downloaded successfully');
                }}
                className="flex-1"
                variant="secondary"
              >
                <ApperIcon name="Download" size={16} className="mr-2" />
                Download Report
              </Button>
              <Button 
                onClick={() => {
                  toast.success('Settlement data refreshed');
                  loadSettlementData();
                }}
                variant="primary"
              >
                <ApperIcon name="RefreshCw" size={16} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ApperIcon name="FileText" size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Loading settlement data...</p>
          </div>
        )}
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
          
<div className={`p-4 rounded-lg border ${sosActive ? 'bg-red-100 border-red-300 animate-pulse' : 'bg-purple-50 border-purple-200'}`}>
            <Button 
              variant="ghost" 
              className={`w-full h-full text-white transition-all duration-200 ${
                sosActive 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 animate-pulse' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
              onClick={sosActive ? deactivateSOS : requestEmergencyHelp}
            >
              <div className="text-center">
                <ApperIcon 
                  name={sosActive ? "AlertTriangle" : "AlertTriangle"} 
                  size={24} 
                  className={`mx-auto mb-2 ${sosActive ? 'animate-bounce' : ''}`} 
                />
                <p className="font-bold">{sosActive ? 'SOS ACTIVE' : 'SOS'}</p>
                <p className="text-xs">
                  {sosActive ? 'Tap to Stop' : 'Emergency Help'}
                </p>
                {sosActive && (
                  <div className="flex justify-center mt-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
// Team Dashboard Functions
  const loadTeamData = async () => {
    try {
      const [drivers, zones, heatmap, alerts, metrics] = await Promise.all([
        deliveryService.getTeamDrivers(),
        deliveryService.getDeliveryZones(),
        deliveryService.getHeatmapData(),
        deliveryService.getBottleneckAlerts(),
        deliveryService.getTeamMetrics()
      ]);

      setTeamData({
        drivers,
        zones,
        heatmapData: heatmap,
        bottleneckAlerts: alerts,
        teamMetrics: metrics
      });
    } catch (error) {
      console.error('Failed to load team data:', error);
      setError('Failed to load team dashboard data');
    }
  };

  const handleZoneAction = async (zoneId, action) => {
    try {
      await deliveryService.executeZoneAction(zoneId, action);
      toast.success(`Zone action "${action}" executed successfully`);
      loadTeamData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to execute zone action: ${error.message}`);
    }
  };

const renderTeamDashboard = () => (
    <div className="space-y-6">
      {/* Team Overview Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Team Dashboard & Assignment Control</h2>
            <p className="text-primary-100">Live delivery operations & personnel management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{availableDrivers?.length || 0}</p>
              <p className="text-sm text-primary-100">Available Drivers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{orders.filter(o => o.assignedDriver).length}</p>
              <p className="text-sm text-primary-100">Assigned Orders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">₹{Object.values(codBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}</p>
              <p className="text-sm text-primary-100">Total COD</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon="RefreshCw"
              onClick={loadTeamData}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-primary-100 text-sm">Assignment Rate</p>
            <p className="text-xl font-bold">{orders.length > 0 ? Math.round((orders.filter(o => o.assignedDriver).length / orders.length) * 100) : 0}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-primary-100 text-sm">Avg Response Time</p>
            <p className="text-xl font-bold">2.3min</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-primary-100 text-sm">COD Accuracy</p>
            <p className="text-xl font-bold">98.5%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-primary-100 text-sm">Active Assignments</p>
            <p className="text-xl font-bold text-warning">{pendingAssignments?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Assignment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personnel Availability */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ApperIcon name="Users" size={20} />
            Personnel Availability
          </h3>
          <div className="space-y-3">
            {availableDrivers.map((driver) => (
              <div key={driver.Id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    driver.status === 'active' ? 'bg-green-500' :
                    driver.status === 'break' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-gray-600">
                      Load: {driver.currentLoad}/{driver.capacity} | COD: ₹{driver.codBalance?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={driver.status === 'active' ? 'success' : 'warning'}>
                    {driver.status === 'active' ? '🟢 Available' : 
                     driver.status === 'break' ? '🟡 Break' : '🔴 Busy'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Rating: {driver.rating}/5</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment History */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ApperIcon name="Clock" size={20} />
            Recent Assignments
          </h3>
          <div className="space-y-3">
            {assignmentHistory.slice(-5).reverse().map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Order #{assignment.orderId}</p>
                  <p className="text-sm text-gray-600">
                    Assigned to {assignment.driverName}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="info">{assignment.assignmentType}</Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(assignment.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {assignmentHistory.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent assignments</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottleneck Alerts */}
      {teamData.bottleneckAlerts && teamData.bottleneckAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between p-4 border-b border-red-200">
            <div className="flex items-center gap-2">
              <ApperIcon name="AlertTriangle" size={20} className="text-red-500" />
              <h3 className="font-semibold text-red-800">Assignment Bottlenecks</h3>
              <Badge variant="danger">{teamData.bottleneckAlerts.length}</Badge>
            </div>
            <div className="flex gap-2">
              {['all', 'urgent', 'warning', 'info'].map(filter => (
                <Button
                  key={filter}
                  size="sm"
                  variant={alertFilter === filter ? 'primary' : 'ghost'}
                  onClick={() => setAlertFilter(filter)}
                  className="text-xs"
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {teamData.bottleneckAlerts
              .filter(alert => alertFilter === 'all' || alert.severity === alertFilter)
              .map(alert => (
                <div key={alert.Id} className={`border rounded-lg p-3 ${
                  alert.severity === 'urgent' ? 'border-red-300 bg-red-50' :
                  alert.severity === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                  'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {alert.severity === 'urgent' ? '🔴' : 
                         alert.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.zone}</p>
                      </div>
                    </div>
                    <Badge variant={alert.severity === 'urgent' ? 'danger' : 
                                   alert.severity === 'warning' ? 'warning' : 'info'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon="Zap"
                      onClick={() => handleZoneAction(alert.zoneId, 'prioritize')}
                    >
                      Prioritize Zone
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="Users"
                      onClick={() => handleZoneAction(alert.zoneId, 'assign_backup')}
                    >
                      Assign Backup
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="Route"
                      onClick={() => handleZoneAction(alert.zoneId, 'reroute')}
                    >
                      Reroute
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <ApperIcon name="Users" size={20} />
              Team Overview
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {teamData.drivers?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active drivers</p>
            ) : (
              teamData.drivers?.map(driver => (
                <div key={driver.Id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      driver.status === 'active' ? 'bg-green-500' :
                      driver.status === 'break' ? 'bg-yellow-500' :
                      driver.status === 'offline' ? 'bg-gray-400' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.zone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{driver.activeDeliveries || 0} active</p>
                    <p className="text-xs text-gray-500">{driver.completedToday || 0} completed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delivery Heatmap */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ApperIcon name="Map" size={20} />
                Delivery Heatmap
              </h3>
              <Button
                size="sm"
                variant="primary"
                icon="Maximize"
                onClick={() => {
                  setCurrentView('map');
                  setTimeout(() => {
                    // This would trigger team view in the map component
                    toast.info('Switched to full map view');
                  }, 100);
                }}
              >
                Full View
              </Button>
            </div>
          </div>
          <div className="p-4">
            <DeliveryMap 
              orders={orders}
              driverLocation={driverLocation}
              optimizedRoute={optimizedRoute}
              selectedOrder={selectedOrder}
              onOrderSelect={setSelectedOrder}
              teamData={teamData}
              isTeamView={true}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Zone Performance */}
      {teamData.zones && teamData.zones.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <ApperIcon name="BarChart3" size={20} />
              Zone Performance
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamData.zones.map(zone => (
                <div 
                  key={zone.Id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedZone?.Id === zone.Id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{zone.name}</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      zone.performance >= 90 ? 'bg-green-500' :
                      zone.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Performance</span>
                      <span className="font-medium">{zone.performance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Orders</span>
                      <span className="font-medium">{zone.activeOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Delivery</span>
                      <span className="font-medium">{zone.avgDeliveryTime}min</span>
                    </div>
                    {zone.bottlenecks > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Bottlenecks</span>
                        <span className="font-medium">{zone.bottlenecks}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Load team data when team view is selected
  useEffect(() => {
    if (currentView === 'team') {
      loadTeamData();
    }
  }, [currentView]);

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
{currentView === 'assignment' && renderAssignmentView()}
          
          {currentView === 'queue' && renderOrderQueue()}
          
          {currentView === 'map' && (
            <DeliveryMap 
              orders={orders}
              driverLocation={driverLocation}
              optimizedRoute={optimizedRoute}
              selectedOrder={selectedOrder}
              onOrderSelect={setSelectedOrder}
              teamData={teamData}
              isTeamView={false}
            />
          )}
          
          {currentView === 'team' && renderTeamDashboard()}
          
          {currentView === 'earnings' && renderEarningsView()}
          
          {currentView === 'operational' && renderOperationalView()}
          
          {currentView === 'contact' && selectedOrder && (
            <CustomerContact 
              order={selectedOrder}
              onClose={() => {
                setCurrentView('assignment');
                setSelectedOrder(null);
              }}
            />
          )}
          
          {currentView === 'proof' && selectedOrder && (
            <ProofOfDelivery 
              order={selectedOrder}
              onComplete={(proofData) => {
                const codData = {
                  collectedAmount: proofData.codAmount || selectedOrder.codAmount || selectedOrder.total,
                  dueAmount: selectedOrder.codAmount || selectedOrder.total
                };
                updateOrderStatus(selectedOrder.Id, 'delivered', 'Delivery completed with proof', codData);
                setCurrentView('assignment');
                setSelectedOrder(null);
              }}
              onCancel={() => {
                setCurrentView('assignment');
                setSelectedOrder(null);
              }}
            />
          )}
          
          {currentView === 'metrics' && (
            <DeliveryMetrics />
          )}
          
          {currentView === 'support' && renderSupportSystem()}
          
          {currentView === 'testing' && renderTestingDashboard()}
        </>
      )}
    </div>
  );
}

export default DeliveryDashboard;