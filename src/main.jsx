import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { globalErrorHandler } from "@/utils/errorHandler";

// Global error handling
window.addEventListener('error', globalErrorHandler)
window.addEventListener('unhandledrejection', globalErrorHandler)
// PWA Service Worker Registration using vite-plugin-pwa
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // Import the registerSW function from virtual:pwa-register
      const { registerSW } = await import('virtual:pwa-register');
      
      const updateSW = registerSW({
        onNeedRefresh() {
          // Show a prompt to user for updating the app
          if (confirm('New version available! Refresh to update?')) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log('App ready to work offline');
          // Optional: Show toast notification
          // toast.success('App is ready to work offline!');
        },
        onRegistered(registration) {
          console.log('Service Worker registered successfully:', registration);
        },
        onRegisterError(error) {
          console.warn('Service Worker registration failed:', error);
          globalErrorHandler(error);
        }
      });
      
    } catch (error) {
      // Fallback for when PWA features are not available
      console.warn('PWA features not available:', error);
      
      // Only attempt manual registration if virtual:pwa-register fails
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('Fallback Service Worker registered:', registration);
      } catch (fallbackError) {
        console.warn('Fallback Service Worker registration also failed:', fallbackError);
        // Don't throw error - app should work without PWA features
      }
    }
  });
  
  // Handle service worker messages for manual refresh
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept()
}