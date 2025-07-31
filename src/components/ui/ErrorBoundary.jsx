import React from "react";
import { AlertTriangle, Home as HomeIcon, RefreshCw } from "lucide-react";
import Error from "@/components/ui/Error";
import Home from "@/components/pages/Home";
/**
 * Error Boundary Component - Catches React component errors
 * Provides fallback UI and error reporting
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to show fallback UI
    return {
      hasError: true,
      errorId: Date.now() + Math.random()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };

    console.error('ErrorBoundary caught an error:', errorDetails);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorDetails
    });

    // Report to global error handler
    if (window.__errorHandler) {
      window.__errorHandler.handleError({
        type: 'react-boundary',
        message: error.message,
        error,
        componentStack: errorInfo.componentStack,
        stack: error.stack
      });
    }

    // Report to external error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                <h3 className="font-medium text-red-900 mb-2">Error Details:</h3>
                <p className="text-sm text-red-700 font-mono">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-700 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-600 mt-1 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
>
<HomeIcon className="w-4 h-4" />
Go Home
</button>
            </div>

            {/* Error ID for support */}
            {this.state.errorId && (
              <p className="mt-4 text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;