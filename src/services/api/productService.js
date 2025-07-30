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
}

export const productService = new ProductService();