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
      updatedAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
    return { ...newOrder };
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
}

export const orderService = new OrderService();