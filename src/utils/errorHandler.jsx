import { toast } from "react-toastify";
import React from "react";

// Global error handler for the application
export class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
// Don't show error toasts in development for certain errors
    if (import.meta.env.MODE === 'development' && 
        (error.message?.includes('Network Error') || 
         error.message?.includes('fetch'))) {
      return;
    }
    
    // Enhanced error mapping for media-related errors
    const errorMessage = this.getErrorMessage(error);
    toast.error(errorMessage);
  }
  
  static getErrorMessage(error) {
    // Media API specific errors
    if (error.message?.includes('getUserMedia') || error.message?.includes('MediaDevices')) {
      return 'Camera/microphone access failed. Please check your permissions and try again.';
    }
    
    if (error.message?.includes('Illegal invocation')) {
      return 'Browser API error. Please refresh the page and try again.';
    }
    
    // Standard error mapping
    const errorMap = {
      'NetworkError': 'Network connection error. Please check your internet connection.',
      'NotAllowedError': 'Permission denied. Please allow the requested permissions in your browser.',
      'NotFoundError': 'Requested resource not found.',
      'NotReadableError': 'Device is already in use by another application.',
      'OverconstrainedError': 'Device constraints cannot be satisfied.',
      'SecurityError': 'Security error. Please ensure you\'re using HTTPS.',
      'AbortError': 'Operation was aborted. Please try again.',
      'NotSupportedError': 'This feature is not supported in your browser.',
      'TypeError': 'Invalid parameters provided.'
    };
    
    return errorMap[error.name] || error.message || 'An unexpected error occurred.';
  }
  
  static async handleAsync(asyncFn, context = '') {
    try {
      return await asyncFn();
    } catch (error) {
      // Enhanced error context for media errors
      if (error.message?.includes('getUserMedia') || error.message?.includes('MediaDevices')) {
        console.error('Media API Error Details:', {
          error: error.message,
          name: error.name,
          context,
          userAgent: navigator.userAgent,
          isSecure: location.protocol === 'https:',
          mediaDevicesSupported: !!(navigator.mediaDevices?.getUserMedia)
        });
      }
      
      this.handle(error, context);
      throw error;
    }
  }
  
  static handlePromise(promise, context = '') {
    return promise.catch(error => {
      this.handle(error, context);
      throw error;
    });
  }
  
  // Media-specific error handler
  static handleMediaError(error, context = 'Media Operation') {
    console.error(`Media Error in ${context}:`, {
      error: error.message,
      name: error.name,
      originalError: error.originalError,
      mediaDevicesSupported: !!(navigator.mediaDevices?.getUserMedia),
      isSecure: location.protocol === 'https:'
    });
    
    // Provide specific guidance for media errors
    if (error.name === 'NotAllowedError') {
      toast.error('Camera/microphone permission denied. Please click the camera icon in your browser\'s address bar to allow access.');
    } else if (error.name === 'NotFoundError') {
      toast.error('No camera/microphone found. Please connect a device and refresh the page.');
    } else if (error.name === 'NotReadableError') {
      toast.error('Camera/microphone is being used by another application. Please close other apps and try again.');
    } else if (error.message?.includes('Illegal invocation')) {
      toast.error('Browser compatibility issue. Please refresh the page or try a different browser.');
    } else {
      toast.error(this.getErrorMessage(error));
    }
  }
}

// React Error Boundary helper
export const withErrorBoundary = (Component) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('React Error Boundary caught error:', error, errorInfo);
      ErrorHandler.handle(error, 'React Error Boundary');
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600">Please refresh the page or try again later.</p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Global Error Handler Class
class GlobalErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught JavaScript errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError({
          type: 'javascript',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          stack: event.error?.stack
        });
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const errorInfo = {
          type: 'promise',
          message: this.extractErrorMessage(event.reason),
          reason: event.reason,
          stack: event.reason?.stack
        };
        
        console.error('Unhandled Promise Rejection:', JSON.stringify(errorInfo, null, 2));
        this.handleError(errorInfo);
      });

      // Handle React errors (will be caught by Error Boundary)
      this.setupReactErrorHandler();
    }
  }

  /**
   * Handle specific error types
   */
  handleError(errorInfo) {
    const error = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...errorInfo
    };

    // Log error
    console.error('Global Error Handler:', error);

    // Store error (with limit)
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Handle specific error types
    if (this.isMediaDeviceError(error)) {
      this.handleMediaDeviceError(error);
    } else if (this.isReactError(error)) {
this.handleReactError(error);
    }

// Emit custom event for error tracking
    if (typeof window !== 'undefined' && window.CustomEvent) {
      window.dispatchEvent(new window.CustomEvent('app:error', { detail: error }));
    }
  }
  /**
   * Check if error is related to MediaDevices API
   */
  isMediaDeviceError(error) {
    const message = error.message?.toLowerCase() || '';
    return message.includes('getusermedia') || 
           message.includes('mediad devices') || 
           message.includes('illegal invocation');
  }

  /**
   * Handle MediaDevices specific errors
   */
  handleMediaDeviceError(error) {
console.warn('MediaDevices API Error detected:', error.message);
    
    // Enhanced error detection for "Illegal invocation" specifically
    if (error.message?.includes('Illegal invocation') && error.message?.includes('getUserMedia')) {
      console.error('getUserMedia context binding error - this indicates improper MediaDevices API usage');
      
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Camera initialization error. Please refresh the page to resolve the issue.');
      }
      return;
    }
    
    // Show user-friendly message if needed
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.error('Camera/microphone access issue detected. Please refresh the page.');
    }
  }
  /**
   * Check if error is React-related
   */
  isReactError(error) {
    const stack = error.stack?.toLowerCase() || '';
    return stack.includes('react') || stack.includes('jsx');
  }

  /**
   * Handle React-specific errors
   */
  handleReactError(error) {
    console.warn('React Error detected:', error.message);
}

  /**
   * Extract error message from various error types
   */
  extractErrorMessage(error) {
    if (!error) return 'Unknown error';
    
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.reason) return this.extractErrorMessage(error.reason);
    
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  /**
   * Setup React error handler
   */
  setupReactErrorHandler() {
    // This will be used by Error Boundary
    window.__errorHandler = this;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  /**
   * Clear error history
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.slice(-5)
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instances
export const errorHandler = new ErrorHandler();
export const globalErrorHandler = new GlobalErrorHandler();

// Export as default for backwards compatibility
export default globalErrorHandler;