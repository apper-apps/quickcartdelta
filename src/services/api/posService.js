import { orderService } from './orderService';
import { productService } from './productService';
import { notificationService } from './notificationService';

class POSService {
  constructor() {
    this.offlineData = this.loadOfflineData();
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  loadOfflineData() {
    return {
      pendingOrders: JSON.parse(localStorage.getItem('pendingPOSOrders') || '[]'),
      customerTabs: JSON.parse(localStorage.getItem('posCustomerTabs') || '{}'),
      inventoryChanges: JSON.parse(localStorage.getItem('posInventoryChanges') || '[]')
    };
  }

  saveOfflineData() {
    localStorage.setItem('pendingPOSOrders', JSON.stringify(this.offlineData.pendingOrders));
    localStorage.setItem('posCustomerTabs', JSON.stringify(this.offlineData.customerTabs));
    localStorage.setItem('posInventoryChanges', JSON.stringify(this.offlineData.inventoryChanges));
  }

  async processPayment(orderData) {
    await this.delay();
    
    try {
      // Create order through order service
      const order = await orderService.create(orderData);
      
      // Update inventory
      await this.updateInventory(orderData.items);
      
      // Generate receipt
      const receipt = this.generateReceipt(order);
      
      return {
        success: true,
        order,
        receipt
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  async updateInventory(items) {
    for (const item of items) {
      // In real app, this would update actual inventory
      console.log(`📦 Inventory updated: ${item.name} -${item.quantity}`);
      
      // Store offline inventory changes
      if (!navigator.onLine) {
        this.offlineData.inventoryChanges.push({
          productId: item.Id,
          quantityChange: -item.quantity,
          timestamp: Date.now()
        });
        this.saveOfflineData();
      }
    }
  }

  generateReceipt(order) {
    const receipt = {
      number: order.receiptNumber,
      date: new Date().toISOString(),
      items: order.items,
      subtotal: order.subtotal || order.total,
      tax: order.tax || 0,
      total: order.total,
      paymentMethod: order.paymentMethod,
      customer: order.customer || 'Walk-in',
      cashier: 'POS System'
    };

    // Mock receipt printing
    console.log('🧾 Receipt Generated:', receipt);
    return receipt;
  }

  async syncOfflineData() {
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }

    await this.delay(1000);
    
    try {
      // Sync pending orders
      for (const order of this.offlineData.pendingOrders) {
        await orderService.create({ ...order, offlineCreated: false });
      }
      
      // Sync inventory changes
      for (const change of this.offlineData.inventoryChanges) {
        await productService.updateInventory(change.productId, change.quantityChange);
      }
      
      // Clear offline data after successful sync
      this.offlineData = {
        pendingOrders: [],
        customerTabs: this.offlineData.customerTabs, // Keep customer tabs
        inventoryChanges: []
      };
      this.saveOfflineData();
      
      return { success: true, syncedItems: this.offlineData.pendingOrders.length };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async searchByBarcode(barcode) {
    return await productService.searchByBarcode(barcode);
  }

  // Split bill functionality
  calculateSplitBill(items, customers, assignments) {
    const splits = {};
    
    customers.forEach(customer => {
      splits[customer] = {
        items: [],
        total: 0
      };
    });
    
    items.forEach(item => {
      const assignedCustomer = assignments[item.Id] || customers[0];
      if (splits[assignedCustomer]) {
        splits[assignedCustomer].items.push(item);
        splits[assignedCustomer].total += item.price * item.quantity;
      }
    });
    
    return splits;
  }

  async processSplitPayment(orderData, splits) {
    const orders = [];
    
    for (const [customer, split] of Object.entries(splits)) {
      const splitOrder = {
        ...orderData,
        items: split.items,
        total: split.total,
        customer,
        receiptNumber: `${orderData.receiptNumber}-${customer.substring(0, 3).toUpperCase()}`
      };
      
      const order = await this.processPayment(splitOrder);
      orders.push(order);
    }
    
    return orders;
  }
}

export const posService = new POSService();