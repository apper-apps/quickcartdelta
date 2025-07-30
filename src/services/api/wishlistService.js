import wishlistData from '@/services/mockData/wishlist.json';

class WishlistService {
  constructor() {
    this.data = [...wishlistData];
    this.nextId = Math.max(...this.data.map(item => item.Id), 0) + 1;
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAll() {
    await this.delay();
    return [...this.data];
  }

  async getById(id) {
    await this.delay();
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID provided');
    }
    
    const item = this.data.find(item => item.Id === numericId);
    if (!item) {
      throw new Error('Wishlist item not found');
    }
    return { ...item };
  }

  async create(itemData) {
    await this.delay();
    
    // Check if item already exists
    const existingItem = this.data.find(item => item.productId === itemData.productId);
    if (existingItem) {
      throw new Error('Item already in wishlist');
    }

    const newItem = {
      Id: this.nextId++,
      ...itemData,
      addedAt: new Date().toISOString(),
      originalPrice: itemData.currentPrice,
      priceDropAlert: false
    };

    this.data.push(newItem);
    return { ...newItem };
  }

  async update(id, itemData) {
    await this.delay();
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID provided');
    }

    const index = this.data.findIndex(item => item.Id === numericId);
    if (index === -1) {
      throw new Error('Wishlist item not found');
    }

    this.data[index] = {
      ...this.data[index],
      ...itemData,
      Id: numericId // Preserve original ID
    };

    return { ...this.data[index] };
  }

  async delete(id) {
    await this.delay();
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      throw new Error('Invalid ID provided');
    }

    const index = this.data.findIndex(item => item.Id === numericId);
    if (index === -1) {
      throw new Error('Wishlist item not found');
    }

    const deletedItem = { ...this.data[index] };
    this.data.splice(index, 1);
    return deletedItem;
  }

  async getByProductId(productId) {
    await this.delay();
    const numericId = parseInt(productId);
    if (isNaN(numericId)) {
      throw new Error('Invalid product ID provided');
    }
    
    return this.data.find(item => item.productId === numericId) || null;
  }

  async checkPriceDrops(products) {
    await this.delay();
    const priceDrops = [];

    for (const wishlistItem of this.data) {
      const currentProduct = products.find(p => p.Id === wishlistItem.productId);
      if (currentProduct && currentProduct.price < wishlistItem.currentPrice) {
        const priceDropPercent = Math.round(((wishlistItem.currentPrice - currentProduct.price) / wishlistItem.currentPrice) * 100);
        
        priceDrops.push({
          wishlistItemId: wishlistItem.Id,
          productId: wishlistItem.productId,
          productTitle: wishlistItem.productTitle,
          oldPrice: wishlistItem.currentPrice,
          newPrice: currentProduct.price,
          priceDropPercent,
          createdAt: new Date().toISOString()
        });

        // Update the current price in wishlist
        wishlistItem.currentPrice = currentProduct.price;
        wishlistItem.priceDropAlert = true;
      }
    }

    return priceDrops;
  }

  async clearAll() {
    await this.delay();
    this.data = [];
    return true;
  }
}

export const wishlistService = new WishlistService();