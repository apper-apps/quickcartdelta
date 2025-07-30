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
    }
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          ...product,
          quantity,
        });
      }
      
      cartSlice.caseReducers.calculateTotals(state);
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
} = cartSlice.actions;

export default cartSlice.reducer;