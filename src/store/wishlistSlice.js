import { createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

const initialState = {
  items: [],
  priceAlerts: []
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (!existingItem) {
        state.items.push({
          ...product,
          addedAt: new Date().toISOString(),
          originalPrice: product.price,
          currentPrice: product.price,
          priceDropAlert: false
        });
        toast.success(`${product.title} added to wishlist! 💝`);
      } else {
        toast.info(`${product.title} is already in your wishlist`);
      }
    },
    
    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      const product = state.items.find(item => item.Id === productId);
      
      if (product) {
        state.items = state.items.filter(item => item.Id !== productId);
        state.priceAlerts = state.priceAlerts.filter(alert => alert.productId !== productId);
        toast.success(`${product.title} removed from wishlist`);
      }
    },
    
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (existingItem) {
        // Remove from wishlist
        state.items = state.items.filter(item => item.Id !== product.Id);
        state.priceAlerts = state.priceAlerts.filter(alert => alert.productId !== product.Id);
        toast.success(`${product.title} removed from wishlist`);
      } else {
        // Add to wishlist
        state.items.push({
          ...product,
          addedAt: new Date().toISOString(),
          originalPrice: product.price,
          currentPrice: product.price,
          priceDropAlert: false
        });
        toast.success(`${product.title} added to wishlist! 💝`);
      }
    },
    
    updatePrices: (state, action) => {
      const updatedProducts = action.payload;
      
      state.items = state.items.map(item => {
        const updatedProduct = updatedProducts.find(p => p.Id === item.Id);
        if (updatedProduct && updatedProduct.price !== item.currentPrice) {
          const priceDrop = updatedProduct.price < item.currentPrice;
          
          if (priceDrop && !item.priceDropAlert) {
            // Create price drop alert
            const priceDropPercent = Math.round(((item.currentPrice - updatedProduct.price) / item.currentPrice) * 100);
            
            state.priceAlerts.push({
              Id: Date.now(),
              productId: item.Id,
              productTitle: item.title,
              oldPrice: item.currentPrice,
              newPrice: updatedProduct.price,
              priceDropPercent,
              createdAt: new Date().toISOString(),
              read: false
            });
            
            toast.success(`🎉 Price drop alert! ${item.title} is now $${updatedProduct.price} (${priceDropPercent}% off)`);
            
            return {
              ...item,
              currentPrice: updatedProduct.price,
              priceDropAlert: true
            };
          }
          
          return {
            ...item,
            currentPrice: updatedProduct.price
          };
        }
        return item;
      });
    },
    
    markAlertAsRead: (state, action) => {
      const alertId = action.payload;
      const alert = state.priceAlerts.find(alert => alert.Id === alertId);
      if (alert) {
        alert.read = true;
      }
    },
    
    clearPriceAlerts: (state) => {
      state.priceAlerts = [];
      state.items = state.items.map(item => ({
        ...item,
        priceDropAlert: false
      }));
    },
    
    clearWishlist: (state) => {
      state.items = [];
      state.priceAlerts = [];
      toast.success('Wishlist cleared');
    }
  }
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  updatePrices,
  markAlertAsRead,
  clearPriceAlerts,
  clearWishlist
} = wishlistSlice.actions;

export default wishlistSlice.reducer;