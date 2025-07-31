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
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason,
        stack: event.reason?.stack
      });
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