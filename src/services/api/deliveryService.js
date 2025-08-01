import { orderService } from "@/services/api/orderService";
class DeliveryService {
  constructor() {
    this.activeDeliveries = new Map();
    this.driverLocation = null;
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

    return {
      totalDeliveries: deliveries.length,
      delivered: delivered.length,
      failed: failed.length,
      inProgress: inProgress.length,
      successRate: deliveries.length > 0 ? (delivered.length / deliveries.length) * 100 : 98,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      onTimeDeliveries,
      onTimeRateTrend: 2, // Mock trend data
      customerRating
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
}

export const deliveryService = new DeliveryService();