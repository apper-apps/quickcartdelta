import productsData from "@/services/mockData/products.json";
import categoriesData from "@/services/mockData/categories.json";
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
    
    const recommendations = new Set();
    const maxRecommendations = 8;
    
    // Get product categories from browsing history and cart
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
}

// Export singleton instance
export const productService = new ProductService();