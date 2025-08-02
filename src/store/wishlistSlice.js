import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import React from "react";

const initialState = {
items: [],
  priceAlerts: [],
  priceDropHistory: [],
  notificationPreferences: {
    priceDrops: true,
    backInStock: true,
    recommendedDeals: true,
    channels: ['push', 'email']
  }
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
        
        // Keep price drop history for analytics
        const historyEntry = {
          productId,
          productTitle: product.title,
          removedAt: new Date().toISOString(),
          finalPrice: product.currentPrice,
          totalSavings: product.originalPrice - product.currentPrice,
          daysWishlisted: Math.floor((Date.now() - new Date(product.addedAt).getTime()) / (1000 * 60 * 60 * 24))
        };
        state.priceDropHistory.unshift(historyEntry);
        
        toast.success(`${product.title} removed from wishlist`);
      }
    },
    
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.Id === product.Id);
      
      if (existingItem) {
        // Remove from wishlist with enhanced tracking
        state.items = state.items.filter(item => item.Id !== product.Id);
        state.priceAlerts = state.priceAlerts.filter(alert => alert.productId !== product.Id);
        
        // Track removal analytics
        const removalData = {
          productId: product.Id,
          productTitle: product.title,
          removedAt: new Date().toISOString(),
          finalPrice: existingItem.currentPrice,
          totalSavings: existingItem.originalPrice - existingItem.currentPrice,
          daysWishlisted: Math.floor((Date.now() - new Date(existingItem.addedAt).getTime()) / (1000 * 60 * 60 * 24))
        };
        state.priceDropHistory.unshift(removalData);
        
        toast.success(`${product.title} removed from wishlist`);
      } else {
        // Add to wishlist with enhanced tracking
        const wishlistItem = {
          ...product,
          addedAt: new Date().toISOString(),
          originalPrice: product.price,
          currentPrice: product.price,
          priceDropAlert: state.notificationPreferences.priceDrops,
          trackingId: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          priceHistory: [{
            price: product.price,
            timestamp: new Date().toISOString(),
            source: 'initial_add'
          }],
          viewCount: 1,
          lastViewed: new Date().toISOString()
        };
        
        state.items.push(wishlistItem);
        toast.success(`${product.title} added to wishlist! 💝 Price alerts enabled`);
      }
    },
    
updatePrices: (state, action) => {
      const updatedProducts = action.payload;
      
      state.items = state.items.map(item => {
        const updatedProduct = updatedProducts.find(p => p.Id === item.Id);
        
        if (updatedProduct && updatedProduct.price !== item.currentPrice) {
          const priceDrop = updatedProduct.price < item.currentPrice;
          const priceIncrease = updatedProduct.price > item.currentPrice;
          const priceChangePercent = Math.round(((item.currentPrice - updatedProduct.price) / item.currentPrice) * 100);
          
          // Update price history
          const updatedPriceHistory = [
            ...(item.priceHistory || []),
            {
              price: updatedProduct.price,
              timestamp: new Date().toISOString(),
              source: 'price_update',
              change: priceDrop ? 'decrease' : 'increase',
              changePercent: Math.abs(priceChangePercent)
            }
          ].slice(-10); // Keep last 10 price changes
          
          if (priceDrop && state.notificationPreferences.priceDrops && priceChangePercent > 0) {
            // Enhanced price drop alert
            const alertData = {
              Id: Date.now(),
              productId: item.Id,
              productTitle: item.title,
              oldPrice: item.currentPrice,
              newPrice: updatedProduct.price,
              priceDropPercent: priceChangePercent,
              savingsAmount: item.currentPrice - updatedProduct.price,
              createdAt: new Date().toISOString(),
              read: false,
              urgency: priceChangePercent > 25 ? 'high' : priceChangePercent > 15 ? 'medium' : 'low',
              trackingId: item.trackingId,
              channels: state.notificationPreferences.channels
            };
            
            state.priceAlerts.push(alertData);
            
            // Enhanced toast notification
            const urgencyEmoji = alertData.urgency === 'high' ? '🔥' : alertData.urgency === 'medium' ? '⚡' : '💰';
            toast.success(`${urgencyEmoji} Price Drop Alert! ${item.title} is now $${updatedProduct.price} (${priceChangePercent}% off - Save $${alertData.savingsAmount.toFixed(2)})`);
            
            return {
              ...item,
              currentPrice: updatedProduct.price,
              priceDropAlert: true,
              priceHistory: updatedPriceHistory,
              lastPriceUpdate: new Date().toISOString(),
              totalSavings: item.originalPrice - updatedProduct.price,
              bestPriceSeen: Math.min(item.bestPriceSeen || item.originalPrice, updatedProduct.price)
            };
          }
          
          if (priceIncrease && priceChangePercent > 10) {
            // Notify about significant price increases
            toast.info(`📈 Price Alert: ${item.title} price increased to $${updatedProduct.price} (+${Math.abs(priceChangePercent)}%)`);
          }
          
          return {
            ...item,
            currentPrice: updatedProduct.price,
            priceHistory: updatedPriceHistory,
            lastPriceUpdate: new Date().toISOString(),
            totalSavings: item.originalPrice - updatedProduct.price,
            bestPriceSeen: Math.min(item.bestPriceSeen || item.originalPrice, updatedProduct.price)
          };
        }
        return item;
      });
      
      // Clean up old price alerts (keep last 50)
      state.priceAlerts = state.priceAlerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
    },
    
    markAlertAsRead: (state, action) => {
      const alertId = action.payload;
      const alert = state.priceAlerts.find(alert => alert.Id === alertId);
      if (alert) {
        alert.read = true;
        alert.readAt = new Date().toISOString();
      }
    },
    
    updateNotificationPreferences: (state, action) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload
      };
      
      // Update existing wishlist items with new preferences
      state.items = state.items.map(item => ({
        ...item,
        priceDropAlert: state.notificationPreferences.priceDrops
      }));
    },
    
    trackWishlistView: (state, action) => {
      const productId = action.payload;
      const item = state.items.find(item => item.Id === productId);
      if (item) {
        item.viewCount = (item.viewCount || 0) + 1;
item.lastViewed = new Date().toISOString();
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
  updateNotificationPreferences,
  trackWishlistView,
  clearPriceAlerts,
  clearWishlist
} = wishlistSlice.actions;

export default wishlistSlice.reducer;