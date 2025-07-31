import './index.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { errorHandler } from "@/utils/errorHandler";

// Initialize global error handler
errorHandler.setupGlobalHandlers();
errorHandler.setupReactErrorHandler();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);