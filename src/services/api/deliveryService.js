import { orderService } from "@/services/api/orderService";

class DeliveryService {
  constructor() {
    this.activeDeliveries = new Map();
    this.driverLocation = null;
    this.earningsData = {
      basePay: 1200,
      bonuses: 0,
      deductions: 0,
      deliveryRate: 35, // Rs per delivery
      bonusThresholds: {
        onTime: 50, // Rs per on-time delivery
        customer: 25, // Rs per 5-star rating
        efficiency: 100 // Rs for completing route under time
      }
    };
    this.vehicleMetrics = {
      fuelEfficiency: 15.2,
      maintenanceAlerts: [],
      temperatureLog: 4.2,
      coolerCapacity: 85
    };
  }

  delay(ms = 400) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getDeliveryQueue() {
    await this.delay();
    
    // Get orders that are ready for delivery
    const allOrders = await orderService.getAll();
    const deliveryOrders = allOrders.filter(order => 
      ['ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery'].includes(order.deliveryStatus)
    );

    // Sort by priority and delivery window
    return deliveryOrders.sort((a, b) => {
      // Urgent orders first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      
      // Then by delivery window
      const aTime = a.deliveryWindow?.start ? new Date(a.deliveryWindow.start) : new Date(a.createdAt);
      const bTime = b.deliveryWindow?.start ? new Date(b.deliveryWindow.start) : new Date(b.createdAt);
      
      return aTime - bTime;
    });
  }

  async updateOrderStatus(orderId, status, location = null, notes = '') {
    await this.delay();
    
    const order = await orderService.updateDeliveryStatus(orderId, status, location, notes);
    
    // Update active deliveries tracking
    if (status === 'picked_up' || status === 'in_transit') {
      this.activeDeliveries.set(orderId, {
        orderId,
        status,
        startTime: new Date().toISOString(),
        currentLocation: location
      });
    } else if (status === 'delivered' || status === 'delivery_failed') {
      this.activeDeliveries.delete(orderId);
    }

    return order;
  }

  async updateDriverLocation(location) {
    this.driverLocation = location;
    
    // Update location for all active deliveries
    for (const [orderId, delivery] of this.activeDeliveries) {
      delivery.currentLocation = location;
      delivery.lastLocationUpdate = new Date().toISOString();
    }

    return location;
  }

  async getActiveDeliveries() {
    await this.delay();
    return Array.from(this.activeDeliveries.values());
  }

  async getDeliveryHistory(driverId, startDate, endDate) {
    await this.delay();
    
    const allOrders = await orderService.getAll();
    return allOrders.filter(order => 
      order.assignedDriver === driverId &&
      order.deliveryStatus === 'delivered' &&
      order.deliveredAt >= startDate &&
      order.deliveredAt <= endDate
    );
  }

async getDeliveryMetrics(driverId, period = 'today') {
    await this.delay();
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const allOrders = await orderService.getAll();
    const deliveries = allOrders.filter(order => 
      order.assignedDriver === driverId &&
      new Date(order.createdAt) >= startDate
    );

    const delivered = deliveries.filter(d => d.deliveryStatus === 'delivered');
    const failed = deliveries.filter(d => d.deliveryStatus === 'delivery_failed');
    const inProgress = deliveries.filter(d => 
      ['picked_up', 'in_transit'].includes(d.deliveryStatus)
    );

    const averageDeliveryTime = delivered.length > 0 
      ? delivered.reduce((sum, d) => {
          const start = new Date(d.deliveryTimeline?.find(t => t.status === 'picked_up')?.timestamp || d.createdAt);
          const end = new Date(d.deliveryTimeline?.find(t => t.status === 'delivered')?.timestamp || d.updatedAt);
          return sum + (end - start);
        }, 0) / delivered.length / (1000 * 60) // Convert to minutes
      : 8.2; // Default average time

    const onTimeDeliveries = delivered.filter(d => {
      if (!d.deliveryWindow?.end) return true;
      const deliveredAt = new Date(d.deliveryTimeline?.find(t => t.status === 'delivered')?.timestamp);
      const windowEnd = new Date(d.deliveryWindow.end);
      return deliveredAt <= windowEnd;
    }).length;

    // Calculate customer rating based on delivery performance
    const customerRating = this.calculateCustomerRating(delivered, onTimeDeliveries, averageDeliveryTime);

    // Calculate earnings data
    const earnings = this.calculateEarnings(delivered, onTimeDeliveries, customerRating, averageDeliveryTime);

    return {
      totalDeliveries: deliveries.length,
      delivered: delivered.length,
      failed: failed.length,
      inProgress: inProgress.length,
      successRate: deliveries.length > 0 ? (delivered.length / deliveries.length) * 100 : 98,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      onTimeDeliveries,
      onTimeRateTrend: 2, // Mock trend data
      customerRating,
      earnings,
      incentiveProgress: {
        current: delivered.length,
        target: 10,
        reward: 200,
        progressText: `${10 - delivered.length} more deliveries for ₹200 bonus`
      }
    };
  }

  calculateEarnings(delivered, onTimeDeliveries, customerRating, averageTime) {
    const baseEarnings = delivered.length * this.earningsData.deliveryRate;
    
    // On-time bonus
    const onTimeBonus = onTimeDeliveries * this.earningsData.bonusThresholds.onTime;
    
    // Customer rating bonus (for ratings 4.5+)
    const ratingBonus = customerRating >= 4.5 ? delivered.length * this.earningsData.bonusThresholds.customer : 0;
    
    // Efficiency bonus (for average time < 30 minutes)
    const efficiencyBonus = averageTime < 30 ? this.earningsData.bonusThresholds.efficiency : 0;
    
    const totalBonuses = onTimeBonus + ratingBonus + efficiencyBonus;
    
    return {
      basePay: this.earningsData.basePay,
      deliveryEarnings: baseEarnings,
      bonuses: {
        onTime: onTimeBonus,
        customerRating: ratingBonus,
        efficiency: efficiencyBonus,
        total: totalBonuses
      },
      deductions: this.earningsData.deductions,
      totalEarnings: this.earningsData.basePay + baseEarnings + totalBonuses - this.earningsData.deductions
    };
  }

  calculateCustomerRating(delivered, onTimeDeliveries, averageTime) {
    let rating = 5.0;
    
    // Reduce rating based on late deliveries
    if (delivered.length > 0) {
      const onTimeRate = onTimeDeliveries / delivered.length;
      if (onTimeRate < 0.9) rating -= 0.5;
      if (onTimeRate < 0.8) rating -= 0.3;
    }
    
    // Reduce rating based on delivery time
    if (averageTime > 15) rating -= 0.2;
    if (averageTime > 20) rating -= 0.2;
    
    return Math.max(rating, 3.0); // Minimum rating of 3.0
  }

  async reportEmergency(driverId, emergencyType, location = null) {
    await this.delay();
    
    const emergencyReport = {
      driverId,
      emergencyType,
      location,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // In a real app, this would send to dispatch center
    console.log('Emergency reported:', emergencyReport);
    
return emergencyReport;
}

  async reportDeliveryIssue(orderId, issueType, description, location = null) {
    await this.delay();
    
    const order = await orderService.updateDeliveryStatus(
      orderId, 
      'delivery_failed', 
      location, 
      `${issueType}: ${description}`
    );

    // Remove from active deliveries
    this.activeDeliveries.delete(orderId);

    return order;
  }

  async completeDelivery(orderId, proofData) {
    await this.delay();
    
    const order = await orderService.update(orderId, {
      deliveryStatus: 'delivered',
      deliveredAt: new Date().toISOString(),
      proofOfDelivery: proofData,
      completedBy: 'driver' // In real app, would be driver ID
    });

    // Remove from active deliveries
    this.activeDeliveries.delete(orderId);

    return order;
  }

  // Vehicle Management
  async updateVehicleMetrics(metrics) {
    await this.delay();
    this.vehicleMetrics = { ...this.vehicleMetrics, ...metrics };
    
    // Store in localStorage for persistence
    localStorage.setItem('vehicleMetrics', JSON.stringify(this.vehicleMetrics));
    
    return this.vehicleMetrics;
  }

  async getVehicleStatus() {
    await this.delay();
    
    // Load from localStorage if available
    const stored = localStorage.getItem('vehicleMetrics');
    if (stored) {
      this.vehicleMetrics = { ...this.vehicleMetrics, ...JSON.parse(stored) };
    }
    
    return {
      ...this.vehicleMetrics,
      batteryLevel: 85,
      gpsStatus: 'active',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-02-15',
      totalKmToday: 185,
      fuelRemaining: 45 // liters
    };
  }

  async logTemperature(temperature) {
    await this.delay();
    
    const tempLog = JSON.parse(localStorage.getItem('temperatureLog') || '[]');
    tempLog.push({
      temperature,
      timestamp: new Date().toISOString(),
      status: temperature >= 2 && temperature <= 8 ? 'optimal' : 'alert'
    });
    
    // Keep only last 24 hours of data
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredLog = tempLog.filter(entry => new Date(entry.timestamp) > dayAgo);
    
    localStorage.setItem('temperatureLog', JSON.stringify(filteredLog));
    
    this.vehicleMetrics.temperatureLog = temperature;
    return filteredLog;
  }

  // Safety & Fatigue Management
  async trackWorkingHours(driverId) {
    await this.delay();
    
    const today = new Date().toDateString();
    const workData = JSON.parse(localStorage.getItem('workingHours') || '{}');
    
    if (!workData[today]) {
      workData[today] = {
        startTime: new Date().toISOString(),
        totalHours: 0,
        breaks: []
      };
    }
    
    // Calculate hours worked today
    const startTime = new Date(workData[today].startTime);
    const now = new Date();
    const hoursWorked = (now - startTime) / (1000 * 60 * 60);
    
    workData[today].totalHours = hoursWorked;
    
    localStorage.setItem('workingHours', JSON.stringify(workData));
    
    return {
      hoursToday: hoursWorked,
      fatigueAlert: hoursWorked >= 6,
      recommendedBreak: hoursWorked >= 4 && hoursWorked % 2 < 0.1
    };
  }

  async recordBreak(duration) {
    await this.delay();
    
    const today = new Date().toDateString();
    const workData = JSON.parse(localStorage.getItem('workingHours') || '{}');
    
    if (workData[today]) {
      workData[today].breaks.push({
        startTime: new Date().toISOString(),
        duration: duration,
        type: duration >= 30 ? 'meal' : 'rest'
      });
      
      localStorage.setItem('workingHours', JSON.stringify(workData));
    }
    
    return workData[today];
  }

  // Offline capability
  async syncOfflineDeliveries() {
    const offlineData = localStorage.getItem('offlineDeliveries');
    if (!offlineData) return;

    const deliveries = JSON.parse(offlineData);
    const results = [];

    for (const delivery of deliveries) {
      try {
        const result = await this.updateOrderStatus(
          delivery.orderId,
          delivery.status,
          delivery.location,
          delivery.notes
        );
        results.push({ success: true, orderId: delivery.orderId, result });
      } catch (error) {
        results.push({ success: false, orderId: delivery.orderId, error: error.message });
      }
    }

    // Clear offline data after sync
    localStorage.removeItem('offlineDeliveries');
    return results;
  }

  saveOfflineDelivery(orderId, status, location, notes) {
    const offlineData = JSON.parse(localStorage.getItem('offlineDeliveries') || '[]');
    offlineData.push({
      orderId,
      status,
      location,
      notes,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('offlineDeliveries', JSON.stringify(offlineData));
  }

  // Emergency & Security
  async reportEmergency(driverId, emergencyType, location = null) {
    await this.delay();
    
    const emergency = {
      id: Date.now(),
      driverId,
      type: emergencyType,
      location,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    // Store emergency data
    const emergencies = JSON.parse(localStorage.getItem('emergencies') || '[]');
    emergencies.push(emergency);
    localStorage.setItem('emergencies', JSON.stringify(emergencies));
    
    // In real app, would send to dispatch immediately
    console.log('🚨 EMERGENCY REPORTED:', emergency);
    
    return emergency;
  }

// Data privacy - blur sensitive addresses
  blurAddress(address) {
    if (!address) return '';
    
    const parts = address.split(' ');
    if (parts.length <= 2) return address;
    
    // Keep first and last part, blur middle
    return `${parts[0]} ${'*'.repeat(parts.slice(1, -1).join(' ').length)} ${parts[parts.length - 1]}`;
  }

// Team Dashboard Methods
  async getTeamDrivers() {
    await this.delay(600);
    
    const drivers = [
      { Id: 1, name: 'Alex Chen', status: 'active', zone: 'Downtown', activeDeliveries: 3, completedToday: 12, rating: 4.8, location: { lat: 40.7128, lng: -74.0060 } },
      { Id: 2, name: 'Maria Garcia', status: 'active', zone: 'Midtown', activeDeliveries: 2, completedToday: 15, rating: 4.9, location: { lat: 40.7589, lng: -73.9851 } },
      { Id: 3, name: 'James Wilson', status: 'break', zone: 'Uptown', activeDeliveries: 0, completedToday: 8, rating: 4.6, location: { lat: 40.7831, lng: -73.9712 } },
      { Id: 4, name: 'Sarah Kim', status: 'active', zone: 'Brooklyn', activeDeliveries: 4, completedToday: 10, rating: 4.7, location: { lat: 40.6782, lng: -73.9442 } },
      { Id: 5, name: 'David Brown', status: 'delayed', zone: 'Queens', activeDeliveries: 2, completedToday: 6, rating: 4.5, location: { lat: 40.7282, lng: -73.7949 } }
    ];

    return drivers;
  }
async getDeliveryZones() {
    await this.delay(500);
const zones = [
      { 
        Id: 1, 
        name: 'Downtown',
        performance: 92, 
        activeOrders: 15, 
        avgDeliveryTime: 22, 
        bottlenecks: 0,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        deliveryDensity: 'high',
        onTimeRate: 94
      },
      { 
        Id: 2, 
        name: 'Midtown', 
        performance: 88, 
        activeOrders: 12, 
        avgDeliveryTime: 28, 
        bottlenecks: 1,
        coordinates: { lat: 40.7589, lng: -73.9851 },
        deliveryDensity: 'very-high',
        onTimeRate: 89
      },
      { 
        Id: 3, 
        name: 'Uptown', 
        performance: 75, 
        activeOrders: 8, 
        avgDeliveryTime: 35, 
        bottlenecks: 2,
        coordinates: { lat: 40.7831, lng: -73.9712 },
        deliveryDensity: 'medium',
        onTimeRate: 76
      },
      { 
        Id: 4, 
        name: 'Brooklyn', 
        performance: 85, 
        activeOrders: 18, 
        avgDeliveryTime: 30, 
        bottlenecks: 1,
        coordinates: { lat: 40.6782, lng: -73.9442 },
        deliveryDensity: 'high',
        onTimeRate: 87
      },
      { 
        Id: 5, 
        name: 'Queens', 
        performance: 68, 
        activeOrders: 6, 
        avgDeliveryTime: 42, 
        bottlenecks: 3,
        coordinates: { lat: 40.7282, lng: -73.7949 },
        deliveryDensity: 'low',
        onTimeRate: 72
      }
    ];

    return zones;
  }
async getHeatmapData() {
    await this.delay(400);
    
    const heatmapData = [
      { zone: 'Downtown', intensity: 0.9, deliveries: 85, delays: 2, performance: 92 },
      { zone: 'Downtown', intensity: 0.9, deliveries: 85, delays: 2, performance: 92 },
      { zone: 'Midtown', intensity: 1.0, deliveries: 95, delays: 8, performance: 88 },
      { zone: 'Uptown', intensity: 0.6, deliveries: 42, delays: 12, performance: 75 },
      { zone: 'Brooklyn', intensity: 0.8, deliveries: 67, delays: 5, performance: 85 },
      { zone: 'Queens', intensity: 0.4, deliveries: 28, delays: 15, performance: 68 }
    ];

    return heatmapData;
  }
async getBottleneckAlerts() {
    await this.delay(300);
    
const alerts = [
      {
        Id: 1,
        title: 'Traffic Congestion Detected',
        zone: 'Queens',
        zoneId: 5,
        severity: 'urgent',
        description: 'Major traffic jam causing 40+ minute delays. 3 drivers affected.',
        timestamp: new Date(Date.now() - 300000),
        affectedDrivers: 3,
        estimatedDelay: 45
      },
      {
        Id: 2,
        title: 'High Order Volume',
        zone: 'Midtown',
        zoneId: 2,
        severity: 'warning',
        description: 'Order volume 150% above normal. Consider backup driver assignment.',
        timestamp: new Date(Date.now() - 600000),
        affectedDrivers: 2,
        estimatedDelay: 15
      },
      {
        Id: 3,
        title: 'Weather Impact',
        zone: 'Uptown',
        zoneId: 3,
        severity: 'warning',
        description: 'Light rain causing slower delivery times. Monitor conditions.',
        timestamp: new Date(Date.now() - 900000),
        affectedDrivers: 1,
        estimatedDelay: 10
      }
    ];

    return alerts;
  }
async getTeamMetrics() {
await this.delay(350);
    
    const metrics = {
      totalDeliveries: 237,
      onTimeRate: 86,
      avgDeliveryTime: 28,
      customerRating: 4.7,
      activeDrivers: 5,
      completedOrders: 189,
      pendingOrders: 48,
      issuesReported: 3,
      totalDistance: 1247,
      fuelEfficiency: 14.2,
      customerSatisfaction: 94
    };

    return metrics;
  }
async executeZoneAction(zoneId, action) {
    await this.delay(800);
    
const actions = {
      'prioritize': `Zone ${zoneId} has been prioritized for immediate attention`,
      'assign_backup': `Backup driver has been assigned to zone ${zoneId}`,
      'reroute': `Traffic rerouting has been activated for zone ${zoneId}`,
      'emergency_support': `Emergency support dispatched to zone ${zoneId}`
    };

    if (!actions[action]) {
      throw new Error('Invalid zone action');
    }

    // Simulate action execution
    console.log(`Executing ${action} for zone ${zoneId}`);
    
    return {
      success: true,
      message: actions[action],
      timestamp: new Date(),
      zoneId,
      action
    };
  }
}

export const deliveryService = new DeliveryService();