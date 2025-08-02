import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { globalErrorHandler } from "@/utils/errorHandler";

// Global error handling
window.addEventListener('error', globalErrorHandler)
window.addEventListener('unhandledrejection', globalErrorHandler)
// Service Worker registration with error handling
// Service Worker Registration with proper error handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      // Use the generated service worker from vite-plugin-pwa
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
      
      // Provide user feedback for PWA installation issues
      if (error.name === 'SecurityError') {
        console.error('Service Worker blocked by security policy. Ensure HTTPS is enabled.');
      } else if (error.message.includes('MIME type')) {
        console.error('Service Worker file not found or has incorrect MIME type.');
      } else {
        console.error('Service Worker registration error:', error.message);
      }
      
      // Don't block app functionality if SW fails
      globalErrorHandler.handleError(error, 'Service Worker Registration');
    }
  });
  
  // Handle service worker messages
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