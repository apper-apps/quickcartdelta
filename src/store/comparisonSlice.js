import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const comparisonSlice = createSlice({
  name: "comparison",
  initialState,
  reducers: {
    addToComparison: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (!existingItem && state.items.length < 4) {
        state.items.push(product);
      }
    },
    removeFromComparison: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.Id !== productId);
    },
    clearComparison: (state) => {
      state.items = [];
    }
  },
});

export const {
  addToComparison,
  removeFromComparison,
  clearComparison
} = comparisonSlice.actions;

export default comparisonSlice.reducer;