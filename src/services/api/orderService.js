import ordersData from "@/services/mockData/orders.json";

class OrderService {
  constructor() {
    this.orders = [...ordersData];
    this.discountCodes = {
      'WELCOME25': {
        code: 'WELCOME25',
        percentage: 25,
        description: 'Welcome discount for new customers',
        active: true,
        minAmount: 0
      },
      'FREESHIP': {
        code: 'FREESHIP',
        percentage: 0,
        description: 'Free shipping on any order',
        active: true,
        minAmount: 0,
        freeShipping: true
      },
      'FLASH50': {
        code: 'FLASH50',
        percentage: 50,
        description: 'Flash sale discount',
        active: true,
        minAmount: 100
      },
      'WEEKEND30': {
        code: 'WEEKEND30',
        percentage: 30,
        description: 'Weekend special discount',
        active: true,
        minAmount: 75
      },
      'SAVE20': {
        code: 'SAVE20',
        percentage: 20,
        description: 'General discount code',
        active: true,
        minAmount: 50
      }
    };

    // COD Ledger System - Blockchain-style transaction logging
    this.codLedger = this.initializeCodLedger();
    this.agentWalletLimits = new Map(); // Rs. 15,000 max per agent
    this.maxWalletLimit = 15000;
    this.syncQueue = [];
    this.webhookEndpoints = new Set();
    this.auditTrail = [];
  }

  initializeCodLedger() {
    const stored = localStorage.getItem('codLedger');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize blockchain-style ledger
    return {
      blocks: [{
        id: 1,
        timestamp: new Date().toISOString(),
        transactions: [],
        previousHash: '0',
        hash: this.generateHash('genesis'),
        nonce: 0
      }],
      pendingTransactions: [],
      difficulty: 2
    };
  }

  generateHash(data) {
    // Simple hash function for demo - in production use proper crypto
    let hash = 0;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Simulate API delay
  async delay(ms = 400) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateDiscountCode(code, orderTotal = 0) {
    await this.delay(200);
    
    const discountInfo = this.discountCodes[code.toUpperCase()];
    
    if (!discountInfo) {
      throw new Error("Invalid discount code");
    }
    
    if (!discountInfo.active) {
      throw new Error("This discount code is no longer active");
    }
    
    if (orderTotal < discountInfo.minAmount) {
      throw new Error(`Minimum order amount of $${discountInfo.minAmount} required for this discount`);
    }
    
    return {
      ...discountInfo,
      isValid: true
    };
  }

  async getAllDiscountCodes() {
    await this.delay();
    return Object.values(this.discountCodes).filter(code => code.active);
  }

  async getAll() {
    await this.delay();
    return [...this.orders];
  }

  async getById(id) {
    await this.delay();
    const order = this.orders.find(o => o.Id === id);
    if (!order) {
      throw new Error("Order not found");
    }
    return { ...order };
  }
async create(orderData) {
    await this.delay();
    const maxId = Math.max(...this.orders.map(o => o.Id));
    const newOrder = {
      ...orderData,
      Id: maxId + 1,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      posMode: orderData.posMode || false,
      receiptNumber: orderData.receiptNumber || null,
      splitBill: orderData.splitBill || null,
      offlineCreated: orderData.offlineCreated || false,
      // Enhanced Assignment & COD Management fields
      deliveryStatus: orderData.deliveryStatus || 'ready_for_pickup',
      priority: orderData.priority || 'normal',
      assignedDriver: null,
      codAmount: orderData.codAmount || orderData.total,
      codDueAmount: orderData.codAmount || orderData.total,
      codCollected: false,
      codCollectedAmount: 0,
      assignmentHistory: [],
      deliveryWindow: orderData.deliveryWindow || null,
      // COD Ledger Integration
      codTransactionId: null,
      ledgerBlockId: null,
      gpsVerification: null,
      digitalReceiptId: null,
      auditTrail: [{
        action: 'order_created',
        timestamp: new Date().toISOString(),
        userId: orderData.userId || 'system',
        details: { orderId: maxId + 1, codAmount: orderData.codAmount || orderData.total }
      }]
    };
    this.orders.push(newOrder);
    
    // Store offline if POS mode
    if (orderData.posMode && !navigator.onLine) {
      localStorage.setItem('pendingPOSOrders', JSON.stringify([
        ...(JSON.parse(localStorage.getItem('pendingPOSOrders') || '[]')),
        newOrder
      ]));
    }
    
    return { ...newOrder };
  }

  async syncOfflineOrders() {
    const pendingOrders = JSON.parse(localStorage.getItem('pendingPOSOrders') || '[]');
    const syncedOrders = [];
    
    for (const order of pendingOrders) {
      try {
        // Attempt to sync with backend
        const syncedOrder = await this.create({ ...order, offlineCreated: false });
        syncedOrders.push(syncedOrder);
      } catch (error) {
        console.error('Failed to sync order:', order.Id, error);
      }
    }
    
    // Clear synced orders from local storage
    localStorage.removeItem('pendingPOSOrders');
    return syncedOrders;
  }

async update(id, orderData) {
    await this.delay();
    const index = this.orders.findIndex(o => o.Id === id);
    if (index === -1) {
      throw new Error("Order not found");
    }

    // Add audit trail entry
    const auditEntry = {
      action: 'order_updated',
      timestamp: new Date().toISOString(),
      userId: orderData.updatedBy || 'system',
      details: { orderId: id, changes: Object.keys(orderData) }
    };

    this.orders[index] = { 
      ...this.orders[index], 
      ...orderData,
      updatedAt: new Date().toISOString(),
      auditTrail: [...(this.orders[index].auditTrail || []), auditEntry]
    };

    // Trigger webhook for real-time sync
    this.triggerWebhook('order_updated', this.orders[index]);
    
    return { ...this.orders[index] };
  }

async assignDriver(orderId, driverId, assignmentData = {}) {
    await this.delay();
    const order = this.orders.find(o => o.Id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check agent wallet limit before assignment
    const currentWalletBalance = this.agentWalletLimits.get(driverId) || 0;
    const codAmount = order.codAmount || order.total;
    
    if (currentWalletBalance + codAmount > this.maxWalletLimit) {
      throw new Error(`Assignment would exceed wallet limit. Current: ₹${currentWalletBalance}, Adding: ₹${codAmount}, Limit: ₹${this.maxWalletLimit}`);
    }
    
    order.assignedDriver = driverId;
    order.assignedAt = new Date().toISOString();
    order.assignmentType = assignmentData.assignmentType || 'manual';
    order.estimatedDeliveryTime = assignmentData.estimatedDeliveryTime || 30;
    order.deliveryStatus = 'assigned';
    
    if (!order.assignmentHistory) order.assignmentHistory = [];
    order.assignmentHistory.push({
      driverId,
      driverName: assignmentData.driverName || `Driver ${driverId}`,
      assignedAt: new Date().toISOString(),
      assignmentType: assignmentData.assignmentType || 'manual',
      codAmount
    });

    // Update agent wallet balance
    this.agentWalletLimits.set(driverId, currentWalletBalance + codAmount);

    // Add to COD ledger
    await this.addCodTransaction({
      type: 'assignment',
      orderId,
      driverId,
      amount: codAmount,
      timestamp: new Date().toISOString(),
      metadata: assignmentData
    });

    // Add audit trail
    order.auditTrail = order.auditTrail || [];
    order.auditTrail.push({
      action: 'driver_assigned',
      timestamp: new Date().toISOString(),
      userId: assignmentData.assignedBy || 'system',
      details: { driverId, codAmount, assignmentType: assignmentData.assignmentType }
    });

    // Trigger webhook for agent app
    this.triggerWebhook('driver_assigned', {
      orderId,
      driverId,
      order: { ...order },
      pushNotification: {
        title: `New COD Assignment`,
        body: `ORDER #${orderId} - ₹${codAmount} COD - ${order.shipping?.address}`,
        data: { orderId, codAmount, estimatedTime: order.estimatedDeliveryTime }
      }
    });
    
    return { ...order };
  }

  async delete(id) {
await this.delay();
    const index = this.orders.findIndex(o => o.Id === id);
    if (index === -1) {
      throw new Error("Order not found");
    }
    this.orders.splice(index, 1);
    return true;
  }

  async getByStatus(status) {
    await this.delay();
    return this.orders.filter(o => o.status === status);
  }

async updateDeliveryStatus(id, status, location = null, notes = '', codData = null) {
    await this.delay();
    const order = this.orders.find(o => o.Id === id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    const timestamp = new Date().toISOString();
    order.deliveryStatus = status;
    order.lastUpdated = timestamp;
    
    if (location) {
      order.currentLocation = location;
      // GPS Verification for compliance
      order.gpsVerification = {
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy || '±5 meters',
        timestamp,
        verified: true
      };
    }
    
    if (notes) {
      order.deliveryNotes = notes;
    }
    
    // Enhanced COD handling with discrepancy management
    if (status === 'delivered' && codData) {
      const codAmount = codData.collectedAmount || order.codAmount || order.total;
      const dueAmount = order.codAmount || order.total;
      const discrepancy = Math.abs(codAmount - dueAmount);
      
      order.codCollected = true;
      order.codCollectedAmount = codAmount;
      order.codDueAmount = dueAmount;
      order.codDiscrepancy = discrepancy;
      order.codRecordedAt = timestamp;
      order.digitalReceiptId = `RCP-${id}-${Date.now()}`;
      
      // Immediate discrepancy handling
      if (discrepancy > 0) {
        // Set discrepancy status and verification requirements
        order.discrepancyStatus = 'pending_verification';
        order.discrepancyDetectedAt = timestamp;
        order.customerVerificationRequired = true;
        order.agentDeductionPending = discrepancy >= 50; // Deduction threshold
        
        // Immediate customer SMS for verification
        await this.sendCustomerVerificationSMS(order, discrepancy);
        
        // Auto-deduct from agent if above threshold
        if (discrepancy >= 50 && order.assignedDriver) {
          await this.processAgentDeduction(order.assignedDriver, discrepancy, id);
          order.agentDeductionProcessed = true;
          order.agentDeductionAmount = discrepancy;
          order.agentDeductionAt = timestamp;
        }
        
        // Generate enhanced compliance alert
        await this.generateComplianceAlert({
          type: 'cod_discrepancy',
          severity: discrepancy >= 100 ? 'high' : discrepancy >= 50 ? 'medium' : 'low',
          orderId: id,
          driverId: order.assignedDriver,
          discrepancy,
          collectedAmount: codAmount,
          dueAmount,
          timestamp,
          customerVerificationSent: true,
          agentDeductionProcessed: order.agentDeductionProcessed || false
        });
      }

      // Update agent wallet balance (original collection)
      if (order.assignedDriver) {
        const currentBalance = this.agentWalletLimits.get(order.assignedDriver) || 0;
        this.agentWalletLimits.set(order.assignedDriver, Math.max(0, currentBalance - dueAmount));
      }

      // Add to COD ledger with discrepancy tracking
      await this.addCodTransaction({
        type: 'collection',
        orderId: id,
        driverId: order.assignedDriver,
        amount: codAmount,
        dueAmount,
        discrepancy,
        discrepancyStatus: order.discrepancyStatus,
        timestamp,
        location: order.gpsVerification,
        digitalReceiptId: order.digitalReceiptId,
        metadata: codData,
        customerVerificationSent: discrepancy > 0,
        agentDeductionProcessed: order.agentDeductionProcessed || false
      });
    }
    
    // Add delivery timeline entry
    if (!order.deliveryTimeline) order.deliveryTimeline = [];
    order.deliveryTimeline.push({
      status,
      timestamp,
      location: order.gpsVerification,
      notes,
      codData: codData ? {
        ...codData,
        discrepancy: order.codDiscrepancy || 0,
        discrepancyStatus: order.discrepancyStatus,
        digitalReceiptId: order.digitalReceiptId
      } : null
    });

    // Add audit trail
    order.auditTrail = order.auditTrail || [];
    order.auditTrail.push({
      action: 'status_updated',
      timestamp,
      userId: codData?.updatedBy || 'driver',
      details: { 
        status, 
        location: order.gpsVerification,
        codData: codData ? { 
          collectedAmount: codData.collectedAmount, 
          discrepancy: order.codDiscrepancy,
          discrepancyStatus: order.discrepancyStatus 
        } : null
      }
    });

    // Enhanced webhook with discrepancy notifications
    this.triggerWebhook('delivery_status_updated', {
      orderId: id,
      status,
      order: { ...order },
      ...(status === 'delivered' && codData && {
        smsNotification: {
          phone: order.shipping?.phone,
          message: `✅ ORDER #${id} Delivered (${new Date().toLocaleTimeString()})
💰 Collected: ₹${codData.collectedAmount} ${order.codDiscrepancy === 0 ? '(No discrepancy)' : `(₹${order.codDiscrepancy} discrepancy)`}
📍 GPS Verified: ${order.gpsVerification?.latitude}° N, ${order.gpsVerification?.longitude}° E`
        },
        ...(order.codDiscrepancy > 0 && {
          discrepancyAlert: {
            severity: order.codDiscrepancy >= 100 ? 'high' : order.codDiscrepancy >= 50 ? 'medium' : 'low',
            customerVerificationSent: true,
            agentDeductionProcessed: order.agentDeductionProcessed || false
          }
        })
      })
    });
    
    return { ...order };
  }

  // New method for customer verification SMS
  async sendCustomerVerificationSMS(order, discrepancy) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    const message = `🚨 PAYMENT VERIFICATION REQUIRED
Order #${order.Id}: Amount discrepancy of ₹${discrepancy} detected.
Expected: ₹${order.codDueAmount}
Collected: ₹${order.codCollectedAmount}

Please verify: Reply with code ${verificationCode} if amount is correct.
Or call customer service: 1800-XXX-XXXX`;

    // Store verification code
    order.customerVerificationCode = verificationCode;
    order.customerVerificationSentAt = new Date().toISOString();
    order.customerVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h expiry

    // Trigger SMS
    this.triggerWebhook('customer_verification_sms', {
      phone: order.shipping?.phone,
      message,
      orderId: order.Id,
      discrepancy,
      verificationCode
    });

    console.log('🔔 Customer verification SMS sent:', { orderId: order.Id, discrepancy, phone: order.shipping?.phone });
  }

  // New method for agent deduction processing
  async processAgentDeduction(driverId, amount, orderId) {
    const deduction = {
      id: Date.now(),
      driverId,
      orderId,
      amount,
      reason: 'cod_discrepancy',
      timestamp: new Date().toISOString(),
      status: 'processed',
      autoProcessed: true
    };

    // Store deduction record
    const deductions = JSON.parse(localStorage.getItem('agentDeductions') || '[]');
    deductions.push(deduction);
    localStorage.setItem('agentDeductions', JSON.stringify(deductions));

    // Update agent balance
    const currentBalance = this.agentWalletLimits.get(driverId) || 0;
    this.agentWalletLimits.set(driverId, Math.max(0, currentBalance - amount));

    // Notify agent
    this.triggerWebhook('agent_deduction_processed', {
      driverId,
      deduction,
      newBalance: this.agentWalletLimits.get(driverId),
      pushNotification: {
        title: 'Wallet Deduction Processed',
        message: `₹${amount} deducted due to COD discrepancy in Order #${orderId}`,
        driverId
      }
    });

    console.log('💰 Agent deduction processed:', deduction);
    return deduction;
  }

async getDeliveryOrders() {
    await this.delay();
    return this.orders.filter(o => 
      ['ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery'].includes(o.deliveryStatus)
    ).sort((a, b) => {
      // Priority sort: urgent first, then unassigned, then by delivery window
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      if (!a.assignedDriver && b.assignedDriver) return -1;
      if (a.assignedDriver && !b.assignedDriver) return 1;
      return new Date(a.deliveryWindow?.start || a.createdAt) - new Date(b.deliveryWindow?.start || b.createdAt);
    });
  }

// COD Ledger & Blockchain Methods
  async addCodTransaction(transactionData) {
    // Add transaction to pending pool
    this.codLedger.pendingTransactions.push({
      id: Date.now(),
      ...transactionData,
      hash: this.generateHash(transactionData)
    });

    // Mine new block if enough transactions
    if (this.codLedger.pendingTransactions.length >= 3) {
      await this.mineBlock();
    }

    this.saveCodLedger();
  }

  async mineBlock() {
    const block = {
      id: this.codLedger.blocks.length + 1,
      timestamp: new Date().toISOString(),
      transactions: [...this.codLedger.pendingTransactions],
      previousHash: this.codLedger.blocks[this.codLedger.blocks.length - 1].hash,
      nonce: 0
    };

    // Simple proof of work
    let hash;
    do {
      block.nonce++;
      hash = this.generateHash(block);
    } while (!hash.startsWith('0'.repeat(this.codLedger.difficulty)));

    block.hash = hash;
    this.codLedger.blocks.push(block);
    this.codLedger.pendingTransactions = [];

    console.log(`✅ COD Block #${block.id} mined with ${block.transactions.length} transactions`);
  }

  saveCodLedger() {
    localStorage.setItem('codLedger', JSON.stringify(this.codLedger));
  }

  getCodLedger() {
    return { ...this.codLedger };
  }

  // Webhook system for real-time sync
  registerWebhook(url) {
    this.webhookEndpoints.add(url);
  }

triggerWebhook(event, data) {
    // Simulate webhook calls to agent apps
    const webhookData = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Add to sync queue for offline handling
    this.syncQueue.push(webhookData);

    // Simulate real webhook calls
    this.webhookEndpoints.forEach(url => {
      console.log(`🔗 Webhook triggered: ${url}`, webhookData);
      // In real implementation: fetch(url, { method: 'POST', body: JSON.stringify(webhookData) })
    });

    // Enhanced notification handling
    if (data.pushNotification) {
      console.log('📱 Push notification sent:', data.pushNotification);
    }

    if (data.smsNotification) {
      console.log('📱 SMS sent:', data.smsNotification);
    }

    // Customer verification SMS
    if (event === 'customer_verification_sms') {
      console.log('📱 Customer verification SMS sent:', {
        phone: data.phone,
        orderId: data.orderId,
        discrepancy: data.discrepancy,
        timestamp: new Date().toISOString()
      });
    }

    // Agent deduction notifications
    if (event === 'agent_deduction_processed') {
      console.log('💰 Agent deduction notification:', {
        driverId: data.driverId,
        amount: data.deduction.amount,
        newBalance: data.newBalance,
        timestamp: new Date().toISOString()
      });
    }

    // Discrepancy alerts
    if (data.discrepancyAlert) {
      console.log('🚨 Discrepancy alert triggered:', {
        severity: data.discrepancyAlert.severity,
        customerVerificationSent: data.discrepancyAlert.customerVerificationSent,
        agentDeductionProcessed: data.discrepancyAlert.agentDeductionProcessed
      });
    }

    // Alert escalations
    if (event === 'alert_escalation') {
      console.log('⚠️ Alert escalation webhook:', data);
    }

    // Compliance alerts with enhanced routing
    if (event === 'compliance_alert' && data.discrepancyNotification) {
      const { adminAlert, managerAlert, immediateAction } = data.discrepancyNotification;
      
      if (immediateAction) {
        console.log('🚨 IMMEDIATE ACTION REQUIRED:', data);
      }
      if (adminAlert) {
        console.log('👨‍💼 Admin notification sent:', data);
      }
      if (managerAlert) {
        console.log('👩‍💼 Manager notification sent:', data);
      }
    }
  }

  // Conflict resolution for offline operations
  async syncOfflineOperations(operations) {
    const conflicts = [];
    const resolved = [];

    for (const operation of operations) {
      try {
        const order = this.orders.find(o => o.Id === operation.orderId);
        if (!order) {
          conflicts.push({ ...operation, reason: 'Order not found' });
          continue;
        }

        // Check for conflicts based on timestamps
        if (order.lastUpdated && new Date(operation.timestamp) < new Date(order.lastUpdated)) {
          conflicts.push({ 
            ...operation, 
            reason: 'Outdated operation',
            serverTimestamp: order.lastUpdated,
            clientTimestamp: operation.timestamp
          });
          continue;
        }

        // Apply operation
        await this.updateDeliveryStatus(
          operation.orderId,
          operation.status,
          operation.location,
          operation.notes,
          operation.codData
        );

        resolved.push(operation);
      } catch (error) {
        conflicts.push({ ...operation, reason: error.message });
      }
    }

    return { resolved, conflicts };
  }

  // Automated compliance alerts
async generateComplianceAlert(alertData) {
    const alert = {
      id: Date.now(),
      ...alertData,
      timestamp: new Date().toISOString(),
      status: 'active',
      escalationLevel: this.determineEscalationLevel(alertData),
      autoActions: this.getAutoActions(alertData)
    };

    // Store alert with enhanced categorization
    const alerts = JSON.parse(localStorage.getItem('complianceAlerts') || '[]');
    alerts.push(alert);
    localStorage.setItem('complianceAlerts', JSON.stringify(alerts));

    // Enhanced notification with escalation
    this.triggerWebhook('compliance_alert', {
      ...alert,
      ...(alert.type === 'cod_discrepancy' && {
        discrepancyNotification: {
          adminAlert: alert.severity === 'high',
          managerAlert: alert.severity === 'medium' || alert.severity === 'high',
          immediateAction: alert.severity === 'high' && alert.discrepancy >= 200
        }
      })
    });

    // Auto-escalate high severity alerts
    if (alert.severity === 'high') {
      await this.escalateAlert(alert);
    }

    console.log('🚨 Enhanced Compliance Alert Generated:', alert);
    return alert;
  }

  // Helper method to determine escalation level
  determineEscalationLevel(alertData) {
    if (alertData.type === 'cod_discrepancy') {
      if (alertData.discrepancy >= 200) return 'immediate';
      if (alertData.discrepancy >= 100) return 'high';
      if (alertData.discrepancy >= 50) return 'medium';
      return 'low';
    }
    return 'standard';
  }

  // Helper method to get auto actions
  getAutoActions(alertData) {
    const actions = [];
    if (alertData.type === 'cod_discrepancy') {
      actions.push('customer_sms_sent');
      if (alertData.discrepancy >= 50) {
        actions.push('agent_deduction_processed');
      }
      if (alertData.discrepancy >= 100) {
        actions.push('manager_notification');
      }
      if (alertData.discrepancy >= 200) {
        actions.push('admin_escalation');
      }
    }
    return actions;
  }

  // Helper method to escalate alerts
  async escalateAlert(alert) {
    const escalation = {
      alertId: alert.id,
      timestamp: new Date().toISOString(),
      level: alert.escalationLevel,
      actions: ['admin_notification', 'immediate_review']
    };

    this.triggerWebhook('alert_escalation', escalation);
    console.log('⚠️ Alert escalated:', escalation);
  }

  // Check for unassigned COD orders > 1 hour
  async checkUnassignedCodOrders() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const unassigned = this.orders.filter(order => 
      !order.assignedDriver && 
      (order.codAmount > 0 || order.total > 0) &&
      new Date(order.createdAt) < oneHourAgo
    );

    if (unassigned.length > 0) {
      await this.generateComplianceAlert({
        type: 'unassigned_cod_timeout',
        orders: unassigned.map(o => o.Id),
        count: unassigned.length,
        totalAmount: unassigned.reduce((sum, o) => sum + (o.codAmount || o.total), 0)
      });
    }

    return unassigned;
  }

  // Check agent proximity to wallet limit
  async checkAgentWalletLimits() {
    const alerts = [];
    for (const [driverId, balance] of this.agentWalletLimits.entries()) {
      const proximityPercentage = (balance / this.maxWalletLimit) * 100;
      
      if (proximityPercentage >= 80) {
        const alert = await this.generateComplianceAlert({
          type: 'wallet_limit_proximity',
          driverId,
          currentBalance: balance,
          limit: this.maxWalletLimit,
          proximityPercentage: Math.round(proximityPercentage)
        });
        alerts.push(alert);
      }
    }
    return alerts;
  }

  // Legacy method - redirect to enhanced version
  async assignDriver(orderId, driverId) {
    return this.assignDriver(orderId, driverId, { assignmentType: 'legacy' });
  }
}

export const orderService = new OrderService();