import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "@/store/cartSlice";
import searchReducer from "@/store/searchSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    search: searchReducer,
  },
});