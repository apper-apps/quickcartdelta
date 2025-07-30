import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import searchReducer from "./searchSlice";
import comparisonReducer from "./comparisonSlice";
import wishlistReducer from "./wishlistSlice";
export const store = configureStore({
  reducer: {
    cart: cartReducer,
    search: searchReducer,
comparison: comparisonReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
});