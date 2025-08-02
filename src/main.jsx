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
// Progressive Web App Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // Check if virtual:pwa-register module is available
      const viteManifest = await import.meta.glob('/virtual:pwa-register', { eager: false });
      
      if (Object.keys(viteManifest).length === 0) {
        console.info('PWA plugin not configured - skipping service worker registration');
        return;
      }

      // Import the registerSW function from virtual:pwa-register
      const { registerSW } = await import('virtual:pwa-register');
      
      if (typeof registerSW !== 'function') {
        console.warn('registerSW function not available from virtual:pwa-register');
        return;
      }

      const updateSW = registerSW({
        onNeedRefresh() {
          // Show a prompt to user for updating the app
          const shouldUpdate = confirm('New version available! Refresh to update?');
          if (shouldUpdate) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log('App ready to work offline');
          // Could show a toast notification here
        },
        onRegistered(registration) {
          console.log('Service Worker registered successfully:', registration);
        },
        onRegisterError(error) {
          console.warn('Service Worker registration failed:', error);
          
          // Handle specific error types
          if (error.message?.includes('MIME type')) {
            console.error('Service Worker script has incorrect MIME type - check server configuration');
          } else if (error.message?.includes('SecurityError')) {
            console.error('Service Worker registration blocked by security policy');
          }
          
          // Report to error handler but don't break the app
          try {
            globalErrorHandler(error);
          } catch (reportError) {
            console.warn('Error reporting failed:', reportError);
          }
        }
      });
      
    } catch (error) {
      // Graceful fallback - app works without PWA features
      console.warn('PWA features not available:', error);
      
      // Don't report import errors as they're expected in some environments
      if (!error.message?.includes('virtual:pwa-register')) {
        try {
          globalErrorHandler(error);
        } catch (reportError) {
          console.warn('Error reporting failed:', reportError);
        }
      }
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