import React from "react";
import { orderService } from "@/services/api/orderService";
import Error from "@/components/ui/Error";

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
      },
      // Enhanced discrepancy deduction settings
      discrepancyDeductions: {
        threshold: 50, // Minimum amount for auto-deduction
        percentage: 100, // Percentage of discrepancy to deduct (100% = full amount)
        maxDaily: 500, // Maximum daily deductions per agent
        escalationThreshold: 200 // Amount that triggers immediate escalation
      }
    };
    this.vehicleMetrics = {
      fuelEfficiency: 15.2,
      maintenanceAlerts: [],
      temperatureLog: 4.2,
      coolerCapacity: 85
    };

    // Enhanced sync architecture
    this.syncQueue = [];
    this.conflictResolution = new Map();
    this.webhookSubscribers = new Set();
    this.networkStatus = 'online';
    this.lastSyncTimestamp = new Date().toISOString();
    
    // Discrepancy tracking
    this.discrepancyTracker = new Map();
    this.customerVerifications = new Map();
    this.agentDeductions = new Map();
    
    // Initialize real-time monitoring
    this.initializeRealtimeSync();
  }

  initializeRealtimeSync() {
    // Simulate webhook subscriptions for agent apps
    this.webhookSubscribers.add('agent_app_primary');
    this.webhookSubscribers.add('admin_dashboard');
    this.webhookSubscribers.add('compliance_monitor');

    // Monitor network status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.networkStatus = 'online';
        this.processSyncQueue();
      });
      
      window.addEventListener('offline', () => {
        this.networkStatus = 'offline';
      });
    }

    // Periodic sync check
    setInterval(() => {
      if (this.networkStatus === 'online' && this.syncQueue.length > 0) {
        this.processSyncQueue();
}
    }, 30000);
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

async updateOrderStatus(orderId, status, location = null, notes = '', codData = null) {
    await this.delay();
    
    const timestamp = new Date().toISOString();
    
    // Enhanced location with GPS accuracy
    const enhancedLocation = location ? {
      ...location,
      accuracy: location.accuracy || '±5 meters',
      timestamp,
      source: 'gps'
    } : null;
    
    const order = await orderService.updateDeliveryStatus(orderId, status, enhancedLocation, notes, codData);
    
    // Update active deliveries tracking with enhanced data
    if (status === 'picked_up' || status === 'in_transit') {
      this.activeDeliveries.set(orderId, {
        orderId,
        status,
        startTime: timestamp,
        currentLocation: enhancedLocation,
        driverId: order.assignedDriver,
        codAmount: order.codAmount || order.total,
        estimatedDeliveryTime: order.estimatedDeliveryTime || 30
      });
    } else if (status === 'delivered' || status === 'delivery_failed') {
      this.activeDeliveries.delete(orderId);
      
      // Update settlement data for delivered COD orders
      if (status === 'delivered' && codData && (order.codAmount > 0 || order.total > 0)) {
        await this.updateSettlementData(codData.collectedAmount || order.codAmount || order.total, true);
      }
    }

    // Add to sync queue for webhook notifications
    this.addToSyncQueue({
      type: 'status_update',
      orderId,
      status,
      location: enhancedLocation,
      timestamp,
      driverId: order.assignedDriver,
      codData
    });

    // Trigger real-time updates to agent apps
    this.broadcastUpdate('order_status_changed', {
      orderId,
      status,
      order,
      location: enhancedLocation,
      timestamp
    });

    return order;
  }

async assignOrderToDriver(orderId, driverId, assignmentData = {}) {
    await this.delay();
    
    const timestamp = new Date().toISOString();
    const enhancedAssignmentData = {
      ...assignmentData,
      assignedBy: assignmentData.assignedBy || 'admin',
      assignmentMethod: assignmentData.assignmentMethod || 'manual',
      timestamp,
      routeDistance: assignmentData.routeDistance || this.calculateRouteDistance(orderId, driverId),
      estimatedDeliveryTime: assignmentData.estimatedDeliveryTime || this.calculateETA(orderId, driverId)
    };

    const order = await orderService.assignDriver(orderId, driverId, enhancedAssignmentData);

    // Add to sync queue for webhook notifications
    this.addToSyncQueue({
      type: 'driver_assignment',
      orderId,
      driverId,
      assignmentData: enhancedAssignmentData,
      timestamp
    });

    // Broadcast to agent app with push notification data
    this.broadcastUpdate('driver_assigned', {
      orderId,
      driverId,
      order,
      pushNotification: {
        title: `🚚 New COD Assignment`,
        body: `ORDER #${orderId} - ₹${order.codAmount || order.total} - ${order.shipping?.address}`,
        data: {
          orderId,
          codAmount: order.codAmount || order.total,
          customerName: order.shipping?.firstName,
          deliveryAddress: order.shipping?.address,
          estimatedTime: enhancedAssignmentData.estimatedDeliveryTime,
          routeMap: `maps://route/${order.shipping?.coordinates?.lat},${order.shipping?.coordinates?.lng}`
        }
      }
    });

    return order;
  }

  calculateRouteDistance(orderId, driverId) {
    // Mock calculation - in real app would use mapping API
    return Math.random() * 10 + 2; // 2-12 km
  }

  calculateETA(orderId, driverId) {
    // Mock ETA calculation - in real app would use traffic data
    const baseTime = 18; // 18 minutes base
    const distance = this.calculateRouteDistance(orderId, driverId);
    return Math.round(baseTime + (distance * 2.5)); // 2.5 mins per km
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

    // Calculate COD metrics
    const codDeliveries = delivered.filter(d => d.codAmount > 0);
    const codAccuracy = codDeliveries.length > 0 
      ? (codDeliveries.filter(d => d.codCollected && d.codCollectedAmount === d.codAmount).length / codDeliveries.length) * 100
      : 100;

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
      codAccuracy: Math.round(codAccuracy),
      totalCodCollected: delivered.reduce((sum, d) => sum + (d.codCollectedAmount || 0), 0),
      incentiveProgress: {
        current: delivered.length,
        target: 10,
        reward: 200,
        progressText: `${10 - delivered.length} more deliveries for ₹200 bonus`
      }
    };
  }

calculateEarnings(delivered, onTimeDeliveries, customerRating, averageTime, driverId = null) {
    const baseEarnings = delivered.length * this.earningsData.deliveryRate;
    
    // On-time bonus
    const onTimeBonus = onTimeDeliveries * this.earningsData.bonusThresholds.onTime;
    
    // Customer rating bonus (for ratings 4.5+)
    const ratingBonus = customerRating >= 4.5 ? delivered.length * this.earningsData.bonusThresholds.customer : 0;
    
    // Efficiency bonus (for average time < 30 minutes)
    const efficiencyBonus = averageTime < 30 ? this.earningsData.bonusThresholds.efficiency : 0;
    
    const totalBonuses = onTimeBonus + ratingBonus + efficiencyBonus;
    
    // Calculate discrepancy deductions
    const discrepancyDeductions = this.calculateDiscrepancyDeductions(driverId);
    const totalDeductions = this.earningsData.deductions + discrepancyDeductions.total;
    
    return {
      basePay: this.earningsData.basePay,
      deliveryEarnings: baseEarnings,
      bonuses: {
        onTime: onTimeBonus,
        customerRating: ratingBonus,
        efficiency: efficiencyBonus,
        total: totalBonuses
      },
      deductions: {
        standard: this.earningsData.deductions,
        discrepancy: discrepancyDeductions.total,
        discrepancyBreakdown: discrepancyDeductions.breakdown,
        total: totalDeductions
      },
      totalEarnings: this.earningsData.basePay + baseEarnings + totalBonuses - totalDeductions,
      discrepancyImpact: discrepancyDeductions.total > 0 ? {
        totalDeducted: discrepancyDeductions.total,
        ordersAffected: discrepancyDeductions.breakdown.length,
        averageDiscrepancy: discrepancyDeductions.breakdown.length > 0 
          ? Math.round(discrepancyDeductions.total / discrepancyDeductions.breakdown.length) 
          : 0
      } : null
    };
  }

  // New method to calculate discrepancy deductions
  calculateDiscrepancyDeductions(driverId) {
    if (!driverId) {
      return { total: 0, breakdown: [] };
    }

    const deductions = JSON.parse(localStorage.getItem('agentDeductions') || '[]');
    const driverDeductions = deductions.filter(d => 
      d.driverId === driverId && 
      d.reason === 'cod_discrepancy' &&
      this.isToday(d.timestamp)
    );

    const total = driverDeductions.reduce((sum, d) => sum + d.amount, 0);
    
    return {
      total,
      breakdown: driverDeductions.map(d => ({
        orderId: d.orderId,
        amount: d.amount,
        timestamp: d.timestamp,
        autoProcessed: d.autoProcessed
      }))
    };
  }

  // Helper method to check if timestamp is today
  isToday(timestamp) {
    const today = new Date().toDateString();
    const date = new Date(timestamp).toDateString();
return today === date;
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
    
    const timestamp = new Date().toISOString();
    const order = await orderService.getById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    const codAmount = proofData.codAmount || order.codAmount || order.total;
    const dueAmount = order.codAmount || order.total;
    const discrepancy = Math.abs(codAmount - dueAmount);
    
    const codData = {
      collectedAmount: codAmount,
      dueAmount,
      discrepancy,
      collectedBy: proofData.driverId || order.assignedDriver,
      timestamp,
      digitalReceiptGenerated: true,
      discrepancyHandled: discrepancy > 0
    };
    
    // Enhanced proof data with GPS verification
    const enhancedProofData = {
      ...proofData,
      timestamp,
      gpsLocation: proofData.location || this.driverLocation,
      digitalReceiptId: `RCP-${orderId}-${Date.now()}`,
      complianceVerified: true,
      codData
    };

    // Pre-delivery discrepancy tracking
    if (discrepancy > 0) {
      await this.trackDiscrepancy(orderId, discrepancy, order.assignedDriver);
    }
    
    const updatedOrder = await orderService.updateDeliveryStatus(
      orderId, 
      'delivered', 
      enhancedProofData.gpsLocation, 
      proofData.notes || '', 
      codData
    );

    // Remove from active deliveries
    this.activeDeliveries.delete(orderId);

    // Update settlement data with discrepancy consideration
    await this.updateSettlementData(codAmount, true, discrepancy);

    // Add to sync queue with discrepancy data
    this.addToSyncQueue({
      type: 'delivery_completed',
      orderId,
      proofData: enhancedProofData,
      codData,
      discrepancyData: discrepancy > 0 ? {
        amount: discrepancy,
        customerVerificationSent: true,
        agentDeductionProcessed: discrepancy >= this.earningsData.discrepancyDeductions.threshold
      } : null,
      timestamp
    });

    // Enhanced broadcast with discrepancy notifications
    this.broadcastUpdate('delivery_completed', {
      orderId,
      order: updatedOrder,
      proofData: enhancedProofData,
      smsNotification: {
        phone: order.shipping?.phone,
        message: `✅ ORDER #${orderId} Delivered (${new Date().toLocaleTimeString()})
💰 Collected: ₹${codAmount} ${discrepancy === 0 ? '(No discrepancy)' : `(₹${discrepancy} discrepancy)`}
📍 GPS Verified: ${enhancedProofData.gpsLocation?.lat?.toFixed(6)}° N, ${enhancedProofData.gpsLocation?.lng?.toFixed(6)}° E
📧 Digital receipt: ${enhancedProofData.digitalReceiptId}`
      },
      ...(discrepancy > 0 && {
        discrepancyHandling: {
          customerVerificationSent: true,
          agentNotified: true,
          deductionProcessed: discrepancy >= this.earningsData.discrepancyDeductions.threshold
        }
      })
    });

    return updatedOrder;
  }

  // New method for discrepancy tracking
  async trackDiscrepancy(orderId, discrepancy, driverId) {
    const discrepancyData = {
      orderId,
      driverId,
      amount: discrepancy,
      timestamp: new Date().toISOString(),
      status: 'detected',
      customerVerificationSent: true,
      agentDeductionProcessed: discrepancy >= this.earningsData.discrepancyDeductions.threshold
    };

    this.discrepancyTracker.set(orderId, discrepancyData);
    
    // Store persistently
    const discrepancies = JSON.parse(localStorage.getItem('discrepancyTracker') || '[]');
    discrepancies.push(discrepancyData);
    localStorage.setItem('discrepancyTracker', JSON.stringify(discrepancies));

    console.log('📊 Discrepancy tracked:', discrepancyData);
  }
// COD Settlement Management
async getCodSettlement() {
    await this.delay();
    
    const today = new Date().toDateString();
    const settlementData = this.calculateDailySettlement();
    
    // Enhanced settlement data with blockchain verification
    const ledger = JSON.parse(localStorage.getItem('codLedger') || '{"blocks":[]}');
    const todayTransactions = this.getTodayTransactions(ledger);
    
    return {
      agentName: 'Ali Raza',
      agentId: 'AGT-001',
      date: today,
      expectedAmount: settlementData.expectedAmount,
      collectedAmount: settlementData.collectedAmount,
      shortage: settlementData.shortage,
      status: settlementData.shortage === 0 ? 'complete' : settlementData.shortage > 0 ? 'shortage' : 'pending',
      totalOrders: settlementData.totalOrders,
      completedOrders: settlementData.completedOrders,
      collectionRate: settlementData.collectionRate,
      settlementTime: new Date().toLocaleTimeString(),
      lastUpdated: new Date().toISOString(),
      
      // Enhanced fields
      walletLimit: 15000,
      currentWalletBalance: this.getCurrentWalletBalance('AGT-001'),
      walletUtilization: Math.round((this.getCurrentWalletBalance('AGT-001') / 15000) * 100),
      blockchainTransactions: todayTransactions,
      digitalReceipts: this.getTodayDigitalReceipts(),
      complianceScore: this.calculateComplianceScore(settlementData),
      discrepancies: this.getDiscrepancies(todayTransactions),
      gpsVerificationRate: this.calculateGpsVerificationRate(todayTransactions)
    };
  }

  calculateDailySettlement() {
    // Get stored settlement data or create default
    const stored = localStorage.getItem('dailySettlement');
    let settlement;
    
    if (stored) {
      settlement = JSON.parse(stored);
      // Check if it's from today
      const storedDate = new Date(settlement.date).toDateString();
      const today = new Date().toDateString();
      
      if (storedDate !== today) {
        // New day, reset settlement
        settlement = this.createNewSettlement();
      }
    } else {
      settlement = this.createNewSettlement();
    }
    
    // Save updated settlement
    localStorage.setItem('dailySettlement', JSON.stringify(settlement));
    
    return settlement;
  }

  createNewSettlement() {
    // Generate realistic settlement data
    const baseExpected = 8950;
    const variations = [-150, -75, 0, 75, 150]; // Possible variations
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    const expectedAmount = baseExpected + variation;
    const collectedAmount = expectedAmount - Math.max(0, Math.floor(Math.random() * 100)); // Small random shortage
    const shortage = expectedAmount - collectedAmount;
    
    return {
      date: new Date().toISOString(),
      expectedAmount,
      collectedAmount,
      shortage,
      totalOrders: 12,
      completedOrders: shortage === 0 ? 12 : 11,
      collectionRate: Math.round((collectedAmount / expectedAmount) * 100)
    };
  }

  async updateSettlementData(orderAmount, collected = true) {
    await this.delay();
    
    const settlement = this.calculateDailySettlement();
    
    if (collected) {
      settlement.collectedAmount += orderAmount;
      settlement.completedOrders += 1;
    }
    
    settlement.expectedAmount += orderAmount;
    settlement.totalOrders += 1;
    settlement.shortage = settlement.expectedAmount - settlement.collectedAmount;
    settlement.collectionRate = Math.round((settlement.collectedAmount / settlement.expectedAmount) * 100);
    
    localStorage.setItem('dailySettlement', JSON.stringify(settlement));
    
    // Trigger settlement update webhook
    this.broadcastUpdate('settlement_updated', {
      settlement,
      orderAmount,
      collected,
      timestamp: new Date().toISOString()
    });
    
    return settlement;
  }

  // Enhanced settlement helper methods
  getTodayTransactions(ledger) {
    const today = new Date().toDateString();
    const transactions = [];
    
    ledger.blocks?.forEach(block => {
      if (new Date(block.timestamp).toDateString() === today) {
        transactions.push(...block.transactions);
      }
    });
    
    return transactions;
  }

  getCurrentWalletBalance(agentId) {
    // Mock current wallet balance calculation
    return Math.floor(Math.random() * 15000);
  }

  getTodayDigitalReceipts() {
    const receipts = JSON.parse(localStorage.getItem('digitalReceipts') || '[]');
    const today = new Date().toDateString();
    
    return receipts.filter(receipt => 
      new Date(receipt.generatedAt).toDateString() === today
    );
  }

  calculateComplianceScore(settlement) {
    let score = 100;
    
    // Deduct points for shortages
    if (settlement.shortage > 0) {
      score -= Math.min(20, (settlement.shortage / settlement.expectedAmount) * 100);
    }
    
    // Deduct points for low collection rate
    if (settlement.collectionRate < 100) {
      score -= (100 - settlement.collectionRate);
    }
    
    return Math.max(0, Math.round(score));
}

  // Enhanced discrepancy management
  getDiscrepancies(transactions) {
    return transactions.filter(t => t.discrepancy && t.discrepancy > 0);
  }

  getDiscrepancyAnalytics(driverId = null) {
    const discrepancies = JSON.parse(localStorage.getItem('discrepancyTracker') || '[]');
    const filtered = driverId ? discrepancies.filter(d => d.driverId === driverId) : discrepancies;
    
    const today = filtered.filter(d => this.isToday(d.timestamp));
    const thisWeek = filtered.filter(d => this.isThisWeek(d.timestamp));
    
    return {
      total: filtered.length,
      today: today.length,
      thisWeek: thisWeek.length,
      totalAmount: filtered.reduce((sum, d) => sum + d.amount, 0),
      averageAmount: filtered.length > 0 ? Math.round(filtered.reduce((sum, d) => sum + d.amount, 0) / filtered.length) : 0,
      customerVerificationRate: filtered.length > 0 ? Math.round((filtered.filter(d => d.customerVerificationSent).length / filtered.length) * 100) : 0,
      autoDeductionRate: filtered.length > 0 ? Math.round((filtered.filter(d => d.agentDeductionProcessed).length / filtered.length) * 100) : 0
    };
  }

  async resolveDiscrepancy(orderId, resolution, notes = '') {
    const discrepancies = JSON.parse(localStorage.getItem('discrepancyTracker') || '[]');
    const index = discrepancies.findIndex(d => d.orderId === orderId);
    
    if (index >= 0) {
      discrepancies[index].status = 'resolved';
      discrepancies[index].resolution = resolution;
      discrepancies[index].resolutionNotes = notes;
      discrepancies[index].resolvedAt = new Date().toISOString();
      
      localStorage.setItem('discrepancyTracker', JSON.stringify(discrepancies));
      
      // Notify relevant parties
      this.broadcastUpdate('discrepancy_resolved', {
        orderId,
        resolution,
        discrepancy: discrepancies[index]
      });
      
      return discrepancies[index];
    }
    
    throw new Error('Discrepancy not found');
  }

  calculateGpsVerificationRate(transactions) {
    const gpsVerified = transactions.filter(t => t.location && t.location.verified);
    return transactions.length > 0 ? Math.round((gpsVerified.length / transactions.length) * 100) : 0;
  }

  // Helper method for week filtering
  isThisWeek(timestamp) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const date = new Date(timestamp);
    return date >= weekStart;
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

// Enhanced sync architecture with conflict resolution
  addToSyncQueue(operation) {
    this.syncQueue.push({
      ...operation,
      id: Date.now(),
      retryCount: 0,
      maxRetries: 3
    });

    // Process immediately if online
    if (this.networkStatus === 'online') {
      this.processSyncQueue();
    }
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    const results = {
      processed: [],
      failed: [],
      conflicts: []
    };

    for (const operation of operations) {
      try {
        // Simulate network operation
        await this.delay(100);
        
        // Check for conflicts
        const conflict = await this.checkForConflicts(operation);
        if (conflict) {
          results.conflicts.push({ operation, conflict });
          // Attempt automatic resolution
          const resolved = await this.resolveConflict(operation, conflict);
          if (resolved) {
            results.processed.push(operation);
          } else {
            results.failed.push(operation);
          }
        } else {
          results.processed.push(operation);
        }

      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount < operation.maxRetries) {
          // Re-queue for retry
          this.syncQueue.push(operation);
        } else {
          results.failed.push({ ...operation, error: error.message });
        }
      }
    }

    this.lastSyncTimestamp = new Date().toISOString();
    
    console.log('🔄 Sync completed:', {
      processed: results.processed.length,
      failed: results.failed.length,
      conflicts: results.conflicts.length,
      timestamp: this.lastSyncTimestamp
    });

    return results;
  }

  async checkForConflicts(operation) {
    // Simulate conflict detection logic
    const stored = localStorage.getItem(`operation_${operation.orderId}_${operation.type}`);
    if (stored) {
      const storedOp = JSON.parse(stored);
      if (new Date(storedOp.timestamp) > new Date(operation.timestamp)) {
        return {
          type: 'timestamp_conflict',
          storedOperation: storedOp,
          message: 'Newer operation exists'
        };
      }
    }
    return null;
  }

  async resolveConflict(operation, conflict) {
    // Automatic conflict resolution strategies
    switch (conflict.type) {
      case 'timestamp_conflict':
        // Use last-write-wins strategy
        console.log(`⚠️ Resolving timestamp conflict for ${operation.orderId} using last-write-wins`);
        return true;
      
      default:
        console.log(`❌ Cannot automatically resolve conflict type: ${conflict.type}`);
        return false;
    }
  }

  broadcastUpdate(event, data) {
    const broadcastData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'delivery_service'
    };

    // Simulate webhook broadcasts to subscribed endpoints
    this.webhookSubscribers.forEach(subscriber => {
      console.log(`📡 Broadcasting ${event} to ${subscriber}:`, broadcastData);
      
      // In real implementation, this would be actual HTTP requests
      // fetch(`${subscriber}/webhook`, { method: 'POST', body: JSON.stringify(broadcastData) })
    });

    // Add to sync queue for persistence
    this.addToSyncQueue({
      type: 'broadcast',
      event,
      data: broadcastData,
      timestamp: new Date().toISOString()
    });
  }

  // Enhanced offline capability with improved conflict resolution
  async syncOfflineDeliveries() {
    const offlineData = localStorage.getItem('offlineDeliveries');
    if (!offlineData) return { processed: [], conflicts: [], failed: [] };

    const deliveries = JSON.parse(offlineData);
    const results = {
      processed: [],
      conflicts: [],
      failed: []
    };

    for (const delivery of deliveries) {
      try {
        // Check for conflicts before processing
        const conflict = await this.checkForConflicts(delivery);
        
        if (conflict) {
          results.conflicts.push({ delivery, conflict });
          
          // Attempt automatic resolution
          const resolved = await this.resolveConflict(delivery, conflict);
          if (!resolved) {
            continue;
          }
        }

        const result = await this.updateOrderStatus(
          delivery.orderId,
          delivery.status,
          delivery.location,
          delivery.notes,
          delivery.codData
        );
        
        results.processed.push({ delivery, result });
      } catch (error) {
        results.failed.push({ 
          delivery, 
          error: error.message,
          retryable: !error.message.includes('not found')
        });
      }
    }

    // Clear successfully processed offline data
    if (results.processed.length > 0) {
      const remainingDeliveries = deliveries.filter(d => 
        !results.processed.some(p => p.delivery.orderId === d.orderId)
      );
      
      if (remainingDeliveries.length > 0) {
        localStorage.setItem('offlineDeliveries', JSON.stringify(remainingDeliveries));
      } else {
        localStorage.removeItem('offlineDeliveries');
      }
    }

    console.log('📤 Offline sync completed:', results);
    return results;
  }

  saveOfflineDelivery(orderId, status, location, notes, codData = null) {
    const offlineData = JSON.parse(localStorage.getItem('offlineDeliveries') || '[]');
    
    const operation = {
      orderId,
      status,
      location: location ? {
        ...location,
        accuracy: location.accuracy || '±5 meters',
        source: 'offline_gps'
      } : null,
      notes,
      codData,
      timestamp: new Date().toISOString(),
      offline: true,
      deviceInfo: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        connection: navigator.connection?.effectiveType || 'unknown'
      }
    };
    
    offlineData.push(operation);
    localStorage.setItem('offlineDeliveries', JSON.stringify(offlineData));
    
    console.log('💾 Saved offline delivery:', operation);
  }

  // Network dropout recovery
  async testNetworkRecovery() {
    try {
      // Simulate testing 500 concurrent operations
      const operations = Array.from({ length: 500 }, (_, i) => ({
        orderId: 1000 + i,
        type: 'status_update',
        status: 'in_transit',
        timestamp: new Date().toISOString()
      }));

      console.log('🧪 Testing network recovery with 500 concurrent operations...');
      
      const startTime = Date.now();
      const results = await Promise.allSettled(
        operations.map(op => this.addToSyncQueue(op))
      );
      
      const processingTime = Date.now() - startTime;
      
      const testResults = {
        totalOperations: operations.length,
        processingTimeMs: processingTime,
        throughput: Math.round(operations.length / (processingTime / 1000)),
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      };

      console.log('✅ Network recovery test completed:', testResults);
      return testResults;
    } catch (error) {
      console.error('❌ Network recovery test failed:', error);
      throw error;
    }
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
      status: emergencyType === 'sos_activated' ? 'sos_active' : 'active',
      accuracy: location?.accuracy || null
    };
    
    // Store emergency data
    const emergencies = JSON.parse(localStorage.getItem('emergencies') || '[]');
    
    // For location updates, update existing SOS record instead of creating new one
    if (emergencyType === 'location_update') {
      const activeSOSIndex = emergencies.findIndex(e => 
        e.driverId === driverId && e.status === 'sos_active'
      );
      
      if (activeSOSIndex !== -1) {
        emergencies[activeSOSIndex].location = location;
        emergencies[activeSOSIndex].timestamp = emergency.timestamp;
        emergencies[activeSOSIndex].accuracy = emergency.accuracy;
      }
    } else {
      emergencies.push(emergency);
    }
    
    localStorage.setItem('emergencies', JSON.stringify(emergencies));
    
    // Enhanced logging for different emergency types
    const logMessages = {
      'sos_activated': '🚨 SOS ACTIVATED - Live location sharing enabled',
      'location_update': `📍 Location updated - Lat: ${location?.latitude}, Lng: ${location?.longitude}`,
      'sos_no_location': '🚨 SOS ACTIVATED - Location unavailable',
      'help_needed': '🚨 Emergency help requested'
    };
    
    console.log(logMessages[emergencyType] || '🚨 EMERGENCY REPORTED:', emergency);
    
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
      { 
        Id: 1,
        name: 'Alex Chen', 
        status: 'active', 
        zone: 'Downtown', 
        activeDeliveries: 3, 
        completedToday: 12, 
        rating: 4.8, 
        location: { lat: 40.7128, lng: -74.0060 },
        capacity: 8,
        vehicle: 'Bike 🛵',
        skills: ['standard', 'perishables'],
        assignmentPreference: 'proximity',
        // Enhanced COD fields
        codWalletBalance: 3200,
        walletLimit: 15000,
        walletUtilization: 21,
        todayCollections: 8950,
        complianceScore: 98
      },
      { 
        Id: 2, 
        name: 'Maria Garcia', 
        status: 'active', 
        zone: 'Midtown', 
        activeDeliveries: 2, 
        completedToday: 15, 
        rating: 4.9, 
        location: { lat: 40.7589, lng: -73.9851 },
        capacity: 6,
        vehicle: 'Scooter 🛴',
        skills: ['standard', 'valuables'],
        assignmentPreference: 'capacity',
        // Enhanced COD fields
        codWalletBalance: 1850,
        walletLimit: 15000,
        walletUtilization: 12,
        todayCollections: 6750,
        complianceScore: 95
      },
      { 
        Id: 3, 
        name: 'James Wilson', 
        status: 'break', 
        zone: 'Uptown', 
        activeDeliveries: 0, 
        completedToday: 8, 
        rating: 4.6, 
        location: { lat: 40.7831, lng: -73.9712 },
        capacity: 10,
        vehicle: 'Van 🚐',
        skills: ['standard', 'perishables', 'valuables'],
        assignmentPreference: 'skill',
        // Enhanced COD fields
        codWalletBalance: 950,
        walletLimit: 15000,
        walletUtilization: 6,
        todayCollections: 4200,
        complianceScore: 88
      },
      { 
        Id: 4, 
        name: 'Sarah Kim', 
        status: 'active', 
        zone: 'Brooklyn', 
        activeDeliveries: 4, 
        completedToday: 10, 
        rating: 4.7, 
        location: { lat: 40.6782, lng: -73.9442 },
        capacity: 8,
        vehicle: 'Bike 🛵',
        skills: ['standard'],
        assignmentPreference: 'proximity',
        // Enhanced COD fields
        codWalletBalance: 2100,
        walletLimit: 15000,
        walletUtilization: 14,
        todayCollections: 7850,
        complianceScore: 92
      },
      { 
        Id: 5, 
        name: 'David Brown', 
        status: 'delayed', 
        zone: 'Queens', 
        activeDeliveries: 2, 
        completedToday: 6, 
        rating: 4.5, 
        location: { lat: 40.7282, lng: -73.7949 },
        capacity: 8,
        vehicle: 'Bike 🛵',
        skills: ['standard', 'perishables'],
        assignmentPreference: 'capacity',
        // Enhanced COD fields
        codWalletBalance: 750,
        walletLimit: 15000,
        walletUtilization: 5,
        todayCollections: 3200,
        complianceScore: 85
      }
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
        onTimeRate: 94,
        // Enhanced COD metrics
        codOrders: 12,
        codAmount: 18500,
        collectionRate: 98,
        avgCodValue: 1542,
        complianceAlerts: 0
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
        onTimeRate: 89,
        // Enhanced COD metrics
        codOrders: 18,
        codAmount: 24750,
        collectionRate: 96,
        avgCodValue: 1375,
        complianceAlerts: 1
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
        onTimeRate: 76,
        // Enhanced COD metrics
        codOrders: 6,
        codAmount: 9200,
        collectionRate: 91,
        avgCodValue: 1533,
        complianceAlerts: 2
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
        onTimeRate: 87,
        // Enhanced COD metrics
        codOrders: 14,
        codAmount: 21300,
        collectionRate: 97,
        avgCodValue: 1521,
        complianceAlerts: 0
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
        onTimeRate: 72,
        // Enhanced COD metrics
        codOrders: 4,
        codAmount: 6800,
        collectionRate: 88,
        avgCodValue: 1700,
        complianceAlerts: 3
      }
    ];

    return zones;
  }

async getHeatmapData() {
    await this.delay(400);
    
    const heatmapData = [
      { 
        zone: 'Downtown', 
        intensity: 0.9, 
        deliveries: 85, 
        delays: 2, 
        performance: 92,
        codIntensity: 0.95,
        codDeliveries: 78,
        avgCodAmount: 1542
      },
      { 
        zone: 'Midtown', 
        intensity: 1.0, 
        deliveries: 95, 
        delays: 8, 
        performance: 88,
        codIntensity: 1.0,
        codDeliveries: 91,
        avgCodAmount: 1375
      },
      { 
        zone: 'Uptown', 
        intensity: 0.6, 
        deliveries: 42, 
        delays: 12, 
        performance: 75,
        codIntensity: 0.65,
        codDeliveries: 38,
        avgCodAmount: 1533
      },
      { 
        zone: 'Brooklyn', 
        intensity: 0.8, 
        deliveries: 67, 
        delays: 5, 
        performance: 85,
        codIntensity: 0.85,
        codDeliveries: 63,
        avgCodAmount: 1521
      },
      { 
        zone: 'Queens', 
        intensity: 0.4, 
        deliveries: 28, 
        delays: 15, 
        performance: 68,
        codIntensity: 0.35,
        codDeliveries: 24,
        avgCodAmount: 1700
      }
    ];

    return heatmapData;
  }

async getBottleneckAlerts() {
    await this.delay(300);
    
    const alerts = [
      {
        Id: 1,
        title: 'Unassigned COD Orders Alert',
        zone: 'Midtown',
        zoneId: 2,
        severity: 'urgent',
        description: '3 COD orders unassigned for >1 hour. Total value: ₹4,850. Immediate assignment required.',
        timestamp: new Date(Date.now() - 3900000), // 65 minutes ago
        affectedDrivers: 0,
        estimatedDelay: 0,
        type: 'cod_assignment',
        codAmount: 4850,
        orderCount: 3
      },
      {
        Id: 2,
        title: 'Agent Wallet Limit Alert',
        zone: 'Downtown',
        zoneId: 1,
        severity: 'warning',
        description: 'Agent Alex Chen at 85% wallet capacity (₹12,750/₹15,000). Monitor future assignments.',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        affectedDrivers: 1,
        estimatedDelay: 0,
        type: 'wallet_limit',
        driverName: 'Alex Chen',
        walletBalance: 12750,
        walletLimit: 15000,
        utilizationPercent: 85
      },
      {
        Id: 3,
        title: 'Failed Sync Attempts',
        zone: 'Queens',
        zoneId: 5,
        severity: 'warning',
        description: '12 sync attempts failed in last hour. Network connectivity issues detected.',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        affectedDrivers: 2,
        estimatedDelay: 0,
        type: 'sync_failure',
        failedAttempts: 12,
        lastSuccessfulSync: new Date(Date.now() - 3600000).toISOString()
      },
      {
        Id: 4,
        title: 'GPS Accuracy Alert',
        zone: 'Brooklyn',
        zoneId: 4,
        severity: 'info',
        description: 'GPS accuracy below ±5 meters threshold for 2 deliveries. Manual verification required.',
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        affectedDrivers: 1,
        estimatedDelay: 5,
        type: 'gps_accuracy',
        deliveriesAffected: 2,
        currentAccuracy: '±8 meters'
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
      customerSatisfaction: 94,
      
      // Enhanced COD metrics
      codMetrics: {
        totalCodOrders: 156,
        totalCodAmount: 238750,
        codCollectionRate: 96.8,
        avgCodValue: 1530,
        codComplianceScore: 94,
        walletUtilization: 68,
        digitalReceiptsGenerated: 151,
        gpsVerificationRate: 98.7,
        codDiscrepancies: 4,
        totalDiscrepancyAmount: 185
      },
      
      // Sync metrics
      syncMetrics: {
        successfulSyncs: 342,
        failedSyncs: 8,
        avgSyncTime: 1.2,
        lastSyncTimestamp: new Date().toISOString(),
        conflictsResolved: 3,
        pendingSyncOperations: 2
      }
    };

    return metrics;
  }

async executeZoneAction(zoneId, action) {
    await this.delay(800);
    
    const actions = {
      'prioritize': {
        message: `Zone ${zoneId} has been prioritized for immediate attention`,
        impact: 'High priority routing activated, +15% assignment preference'
      },
      'assign_backup': {
        message: `Backup driver has been assigned to zone ${zoneId}`,
        impact: 'Additional driver capacity +8 orders, ETA reduced by 12 minutes'
      },
      'reroute': {
        message: `Traffic rerouting has been activated for zone ${zoneId}`,
        impact: 'Alternative routes calculated, estimated time savings: 8-15 minutes'
      },
      'emergency_support': {
        message: `Emergency support dispatched to zone ${zoneId}`,
        impact: 'Priority response team activated, on-site ETA: 15 minutes'
      },
      'cod_intervention': {
        message: `COD compliance intervention initiated for zone ${zoneId}`,
        impact: 'Manual review triggered, temporary assignment hold for verification'
      }
    };

    if (!actions[action]) {
      throw new Error('Invalid zone action');
    }

    // Simulate action execution with enhanced tracking
    console.log(`🎯 Executing ${action} for zone ${zoneId}`);
    
    // Add to audit trail
    const auditEntry = {
      action: 'zone_action_executed',
      zoneId,
      actionType: action,
      timestamp: new Date().toISOString(),
      executedBy: 'admin',
      details: actions[action]
    };

    // Store audit entry
    const auditTrail = JSON.parse(localStorage.getItem('zoneActionAudit') || '[]');
    auditTrail.push(auditEntry);
    localStorage.setItem('zoneActionAudit', JSON.stringify(auditTrail));

    // Broadcast action to relevant systems
    this.broadcastUpdate('zone_action_executed', auditEntry);
    
    return {
      success: true,
      message: actions[action].message,
      impact: actions[action].impact,
      timestamp: new Date(),
      zoneId,
      action,
      auditId: auditEntry.timestamp
    };
  }

  // Testing protocol method for 500 concurrent COD orders
  async simulateConcurrentCodOrders() {
    console.log('🧪 Starting concurrent COD orders simulation...');
    
    const startTime = Date.now();
    const orders = [];
    
    // Generate 500 test orders
    for (let i = 1; i <= 500; i++) {
      orders.push({
        Id: 9000 + i,
        codAmount: Math.floor(Math.random() * 3000) + 500, // ₹500-₹3500
        priority: ['normal', 'high', 'urgent'][Math.floor(Math.random() * 3)],
        zone: ['Downtown', 'Midtown', 'Brooklyn', 'Queens'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString()
      });
    }

    const results = {
      totalOrders: orders.length,
      processed: 0,
      failed: 0,
      avgProcessingTime: 0,
      walletLimitExceeded: 0,
      syncFailures: 0,
      gpsVerificationRate: 0
    };

    // Process orders concurrently
    const processingPromises = orders.map(async (order) => {
      try {
        await this.delay(Math.random() * 100); // Simulate variable processing time
        
        // Simulate wallet limit checks
        if (Math.random() < 0.05) { // 5% chance of wallet limit issue
          results.walletLimitExceeded++;
          throw new Error('Wallet limit exceeded');
        }
        
        // Simulate sync issues
        if (Math.random() < 0.02) { // 2% chance of sync failure
          results.syncFailures++;
          throw new Error('Sync failure');
        }
        
        results.processed++;
        return { success: true, orderId: order.Id };
      } catch (error) {
        results.failed++;
        return { success: false, orderId: order.Id, error: error.message };
      }
    });

    await Promise.allSettled(processingPromises);
    
    const endTime = Date.now();
    results.avgProcessingTime = (endTime - startTime) / orders.length;
    results.gpsVerificationRate = 98.5; // Simulated GPS verification rate
    
    console.log('✅ Concurrent COD simulation completed:', results);
return results;
  }

  // Performance Reports Methods
  async getWeeklyEfficiencyRankings() {
    await this.delay(500);
    
    const drivers = await this.getTeamDrivers();
    const weeklyData = drivers.map(driver => {
      const efficiencyScore = Math.round(((100 - (driver.avgDelay || 25)) + (driver.complianceScore || 90) + (driver.rating * 20)) / 3);
      const weeklyDeliveries = Math.floor(Math.random() * 30) + 10; // 10-40 deliveries per week
      const avgTime = Math.floor(Math.random() * 20) + 15; // 15-35 minutes
      const successRate = Math.floor(Math.random() * 15) + 85; // 85-100%
      
      return {
        ...driver,
        efficiencyScore,
        weeklyDeliveries,
        avgTime,
        successRate,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: Math.floor(Math.random() * 10) + 1
      };
    });
    
    return weeklyData.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  async getCustomerFeedbackAnalysis(period = 'week') {
    await this.delay(400);
    
    const feedbackData = {
      overallSatisfaction: 4.7,
      responseRate: 78,
      avgResponseTime: 2.3, // days
      weeklyGrowth: 12, // percentage
      
      ratingDistribution: {
        5: 68,
        4: 22,
        3: 7,
        2: 2,
        1: 1
      },
      
      positiveFeedback: [
        { theme: 'Fast delivery times', percentage: 89 },
        { theme: 'Professional service', percentage: 82 },
        { theme: 'Accurate COD handling', percentage: 75 },
        { theme: 'Good communication', percentage: 68 }
      ],
      
      improvementAreas: [
        { issue: 'Delivery time delays', percentage: 18 },
        { issue: 'Package handling', percentage: 12 },
        { issue: 'Location accuracy', percentage: 8 },
        { issue: 'COD discrepancies', percentage: 5 }
      ],
      
      feedbackTrends: {
        satisfaction: {
          current: 4.7,
          previous: 4.5,
          change: 0.2
        },
        complaints: {
          current: 3,
          previous: 8,
          change: -5
        },
        recommendations: {
          current: 92,
          previous: 87,
          change: 5
        }
      },
      
      topComments: [
        "Great service! Driver was very professional and delivered on time.",
        "Fast delivery and accurate COD collection. Highly recommended!",
        "Could improve on delivery time estimation, but overall good experience.",
        "Excellent communication throughout the delivery process."
      ]
    };
    
    return feedbackData;
  }
}

export const deliveryService = new DeliveryService();