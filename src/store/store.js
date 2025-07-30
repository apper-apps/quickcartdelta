import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import searchReducer from "./searchSlice";
import comparisonReducer from "./comparisonSlice";
 
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    search: searchReducer,
    comparison: comparisonReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
});