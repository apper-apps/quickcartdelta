import toast from "react-hot-toast";
import React from "react";
import Error from "@/components/ui/Error";

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Categorize error based on status code or error type
 */
const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  const status = error.status || error.response?.status;
  
  if (status) {
    if (status === 401) return ERROR_TYPES.AUTHENTICATION;
    if (status === 403) return ERROR_TYPES.AUTHORIZATION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status >= 400 && status < 500) return ERROR_TYPES.CLIENT;
    if (status >= 500) return ERROR_TYPES.SERVER;
  }
  
  if (error.name === 'ValidationError') return ERROR_TYPES.VALIDATION;
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return ERROR_TYPES.NETWORK;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
const getUserFriendlyMessage = (error, type) => {
  const defaultMessages = {
    [ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection.',
    [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
    [ERROR_TYPES.AUTHENTICATION]: 'Please log in to continue.',
    [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_TYPES.SERVER]: 'Server error. Please try again later.',
    [ERROR_TYPES.CLIENT]: 'Invalid request. Please check your input.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
  };

  // Use custom message if provided, otherwise use default
  return error.userMessage || error.message || defaultMessages[type] || defaultMessages[ERROR_TYPES.UNKNOWN];
};

/**
 * Get error severity based on type and context
 */
const getErrorSeverity = (type, error) => {
  const severityMap = {
    [ERROR_TYPES.AUTHENTICATION]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.AUTHORIZATION]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.SERVER]: ERROR_SEVERITY.HIGH,
    [ERROR_TYPES.NETWORK]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.VALIDATION]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.CLIENT]: ERROR_SEVERITY.MEDIUM,
    [ERROR_TYPES.NOT_FOUND]: ERROR_SEVERITY.LOW,
    [ERROR_TYPES.UNKNOWN]: ERROR_SEVERITY.MEDIUM
  };

  return error.severity || severityMap[type] || ERROR_SEVERITY.MEDIUM;
};

/**
 * Log error to console and external services
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };
// Console logging
  if (import.meta.env.MODE === 'development') {
    console.error('Error Handler:', errorInfo);
  }

  // Here you would typically send to an error tracking service
  // Examples: Sentry, LogRocket, Rollbar, etc.
  try {
    // Example: External error service
    // errorTrackingService.captureException(error, errorInfo);
  } catch (trackingError) {
    console.warn('Failed to log error to tracking service:', trackingError);
  }
};

/**
 * Main error handler function
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    logError: shouldLog = true,
    context = {},
    fallbackMessage,
    toastType = 'error'
  } = options;

  if (!error) {
    console.warn('handleError called with no error');
    return;
  }

  const errorType = categorizeError(error);
  const severity = getErrorSeverity(errorType, error);
  const userMessage = fallbackMessage || getUserFriendlyMessage(error, errorType);

  // Log error if enabled
  if (shouldLog) {
    logError(error, { ...context, type: errorType, severity });
  }

  // Show toast notification if enabled
  if (showToast) {
    const toastOptions = {
      duration: severity === ERROR_SEVERITY.CRITICAL ? 6000 : 4000,
      position: 'top-right',
    };

    switch (toastType) {
      case 'error':
        toast.error(userMessage, toastOptions);
        break;
      case 'warning':
        toast.error(userMessage, toastOptions); // react-hot-toast doesn't have warning, use error
        break;
      default:
        toast.error(userMessage, toastOptions);
    }
  }

  return {
    type: errorType,
    severity,
    message: userMessage,
    originalError: error
  };
};

/**
 * Handle async function errors with automatic error handling
 */
export const withErrorHandler = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw so calling code can handle if needed
    }
  };
};

/**
 * React Hook for error handling
 */
export const useErrorHandler = () => {
  const handleAsyncError = (error, options = {}) => {
    handleError(error, options);
  };

  const handleFormError = (error, fieldErrors = {}) => {
    const errorType = categorizeError(error);
    
    if (errorType === ERROR_TYPES.VALIDATION && error.fieldErrors) {
      // Handle field-specific errors
      Object.entries(error.fieldErrors).forEach(([field, message]) => {
        toast.error(`${field}: ${message}`, { duration: 4000 });
      });
    } else {
      handleError(error, { context: { component: 'form', fieldErrors } });
    }
  };

  const handleNetworkError = (error) => {
    handleError(error, {
      context: { component: 'network' },
      fallbackMessage: 'Connection failed. Please check your internet connection and try again.'
    });
  };

  return {
    handleError: handleAsyncError,
    handleFormError,
    handleNetworkError
  };
};

/**
 * Global error boundary error handler
 */
export const handleGlobalError = (error, errorInfo) => {
  const context = {
    component: 'ErrorBoundary',
    errorInfo,
    componentStack: errorInfo?.componentStack
  };

  handleError(error, {
    context,
    fallbackMessage: 'Something went wrong. Please refresh the page.',
    showToast: true,
    logError: true
  });
};

/**
 * Promise rejection handler
 */
export const handleUnhandledRejection = (event) => {
  const error = event.reason || event.detail?.reason;
  
  handleError(error, {
    context: { type: 'unhandledRejection' },
    fallbackMessage: 'An unexpected error occurred.',
    showToast: true,
    logError: true
  });
};

/**
 * Window error handler
 */
export const handleWindowError = (event) => {
  const error = new Error(event.message);
  error.filename = event.filename;
  error.lineno = event.lineno;
  error.colno = event.colno;

  handleError(error, {
    context: { 
      type: 'windowError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    },
    fallbackMessage: 'A JavaScript error occurred.',
    showToast: false, // Don't show toast for all JS errors
    logError: true
  });
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Handle JavaScript errors
  window.addEventListener('error', handleWindowError);
  
  // Cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleWindowError);
  };
};

// Export default error handler
export default handleError;

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
    // Media API specific errors (camera and microphone)
    if (error.message?.includes('getUserMedia') || error.message?.includes('MediaDevices')) {
      return 'Camera/microphone access failed. Please check your permissions and try again.';
    }
    
    // Speech Recognition specific errors
    if (error.message?.includes('Voice recognition') || error.message?.includes('SpeechRecognition')) {
      return 'Voice recognition failed. Please check microphone permissions and try again.';
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
      'TypeError': 'Invalid parameters provided.',
      // Speech Recognition errors
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'no-speech': 'No speech detected. Please try speaking clearly.',
      'audio-capture': 'Audio capture failed. Check microphone connection.',
      'network': 'Network error during voice recognition. Check connection.',
      'service-not-allowed': 'Voice recognition service not allowed.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported': 'Language not supported for voice recognition.'
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
      toast.error('🔄 Camera API context error detected. Auto-refreshing to resolve...\n\n💡 This is a browser compatibility issue that resolves with page refresh.', {
        autoClose: 2500,
        style: { whiteSpace: 'pre-line' }
      });
      // Auto-refresh after shorter delay for better UX
      setTimeout(() => {
        console.log('Auto-refreshing to resolve MediaDevices API context binding issue...');
        window.location.reload();
      }, 2500);
    } else if (error.message?.includes('OverconstrainedError') || error.name === 'OverconstrainedError') {
      toast.error('📹 Camera constraints not supported. Trying with basic settings...\n\n💡 Your camera may not support the requested resolution.', {
        autoClose: 5000,
        style: { whiteSpace: 'pre-line' }
      });
    } else if (error.name === 'SecurityError') {
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        toast.error('🔒 Camera requires secure connection (HTTPS).\n\n💡 Please use https:// URL or localhost for camera access.', {
          autoClose: 7000,
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        toast.error('🔒 Security restrictions prevent camera access.\n\n💡 Check browser security settings and permissions.', {
          autoClose: 6000,
          style: { whiteSpace: 'pre-line' }
        });
      }
    } else {
      const enhancedMessage = this.getErrorMessage(error);
      toast.error(`🎥 ${enhancedMessage}\n\n💡 Try refreshing the page or check camera permissions.`, {
        autoClose: 6000,
        style: { whiteSpace: 'pre-line' }
      });
    }
  }

  // Speech Recognition specific error handler
  static handleSpeechRecognitionError(error, context = 'Speech Recognition') {
    console.error(`Speech Recognition Error in ${context}:`, {
      error: error.message,
      name: error.name,
      originalError: error.originalError,
      speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      isSecure: location.protocol === 'https:',
      userAgent: navigator.userAgent,
      permissions: navigator.permissions ? 'supported' : 'not supported'
    });

// Provide specific guidance for speech recognition errors
    if (error.name === 'not-allowed' || error.message?.includes('not-allowed')) {
      const browserGuidance = this.getMicrophonePermissionGuidance();
      toast.error(
        `🎤 Voice search blocked - microphone permission needed\n\n${browserGuidance}`,
        { 
          autoClose: 10000,
          style: { whiteSpace: 'pre-line' },
          toastId: 'microphone-permission-denied' // Prevent duplicate toasts
        }
      );
      
      // Enhanced logging for permission denial debugging
      console.error('Speech Recognition Permission Denied:', {
        error: error.message,
        name: error.name,
        context,
        permissionsSupported: !!(navigator.permissions),
        speechRecognitionSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        isSecure: location.protocol === 'https:',
        hostname: location.hostname,
        timestamp: new Date().toISOString()
      });
    } else if (error.name === 'no-speech') {
      toast.error('🔇 No speech detected. Please speak clearly and try again.');
    } else if (error.name === 'audio-capture') {
      toast.error('🎤 Microphone capture failed. Please check your microphone connection.');
    } else if (error.name === 'network') {
      toast.error('🌐 Network error during voice recognition. Please check your connection.');
    } else if (error.name === 'service-not-allowed') {
      toast.error('🚫 Voice recognition service not allowed. Please enable the feature in your browser.');
    } else if (error.name === 'language-not-supported') {
      toast.error('🌍 Current language not supported for voice recognition.');
    } else {
      const enhancedMessage = this.getErrorMessage(error);
      toast.error(`🎤 ${enhancedMessage}\n\n💡 Try checking microphone permissions or refresh the page.`, {
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

  // Microphone-specific permission guidance
  static getMicrophonePermissionGuidance() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Chrome Setup:\n🎤 Click microphone icon in address bar → "Always allow"\n⚙️ Or: Settings → Privacy → Site Settings → Microphone\n↻ Refresh page after enabling';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox Setup:\n🛡️ Click shield icon in address bar → "Allow Microphone"\n⚙️ Or: Settings → Privacy → Permissions → Microphone\n↻ Refresh page after enabling';
    } else if (userAgent.includes('safari')) {
      return 'Safari Setup:\n⚙️ Safari → Settings → Websites → Microphone → "Allow"\n🎤 Or click microphone icon in address bar if visible\n↻ Refresh page after enabling';
    } else if (userAgent.includes('edge')) {
      return 'Edge Setup:\n🎤 Click microphone icon in address bar → "Allow"\n⚙️ Or: Settings → Site permissions → Microphone\n↻ Refresh page after enabling';
    } else {
      return 'Browser Setup:\n🎤 Look for microphone icon in address bar → "Allow"\n⚙️ Check browser settings → Privacy → Microphone\n↻ Refresh page after enabling';
    }
  }

// Check if environment supports media access (camera and microphone)
  static checkMediaEnvironment() {
    const issues = [];
    
    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('HTTPS required for camera/microphone access');
    }
    
    // Check browser support
    if (!navigator?.mediaDevices?.getUserMedia) {
      issues.push('MediaDevices API not supported');
    }
    
    // Check Speech Recognition support
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      issues.push('Speech Recognition API not supported');
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
      recommendations.push('Use HTTPS or localhost for camera/microphone access');
    }
    
    if (issues.some(issue => issue.includes('MediaDevices'))) {
      recommendations.push('Update to a modern browser (Chrome 53+, Firefox 36+, Safari 11+)');
    }
    
    if (issues.some(issue => issue.includes('Speech Recognition'))) {
      recommendations.push('Voice search requires Chrome 25+, Firefox 44+, or Safari 14+');
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
           message.includes('voice recognition') ||
           message.includes('speechrecognition') ||
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