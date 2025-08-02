import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { globalErrorHandler } from '@/utils/errorHandler'

// Global error handling
window.addEventListener('error', globalErrorHandler)
window.addEventListener('unhandledrejection', globalErrorHandler)

// Service Worker registration with error handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      console.log('SW registered: ', registration)
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              if (window.confirm('New version available! Refresh to update?')) {
                window.location.reload()
              }
            }
          })
        }
      })
    } catch (error) {
      console.warn('SW registration failed:', error.message)
      // Don't throw error, app should work without SW
    }
  })
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