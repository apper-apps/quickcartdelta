/**
 * Global Error Handler - Catches and handles runtime errors
 * Including MediaDevices API binding issues
 */

class ErrorHandler {
  constructor() {
    this.setupGlobalHandlers();
    this.errors = [];
    this.maxErrors = 100;
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught errors
window.addEventListener('error', (event) => {
      const errorInfo = {
        type: 'javascript',
        message: event.message || 'Unknown JavaScript error',
        filename: event.filename || 'unknown',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        error: event.error ? {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack
        } : null,
        stack: event.error?.stack || 'No stack trace available'
      };
      
console.error('Global JavaScript Error:', JSON.stringify(errorInfo, null, 2));
      this.handleError(errorInfo);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const errorInfo = {
        type: 'promise',
        message: this.extractErrorMessage(reason) || 'Unhandled promise rejection',
        error: reason ? {
          name: reason.name || 'UnhandledRejection',
          message: reason.message || String(reason),
          stack: reason.stack
        } : null,
        stack: reason?.stack || 'No stack trace available'
      };
      
console.error('Unhandled Promise Rejection:', JSON.stringify(errorInfo, null, 2));
      this.handleError(errorInfo);
    });

    // Handle React errors (will be caught by Error Boundary)
    this.setupReactErrorHandler();
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
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:error', { detail: error }));
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

// Export singleton instance
export const errorHandler = new ErrorHandler();
export default errorHandler;