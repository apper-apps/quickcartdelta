import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { globalErrorHandler } from "@/utils/errorHandler";

// Initialize global error handlers
globalErrorHandler.setupGlobalHandlers();

// PWA Service Worker Registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      
      const updateSW = registerSW({
        onNeedRefresh() {
          if (window.confirm('New version available! Click OK to refresh.')) {
            updateSW(true);
          }
        },
        onOfflineReady() {
          console.log('App ready to work offline');
        },
        onRegisterError(error) {
          console.warn('Service Worker registration error:', error);
        }
      });
      
      console.log('PWA Service Worker registered successfully');
    } catch (error) {
      // Graceful fallback for PWA registration failures
      console.info('PWA features not available - running in standard web mode');
      if (error.name === 'SecurityError') {
        console.info('HTTPS required for PWA features');
      } else {
        console.warn('Service Worker registration error:', error.message);
      }
    }
  } else if (!('serviceWorker' in navigator)) {
    console.info('Service Worker not supported by this browser');
  } else {
    console.info('Development mode - PWA features disabled');
  }
};

// Register service worker only in production
if (import.meta.env.PROD) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);