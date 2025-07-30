import { createSlice } from "@reduxjs/toolkit";

const browsingSlice = createSlice({
  name: "browsing",
  initialState: {
    history: [], // Array of product IDs viewed by user
    maxHistory: 50, // Maximum items to keep in history
  },
  reducers: {
    addToHistory: (state, action) => {
      const productId = action.payload;
      
      // Remove if already exists to avoid duplicates
      state.history = state.history.filter(id => id !== productId);
      
      // Add to beginning of array (most recent first)
      state.history.unshift(productId);
      
      // Limit history size
      if (state.history.length > state.maxHistory) {
        state.history = state.history.slice(0, state.maxHistory);
      }
    },
    clearHistory: (state) => {
      state.history = [];
    },
    removeFromHistory: (state, action) => {
      const productId = action.payload;
      state.history = state.history.filter(id => id !== productId);
    },
  },
});

export const {
  addToHistory,
  clearHistory,
  removeFromHistory,
} = browsingSlice.actions;

export default browsingSlice.reducer;