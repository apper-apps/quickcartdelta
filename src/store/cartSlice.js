import { createSlice } from "@reduxjs/toolkit";

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
      type: "manual" // manual, dynamic, loyalty, referral
    },
    abandonment: {
      tracked: false,
      timestamp: null,
      reminderSent: false
    },
    checkout: {
      biometricEnabled: false,
      savedPayments: [],
      oneClickEnabled: false
    },
    dynamicPricing: {
      personalizedDiscount: 0,
      tierDiscount: 0,
      bulkDiscount: 0
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
      state.isOpen = false;
    },
applyDiscount: (state, action) => {
      const { code, type = "manual" } = action.payload;
      // Mock discount validation - in real app, this would call a service
      const validCodes = {
        'WELCOME25': 25,
        'FREESHIP': 0, // Special case for free shipping
        'FLASH50': 50,
        'WEEKEND30': 30,
        'SAVE20': 20,
        'VIP15': 15,
        'ABANDONER10': 10,
        'REFERRAL20': 20
      };
      
      if (validCodes.hasOwnProperty(code)) {
        state.discount = {
          code: code,
          percentage: validCodes[code],
          isValid: true,
          type
        };
      } else {
        state.discount = {
          code: "",
          percentage: 0,
          isValid: false,
          type: "manual"
        };
      }
    },

    trackAbandonment: (state) => {
      if (state.items.length > 0 && !state.abandonment.tracked) {
        state.abandonment = {
          tracked: true,
          timestamp: Date.now(),
          reminderSent: false
        };
      }
    },

    enableBiometric: (state, action) => {
      state.checkout.biometricEnabled = action.payload;
    },

    savePaymentMethod: (state, action) => {
      const payment = action.payload;
      const exists = state.checkout.savedPayments.find(p => p.id === payment.id);
      if (!exists) {
        state.checkout.savedPayments.push(payment);
      }
    },

    enableOneClick: (state, action) => {
      state.checkout.oneClickEnabled = action.payload;
    },

    applyDynamicPricing: (state, action) => {
      const { personalizedDiscount, tierDiscount, bulkDiscount } = action.payload;
      state.dynamicPricing = {
        personalizedDiscount: personalizedDiscount || 0,
        tierDiscount: tierDiscount || 0,
        bulkDiscount: bulkDiscount || 0
      };
      
      // Auto-apply best dynamic discount
      const totalDynamicDiscount = Math.max(personalizedDiscount, tierDiscount, bulkDiscount);
      if (totalDynamicDiscount > state.discount.percentage) {
        state.discount = {
          code: "DYNAMIC",
          percentage: totalDynamicDiscount,
          isValid: true,
          type: "dynamic"
        };
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
} = cartSlice.actions;

export default cartSlice.reducer;