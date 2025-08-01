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
  
// Media-specific error handler with enhanced permission guidance
  static handleMediaError(error, context = 'Media Operation') {
    console.error(`Media Error in ${context}:`, {
      error: error.message,
      name: error.name,
      originalError: error.originalError,
      mediaDevicesSupported: !!(navigator.mediaDevices?.getUserMedia),
      isSecure: location.protocol === 'https:',
      userAgent: navigator.userAgent,
      permissions: navigator.permissions ? 'supported' : 'not supported'
    });
    
    // Provide specific guidance for media errors with detailed instructions
    if (error.name === 'NotAllowedError') {
      const browserGuidance = this.getBrowserSpecificGuidance();
      toast.error(
        `Camera/microphone permission denied. ${browserGuidance}`,
        { 
          autoClose: 8000,
          style: { whiteSpace: 'pre-line' }
        }
      );
    } else if (error.name === 'NotFoundError') {
      toast.error('No camera/microphone found. Please connect a device and refresh the page.');
    } else if (error.name === 'NotReadableError') {
      toast.error('Camera/microphone is being used by another application. Please close other apps and try again.');
    } else if (error.name === 'SecurityError') {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        toast.error('Camera access requires HTTPS. Please use a secure connection.');
      } else {
        toast.error('Security restrictions prevent camera access. Please check your browser settings.');
      }
} else if (error.message?.includes('Illegal invocation')) {
      toast.error('Browser API error detected. Refreshing automatically to resolve...', {
        autoClose: 2000,
        style: { whiteSpace: 'pre-line' }
      });
      // Auto-refresh after shorter delay for better UX
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (error.message?.includes('OverconstrainedError')) {
      toast.error('Camera constraints not supported. Trying with basic settings...', {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    } else {
      toast.error(this.getErrorMessage(error), {
        autoClose: 6000,
        style: { whiteSpace: 'pre-line' }
      });
    }
  }

// Enhanced browser-specific permission guidance with visual cues
  static getBrowserSpecificGuidance() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Chrome Setup:\n🎥 Click camera icon in address bar → "Always allow"\n⚙️ Or: Settings → Privacy → Site Settings → Camera\n↻ Refresh page after enabling';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox Setup:\n🛡️ Click shield icon in address bar → "Allow Camera"\n⚙️ Or: Settings → Privacy → Permissions → Camera\n↻ Refresh page after enabling';
    } else if (userAgent.includes('safari')) {
      return 'Safari Setup:\n⚙️ Safari → Settings → Websites → Camera → "Allow"\n🎥 Or click camera icon in address bar if visible\n↻ Refresh page after enabling';
    } else if (userAgent.includes('edge')) {
      return 'Edge Setup:\n🎥 Click camera icon in address bar → "Allow"\n⚙️ Or: Settings → Site permissions → Camera\n↻ Refresh page after enabling';
    } else {
      return 'Browser Setup:\n🎥 Look for camera icon in address bar → "Allow"\n⚙️ Check browser settings → Privacy → Camera\n↻ Refresh page after enabling';
    }
  }

  // Check if environment supports media access
  static checkMediaEnvironment() {
    const issues = [];
    
    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('HTTPS required for camera access');
    }
    
    // Check browser support
    if (!navigator?.mediaDevices?.getUserMedia) {
      issues.push('MediaDevices API not supported');
    }
    
    // Check permissions API support
    if (!navigator?.permissions?.query) {
      issues.push('Permissions API not supported (will use fallback)');
    }
    
    return {
      isSupported: issues.length === 0,
      issues,
      recommendations: this.getEnvironmentRecommendations(issues)
    };
  }

  static getEnvironmentRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(issue => issue.includes('HTTPS'))) {
      recommendations.push('Use HTTPS or localhost for camera access');
    }
    
    if (issues.some(issue => issue.includes('MediaDevices'))) {
      recommendations.push('Update to a modern browser (Chrome 53+, Firefox 36+, Safari 11+)');
    }
    
    return recommendations;
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
    const stack = error.stack?.toLowerCase() || '';
    return message.includes('getusermedia') || 
           message.includes('mediadevices') || 
           message.includes('illegal invocation') ||
           (message.includes('illegal invocation') && stack.includes('getusermedia'));
  }

  /**
   * Handle MediaDevices specific errors
   */
handleMediaDeviceError(error) {
    console.warn('MediaDevices API Error detected:', error.message);
    
    // Enhanced error detection for "Illegal invocation" specifically
    if (error.message?.includes('Illegal invocation')) {
      console.error('MediaDevices API context binding error details:', {
        message: error.message,
        stack: error.stack,
        cause: 'Browser API context binding issue - common in some browsers',
        solution: 'Auto-refresh resolves context binding problems',
        preventive: 'Use proper context binding: navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)'
      });
      
      if (typeof window !== 'undefined') {
        // Use toast if available, otherwise console
        if (window.toast) {
          window.toast.error('🔄 Camera API context error. Auto-refreshing to resolve...', {
            autoClose: 1500
          });
        } else {
          console.log('Auto-refreshing to resolve camera API context issue...');
        }
        
        // Auto-refresh after shorter delay for better UX
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
      return;
    }
    
    // Handle getUserMedia specific errors with detailed logging
    if (error.message?.includes('getUserMedia')) {
      console.error('getUserMedia API Error Details:', {
        error: error.message,
        name: error.name,
        originalError: error.originalError,
        mediaDevicesSupported: !!(navigator.mediaDevices),
        getUserMediaSupported: !!(navigator.mediaDevices?.getUserMedia),
        isSecure: location.protocol === 'https:',
        hostname: location.hostname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
    
    // Enhanced user messaging with actionable guidance
    if (typeof window !== 'undefined' && window.toast) {
      if (error.name === 'NotAllowedError') {
        window.toast.error('🎥 Camera permission needed. Check browser address bar for permission prompt.', {
          autoClose: 8000
        });
      } else if (error.name === 'NotFoundError') {
        window.toast.error('📱 No camera found. Please connect a camera device.', {
          autoClose: 6000
        });
      } else if (error.name === 'NotReadableError') {
        window.toast.error('📹 Camera busy. Close other apps using camera and try again.', {
          autoClose: 6000
        });
      } else {
        window.toast.error('🔧 Camera access issue. Please check permissions and refresh.', {
          autoClose: 5000
        });
      }
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