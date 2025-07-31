import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { globalErrorHandler } from "@/utils/errorHandler";

// Initialize global error handlers
globalErrorHandler.setupGlobalHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);