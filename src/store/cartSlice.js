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
      isValid: false
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
      const code = action.payload;
      // Mock discount validation - in real app, this would call a service
      const validCodes = {
        'WELCOME25': 25,
        'FREESHIP': 0, // Special case for free shipping
        'FLASH50': 50,
        'WEEKEND30': 30,
        'SAVE20': 20
      };
      
      if (validCodes.hasOwnProperty(code)) {
        state.discount = {
          code: code,
          percentage: validCodes[code],
          isValid: true
        };
      } else {
        state.discount = {
          code: "",
          percentage: 0,
          isValid: false
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
} = cartSlice.actions;

export default cartSlice.reducer;