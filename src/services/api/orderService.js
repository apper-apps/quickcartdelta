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
      offlineCreated: orderData.offlineCreated || false
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
    this.orders[index] = { 
      ...this.orders[index], 
      ...orderData,
      updatedAt: new Date().toISOString()
    };
    return { ...this.orders[index] };
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

  async updateDeliveryStatus(id, status, location = null, notes = '') {
    await this.delay();
    const order = this.orders.find(o => o.Id === id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    order.deliveryStatus = status;
    order.lastUpdated = new Date().toISOString();
    if (location) {
      order.currentLocation = location;
    }
    if (notes) {
      order.deliveryNotes = notes;
    }
    
    // Add delivery timeline entry
    if (!order.deliveryTimeline) order.deliveryTimeline = [];
    order.deliveryTimeline.push({
      status,
      timestamp: new Date().toISOString(),
      location,
      notes
    });
    
    return { ...order };
  }

  async getDeliveryOrders() {
    await this.delay();
    return this.orders.filter(o => 
      ['ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery'].includes(o.deliveryStatus)
    ).sort((a, b) => {
      // Priority sort: urgent first, then by delivery window
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return new Date(a.deliveryWindow?.start || a.createdAt) - new Date(b.deliveryWindow?.start || b.createdAt);
    });
  }

  async assignDriver(orderId, driverId) {
    await this.delay();
    const order = this.orders.find(o => o.Id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    
    order.assignedDriver = driverId;
    order.deliveryStatus = 'assigned';
    order.lastUpdated = new Date().toISOString();
    
    return { ...order };
  }
}

export const orderService = new OrderService();