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
  // Only register service worker in production or when explicitly available
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      // Check if service worker file exists before attempting registration
      const swResponse = await fetch('/sw.js', { method: 'HEAD' });
      
      if (!swResponse.ok) {
        console.info('Service worker not available - running in standard web mode');
        return;
      }
      
      // Verify correct MIME type
      const contentType = swResponse.headers.get('content-type');
      if (!contentType || (!contentType.includes('javascript') && !contentType.includes('text/javascript'))) {
        console.info('Service worker has incorrect MIME type - running in standard web mode');
        return;
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module' // Support modern ES modules
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
        console.info('PWA service worker has incorrect MIME type - running in standard web mode');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.info('Service worker file not found - running in standard web mode');
      } else {
        console.info('PWA features unavailable - running in standard web mode');
      }
    }
  } else if (!('serviceWorker' in navigator)) {
    console.info('ServiceWorker not supported - running in standard web mode');
  } else {
    console.info('Development mode - PWA features disabled');
  }
};

// Register SW after DOM is loaded, only in production
if (import.meta.env.PROD) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }
} else {
  console.info('Development mode - Service Worker registration skipped');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);