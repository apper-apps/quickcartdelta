import { createSlice } from "@reduxjs/toolkit";
import React from "react";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    total: 0,
    itemCount: 0,
    isOpen: false,
    discount: {
      code: "",
      percentage: 0,
      isValid: false,
      type: "manual", // manual, dynamic, loyalty, referral, abandonment
      appliedAt: null,
      expiresAt: null
    },
    abandonment: {
      tracked: false,
      timestamp: null,
      reminderSent: false,
      reminderCount: 0,
      lastActivity: Date.now(),
      recoveryOffers: []
    },
    checkout: {
      biometricEnabled: false,
      savedPayments: [],
      oneClickEnabled: false,
      preferredPaymentMethod: null,
      autoApplyLoyaltyPoints: true,
      expressCheckout: false
    },
    dynamicPricing: {
      personalizedDiscount: 0,
      tierDiscount: 0,
      bulkDiscount: 0,
      seasonalDiscount: 0,
      firstTimeDiscount: 0,
      appliedAt: null
    },
    bnpl: {
      available: true,
      providers: ['afterpay', 'klarna', 'tabby'],
      selectedProvider: null,
      installmentPlan: null
    },
    crypto: {
      enabled: true,
      supportedCoins: ['BTC', 'ETH', 'USDC', 'USDT'],
      selectedCoin: null,
      exchangeRate: null,
      walletConnected: false
    },
    pos: {
      mode: false,
      offlineMode: false,
      pendingSyncs: [],
      customerTabs: {},
      currentCustomer: null,
      splitBill: {
        enabled: false,
        customers: [],
        itemAssignments: {}
      },
      receipt: {
        number: null,
        printed: false
      }
    }
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, customerId = null } = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          ...product,
          quantity,
          customerId,
        });
      }
      
      cartSlice.caseReducers.calculateTotals(state);
      
      // Store offline if POS mode and offline
      if (state.pos.mode && state.pos.offlineMode) {
        state.pos.pendingSyncs.push({
          type: 'ADD_TO_CART',
          data: { product, quantity, customerId },
          timestamp: Date.now()
        });
      }
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.Id !== productId);
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.Id === productId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.Id !== productId);
        } else {
          item.quantity = quantity;
        }
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      // Reset split bill when clearing cart
      state.pos.splitBill = {
        enabled: false,
        customers: [],
itemAssignments: {}
    };
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
closeCart: (state) => {
      state.isOpen = false;
    },
    applyDiscount: (state, action) => {
      const { code, type = "manual", expiresIn = null } = action.payload;
      // Enhanced discount validation with dynamic codes
      const validCodes = {
        // Standard codes
        'WELCOME25': { percentage: 25, description: 'New customer welcome' },
        'FREESHIP': { percentage: 0, freeShipping: true, description: 'Free shipping' },
        'FLASH50': { percentage: 50, description: 'Flash sale special' },
        'WEEKEND30': { percentage: 30, description: 'Weekend promotion' },
        'SAVE20': { percentage: 20, description: 'General discount' },
        'VIP15': { percentage: 15, description: 'VIP member exclusive' },
        
        // Abandonment recovery codes
        'COMEBACK10': { percentage: 10, description: 'Cart recovery offer' },
        'COMEBACK15': { percentage: 15, description: 'Extended recovery offer' },
        'COMEBACK20': { percentage: 20, description: 'Final recovery offer' },
        
        // Referral codes
        'REFERRAL20': { percentage: 20, description: 'Referral bonus' },
        'FRIEND15': { percentage: 15, description: 'Friend referral' },
        
        // Loyalty codes
        'LOYAL10': { percentage: 10, description: 'Loyalty reward' },
        'PLATINUM25': { percentage: 25, description: 'Platinum tier exclusive' },
        
        // Seasonal codes
        'HOLIDAY30': { percentage: 30, description: 'Holiday special' },
        'SUMMER25': { percentage: 25, description: 'Summer sale' },
        'BLACKFRIDAY50': { percentage: 50, description: 'Black Friday deal' },
        
        // Crypto payment incentives
        'CRYPTO5': { percentage: 5, description: 'Crypto payment bonus' },
        'BTC10': { percentage: 10, description: 'Bitcoin payment special' }
      };
      
      // Check for dynamic spin wheel codes (pattern: SPIN + random)
      const spinWheelPattern = /^SPIN[A-Z0-9]{6}$/;
      const luckyPattern = /^LUCKY[A-Z0-9]{6}$/;
      
      let discountData = validCodes[code];
      
      // Handle dynamic codes
      if (!discountData && spinWheelPattern.test(code)) {
        discountData = { percentage: 15, description: 'Spin wheel prize' };
      } else if (!discountData && luckyPattern.test(code)) {
        discountData = { percentage: 10, description: 'Lucky draw prize' };
      }
      
      if (discountData) {
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null;
        
        state.discount = {
          code: code,
          percentage: discountData.percentage,
          isValid: true,
          type,
          description: discountData.description,
          freeShipping: discountData.freeShipping || false,
          appliedAt: new Date().toISOString(),
          expiresAt
        };
        
        // Track discount usage
        console.log(`💰 Discount applied: ${code} (${discountData.percentage}%) - ${discountData.description}`);
      } else {
        state.discount = {
          code: "",
          percentage: 0,
          isValid: false,
          type: "manual",
          appliedAt: null,
          expiresAt: null
        };
        console.warn(`❌ Invalid discount code: ${code}`);
      }
    },

trackAbandonment: (state, action) => {
      const { activity = 'cart_update' } = action.payload || {};
      
      if (state.items.length > 0) {
        const now = Date.now();
        const lastActivity = state.abandonment.lastActivity;
        const timeSinceLastActivity = now - lastActivity;
        
        // Start tracking abandonment after 5 minutes of inactivity
        if (!state.abandonment.tracked && timeSinceLastActivity > 5 * 60 * 1000) {
          state.abandonment.tracked = true;
          state.abandonment.timestamp = now;
          console.log('🕒 Cart abandonment tracking started');
        }
        
        // Update last activity
        state.abandonment.lastActivity = now;
        
        // Generate progressive recovery offers
        const hoursAbandoned = Math.floor(timeSinceLastActivity / (1000 * 60 * 60));
        const newOffers = [];
        
        if (hoursAbandoned >= 1 && !state.abandonment.recoveryOffers.find(o => o.trigger === '1_hour')) {
          newOffers.push({
            id: `recovery_${now}`,
            trigger: '1_hour',
            discountCode: 'COMEBACK10',
            discountPercent: 10,
            message: 'Complete your purchase in the next hour and save 10%!',
            expiresIn: 60 * 60 * 1000, // 1 hour
            createdAt: new Date().toISOString()
          });
        }
        
        if (hoursAbandoned >= 24 && !state.abandonment.recoveryOffers.find(o => o.trigger === '24_hours')) {
          newOffers.push({
            id: `recovery_${now}_24h`,
            trigger: '24_hours',
            discountCode: 'COMEBACK15',
            discountPercent: 15,
            message: 'Your items are still waiting! Save 15% if you complete your order today.',
            expiresIn: 24 * 60 * 60 * 1000, // 24 hours
            createdAt: new Date().toISOString()
          });
        }
        
        if (hoursAbandoned >= 72 && !state.abandonment.recoveryOffers.find(o => o.trigger === '72_hours')) {
          newOffers.push({
            id: `recovery_${now}_72h`,
            trigger: '72_hours',
            discountCode: 'COMEBACK20',
            discountPercent: 20,
            message: 'Final offer! Complete your purchase and save 20% - expires soon!',
            expiresIn: 48 * 60 * 60 * 1000, // 48 hours
            createdAt: new Date().toISOString()
          });
        }
        
        state.abandonment.recoveryOffers.push(...newOffers);
      } else if (state.abandonment.tracked) {
        // Reset abandonment tracking when cart is emptied
        state.abandonment = {
          tracked: false,
          timestamp: null,
          reminderSent: false,
          reminderCount: 0,
          lastActivity: Date.now(),
          recoveryOffers: []
        };
      }
    },

enableBiometric: (state, action) => {
      const { enabled, deviceType = 'fingerprint' } = action.payload;
      state.checkout.biometricEnabled = enabled;
      state.checkout.biometricType = deviceType; // fingerprint, face, voice
      
      if (enabled) {
        state.checkout.expressCheckout = true;
        console.log(`🔐 Biometric authentication enabled: ${deviceType}`);
      }
    },

    savePaymentMethod: (state, action) => {
      const payment = action.payload;
      const exists = state.checkout.savedPayments.find(p => p.id === payment.id);
      
      if (!exists) {
        const enhancedPayment = {
          ...payment,
          addedAt: new Date().toISOString(),
          lastUsed: null,
          isDefault: state.checkout.savedPayments.length === 0,
          securityLevel: payment.type === 'crypto' ? 'high' : 'standard'
        };
        
        state.checkout.savedPayments.push(enhancedPayment);
        
        // Set as preferred if it's the first one
        if (!state.checkout.preferredPaymentMethod) {
          state.checkout.preferredPaymentMethod = payment.id;
        }
        
        console.log(`💳 Payment method saved: ${payment.type} ending in ${payment.last4 || payment.address?.slice(-4)}`);
      }
    },

    enableOneClick: (state, action) => {
      state.checkout.oneClickEnabled = action.payload;
      
      if (action.payload && state.checkout.biometricEnabled && state.checkout.savedPayments.length > 0) {
        state.checkout.expressCheckout = true;
        console.log('⚡ Express one-click checkout enabled');
      }
    },
    
    setBNPLProvider: (state, action) => {
      const { provider, installmentPlan } = action.payload;
      
      state.bnpl.selectedProvider = provider;
      state.bnpl.installmentPlan = installmentPlan;
      
      console.log(`💳 BNPL provider selected: ${provider} with ${installmentPlan?.installments || 4} installments`);
    },
    
    setCryptoPayment: (state, action) => {
      const { coin, exchangeRate, walletAddress } = action.payload;
      
      state.crypto.selectedCoin = coin;
      state.crypto.exchangeRate = exchangeRate;
      state.crypto.walletConnected = !!walletAddress;
      
      if (walletAddress) {
        // Apply crypto payment bonus
        if (!state.discount.isValid || state.discount.percentage < 5) {
          state.discount = {
            code: 'CRYPTO5',
            percentage: 5,
            isValid: true,
            type: 'crypto_bonus',
            description: 'Cryptocurrency payment bonus',
            appliedAt: new Date().toISOString()
          };
        }
      }
      
console.log(`₿ Crypto payment setup: ${coin} at rate ${exchangeRate}`);
    },
    
    applyDynamicPricing: (state, action) => {
      const {
        personalizedDiscount, 
        tierDiscount, 
        bulkDiscount, 
        seasonalDiscount,
        firstTimeDiscount,
        userContext 
      } = action.payload;
      
      // Enhanced dynamic pricing with multiple factors
      state.dynamicPricing = {
        personalizedDiscount: personalizedDiscount || 0,
        tierDiscount: tierDiscount || 0,
        bulkDiscount: bulkDiscount || 0,
        seasonalDiscount: seasonalDiscount || 0,
        firstTimeDiscount: firstTimeDiscount || 0,
        appliedAt: new Date().toISOString()
      };
      
      // Calculate best dynamic discount with stacking rules
      let bestDiscount = Math.max(personalizedDiscount || 0, tierDiscount || 0);
      
      // Add stackable discounts
      if (bulkDiscount) bestDiscount += Math.min(bulkDiscount, 10); // Cap bulk bonus at 10%
      if (seasonalDiscount) bestDiscount += Math.min(seasonalDiscount, 5); // Cap seasonal at 5%
      if (firstTimeDiscount && userContext?.isFirstTime) bestDiscount += firstTimeDiscount;
      
      // Cap total dynamic discount at 50%
      bestDiscount = Math.min(bestDiscount, 50);
      
      // Auto-apply if better than current discount
      if (bestDiscount > state.discount.percentage) {
        const discountComponents = [];
        if (personalizedDiscount) discountComponents.push(`Personal: ${personalizedDiscount}%`);
        if (tierDiscount) discountComponents.push(`Tier: ${tierDiscount}%`);
        if (bulkDiscount) discountComponents.push(`Bulk: ${bulkDiscount}%`);
        if (seasonalDiscount) discountComponents.push(`Seasonal: ${seasonalDiscount}%`);
        if (firstTimeDiscount && userContext?.isFirstTime) discountComponents.push(`First-time: ${firstTimeDiscount}%`);
        
        state.discount = {
          code: "DYNAMIC",
          percentage: Math.round(bestDiscount),
          isValid: true,
          type: "dynamic",
          description: `Smart pricing: ${discountComponents.join(', ')}`,
          appliedAt: new Date().toISOString()
        };
        
        console.log(`🎯 Dynamic pricing applied: ${Math.round(bestDiscount)}% (${discountComponents.join(', ')})`);
      }
    },
    removeDiscount: (state) => {
      state.discount = {
        code: "",
        percentage: 0,
        isValid: false
      };
    },

    // POS-specific actions
    togglePOSMode: (state) => {
      state.pos.mode = !state.pos.mode;
    },

    setOfflineMode: (state, action) => {
      state.pos.offlineMode = action.payload;
    },

    saveCustomerTab: (state, action) => {
      const { customerId, customerName } = action.payload;
      state.pos.customerTabs[customerId] = {
        name: customerName,
        items: [...state.items],
        total: state.total,
        savedAt: Date.now()
      };
      // Clear current cart after saving tab
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
    },

    loadCustomerTab: (state, action) => {
      const customerId = action.payload;
      const tab = state.pos.customerTabs[customerId];
      if (tab) {
        state.items = [...tab.items];
        state.pos.currentCustomer = customerId;
        cartSlice.caseReducers.calculateTotals(state);
      }
    },

    deleteCustomerTab: (state, action) => {
      const customerId = action.payload;
      delete state.pos.customerTabs[customerId];
    },

    enableSplitBill: (state, action) => {
      const customers = action.payload;
      state.pos.splitBill = {
        enabled: true,
        customers,
        itemAssignments: {}
      };
    },

    assignItemToCustomer: (state, action) => {
      const { itemId, customerId } = action.payload;
      state.pos.splitBill.itemAssignments[itemId] = customerId;
    },

    disableSplitBill: (state) => {
      state.pos.splitBill = {
        enabled: false,
        customers: [],
        itemAssignments: {}
      };
    },

    syncOfflineData: (state) => {
      // Clear pending syncs after successful sync
      state.pos.pendingSyncs = [];
    },

    generateReceipt: (state, action) => {
      const receiptNumber = action.payload || `RCP-${Date.now()}`;
      state.pos.receipt = {
        number: receiptNumber,
        printed: false
      };
    },

calculateTotals: (state) => {
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
      
      // Track abandonment when cart has items
      if (state.items.length > 0 && !state.abandonment.tracked) {
        state.abandonment.tracked = true;
        state.abandonment.timestamp = Date.now();
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  applyDiscount,
  removeDiscount,
  calculateTotals,
  trackAbandonment,
  enableBiometric,
  savePaymentMethod,
  enableOneClick,
  applyDynamicPricing,
  togglePOSMode,
  setOfflineMode,
  saveCustomerTab,
  loadCustomerTab,
  deleteCustomerTab,
  enableSplitBill,
  assignItemToCustomer,
disableSplitBill,
  syncOfflineData,
  generateReceipt,
  setBNPLProvider,
  setCryptoPayment
} = cartSlice.actions;
export default cartSlice.reducer;