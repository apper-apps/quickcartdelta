import productsData from "@/services/mockData/products.json";
import categoriesData from "@/services/mockData/categories.json";

// Enhanced product service with AR/3D capabilities
class ProductService {
  constructor() {
    this.products = [...productsData];
    this.categories = [...categoriesData];
  }

  // Simulate API delay
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAll() {
    await this.delay();
    return [...this.products];
  }
async getById(id) {
    await this.delay();
    const product = this.products.find(p => p.Id === id);
    if (!product) {
      throw new Error("Product not found");
    }
    return { ...product };
  }

  async getByIds(ids) {
    await this.delay();
    const products = this.products.filter(p => ids.includes(p.Id));
    return products.map(product => ({ ...product }));
  }

  async getComparableProducts(productId) {
    await this.delay();
    const product = this.products.find(p => p.Id === productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Return products in same category excluding the current product
    const comparableProducts = this.products
      .filter(p => p.category === product.category && p.Id !== productId)
      .slice(0, 8)
      .map(product => ({ ...product }));
    
    return comparableProducts;
  }

  async getByCategory(category) {
    await this.delay();
    if (category === "all") {
      return [...this.products];
    }
    return this.products.filter(p => p.category === category);
  }

  async getFeatured() {
    await this.delay();
    return this.products.filter(p => p.featured).slice(0, 8);
  }

  async search(query) {
    await this.delay();
    const searchTerm = query.toLowerCase();
    return this.products.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  }

  async getCategories() {
    await this.delay();
    return [...this.categories];
  }

  async create(productData) {
    await this.delay();
    const maxId = Math.max(...this.products.map(p => p.Id));
    const newProduct = {
      ...productData,
      Id: maxId + 1,
      createdAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    return { ...newProduct };
  }

  async update(id, productData) {
    await this.delay();
    const index = this.products.findIndex(p => p.Id === id);
    if (index === -1) {
      throw new Error("Product not found");
    }
    this.products[index] = { ...this.products[index], ...productData };
    return { ...this.products[index] };
  }
async delete(id) {
    await this.delay();
    const index = this.products.findIndex(p => p.Id === id);
    if (index === -1) {
      throw new Error("Product not found");
    }
    this.products.splice(index, 1);
    return true;
  }

async getBrowsingRecommendations(currentProductId = null, browsingHistory = [], cartItems = []) {
    await this.delay();
    const maxRecommendations = 8;
    const recommendations = new Set();
    const viewedCategories = new Set();
    const cartCategories = new Set();
    
    // Analyze browsing history
    browsingHistory.forEach(productId => {
      const product = this.products.find(p => p.Id === productId);
      if (product) {
        viewedCategories.add(product.category);
      }
    });
    
    // Analyze cart contents
    cartItems.forEach(item => {
      cartCategories.add(item.category);
    });
    
    // Get current product category if provided
    let currentCategory = null;
    if (currentProductId) {
      const currentProduct = this.products.find(p => p.Id === currentProductId);
      if (currentProduct) {
        currentCategory = currentProduct.category;
      }
    }
    
    // Priority 1: Same category as current product (if on product detail page)
    if (currentCategory) {
      const sameCategory = this.products
        .filter(p => p.category === currentCategory && p.Id !== currentProductId)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      
      sameCategory.forEach(product => recommendations.add(product));
    }
    
    // Priority 2: Products from categories in cart
    cartCategories.forEach(category => {
      if (recommendations.size >= maxRecommendations) return;
      
      const categoryProducts = this.products
        .filter(p => p.category === category && 
                    !Array.from(recommendations).some(r => r.Id === p.Id) &&
                    p.Id !== currentProductId)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      
      categoryProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add(product);
        }
      });
    });
    
    // Priority 3: Products from browsed categories
    viewedCategories.forEach(category => {
      if (recommendations.size >= maxRecommendations) return;
      
      const categoryProducts = this.products
        .filter(p => p.category === category && 
                    !Array.from(recommendations).some(r => r.Id === p.Id) &&
                    p.Id !== currentProductId)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      
categoryProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add(product);
        }
      });
    });
    
    // Priority 4: Featured products to fill remaining slots
    if (recommendations.size < maxRecommendations) {
      const featuredProducts = this.products
        .filter(p => p.featured && 
                    !Array.from(recommendations).some(r => r.Id === p.Id) &&
                    p.Id !== currentProductId)
        .sort((a, b) => b.rating - a.rating);
      
      featuredProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add(product);
        }
      });
    }
    
    // Priority 5: High-rated products to fill any remaining slots
    if (recommendations.size < maxRecommendations) {
      const highRatedProducts = this.products
        .filter(p => p.rating >= 4.3 && 
                    !Array.from(recommendations).some(r => r.Id === p.Id) &&
                    p.Id !== currentProductId)
        .sort((a, b) => b.rating - a.rating);
      
      highRatedProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add(product);
        }
      });
    }
    
    return Array.from(recommendations).map(product => ({ ...product }));
  }

  async checkCameraAvailability() {
    try {
      // Enhanced MediaDevices API availability check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { available: false, reason: 'not_supported' };
      }
      
      // Check for secure context (HTTPS required for camera access)
      if (!window.isSecureContext) {
        return { available: false, reason: 'insecure_context' };
      }
      
      // Use direct method call to prevent context binding issues
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      // Immediately stop the stream after checking availability
      stream.getTracks().forEach(track => track.stop());
      
      return { available: true };
    } catch (error) {
      console.warn('Camera availability check failed:', error);
      
      // Enhanced error categorization
      let reason = 'unknown';
      if (error.name === 'NotAllowedError') {
        reason = 'permission_denied';
      } else if (error.name === 'NotFoundError') {
        reason = 'no_camera';
      } else if (error.name === 'NotReadableError') {
        reason = 'camera_in_use';
      } else if (error.name === 'TypeError' && error.message.includes('Illegal invocation')) {
        reason = 'api_error';
      }
      
return { available: false, reason };
    }
  }

  async getARCapability(productId) {
    await this.delay();
    try {
      const product = await this.getById(productId);
      
      if (!product) return null;
      
      // Check camera availability
      const cameraAvailable = await this.checkCameraAvailability();
      
      // Mock AR capability based on category
      const arCapableCategories = ['electronics', 'furniture', 'clothing', 'home-garden'];
      const hasAR = arCapableCategories.some(cat => 
        product.category.toLowerCase().includes(cat.replace('-', '')) ||
        product.tags?.some(tag => tag.toLowerCase().includes(cat.replace('-', '')))
      );
      
      return {
        hasAR: hasAR && cameraAvailable,
        has3D: hasAR, // 3D view doesn't require camera
        cameraRequired: hasAR,
        cameraAvailable,
        arFeatures: hasAR ? ['360_view', 'size_visualization', 'room_placement'] : [],
        modelUrl: hasAR ? `/models/${productId}.glb` : null,
        instructions: hasAR ? [
          'Allow camera access for AR features',
          'Tap to place in your space',
          'Pinch to resize',
          'Drag to rotate',
          'Walk around to view from all angles'
        ] : null,
        fallbackMessage: !cameraAvailable ? 'Camera access required for AR features' : null
      };
    } catch (error) {
      console.error('Error checking AR capability:', error);
      return {
        hasAR: false,
        has3D: false,
        cameraRequired: false,
        cameraAvailable: false,
        arFeatures: [],
        modelUrl: null,
        instructions: null,
        fallbackMessage: 'AR features unavailable'
      };
    }
  }


  async trackPriceDrops(products) {
    await this.delay();
    
    // Mock price drop detection
    const priceDrops = products.filter(product => {
      // Simulate price changes - in real app would compare with historical data
      const hasDiscount = product.discount && product.discount > 0;
      const randomDrop = Math.random() < 0.1; // 10% chance of price drop
      return hasDiscount || randomDrop;
    }).map(product => ({
      productId: product.Id,
      previousPrice: product.price * 1.2, // Mock previous price
      currentPrice: product.price,
dropPercentage: Math.round((1 - product.price / (product.price * 1.2)) * 100),
      alertType: 'price_drop'
    }));
    
    return priceDrops;
  }
  async searchByBarcode(barcode) {
    await this.delay();
    // Mock barcode lookup - in real app, this would query by barcode field
    const mockBarcodeMap = {
      '1234567890123': 1,
      '9876543210987': 2,
      '4567890123456': 3
    };
    
    const productId = mockBarcodeMap[barcode];
    if (productId) {
      const product = this.products.find(p => p.Id === productId);
      return product ? [product] : [];
    }
    
return [];
  }

  // Get placeholder image for failed image loads
  getPlaceholderImage(productTitle = "Product", width = 400, height = 400) {
    const encodedTitle = encodeURIComponent(productTitle.slice(0, 20));
    return `https://via.placeholder.com/${width}x${height}/e5e7eb/6b7280?text=${encodedTitle}`;
  }

  // Validate image URL and provide fallback
  async validateImageUrl(url, fallbackTitle = "Product") {
    try {
      return new Promise((resolve) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          resolve(this.getPlaceholderImage(fallbackTitle));
        }, 5000); // 5 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          resolve(url);
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve(this.getPlaceholderImage(fallbackTitle));
        };

        img.src = url;
      });
    } catch (error) {
      console.warn('Image validation failed:', error);
      return this.getPlaceholderImage(fallbackTitle);
    }
  }
}

// Export singleton instance
export const productService = new ProductService();