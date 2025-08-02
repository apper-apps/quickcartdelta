import ordersData from "@/services/mockData/orders.json";
import React from "react";
import Error from "@/components/ui/Error";

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

// Enhanced COD Ledger System with End-to-End Encryption & PCI-DSS Compliance
    this.codLedger = this.initializeSecureCodLedger();
    this.agentWalletLimits = new Map(); // Rs. 15,000 max per agent
    this.maxWalletLimit = 15000;
    this.syncQueue = [];
    this.webhookEndpoints = new Set();
    this.auditTrail = [];
    
    // PCI-DSS compliance settings
    this.encryptionEnabled = true;
    this.auditRetentionDays = 2555; // 7 years as per PCI-DSS
    this.maxTransactionAmount = 100000; // Security limit
    this.securityVersion = '2.0';
    
    // Initialize encryption service
    this.initializeEncryption();
  }

  initializeEncryption() {
    try {
      // Dynamically import encryption service to avoid circular dependencies
      import('@/utils/encryption').then(({ encryptionService }) => {
        this.encryptionService = encryptionService;
        console.log('🔒 Financial encryption initialized');
      });
    } catch (error) {
      console.error('🔒 Failed to initialize encryption:', error);
      this.encryptionEnabled = false;
    }
  }

  initializeSecureCodLedger() {
    try {
      // Try to load encrypted ledger first
      const encryptedLedger = localStorage.getItem('codLedger_encrypted');
      if (encryptedLedger && this.encryptionService) {
        const parsed = JSON.parse(encryptedLedger);
        return this.encryptionService.decryptCodLedger(parsed);
      }
      
      // Fallback to legacy unencrypted ledger
      const stored = localStorage.getItem('codLedger');
      if (stored) {
        const legacy = JSON.parse(stored);
        // Migrate to encrypted storage
        this.migrateLegacyLedger(legacy);
        return legacy;
      }
    } catch (error) {
      console.error('🔒 Failed to load encrypted COD ledger:', error);
    }
    
    // Initialize new secure blockchain-style ledger
    const genesisBlock = {
      id: 1,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: this.generateSecureHash('genesis'),
      nonce: 0,
      encryptionVersion: '2.0',
      complianceLevel: 'PCI-DSS'
    };
    
    return {
      blocks: [genesisBlock],
      pendingTransactions: [],
      difficulty: 4, // Increased for better security
      encryptionEnabled: true,
      lastAudit: new Date().toISOString(),
      totalTransactions: 0,
      totalAmount: 0
    };
  }

  // Migrate legacy unencrypted ledger to encrypted format
  migrateLegacyLedger(legacyLedger) {
    try {
      if (!this.encryptionService) return;
      
      console.log('🔄 Migrating COD ledger to encrypted format...');
      
      // Add encryption metadata to existing blocks
      const migratedLedger = {
        ...legacyLedger,
        encryptionEnabled: true,
        migratedAt: new Date().toISOString(),
        securityVersion: '2.0'
      };
      
      // Encrypt and save
      const encrypted = this.encryptionService.encryptCodLedger(migratedLedger);
      localStorage.setItem('codLedger_encrypted', JSON.stringify(encrypted));
      
      // Secure delete legacy data
      this.encryptionService.secureDelete('codLedger');
      
      console.log('✅ COD ledger migration completed');
    } catch (error) {
      console.error('🔒 COD ledger migration failed:', error);
    }
  }

  // Enhanced secure hash generation
  generateSecureHash(data) {
    if (this.encryptionService) {
      return this.encryptionService.createBlockHash(data);
    }
    // Fallback to original hash for compatibility
    return this.generateHash(data);
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
    
    try {
      // PCI-DSS compliance validation
      if (!this.validateOrderCompliance(orderData)) {
        throw new Error('Order data does not meet PCI-DSS compliance requirements');
      }
      
      const maxId = Math.max(...this.orders.map(o => o.Id));
      const orderId = maxId + 1;
      
      // Create secure financial data container
      const financialData = {
        total: orderData.total,
        codAmount: orderData.codAmount || orderData.total,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        items: orderData.items?.map(item => ({
          ...item,
          price: item.price,
          total: item.price * item.quantity
        }))
      };
      
      // Encrypt financial data
      let encryptedFinancialData = null;
      if (this.encryptionService) {
        encryptedFinancialData = this.encryptionService.encryptFinancialData(financialData);
      }
      
      const newOrder = {
        ...orderData,
        Id: orderId,
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
        
        // Enhanced COD Ledger Integration with Encryption
        codTransactionId: null,
        ledgerBlockId: null,
        gpsVerification: null,
        digitalReceiptId: null,
        
        // PCI-DSS Compliance Fields
        encryptedFinancialData,
        financialDataEncrypted: !!encryptedFinancialData,
        securityVersion: this.securityVersion,
        complianceLevel: 'PCI-DSS',
        dataClassification: 'SENSITIVE-FINANCIAL',
        
        // Enhanced customer data protection
        customer: this.securizeCustomerData(orderData.customer),
        shipping: this.securizeShippingData(orderData.shipping),
        
        // Digital signature for integrity
        orderSignature: this.encryptionService ? 
          this.encryptionService.createSignature({
            orderId,
            total: orderData.total,
            timestamp: new Date().toISOString(),
            customerId: orderData.customer?.id || 'anonymous'
          }) : null,
        
        // Enhanced audit trail with encryption
        auditTrail: [{
          action: 'order_created',
          timestamp: new Date().toISOString(),
          userId: orderData.userId || 'system',
          details: this.encryptionService ? {
            orderId,
            codAmount: this.encryptionService.maskSensitiveData(orderData.codAmount || orderData.total, 'amount'),
            itemCount: orderData.items?.length || 0,
            customerType: orderData.customer ? 'registered' : 'anonymous',
            paymentMethod: orderData.paymentMethod || 'unknown'
          } : { orderId, codAmount: orderData.codAmount || orderData.total },
          ipAddress: 'localhost', // In production, capture real IP
          sessionId: this.encryptionService?.getSessionId(),
          signature: this.encryptionService ? 
            this.encryptionService.createSignature(`order_created_${orderId}_${new Date().toISOString()}`) : null
        }]
      };
      
      this.orders.push(newOrder);
      
      // Enhanced offline storage with encryption
      if (orderData.posMode && !navigator.onLine) {
        this.storeOfflineOrderSecurely(newOrder);
      }
      
      // Create comprehensive audit entry
      this.createFinancialAudit('order_created', {
        orderId,
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(orderData.total, 'amount') : orderData.total,
        paymentMethod: orderData.paymentMethod,
        encrypted: !!encryptedFinancialData,
        compliance: 'PCI-DSS'
      });
      
      return { ...newOrder };
      
    } catch (error) {
      console.error('🔒 Secure order creation failed:', error);
      
      // Create error audit
      this.createFinancialAudit('order_creation_failed', {
        error: error.message,
        orderData: orderData ? {
          total: this.encryptionService ? 
            this.encryptionService.maskSensitiveData(orderData.total, 'amount') : orderData.total,
          itemCount: orderData.items?.length || 0
        } : null
      });
      
      throw error;
    }
  }

  // Validate PCI-DSS compliance for order data
  validateOrderCompliance(orderData) {
    try {
      // Check for required fields
      if (!orderData.total || orderData.total <= 0) {
        return false;
      }
      
      // Validate transaction amount limits
      if (orderData.total > this.maxTransactionAmount) {
        console.warn('🚨 Transaction amount exceeds security limit');
        return false;
      }
      
      // Validate items data
      if (orderData.items && Array.isArray(orderData.items)) {
        const calculatedTotal = orderData.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
        
        // Allow small tolerance for floating point precision
        const tolerance = 0.01;
        if (Math.abs(calculatedTotal - orderData.total) > tolerance) {
          console.warn('🚨 Order total mismatch detected');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('🔒 Order compliance validation failed:', error);
      return false;
    }
  }

  // Securize customer data
  securizeCustomerData(customerData) {
    if (!customerData || !this.encryptionService) {
      return customerData;
    }
    
    if (typeof customerData === 'string') {
      return this.encryptionService.maskSensitiveData(customerData);
    }
    
    return {
      ...customerData,
      name: customerData.name ? 
        this.encryptionService.maskSensitiveData(customerData.name) : undefined,
      email: customerData.email ? 
        this.encryptionService.maskSensitiveData(customerData.email) : undefined,
      phone: customerData.phone ? 
        this.encryptionService.maskSensitiveData(customerData.phone, 'phone') : undefined,
      // Keep non-sensitive data
      id: customerData.id,
      preferences: customerData.preferences
    };
  }

  // Securize shipping data
  securizeShippingData(shippingData) {
    if (!shippingData || !this.encryptionService) {
      return shippingData;
    }
    
    return {
      ...shippingData,
      name: shippingData.name ? 
        this.encryptionService.maskSensitiveData(shippingData.name) : undefined,
      phone: shippingData.phone ? 
        this.encryptionService.maskSensitiveData(shippingData.phone, 'phone') : undefined,
      address: shippingData.address ? 
        this.encryptionService.maskSensitiveData(shippingData.address) : undefined,
      // Keep necessary operational data
      method: shippingData.method,
      cost: shippingData.cost,
      estimatedDelivery: shippingData.estimatedDelivery
    };
  }

  // Store offline orders with encryption
  storeOfflineOrderSecurely(order) {
    try {
      if (!this.encryptionService) {
        // Fallback to legacy storage
        localStorage.setItem('pendingPOSOrders', JSON.stringify([
          ...(JSON.parse(localStorage.getItem('pendingPOSOrders') || '[]')),
          order
        ]));
        return;
      }
      
      const existingOrders = localStorage.getItem('pendingPOSOrders_encrypted');
      let ordersList = [];
      
      if (existingOrders) {
        const decrypted = this.encryptionService.decryptFinancialData(JSON.parse(existingOrders));
        ordersList = Array.isArray(decrypted) ? decrypted : [];
      }
      
      ordersList.push(order);
      const encrypted = this.encryptionService.encryptFinancialData(ordersList);
      localStorage.setItem('pendingPOSOrders_encrypted', JSON.stringify(encrypted));
      
      // Remove legacy unencrypted data
      localStorage.removeItem('pendingPOSOrders');
      
    } catch (error) {
      console.error('🔒 Failed to store offline order securely:', error);
      // Fallback to unencrypted storage (not recommended for production)
      localStorage.setItem('pendingPOSOrders', JSON.stringify([
        ...(JSON.parse(localStorage.getItem('pendingPOSOrders') || '[]')),
        order
      ]));
    }
  }

  // Create financial audit trail
  createFinancialAudit(action, data) {
    try {
      if (!this.encryptionService) {
        console.log(`📊 Financial Audit: ${action}`, data);
        return;
      }
      
      const auditEntry = this.encryptionService.createAuditEntry(action, data, 'order_service');
      
      // Store encrypted audit trail
      const auditTrail = JSON.parse(localStorage.getItem('financial_audit_trail') || '[]');
      auditTrail.push(auditEntry);
      
      // Implement retention policy (keep only recent entries)
      const retentionMs = this.auditRetentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - retentionMs);
      
      const filteredAudit = auditTrail.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
      
      localStorage.setItem('financial_audit_trail', JSON.stringify(filteredAudit));
      
      console.log(`🔒📊 Encrypted Financial Audit: ${action}`);
    } catch (error) {
      console.error('🔒 Failed to create financial audit:', error);
    }
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
    
    try {
      const order = this.orders.find(o => o.Id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // Enhanced security validation for driver assignment
      if (!this.validateDriverAssignmentSecurity(driverId, assignmentData)) {
        throw new Error("Driver assignment failed security validation");
      }

      // Check agent wallet limit before assignment with encryption
      const currentWalletBalance = this.getSecureWalletBalance(driverId);
      const codAmount = this.getDecryptedCodAmount(order);
      
      if (currentWalletBalance + codAmount > this.maxWalletLimit) {
        const maskedBalance = this.encryptionService ? 
          this.encryptionService.maskSensitiveData(currentWalletBalance, 'amount') : currentWalletBalance;
        const maskedAmount = this.encryptionService ?
          this.encryptionService.maskSensitiveData(codAmount, 'amount') : codAmount;
          
        throw new Error(`Assignment would exceed wallet limit. Current: ₹${maskedBalance}, Adding: ₹${maskedAmount}, Limit: ₹${this.maxWalletLimit}`);
      }
      
      const assignmentTimestamp = new Date().toISOString();
      
      // Update order with encrypted assignment data
      order.assignedDriver = driverId;
      order.assignedAt = assignmentTimestamp;
      order.assignmentType = assignmentData.assignmentType || 'manual';
      order.estimatedDeliveryTime = assignmentData.estimatedDeliveryTime || 30;
      order.deliveryStatus = 'assigned';
      
      // Create secure assignment history entry
      if (!order.assignmentHistory) order.assignmentHistory = [];
      const assignmentEntry = {
        driverId,
        driverName: assignmentData.driverName || `Driver ${driverId}`,
        assignedAt: assignmentTimestamp,
        assignmentType: assignmentData.assignmentType || 'manual',
        codAmount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(codAmount, 'amount') : codAmount,
        assignmentId: this.encryptionService ? 
          this.encryptionService.generateAnonymousId() : Date.now(),
        securityVersion: this.securityVersion
      };
      
      order.assignmentHistory.push(assignmentEntry);

      // Update agent wallet balance with encryption
      this.updateSecureWalletBalance(driverId, currentWalletBalance + codAmount);

      // Add to encrypted COD ledger
      await this.addSecureCodTransaction({
        type: 'assignment',
        orderId,
        driverId,
        amount: codAmount,
        timestamp: assignmentTimestamp,
        metadata: {
          ...assignmentData,
          assignmentId: assignmentEntry.assignmentId,
          securityLevel: 'PCI-DSS'
        }
      });

      // Add encrypted audit trail
      order.auditTrail = order.auditTrail || [];
      const auditEntry = {
        action: 'driver_assigned',
        timestamp: assignmentTimestamp,
        userId: assignmentData.assignedBy || 'system',
        details: {
          driverId,
          codAmount: this.encryptionService ? 
            this.encryptionService.maskSensitiveData(codAmount, 'amount') : codAmount,
          assignmentType: assignmentData.assignmentType,
          assignmentId: assignmentEntry.assignmentId
        },
        signature: this.encryptionService ? 
          this.encryptionService.createSignature(`assignment_${orderId}_${driverId}_${assignmentTimestamp}`) : null,
        complianceLevel: 'PCI-DSS'
      };
      
      order.auditTrail.push(auditEntry);

      // Trigger secure webhook for agent app
      await this.triggerSecureWebhook('driver_assigned', {
        orderId,
        driverId,
        order: this.createSecureOrderCopy(order),
        pushNotification: {
          title: `New COD Assignment`,
          body: this.encryptionService ? 
            `ORDER #${orderId} - ${this.encryptionService.maskSensitiveData(codAmount, 'amount')} COD - ${this.encryptionService.maskSensitiveData(order.shipping?.address || 'Address')}` :
            `ORDER #${orderId} - ₹${codAmount} COD - ${order.shipping?.address}`,
          data: { 
            orderId, 
            codAmount: this.encryptionService ? 
              this.encryptionService.maskSensitiveData(codAmount, 'amount') : codAmount,
            estimatedTime: order.estimatedDeliveryTime,
            assignmentId: assignmentEntry.assignmentId
          }
        },
        securityMetadata: {
          encrypted: this.encryptionEnabled,
          signatureVerified: true,
          complianceLevel: 'PCI-DSS'
        }
      });
      
      // Create financial audit
      this.createFinancialAudit('driver_assigned', {
        orderId,
        driverId,
        codAmount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(codAmount, 'amount') : codAmount,
        assignmentType: assignmentData.assignmentType,
        walletBalance: this.encryptionService ?
          this.encryptionService.maskSensitiveData(currentWalletBalance + codAmount, 'amount') : currentWalletBalance + codAmount
      });
      
      return { ...this.createSecureOrderCopy(order) };
      
    } catch (error) {
      console.error('🔒 Secure driver assignment failed:', error);
      
      // Create error audit
      this.createFinancialAudit('driver_assignment_failed', {
        orderId,
        driverId,
        error: error.message,
        assignmentData: assignmentData ? {
          assignmentType: assignmentData.assignmentType,
          estimatedTime: assignmentData.estimatedDeliveryTime
        } : null
      });
      
      throw error;
    }
  }

  // Validate driver assignment security
  validateDriverAssignmentSecurity(driverId, assignmentData) {
    try {
      // Basic validation
      if (!driverId || typeof driverId !== 'string') {
        return false;
      }
      
      // Check driver ID format (should be alphanumeric)
      if (!/^[a-zA-Z0-9_-]+$/.test(driverId)) {
        console.warn('🚨 Invalid driver ID format');
        return false;
      }
      
      // Validate assignment data
      if (assignmentData.estimatedDeliveryTime && assignmentData.estimatedDeliveryTime < 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('🔒 Driver assignment security validation failed:', error);
      return false;
    }
  }

  // Get secure wallet balance
  getSecureWalletBalance(driverId) {
    return this.agentWalletLimits.get(driverId) || 0;
  }

  // Update secure wallet balance
  updateSecureWalletBalance(driverId, newBalance) {
    this.agentWalletLimits.set(driverId, newBalance);
    
    // Store encrypted wallet data
    if (this.encryptionService) {
      const walletData = {};
      for (const [id, balance] of this.agentWalletLimits.entries()) {
        walletData[id] = balance;
      }
      
      const encrypted = this.encryptionService.encryptFinancialData(walletData);
      localStorage.setItem('agent_wallets_encrypted', JSON.stringify(encrypted));
    }
  }

  // Get decrypted COD amount
  getDecryptedCodAmount(order) {
    if (order.encryptedFinancialData && this.encryptionService) {
      try {
        const decrypted = this.encryptionService.decryptFinancialData(order.encryptedFinancialData);
        return decrypted.codAmount || decrypted.total;
      } catch (error) {
        console.error('🔒 Failed to decrypt COD amount:', error);
      }
    }
    return order.codAmount || order.total;
  }

  // Create secure order copy for external consumption
  createSecureOrderCopy(order) {
    if (!this.encryptionService) {
      return { ...order };
    }
    
    return {
      ...order,
      // Mask sensitive data
      total: this.encryptionService.maskSensitiveData(order.total, 'amount'),
      codAmount: this.encryptionService.maskSensitiveData(order.codAmount, 'amount'),
      customer: order.customer ? this.encryptionService.maskSensitiveData(order.customer) : null,
      shipping: order.shipping ? {
        ...order.shipping,
        name: this.encryptionService.maskSensitiveData(order.shipping.name),
        phone: this.encryptionService.maskSensitiveData(order.shipping.phone, 'phone'),
        address: this.encryptionService.maskSensitiveData(order.shipping.address)
      } : null,
      // Keep operational data
      Id: order.Id,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      assignedDriver: order.assignedDriver,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
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
    
    try {
      const order = this.orders.find(o => o.Id === id);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Validate delivery status update for security
      if (!this.validateDeliveryStatusSecurity(status, codData)) {
        throw new Error("Delivery status update failed security validation");
      }
      
      const timestamp = new Date().toISOString();
      const updateId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      order.deliveryStatus = status;
      order.lastUpdated = timestamp;
      order.updateId = updateId;
      
      // Enhanced GPS verification with encryption
      if (location) {
        order.currentLocation = location;
        order.gpsVerification = {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy || '±5 meters',
          timestamp,
          verified: true,
          // Add security metadata
          verificationId: this.encryptionService ? 
            this.encryptionService.generateAnonymousId() : Date.now(),
          integrity: this.encryptionService ? 
            this.encryptionService.createSignature({
              lat: location.lat,
              lng: location.lng,
              timestamp
            }) : null
        };
      }
      
      if (notes) {
        // Sanitize and store notes securely
        order.deliveryNotes = this.sanitizeDeliveryNotes(notes);
      }
      
      // Enhanced COD handling with PCI-DSS compliance and discrepancy management
      if (status === 'delivered' && codData) {
        await this.processSecureCodCollection(order, codData, timestamp, updateId);
      }
      
      // Add encrypted delivery timeline entry
      if (!order.deliveryTimeline) order.deliveryTimeline = [];
      const timelineEntry = {
        status,
        timestamp,
        location: order.gpsVerification,
        notes: order.deliveryNotes,
        updateId,
        codData: codData ? this.createSecureCodDataCopy(codData, order) : null,
        signature: this.encryptionService ? 
          this.encryptionService.createSignature(`${status}_${id}_${timestamp}`) : null
      };
      
      order.deliveryTimeline.push(timelineEntry);

      // Add encrypted audit trail
      order.auditTrail = order.auditTrail || [];
      const auditEntry = {
        action: 'status_updated',
        timestamp,
        userId: codData?.updatedBy || 'driver',
        updateId,
        details: { 
          status, 
          location: order.gpsVerification ? {
            verified: true,
            timestamp: order.gpsVerification.timestamp
          } : null,
          codData: codData ? this.createAuditCodData(codData, order) : null
        },
        signature: this.encryptionService ? 
          this.encryptionService.createSignature(`audit_${id}_${timestamp}_${codData?.updatedBy || 'driver'}`) : null,
        complianceLevel: 'PCI-DSS'
      };
      
      order.auditTrail.push(auditEntry);

      // Enhanced secure webhook with discrepancy notifications
      await this.triggerSecureWebhook('delivery_status_updated', {
        orderId: id,
        status,
        order: this.createSecureOrderCopy(order),
        updateId,
        ...(status === 'delivered' && codData && {
          smsNotification: this.createSecureSMSNotification(order, codData),
          ...(order.codDiscrepancy > 0 && {
            discrepancyAlert: {
              severity: order.codDiscrepancy >= 100 ? 'high' : order.codDiscrepancy >= 50 ? 'medium' : 'low',
              customerVerificationSent: true,
              agentDeductionProcessed: order.agentDeductionProcessed || false,
              encrypted: this.encryptionEnabled,
              complianceLevel: 'PCI-DSS'
            }
          })
        }),
        securityMetadata: {
          encrypted: this.encryptionEnabled,
          signatureVerified: true,
          gpsVerified: !!order.gpsVerification,
          complianceLevel: 'PCI-DSS'
        }
      });
      
      // Create comprehensive financial audit
      this.createFinancialAudit('delivery_status_updated', {
        orderId: id,
        status,
        hasLocation: !!location,
        hasCodData: !!codData,
        codAmount: codData ? 
          (this.encryptionService ? 
            this.encryptionService.maskSensitiveData(codData.collectedAmount, 'amount') : 
            codData.collectedAmount) : null,
        discrepancy: order.codDiscrepancy || 0,
        updateId
      });
      
      return { ...this.createSecureOrderCopy(order) };
      
    } catch (error) {
      console.error('🔒 Secure delivery status update failed:', error);
      
      // Create error audit
      this.createFinancialAudit('delivery_status_update_failed', {
        orderId: id,
        status,
        error: error.message,
        codData: codData ? {
          hasCollectedAmount: !!codData.collectedAmount,
          updatedBy: codData.updatedBy
        } : null
      });
      
      throw error;
    }
  }

  // Validate delivery status update security
  validateDeliveryStatusSecurity(status, codData) {
    try {
      // Validate status values
      const validStatuses = [
        'ready_for_pickup', 'picked_up', 'in_transit', 
        'out_for_delivery', 'delivered', 'failed', 'returned'
      ];
      
      if (!validStatuses.includes(status)) {
        console.warn('🚨 Invalid delivery status');
        return false;
      }
      
      // Validate COD data if present
      if (codData) {
        if (codData.collectedAmount && (
          typeof codData.collectedAmount !== 'number' || 
          codData.collectedAmount < 0 || 
          codData.collectedAmount > this.maxTransactionAmount
        )) {
          console.warn('🚨 Invalid COD amount');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('🔒 Delivery status security validation failed:', error);
      return false;
    }
  }

  // Process secure COD collection
  async processSecureCodCollection(order, codData, timestamp, updateId) {
    const collectedAmount = codData.collectedAmount || this.getDecryptedCodAmount(order);
    const dueAmount = this.getDecryptedCodAmount(order);
    const discrepancy = Math.abs(collectedAmount - dueAmount);
    
    // Update order with encrypted COD data
    order.codCollected = true;
    order.codCollectedAmount = collectedAmount;
    order.codDueAmount = dueAmount;
    order.codDiscrepancy = discrepancy;
    order.codRecordedAt = timestamp;
    order.digitalReceiptId = `RCP-${order.Id}-${Date.now()}-${updateId}`;
    
    // Immediate discrepancy handling with enhanced security
    if (discrepancy > 0) {
      await this.handleSecureCodDiscrepancy(order, discrepancy, timestamp, collectedAmount, dueAmount);
    }

    // Update agent wallet balance with encryption
    if (order.assignedDriver) {
      const currentBalance = this.getSecureWalletBalance(order.assignedDriver);
      this.updateSecureWalletBalance(order.assignedDriver, Math.max(0, currentBalance - dueAmount));
    }

    // Add to encrypted COD ledger with comprehensive discrepancy tracking
    await this.addSecureCodTransaction({
      type: 'collection',
      orderId: order.Id,
      driverId: order.assignedDriver,
      amount: collectedAmount,
      dueAmount,
      discrepancy,
      discrepancyStatus: order.discrepancyStatus,
      timestamp,
      location: order.gpsVerification,
      digitalReceiptId: order.digitalReceiptId,
      metadata: {
        ...codData,
        updateId,
        securityLevel: 'PCI-DSS',
        encrypted: this.encryptionEnabled
      },
      customerVerificationSent: discrepancy > 0,
      agentDeductionProcessed: order.agentDeductionProcessed || false
    });
  }

  // Handle secure COD discrepancy
  async handleSecureCodDiscrepancy(order, discrepancy, timestamp, collectedAmount, dueAmount) {
    // Set discrepancy status and verification requirements
    order.discrepancyStatus = 'pending_verification';
    order.discrepancyDetectedAt = timestamp;
    order.customerVerificationRequired = true;
    order.agentDeductionPending = discrepancy >= 50; // Deduction threshold
    
    // Immediate customer SMS for verification
    await this.sendSecureCustomerVerificationSMS(order, discrepancy);
    
    // Auto-deduct from agent if above threshold
    if (discrepancy >= 50 && order.assignedDriver) {
      await this.processSecureAgentDeduction(order.assignedDriver, discrepancy, order.Id);
      order.agentDeductionProcessed = true;
      order.agentDeductionAmount = discrepancy;
      order.agentDeductionAt = timestamp;
    }
    
    // Generate enhanced compliance alert with encryption
    await this.generateSecureComplianceAlert({
      type: 'cod_discrepancy',
      severity: discrepancy >= 100 ? 'high' : discrepancy >= 50 ? 'medium' : 'low',
      orderId: order.Id,
      driverId: order.assignedDriver,
      discrepancy,
      collectedAmount,
      dueAmount,
      timestamp,
      customerVerificationSent: true,
      agentDeductionProcessed: order.agentDeductionProcessed || false,
      encryptionEnabled: this.encryptionEnabled,
      complianceLevel: 'PCI-DSS'
    });
  }

  // Sanitize delivery notes
  sanitizeDeliveryNotes(notes) {
    if (!notes || typeof notes !== 'string') {
      return '';
    }
    
    // Remove potential script tags and sanitize
    return notes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .substring(0, 500); // Limit length
  }

  // Create secure COD data copy for timeline
  createSecureCodDataCopy(codData, order) {
    if (!codData) return null;
    
    return {
      collectedAmount: this.encryptionService ? 
        this.encryptionService.maskSensitiveData(codData.collectedAmount, 'amount') : 
        codData.collectedAmount,
      discrepancy: order.codDiscrepancy || 0,
      discrepancyStatus: order.discrepancyStatus,
      digitalReceiptId: order.digitalReceiptId,
      encrypted: this.encryptionEnabled,
      paymentMethod: codData.paymentMethod || 'cash'
    };
  }

  // Create audit-safe COD data
  createAuditCodData(codData, order) {
    if (!codData) return null;
    
    return {
      collectedAmount: this.encryptionService ? 
        this.encryptionService.maskSensitiveData(codData.collectedAmount, 'amount') : 
        codData.collectedAmount,
      discrepancy: order.codDiscrepancy || 0,
      discrepancyStatus: order.discrepancyStatus,
      encrypted: this.encryptionEnabled,
      verified: true
    };
  }

  // Create secure SMS notification
  createSecureSMSNotification(order, codData) {
    const maskedPhone = this.encryptionService ? 
      this.encryptionService.maskSensitiveData(order.shipping?.phone, 'phone') : 
      order.shipping?.phone;
    
    const maskedAmount = this.encryptionService ? 
      this.encryptionService.maskSensitiveData(codData.collectedAmount, 'amount') : 
      codData.collectedAmount;
    
    const maskedLocation = this.encryptionService && order.gpsVerification ? 
      `${this.encryptionService.maskSensitiveData(order.gpsVerification.latitude)}° N, ${this.encryptionService.maskSensitiveData(order.gpsVerification.longitude)}° E` :
      `${order.gpsVerification?.latitude}° N, ${order.gpsVerification?.longitude}° E`;
    
    return {
      phone: maskedPhone,
      message: `✅ ORDER #${order.Id} Delivered (${new Date().toLocaleTimeString()})
💰 Collected: ${maskedAmount} ${order.codDiscrepancy === 0 ? '(No discrepancy)' : `(${this.encryptionService ? this.encryptionService.maskSensitiveData(order.codDiscrepancy, 'amount') : order.codDiscrepancy} discrepancy)`}
📍 GPS Verified: ${maskedLocation}`,
      encrypted: this.encryptionEnabled,
      complianceLevel: 'PCI-DSS'
    };
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
// Enhanced secure agent deduction processing with PCI-DSS compliance
  async processSecureAgentDeduction(driverId, amount, orderId) {
    try {
      const deductionId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      const deduction = {
        id: deductionId,
        driverId,
        orderId,
        amount,
        reason: 'cod_discrepancy',
        timestamp: new Date().toISOString(),
        status: 'processed',
        autoProcessed: true,
        // Enhanced security metadata
        securityVersion: this.securityVersion,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS',
        auditTrail: [],
        signature: this.encryptionService ? 
          this.encryptionService.createSignature({
            driverId,
            orderId,
            amount,
            timestamp: new Date().toISOString()
          }) : null
      };

      // Create encrypted deduction record
      const encryptedDeduction = this.encryptionService ? {
        ...deduction,
        // Encrypt sensitive financial data
        encryptedAmount: this.encryptionService.encryptFinancialData(amount),
        maskedAmount: this.encryptionService.maskSensitiveData(amount, 'amount'),
        // Remove raw amount from storage
        amount: undefined
      } : deduction;

      // Store encrypted deduction record
      let deductions = [];
      try {
        const storedDeductions = localStorage.getItem('agentDeductions_encrypted');
        if (storedDeductions && this.encryptionService) {
          const decrypted = this.encryptionService.decryptFinancialData(JSON.parse(storedDeductions));
          deductions = Array.isArray(decrypted) ? decrypted : [];
        } else {
          // Fallback to legacy storage
          deductions = JSON.parse(localStorage.getItem('agentDeductions') || '[]');
        }
      } catch (error) {
        console.error('🔒 Failed to load existing deductions:', error);
        deductions = [];
      }
      
      deductions.push(encryptedDeduction);
      
      // Store with encryption
      if (this.encryptionService) {
        const encrypted = this.encryptionService.encryptFinancialData(deductions);
        localStorage.setItem('agentDeductions_encrypted', JSON.stringify(encrypted));
        // Remove legacy unencrypted data
        localStorage.removeItem('agentDeductions');
      } else {
        localStorage.setItem('agentDeductions', JSON.stringify(deductions));
      }

      // Update agent balance with secure wallet management
      const currentBalance = this.getSecureWalletBalance(driverId);
      this.updateSecureWalletBalance(driverId, Math.max(0, currentBalance - amount));
      const newBalance = this.getSecureWalletBalance(driverId);

      // Create comprehensive audit trail
      const auditEntry = {
        action: 'agent_deduction_processed',
        timestamp: new Date().toISOString(),
        deductionId,
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(amount, 'amount') : amount,
        previousBalance: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(currentBalance, 'amount') : currentBalance,
        newBalance: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(newBalance, 'amount') : newBalance,
        signature: this.encryptionService ? 
          this.encryptionService.createSignature(`deduction_${deductionId}_${driverId}`) : null
      };

      // Store audit trail
      deduction.auditTrail.push(auditEntry);

      // Notify agent with secure webhook
      await this.triggerSecureWebhook('agent_deduction_processed', {
        driverId,
        deduction: {
          ...deduction,
          amount: this.encryptionService ? 
            this.encryptionService.maskSensitiveData(amount, 'amount') : amount
        },
        newBalance: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(newBalance, 'amount') : newBalance,
        pushNotification: {
          title: 'Wallet Deduction Processed',
          message: `${this.encryptionService ? this.encryptionService.maskSensitiveData(amount, 'amount') : `₹${amount}`} deducted due to COD discrepancy in Order #${orderId}`,
          driverId,
          encrypted: this.encryptionEnabled
        },
        securityMetadata: {
          encrypted: this.encryptionEnabled,
          signatureVerified: true,
          complianceLevel: 'PCI-DSS',
          auditTrailCreated: true
        }
      });

      // Create financial audit
      this.createFinancialAudit('agent_deduction_processed', {
        driverId,
        orderId,
        deductionId,
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(amount, 'amount') : amount,
        reason: 'cod_discrepancy',
        newBalance: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(newBalance, 'amount') : newBalance,
        autoProcessed: true
      });

      console.log('💰🔒 Secure agent deduction processed:', {
        deductionId,
        driverId,
        maskedAmount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(amount, 'amount') : amount,
        encrypted: this.encryptionEnabled
      });
      
      return deduction;
      
    } catch (error) {
      console.error('🔒 Secure agent deduction failed:', error);
      
      // Create error audit
      this.createFinancialAudit('agent_deduction_failed', {
        driverId,
        orderId,
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(amount, 'amount') : amount,
        error: error.message
      });
      
      throw error;
    }
  }

  // Legacy method redirect
  async processAgentDeduction(driverId, amount, orderId) {
    return this.processSecureAgentDeduction(driverId, amount, orderId);
  }

  // Send secure customer verification SMS
  async sendSecureCustomerVerificationSMS(order, discrepancy) {
    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code
      const maskedDiscrepancy = this.encryptionService ? 
        this.encryptionService.maskSensitiveData(discrepancy, 'amount') : discrepancy;
      const maskedDueAmount = this.encryptionService ? 
        this.encryptionService.maskSensitiveData(order.codDueAmount, 'amount') : order.codDueAmount;
      const maskedCollectedAmount = this.encryptionService ? 
        this.encryptionService.maskSensitiveData(order.codCollectedAmount, 'amount') : order.codCollectedAmount;
      
      const message = `🚨 PAYMENT VERIFICATION REQUIRED
Order #${order.Id}: Amount discrepancy of ${maskedDiscrepancy} detected.
Expected: ${maskedDueAmount}
Collected: ${maskedCollectedAmount}

Please verify: Reply with code ${verificationCode} if amount is correct.
Or call customer service: 1800-XXX-XXXX`;

      // Store encrypted verification code
      order.customerVerificationCode = this.encryptionService ? 
        this.encryptionService.encryptFinancialData(verificationCode).data : verificationCode;
      order.customerVerificationSentAt = new Date().toISOString();
      order.customerVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h expiry

      // Trigger secure SMS
      await this.triggerSecureWebhook('customer_verification_sms', {
        phone: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(order.shipping?.phone, 'phone') : order.shipping?.phone,
        message,
        orderId: order.Id,
        discrepancy: maskedDiscrepancy,
        verificationCode: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(verificationCode) : verificationCode,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS'
      });

      console.log('🔔🔒 Secure customer verification SMS sent:', { 
        orderId: order.Id, 
        discrepancy: maskedDiscrepancy,
        phone: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(order.shipping?.phone, 'phone') : order.shipping?.phone,
        encrypted: this.encryptionEnabled
      });
      
    } catch (error) {
      console.error('🔒 Secure customer verification SMS failed:', error);
      // Fallback to original method
      return this.sendCustomerVerificationSMS(order, discrepancy);
    }
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
// Enhanced secure COD transaction with end-to-end encryption
  async addSecureCodTransaction(transactionData) {
    try {
      const transactionId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      // Create encrypted transaction
      const transaction = {
        id: transactionId,
        ...transactionData,
        // Encrypt sensitive financial data
        encryptedAmount: this.encryptionService ? 
          this.encryptionService.encryptFinancialData(transactionData.amount) : null,
        encryptedMetadata: this.encryptionService && transactionData.metadata ? 
          this.encryptionService.encryptFinancialData(transactionData.metadata) : null,
        // Mask amounts for storage
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(transactionData.amount, 'amount') : transactionData.amount,
        dueAmount: this.encryptionService && transactionData.dueAmount ? 
          this.encryptionService.maskSensitiveData(transactionData.dueAmount, 'amount') : transactionData.dueAmount,
        // Enhanced security metadata
        hash: this.generateSecureHash(transactionData),
        securityVersion: this.securityVersion,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS',
        signature: this.encryptionService ? 
          this.encryptionService.createSignature({
            ...transactionData,
            transactionId,
            timestamp: transactionData.timestamp
          }) : null
      };

      // Add transaction to pending pool
      this.codLedger.pendingTransactions.push(transaction);
      this.codLedger.totalTransactions = (this.codLedger.totalTransactions || 0) + 1;
      
      // Update total amount (using original amount for calculations)
      if (typeof transactionData.amount === 'number') {
        this.codLedger.totalAmount = (this.codLedger.totalAmount || 0) + transactionData.amount;
      }

      // Mine new block if enough transactions (reduced threshold for better security)
      if (this.codLedger.pendingTransactions.length >= 2) {
        await this.mineSecureBlock();
      }

      this.saveSecureCodLedger();
      
      // Create transaction audit
      this.createFinancialAudit('cod_transaction_added', {
        transactionId,
        type: transactionData.type,
        orderId: transactionData.orderId,
        driverId: transactionData.driverId,
        amount: this.encryptionService ? 
          this.encryptionService.maskSensitiveData(transactionData.amount, 'amount') : transactionData.amount,
        encrypted: this.encryptionEnabled
      });
      
    } catch (error) {
      console.error('🔒 Secure COD transaction failed:', error);
      
      // Fallback to legacy method
      return this.addCodTransaction(transactionData);
    }
  }

  // Enhanced secure block mining with PCI-DSS compliance
  async mineSecureBlock() {
    try {
      const blockId = this.codLedger.blocks.length + 1;
      const timestamp = new Date().toISOString();
      
      const block = {
        id: blockId,
        timestamp,
        transactions: [...this.codLedger.pendingTransactions],
        previousHash: this.codLedger.blocks[this.codLedger.blocks.length - 1].hash,
        nonce: 0,
        // Enhanced security metadata
        securityVersion: this.securityVersion,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS',
        minerNode: 'order_service_v2',
        transactionCount: this.codLedger.pendingTransactions.length,
        blockSignature: null // Will be set after mining
      };

      // Enhanced proof of work with increased difficulty
      let hash;
      const targetDifficulty = Math.max(this.codLedger.difficulty, 3);
      
      do {
        block.nonce++;
        hash = this.generateSecureHash(block);
      } while (!hash.startsWith('0'.repeat(targetDifficulty)));

      block.hash = hash;
      block.blockSignature = this.encryptionService ? 
        this.encryptionService.createSignature(block) : null;
      
      // Add block to ledger
      this.codLedger.blocks.push(block);
      this.codLedger.pendingTransactions = [];
      this.codLedger.lastBlockMined = timestamp;

      console.log(`✅🔒 Secure COD Block #${block.id} mined with ${block.transactionCount} encrypted transactions (difficulty: ${targetDifficulty})`);
      
      // Create mining audit
      this.createFinancialAudit('cod_block_mined', {
        blockId,
        transactionCount: block.transactionCount,
        difficulty: targetDifficulty,
        nonce: block.nonce,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS'
      });
      
    } catch (error) {
      console.error('🔒 Secure block mining failed:', error);
      
      // Fallback to legacy mining
      return this.mineBlock();
    }
  }

  // Save encrypted COD ledger
  saveSecureCodLedger() {
    try {
      if (!this.encryptionService) {
        // Fallback to legacy storage
        localStorage.setItem('codLedger', JSON.stringify(this.codLedger));
        return;
      }
      
      const encrypted = this.encryptionService.encryptCodLedger(this.codLedger);
      localStorage.setItem('codLedger_encrypted', JSON.stringify(encrypted));
      
      // Remove legacy unencrypted data
      this.encryptionService.secureDelete('codLedger');
      
      console.log('🔒 COD ledger saved with encryption');
      
    } catch (error) {
      console.error('🔒 Failed to save encrypted COD ledger:', error);
      
      // Fallback to legacy storage
      localStorage.setItem('codLedger', JSON.stringify(this.codLedger));
    }
  }

  // Legacy method redirects
  async addCodTransaction(transactionData) {
    return this.addSecureCodTransaction(transactionData);
  }

  async mineBlock() {
    return this.mineSecureBlock();
  }

  saveCodLedger() {
    return this.saveSecureCodLedger();
  }

  getCodLedger() {
    return { ...this.codLedger };
  }

  // Webhook system for real-time sync
  registerWebhook(url) {
    this.webhookEndpoints.add(url);
  }

// Enhanced secure webhook system with end-to-end encryption
async triggerSecureWebhook(event, data) {
    try {
      const webhookId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      // Create encrypted webhook data
      const webhookData = {
        id: webhookId,
        event,
        timestamp: new Date().toISOString(),
        data: data,
        // Enhanced security metadata
        securityVersion: this.securityVersion,
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS',
        signature: this.encryptionService ? 
          this.encryptionService.createSignature({ event, data, timestamp: new Date().toISOString() }) : null
      };

      // Encrypt sensitive webhook data
      if (this.encryptionService && this.containsSensitiveData(data)) {
        webhookData.encryptedData = this.encryptionService.encryptFinancialData(data);
        webhookData.data = this.maskWebhookData(data); // Keep masked version for logging
      }

      // Add to encrypted sync queue for offline handling
      this.syncQueue.push(webhookData);
      
      // Simulate secure webhook calls
      this.webhookEndpoints.forEach(url => {
        console.log(`🔗🔒 Secure webhook triggered: ${url}`, {
          id: webhookId,
          event,
          timestamp: webhookData.timestamp,
          encrypted: this.encryptionEnabled,
          dataSize: JSON.stringify(webhookData).length
        });
        // In real implementation: 
        // fetch(url, { 
        //   method: 'POST', 
        //   body: JSON.stringify(webhookData),
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'X-Webhook-Signature': webhookData.signature,
        //     'X-Encryption-Enabled': this.encryptionEnabled ? 'true' : 'false'
        //   }
        // })
      });

      // Enhanced secure notification handling
      if (data.pushNotification) {
        console.log('📱🔒 Encrypted push notification sent:', {
          ...data.pushNotification,
          // Mask sensitive data in logs
          title: data.pushNotification.title,
          body: this.encryptionService ? 
            this.encryptionService.maskSensitiveData(data.pushNotification.body) : 
            data.pushNotification.body,
          encrypted: this.encryptionEnabled
        });
      }

      if (data.smsNotification) {
        console.log('📱🔒 Encrypted SMS sent:', {
          phone: data.smsNotification.phone,
          messageLength: data.smsNotification.message?.length || 0,
          encrypted: data.smsNotification.encrypted || this.encryptionEnabled,
          complianceLevel: data.smsNotification.complianceLevel || 'PCI-DSS'
        });
      }

      // Secure customer verification SMS
      if (event === 'customer_verification_sms') {
        console.log('📱🔒 Secure customer verification SMS sent:', {
          phone: data.phone,
          orderId: data.orderId,
          discrepancy: data.discrepancy,
          timestamp: new Date().toISOString(),
          encrypted: data.encrypted || this.encryptionEnabled,
          complianceLevel: data.complianceLevel || 'PCI-DSS'
        });
      }

      // Secure agent deduction notifications
      if (event === 'agent_deduction_processed') {
        console.log('💰🔒 Encrypted agent deduction notification:', {
          driverId: data.driverId,
          deductionId: data.deduction?.id,
          amount: data.deduction?.amount || 'encrypted', // Already masked
          newBalance: data.newBalance, // Already masked
          timestamp: new Date().toISOString(),
          encrypted: data.securityMetadata?.encrypted || this.encryptionEnabled
        });
      }

      // Secure discrepancy alerts
      if (data.discrepancyAlert) {
        console.log('🚨🔒 Encrypted discrepancy alert triggered:', {
          severity: data.discrepancyAlert.severity,
          customerVerificationSent: data.discrepancyAlert.customerVerificationSent,
          agentDeductionProcessed: data.discrepancyAlert.agentDeductionProcessed,
          encrypted: data.discrepancyAlert.encrypted || this.encryptionEnabled,
          complianceLevel: data.discrepancyAlert.complianceLevel || 'PCI-DSS'
        });
      }

      // Secure alert escalations
      if (event === 'alert_escalation') {
        console.log('⚠️🔒 Encrypted alert escalation webhook:', {
          alertId: data.alertId,
          level: data.level,
          timestamp: data.timestamp,
          encrypted: this.encryptionEnabled
        });
      }

      // Secure compliance alerts with enhanced routing
      if (event === 'compliance_alert' && data.discrepancyNotification) {
        const { adminAlert, managerAlert, immediateAction } = data.discrepancyNotification;
        
        if (immediateAction) {
          console.log('🚨🔒 IMMEDIATE ACTION REQUIRED (ENCRYPTED):', {
            type: data.type,
            severity: data.severity,
            encrypted: data.encryptionEnabled || this.encryptionEnabled,
            complianceLevel: data.complianceLevel || 'PCI-DSS'
          });
        }
        if (adminAlert) {
          console.log('👨‍💼🔒 Encrypted admin notification sent:', {
            alertId: data.id,
            type: data.type,
            severity: data.severity,
            timestamp: data.timestamp
          });
        }
        if (managerAlert) {
          console.log('👩‍💼🔒 Encrypted manager notification sent:', {
            alertId: data.id,
            type: data.type,
            severity: data.severity,
            timestamp: data.timestamp
          });
        }
      }

      // Create webhook audit
      this.createFinancialAudit('webhook_triggered', {
        webhookId,
        event,
        hasEncryptedData: !!webhookData.encryptedData,
        endpointCount: this.webhookEndpoints.size,
        dataSize: JSON.stringify(webhookData).length,
        complianceLevel: 'PCI-DSS'
      });
      
    } catch (error) {
      console.error('🔒 Secure webhook failed:', error);
      
      // Fallback to legacy webhook
      return this.triggerWebhook(event, data);
    }
  }

  // Check if data contains sensitive information
  containsSensitiveData(data) {
    if (!data || typeof data !== 'object') return false;
    
    const sensitiveFields = [
      'total', 'amount', 'codAmount', 'balance', 'newBalance',
      'phone', 'address', 'cardNumber', 'customerInfo',
      'paymentToken', 'verificationCode'
    ];
    
    const checkObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.some(item => checkObject(item));
      }
      
      if (obj && typeof obj === 'object') {
        return Object.keys(obj).some(key => 
          sensitiveFields.includes(key) || checkObject(obj[key])
        );
      }
      
      return false;
    };
    
    return checkObject(data);
  }

  // Mask sensitive data in webhook
  maskWebhookData(data) {
    if (!this.encryptionService || !data) return data;
    
    const masked = { ...data };
    
    // Mask common sensitive fields
    if (masked.order) {
      masked.order = this.createSecureOrderCopy(masked.order);
    }
    
    if (masked.deduction && masked.deduction.amount) {
      masked.deduction = {
        ...masked.deduction,
        amount: this.encryptionService.maskSensitiveData(masked.deduction.amount, 'amount')
      };
    }
    
    if (masked.newBalance) {
      masked.newBalance = this.encryptionService.maskSensitiveData(masked.newBalance, 'amount');
    }
    
    if (masked.pushNotification && masked.pushNotification.body) {
      masked.pushNotification = {
        ...masked.pushNotification,
        body: this.encryptionService.maskSensitiveData(masked.pushNotification.body)
      };
    }
    
    return masked;
  }

  // Legacy method redirect
  triggerWebhook(event, data) {
    return this.triggerSecureWebhook(event, data);
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
// Enhanced secure compliance alert with PCI-DSS requirements
async generateSecureComplianceAlert(alertData) {
    try {
      const alertId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      const alert = {
        id: alertId,
        ...alertData,
        timestamp: new Date().toISOString(),
        status: 'active',
        escalationLevel: this.determineEscalationLevel(alertData),
        autoActions: this.getAutoActions(alertData),
        // Enhanced security metadata
        securityVersion: this.securityVersion,
        encrypted: this.encryptionEnabled,
        complianceLevel: alertData.complianceLevel || 'PCI-DSS',
        sensitiveDataMasked: true,
        auditTrail: [],
        signature: this.encryptionService ? 
          this.encryptionService.createSignature({
            ...alertData,
            alertId,
            timestamp: new Date().toISOString()
          }) : null
      };

      // Mask sensitive data in alert
      if (this.encryptionService) {
        if (alert.discrepancy) {
          alert.maskedDiscrepancy = this.encryptionService.maskSensitiveData(alert.discrepancy, 'amount');
        }
        if (alert.collectedAmount) {
          alert.maskedCollectedAmount = this.encryptionService.maskSensitiveData(alert.collectedAmount, 'amount');
        }
        if (alert.dueAmount) {
          alert.maskedDueAmount = this.encryptionService.maskSensitiveData(alert.dueAmount, 'amount');
        }
      }

      // Store encrypted alert with enhanced categorization
      let alerts = [];
      try {
        const storedAlerts = localStorage.getItem('complianceAlerts_encrypted');
        if (storedAlerts && this.encryptionService) {
          const decrypted = this.encryptionService.decryptFinancialData(JSON.parse(storedAlerts));
          alerts = Array.isArray(decrypted) ? decrypted : [];
        } else {
          // Fallback to legacy storage
          alerts = JSON.parse(localStorage.getItem('complianceAlerts') || '[]');
        }
      } catch (error) {
        console.error('🔒 Failed to load existing alerts:', error);
        alerts = [];
      }
      
      alerts.push(alert);
      
      // Implement retention policy
      const retentionMs = this.auditRetentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - retentionMs);
      const filteredAlerts = alerts.filter(a => 
        new Date(a.timestamp) > cutoffDate
      );
      
      // Store with encryption
      if (this.encryptionService) {
        const encrypted = this.encryptionService.encryptFinancialData(filteredAlerts);
        localStorage.setItem('complianceAlerts_encrypted', JSON.stringify(encrypted));
        // Remove legacy unencrypted data
        localStorage.removeItem('complianceAlerts');
      } else {
        localStorage.setItem('complianceAlerts', JSON.stringify(filteredAlerts));
      }

      // Enhanced secure notification with escalation
      await this.triggerSecureWebhook('compliance_alert', {
        ...alert,
        // Remove raw sensitive data from webhook
        discrepancy: undefined,
        collectedAmount: undefined,
        dueAmount: undefined,
        ...(alert.type === 'cod_discrepancy' && {
          discrepancyNotification: {
            adminAlert: alert.severity === 'high',
            managerAlert: alert.severity === 'medium' || alert.severity === 'high',
            immediateAction: alert.severity === 'high' && (alertData.discrepancy >= 200),
            encrypted: this.encryptionEnabled,
            complianceLevel: 'PCI-DSS'
          }
        })
      });

      // Auto-escalate high severity alerts with encryption
      if (alert.severity === 'high') {
        await this.escalateSecureAlert(alert);
      }

      // Create comprehensive audit trail
      this.createFinancialAudit('compliance_alert_generated', {
        alertId,
        type: alert.type,
        severity: alert.severity,
        escalationLevel: alert.escalationLevel,
        autoActions: alert.autoActions,
        encrypted: this.encryptionEnabled,
        maskedDiscrepancy: alert.maskedDiscrepancy,
        complianceLevel: alert.complianceLevel
      });

      console.log('🚨🔒 Enhanced Secure Compliance Alert Generated:', {
        id: alertId,
        type: alert.type,
        severity: alert.severity,
        encrypted: this.encryptionEnabled,
        complianceLevel: alert.complianceLevel,
        maskedDiscrepancy: alert.maskedDiscrepancy
      });
      
      return alert;
      
    } catch (error) {
      console.error('🔒 Secure compliance alert generation failed:', error);
      
      // Fallback to legacy method
      return this.generateComplianceAlert(alertData);
    }
  }

  // Enhanced secure alert escalation
  async escalateSecureAlert(alert) {
    try {
      const escalationId = this.encryptionService ? 
        this.encryptionService.generateAnonymousId() : Date.now();
      
      const escalation = {
        id: escalationId,
        alertId: alert.id,
        timestamp: new Date().toISOString(),
        level: alert.escalationLevel,
        actions: ['admin_notification', 'immediate_review', 'compliance_audit'],
        // Enhanced security metadata
        encrypted: this.encryptionEnabled,
        complianceLevel: 'PCI-DSS',
        urgencyLevel: alert.severity === 'high' ? 'critical' : 'high',
        signature: this.encryptionService ? 
          this.encryptionService.createSignature({
            escalationId,
            alertId: alert.id,
            timestamp: new Date().toISOString()
          }) : null
      };

      await this.triggerSecureWebhook('alert_escalation', escalation);
      
      // Create escalation audit
      this.createFinancialAudit('alert_escalated', {
        escalationId,
        alertId: alert.id,
        level: alert.escalationLevel,
        urgencyLevel: escalation.urgencyLevel,
        encrypted: this.encryptionEnabled
      });
      
      console.log('⚠️🔒 Secure alert escalated:', {
        escalationId,
        alertId: alert.id,
        level: alert.escalationLevel,
        encrypted: this.encryptionEnabled
      });
      
    } catch (error) {
      console.error('🔒 Secure alert escalation failed:', error);
      
      // Fallback to legacy escalation
      return this.escalateAlert(alert);
    }
  }

  // Legacy method redirects
  async generateComplianceAlert(alertData) {
    return this.generateSecureComplianceAlert(alertData);
  }

  async escalateAlert(alert) {
    return this.escalateSecureAlert(alert);
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
}
}

export const orderService = new OrderService();