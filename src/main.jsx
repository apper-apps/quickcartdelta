import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { globalErrorHandler } from "@/utils/errorHandler";

// Initialize global error handlers
globalErrorHandler.setupGlobalHandlers();

// Service Worker Registration with Error Handling
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('ServiceWorker registration successful:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              if (window.confirm('New version available! Click OK to refresh.')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
    } catch (error) {
      console.warn('ServiceWorker registration failed:', error);
      // Gracefully handle PWA unavailability - app continues to work
      if (error.name === 'SecurityError') {
        console.info('PWA features disabled due to security constraints (HTTPS required)');
      } else if (error.message?.includes('MIME type')) {
        console.info('PWA service worker not available - running in standard web mode');
      }
    }
  } else {
    console.info('ServiceWorker not supported - running in standard web mode');
  }
};

// Register SW after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
  registerServiceWorker();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);