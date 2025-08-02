import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import searchReducer from "./searchSlice";
import comparisonReducer from "./comparisonSlice";
import wishlistReducer from "./wishlistSlice";
import browsingReducer from "./browsingSlice";
import loyaltyReducer from "./loyaltySlice";
import localizationReducer from "./localizationSlice";
import discrepancyReducer from "./discrepancySlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    search: searchReducer,
    comparison: comparisonReducer,
    wishlist: wishlistReducer,
    browsing: browsingReducer,
    loyalty: loyaltyReducer,
    localization: localizationReducer,
    discrepancy: discrepancyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'discrepancy/addDiscrepancy',
          'discrepancy/addCustomerVerification',
          'discrepancy/addAgentDeduction'
        ],
      },
    }),
});