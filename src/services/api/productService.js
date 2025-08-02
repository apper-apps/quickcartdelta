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

async search(query, options = {}) {
    await this.delay();
    const searchTerm = query.toLowerCase();
    
    // Enhanced search with NLP-like intent analysis
    const searchResults = this.products.filter(product =>
      product.title.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      product.brand?.toLowerCase().includes(searchTerm)
    );
    
    // Add search intent analysis
    const intent = this.analyzeSearchIntent(query);
    
    // Sort by relevance with intent weighting
    const sortedResults = searchResults.sort((a, b) => {
      let scoreA = this.calculateRelevanceScore(a, searchTerm, intent);
      let scoreB = this.calculateRelevanceScore(b, searchTerm, intent);
      
      // Apply user context if provided
      if (options.userContext) {
        scoreA += this.applyUserContextBoost(a, options.userContext);
        scoreB += this.applyUserContextBoost(b, options.userContext);
      }
      
      return scoreB - scoreA;
    });
    
    return sortedResults;
  }
  
  analyzeSearchIntent(query) {
    const intent = { type: 'general', confidence: 0.5 };
    const lowerQuery = query.toLowerCase();
    
    // Price intent
    if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable') || lowerQuery.includes('budget')) {
      intent.type = 'price_conscious';
      intent.confidence = 0.8;
    }
    // Quality intent
    else if (lowerQuery.includes('best') || lowerQuery.includes('premium') || lowerQuery.includes('high quality')) {
      intent.type = 'quality_focused';
      intent.confidence = 0.8;
    }
    // Brand intent
    else if (lowerQuery.includes('apple') || lowerQuery.includes('samsung') || lowerQuery.includes('nike')) {
      intent.type = 'brand_specific';
      intent.confidence = 0.9;
    }
    
    return intent;
  }
  
  calculateRelevanceScore(product, searchTerm, intent) {
    let score = 0;
    
    // Title match (highest weight)
    if (product.title.toLowerCase().includes(searchTerm)) score += 10;
    
    // Category match
    if (product.category.toLowerCase().includes(searchTerm)) score += 5;
    
    // Description match
    if (product.description.toLowerCase().includes(searchTerm)) score += 3;
    
    // Brand match
    if (product.brand?.toLowerCase().includes(searchTerm)) score += 7;
    
    // Intent-based scoring
    if (intent.type === 'price_conscious') {
      score += product.price < 50 ? 5 : product.price < 100 ? 3 : 0;
    } else if (intent.type === 'quality_focused') {
      score += product.rating > 4.0 ? 5 : 0;
    }
    
    // Popularity boost
    score += Math.log(product.reviews + 1) * 0.5;
    
    return score * intent.confidence;
  }
  
  applyUserContextBoost(product, userContext) {
    let boost = 0;
    
    // Browsing history boost
    if (userContext.browsing?.includes(product.Id)) boost += 2;
    
    // Category preference
    const viewedCategories = userContext.browsing?.map(id => 
      this.products.find(p => p.Id === id)?.category
    ).filter(Boolean);
    
    if (viewedCategories?.includes(product.category)) boost += 3;
    
    // Cart context
    if (userContext.cart?.some(item => item.category === product.category)) boost += 4;
    
    return boost;
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

async getBrowsingRecommendations(currentProductId = null, browsingHistory = [], cartItems = [], options = {}) {
    await this.delay();
    const maxRecommendations = options.maxRecommendations || 12;
    const recommendations = new Set();
    const viewedCategories = new Set();
    const cartCategories = new Set();
    const viewedBrands = new Set();
    
    // Advanced user behavior analysis
    const userProfile = this.buildUserProfile(browsingHistory, cartItems);
    
    // Analyze browsing history with frequency weighting
    const categoryFrequency = {};
    const brandFrequency = {};
    
    browsingHistory.forEach(productId => {
      const product = this.products.find(p => p.Id === productId);
      if (product) {
        viewedCategories.add(product.category);
        viewedBrands.add(product.brand);
        
        categoryFrequency[product.category] = (categoryFrequency[product.category] || 0) + 1;
        brandFrequency[product.brand] = (brandFrequency[product.brand] || 0) + 1;
      }
    });
    
    // Analyze cart contents with value weighting
    cartItems.forEach(item => {
      cartCategories.add(item.category);
    });
    
    // Get current product details
    let currentProduct = null;
    if (currentProductId) {
      currentProduct = this.products.find(p => p.Id === currentProductId);
    }
    
    // Advanced collaborative filtering
    if (options.includeCollaborativeFiltering) {
      const collaborativeRecs = this.getCollaborativeRecommendations(
        browsingHistory,
        cartItems,
        currentProductId
      );
      collaborativeRecs.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add({ ...product, source: 'collaborative' });
        }
      });
    }
    
    // Priority 1: Frequently bought together with current product
    if (currentProduct?.frequentlyBoughtWith) {
      const bundleProducts = this.products
        .filter(p => currentProduct.frequentlyBoughtWith.includes(p.title))
        .slice(0, 3);
      
      bundleProducts.forEach(product => recommendations.add({ ...product, source: 'bundle' }));
    }
    
    // Priority 2: Same category as current product with enhanced scoring
    if (currentProduct) {
      const sameCategory = this.products
        .filter(p => 
          p.category === currentProduct.category && 
          p.Id !== currentProductId &&
          !Array.from(recommendations).some(r => r.Id === p.Id)
        )
        .map(product => ({
          ...product,
          score: this.calculateRecommendationScore(product, userProfile, 'category_match')
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
      
      sameCategory.forEach(product => recommendations.add({ ...product, source: 'category' }));
    }
    
    // Priority 3: Brand affinity recommendations
    const topBrands = Object.entries(brandFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand);
    
    topBrands.forEach(brand => {
      if (recommendations.size >= maxRecommendations) return;
      
      const brandProducts = this.products
        .filter(p => 
          p.brand === brand &&
          p.Id !== currentProductId &&
          !Array.from(recommendations).some(r => r.Id === p.Id)
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      
      brandProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add({ ...product, source: 'brand_affinity' });
        }
      });
    });
    
    // Priority 4: Cart complementary products
    cartCategories.forEach(category => {
      if (recommendations.size >= maxRecommendations) return;
      
      const complementaryProducts = this.products
        .filter(p => 
          this.areComplementaryCategories(p.category, category) &&
          !Array.from(recommendations).some(r => r.Id === p.Id) &&
          p.Id !== currentProductId
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      
      complementaryProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add({ ...product, source: 'complementary' });
        }
      });
    });
    
    // Priority 5: Trending products in user's categories
    if (options.includeTrendingProducts) {
      const trendingProducts = this.getTrendingProducts(viewedCategories, currentProductId);
      trendingProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add({ ...product, source: 'trending' });
        }
      });
    }
    
    // Priority 6: Seasonal recommendations
    if (options.includeSeasonalRecommendations) {
      const seasonalProducts = this.getSeasonalRecommendations(currentProductId);
      seasonalProducts.forEach(product => {
        if (recommendations.size < maxRecommendations) {
          recommendations.add({ ...product, source: 'seasonal' });
        }
      });
    }
    
    // Fill remaining slots with high-rated products
    if (recommendations.size < maxRecommendations) {
      const fillProducts = this.products
        .filter(p => 
          p.rating >= 4.2 && 
          !Array.from(recommendations).some(r => r.Id === p.Id) &&
          p.Id !== currentProductId
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxRecommendations - recommendations.size);
      
      fillProducts.forEach(product => recommendations.add({ ...product, source: 'high_rated' }));
    }
    
    const finalRecommendations = Array.from(recommendations)
      .map(product => ({ ...product }))
      .slice(0, maxRecommendations);
    
    console.log(`🎯 Generated ${finalRecommendations.length} personalized recommendations`);
    return finalRecommendations;
  }
  
  buildUserProfile(browsingHistory, cartItems) {
    const profile = {
      categories: {},
      brands: {},
      priceRange: { min: 0, max: 1000 },
      avgRating: 0,
      totalItems: browsingHistory.length + cartItems.length
    };
    
    // Analyze browsing patterns
    browsingHistory.forEach(productId => {
      const product = this.products.find(p => p.Id === productId);
      if (product) {
        profile.categories[product.category] = (profile.categories[product.category] || 0) + 1;
        profile.brands[product.brand] = (profile.brands[product.brand] || 0) + 1;
      }
    });
    
    // Analyze cart patterns
    cartItems.forEach(item => {
      profile.categories[item.category] = (profile.categories[item.category] || 0) + 2; // Higher weight
      profile.priceRange.min = Math.min(profile.priceRange.min, item.price);
      profile.priceRange.max = Math.max(profile.priceRange.max, item.price);
    });
    
    return profile;
  }
  
  getCollaborativeRecommendations(browsingHistory, cartItems, currentProductId) {
    // Simplified collaborative filtering - in production, use more sophisticated algorithms
    const userBehavior = [...browsingHistory, ...cartItems.map(item => item.Id)];
    const similarUsers = this.findSimilarUsers(userBehavior);
    
    const collaborativeProducts = [];
    similarUsers.forEach(similarUser => {
      similarUser.products.forEach(productId => {
        if (!userBehavior.includes(productId) && productId !== currentProductId) {
          const product = this.products.find(p => p.Id === productId);
          if (product && !collaborativeProducts.find(p => p.Id === productId)) {
            collaborativeProducts.push(product);
          }
        }
      });
    });
    
    return collaborativeProducts.slice(0, 4);
  }
  
  findSimilarUsers(userBehavior) {
    // Mock similar users data - in production, use real user behavior analytics
    const mockSimilarUsers = [
      { products: [1, 3, 5, 7, 9], similarity: 0.8 },
      { products: [2, 4, 6, 8, 10], similarity: 0.7 },
      { products: [11, 13, 15, 17, 19], similarity: 0.6 }
    ];
    
    return mockSimilarUsers.filter(user => user.similarity > 0.5);
  }
  
  areComplementaryCategories(cat1, cat2) {
    const complementaryMap = {
      'electronics': ['accessories', 'cables'],
      'clothing': ['shoes', 'accessories'],
      'home-garden': ['furniture', 'decor'],
      'sports': ['fitness', 'outdoor']
    };
    
    return complementaryMap[cat1]?.includes(cat2) || complementaryMap[cat2]?.includes(cat1);
  }
  
  getTrendingProducts(viewedCategories, currentProductId) {
    // Mock trending algorithm - in production, use real analytics
    return this.products
      .filter(p => 
        Array.from(viewedCategories).includes(p.category) &&
        p.Id !== currentProductId &&
        p.reviews > 50 // Popular products
      )
      .sort((a, b) => (b.reviews * b.rating) - (a.reviews * a.rating))
      .slice(0, 3);
  }
  
  getSeasonalRecommendations(currentProductId) {
    const currentMonth = new Date().getMonth();
    const seasonalCategories = {
      'winter': ['clothing', 'electronics'], // Dec, Jan, Feb
      'spring': ['home-garden', 'sports'], // Mar, Apr, May
      'summer': ['sports', 'outdoor'], // Jun, Jul, Aug
      'fall': ['clothing', 'electronics'] // Sep, Oct, Nov
    };
    
    let season = 'spring';
    if (currentMonth >= 11 || currentMonth <= 1) season = 'winter';
    else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer';
    else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall';
    
    const relevantCategories = seasonalCategories[season];
    
    return this.products
      .filter(p => 
        relevantCategories.includes(p.category) &&
        p.Id !== currentProductId
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);
  }
  
  calculateRecommendationScore(product, userProfile, source) {
    let score = product.rating * 2; // Base score
    
    // Category affinity
    const categoryCount = userProfile.categories[product.category] || 0;
    score += categoryCount * 1.5;
    
    // Brand affinity
    const brandCount = userProfile.brands[product.brand] || 0;
    score += brandCount * 1.2;
    
    // Price fit
    if (product.price >= userProfile.priceRange.min && product.price <= userProfile.priceRange.max) {
      score += 2;
    }
    
    // Source weighting
    const sourceWeights = {
      'category_match': 1.5,
      'brand_affinity': 1.3,
      'collaborative': 1.8,
      'trending': 1.1,
      'seasonal': 1.0
    };
    
    score *= sourceWeights[source] || 1.0;
    
    return score;
  }

async checkCameraAvailability() {
    try {
      // Enhanced MediaDevices API availability check with better error handling
      if (!navigator?.mediaDevices?.getUserMedia) {
        return { 
          available: false, 
          reason: 'not_supported',
          message: 'Camera API not supported in this browser'
        };
      }
      
      // Check for secure context (HTTPS required for camera access)
      if (!window.isSecureContext) {
        return { 
          available: false, 
          reason: 'insecure_context',
          message: 'HTTPS required for camera access'
        };
      }
      
      // Check for actual camera devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          return {
            available: false,
            reason: 'no_camera',
            message: 'No camera device found'
          };
        }
      } catch (enumError) {
        console.warn('Could not enumerate devices:', enumError);
      }
      
      // Test actual camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        // Immediately stop the stream after checking availability
        stream.getTracks().forEach(track => track.stop());
        
        return { available: true, message: 'Camera available' };
      } catch (accessError) {
        // Handle permission-related errors without failing completely
        if (accessError.name === 'NotAllowedError') {
          return {
            available: true, // Camera exists but needs permission
            reason: 'permission_required',
            message: 'Camera permission required'
          };
        }
        throw accessError; // Re-throw other errors
      }
      
    } catch (error) {
      console.warn('Camera availability check failed:', error);
      
      // Enhanced error categorization
      let reason = 'unknown';
      let message = 'Camera availability check failed';
      
      if (error.name === 'NotAllowedError') {
        reason = 'permission_denied';
        message = 'Camera permission denied';
      } else if (error.name === 'NotFoundError') {
        reason = 'no_camera';
        message = 'No camera device found';
      } else if (error.name === 'NotReadableError') {
        reason = 'camera_in_use';
        message = 'Camera is being used by another application';
      } else if (error.name === 'TypeError' && error.message.includes('Illegal invocation')) {
        reason = 'api_error';
        message = 'Camera API context error';
      } else if (error.name === 'NotSupportedError') {
        reason = 'not_supported';
        message = 'Camera not supported in this browser';
      }
      
      return { available: false, reason, message };
    }
  }

  async getARCapability(productId) {
    await this.delay();
    try {
      const product = await this.getById(productId);
      
      if (!product) {
        return {
          hasAR: false,
          has3D: false,
          cameraRequired: false,
          cameraAvailable: false,
          message: 'Product not found'
        };
      }
      
      // Check camera availability
      const cameraCheck = await this.checkCameraAvailability();
      
      // Enhanced AR capability detection based on multiple factors
      const arCapableCategories = {
        'electronics': ['phone', 'tablet', 'laptop', 'headphones', 'speaker'],
        'furniture': ['chair', 'table', 'sofa', 'bed', 'desk'],
        'clothing': ['shoes', 'jacket', 'dress', 'shirt', 'hat'],
        'home-garden': ['plant', 'decoration', 'lamp', 'mirror'],
        'sports': ['equipment', 'gear', 'bike', 'fitness']
      };
      
      let hasAR = false;
      let arCategory = null;
      
      // Check if product belongs to AR-capable category
      Object.entries(arCapableCategories).forEach(([category, keywords]) => {
        if (product.category.toLowerCase().includes(category.replace('-', ''))) {
          const hasKeyword = keywords.some(keyword => 
            product.title.toLowerCase().includes(keyword) ||
            product.description.toLowerCase().includes(keyword) ||
            product.tags?.some(tag => tag.toLowerCase().includes(keyword))
          );
          if (hasKeyword) {
            hasAR = true;
            arCategory = category;
          }
        }
      });
      
      // Enhanced 3D model availability
      const has3D = hasAR && ['electronics', 'furniture', 'sports'].includes(arCategory);
      
      // AR features based on category
      const categoryFeatures = {
        'electronics': ['360_view', 'size_comparison', 'color_options'],
        'furniture': ['room_placement', 'size_visualization', 'material_preview'],
        'clothing': ['virtual_try_on', 'size_fitting', 'color_matching'],
        'home-garden': ['space_planning', 'lighting_effects', 'seasonal_preview'],
        'sports': ['size_comparison', 'usage_demonstration', 'compatibility_check']
      };
      
      return {
        hasAR: hasAR && cameraCheck.available,
        has3D: has3D, // 3D view doesn't require camera permission
        cameraRequired: hasAR,
        cameraAvailable: cameraCheck.available,
        cameraMessage: cameraCheck.message,
        arCategory,
        arFeatures: hasAR ? categoryFeatures[arCategory] || ['360_view'] : [],
        modelUrl: has3D ? `/models/${arCategory}/${productId}.glb` : null,
        instructions: hasAR ? [
          'Allow camera access when prompted',
          'Point camera at a flat surface',
          'Tap to place the product',
          'Pinch to resize and adjust',
          'Drag to rotate and position',
          'Walk around to view all angles'
        ] : null,
        fallbackMessage: !cameraCheck.available ? 
          `AR preview requires camera access: ${cameraCheck.message}` : null,
        compatibilityScore: hasAR ? 0.9 : 0.0 // ML confidence score
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
        fallbackMessage: 'AR capability check failed',
        error: error.message
      };
    }
  }


async trackPriceDrops(products, userWishlist = []) {
    await this.delay();
    
    // Enhanced price drop detection with ML-like patterns
    const priceDrops = [];
    
    products.forEach(product => {
      const isWishlisted = userWishlist.some(item => item.Id === product.Id);
      let dropProbability = 0.1; // Base 10% chance
      
      // Increase probability for wishlisted items
      if (isWishlisted) dropProbability = 0.3;
      
      // Seasonal pricing patterns
      const currentMonth = new Date().getMonth();
      if ([10, 11, 0].includes(currentMonth)) dropProbability += 0.2; // Holiday sales
      if ([6, 7].includes(currentMonth)) dropProbability += 0.15; // Summer sales
      
      // Category-based patterns
      if (product.category === 'electronics') dropProbability += 0.1;
      if (product.category === 'clothing') dropProbability += 0.15;
      
      // Inventory clearance simulation
      if (product.stock && product.stock < 10) dropProbability += 0.2;
      
      const hasPriceDrop = Math.random() < dropProbability;
      const hasDiscount = product.discount && product.discount > 0;
      
      if (hasPriceDrop || hasDiscount) {
        const previousPrice = product.originalPrice || product.price * (1.1 + Math.random() * 0.3);
        const dropPercentage = Math.round(((previousPrice - product.price) / previousPrice) * 100);
        
        if (dropPercentage > 0) {
          priceDrops.push({
            productId: product.Id,
            productName: product.title,
            previousPrice,
            currentPrice: product.price,
            dropPercentage,
            alertType: 'price_drop',
            timestamp: new Date().toISOString(),
            isWishlisted,
            urgency: dropPercentage > 25 ? 'high' : dropPercentage > 15 ? 'medium' : 'low'
          });
        }
      }
    });
    
    console.log(`💰 Detected ${priceDrops.length} price drops`);
    return priceDrops;
  }
async searchByBarcode(barcode) {
    await this.delay();
    
    // Enhanced barcode lookup with product matching
    const enhancedBarcodeMap = {
      '1234567890123': { productId: 1, confidence: 0.95 },
      '9876543210987': { productId: 2, confidence: 0.90 },
      '4567890123456': { productId: 3, confidence: 0.88 },
      '7890123456789': { productId: 4, confidence: 0.92 },
      '3456789012345': { productId: 5, confidence: 0.87 },
      '6789012345678': { productId: 6, confidence: 0.93 }
    };
    
    const barcodeData = enhancedBarcodeMap[barcode];
    
    if (barcodeData) {
      const product = this.products.find(p => p.Id === barcodeData.productId);
      if (product) {
        // Add barcode-specific metadata
        const enhancedProduct = {
          ...product,
          barcodeMatch: {
            barcode,
            confidence: barcodeData.confidence,
            scanTimestamp: new Date().toISOString()
          }
        };
        
        console.log(`📊 Barcode match found: ${product.title} (${Math.round(barcodeData.confidence * 100)}% confidence)`);
        return [enhancedProduct];
      }
    }
    
    // Fallback: attempt fuzzy matching for similar products
    const fuzzyMatches = this.products.filter(product => {
      // Simple similarity check based on first/last digits
      const productId = product.Id.toString();
      const firstDigit = barcode.charAt(0);
      const lastDigit = barcode.charAt(barcode.length - 1);
      
      return productId.includes(firstDigit) || productId.includes(lastDigit);
    }).slice(0, 3);
    
    if (fuzzyMatches.length > 0) {
      console.log(`🔍 Found ${fuzzyMatches.length} potential matches for barcode ${barcode}`);
      return fuzzyMatches.map(product => ({
        ...product,
        barcodeMatch: {
          barcode,
          confidence: 0.3,
          matchType: 'fuzzy',
          scanTimestamp: new Date().toISOString()
        }
      }));
    }
    
    console.log(`❌ No product found for barcode ${barcode}`);
    return [];
  }

  // Get placeholder image for failed image loads
getPlaceholderImage(productTitle = "Product", width = 400, height = 400) {
    try {
      // Ensure we have a valid title
      const title = productTitle?.trim() || "Product";
      
      // Smart truncation that preserves word boundaries
      let truncatedTitle = title.length <= 25 ? title : title.slice(0, 25);
      
      // If we truncated mid-word, find the last complete word
      if (title.length > 25) {
        const lastSpaceIndex = truncatedTitle.lastIndexOf(' ');
        if (lastSpaceIndex > 10) { // Ensure we have at least 10 chars
          truncatedTitle = truncatedTitle.slice(0, lastSpaceIndex);
        }
      }
      
      // Clean and encode the title properly
      const cleanTitle = truncatedTitle
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens and spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      const encodedTitle = encodeURIComponent(cleanTitle || 'Product');
      return `https://via.placeholder.com/${width}x${height}/e5e7eb/6b7280?text=${encodedTitle}`;
    } catch (error) {
      console.warn('Error generating placeholder image:', error);
      return `https://via.placeholder.com/${width}x${height}/e5e7eb/6b7280?text=Product`;
    }
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