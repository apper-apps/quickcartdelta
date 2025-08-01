import React from "react";
import { AlertTriangle, Camera, Monitor, RefreshCw, Settings, Shield } from "lucide-react";
import ApperIcon from "@/components/ApperIcon";

function Error({ message, onRetry, className }) {
  const messageText = message || 'Something went wrong'
  const isCameraError = messageText.toLowerCase().includes('camera') || 
                       messageText.toLowerCase().includes('permission') ||
                       messageText.toLowerCase().includes('notallowederror') ||
                       messageText.toLowerCase().includes('biometric')
  const isPermissionDenied = messageText.toLowerCase().includes('denied') ||
                            messageText.toLowerCase().includes('notallowed') ||
                            messageText.toLowerCase().includes('permanently denied')
  const isDeviceError = messageText.toLowerCase().includes('device') ||
                       messageText.toLowerCase().includes('notfound') ||
                       messageText.toLowerCase().includes('no camera')
  const isBrowserError = messageText.toLowerCase().includes('browser') ||
                        messageText.toLowerCase().includes('https') ||
                        messageText.toLowerCase().includes('not supported')

  const getCameraErrorDetails = () => {
    if (isPermissionDenied) {
      return {
        icon: Shield,
        title: 'Camera Permission Required',
        description: 'Camera access is needed for AR preview and biometric authentication',
suggestions: [
          '🎥 Click "Allow" when your browser asks for camera permission',
          '🌐 Chrome: Click the camera icon in the address bar → Select "Always allow"',
          '🦊 Firefox: Click the shield icon → Select "Allow Camera"',
          '🍎 Safari: Safari Menu → Settings → Websites → Camera → Allow this site',
          '🔷 Edge: Click the camera icon in the address bar → Select "Allow"',
          '🔄 Refresh the page after enabling permissions'
        ],
        additionalInfo: 'If you previously denied access, look for the camera icon in your browser\'s address bar to change permissions.'
      }
    } else if (isDeviceError) {
      return {
        icon: Camera,
        title: 'Camera Not Available',
        description: 'No camera device was found or it\'s not accessible',
        suggestions: [
          'Make sure your camera is connected and working',
          'Close other applications that might be using the camera',
          'Check if your camera works in other applications',
          'Try unplugging and reconnecting external cameras',
          'Restart your browser and try again'
        ],
        additionalInfo: 'Some devices may have camera access disabled by system administrators.'
      }
    } else if (isBrowserError) {
      return {
        icon: Monitor,
        title: 'Browser Compatibility Issue',
        description: 'Your browser doesn\'t support camera access or requires HTTPS',
        suggestions: [
          'Use a modern browser like Chrome, Firefox, Safari, or Edge',
          'Make sure you\'re accessing the site via HTTPS (secure connection)',
          'Update your browser to the latest version',
          'Enable camera support in your browser settings',
          'Try accessing the site in an incognito/private window'
        ],
        additionalInfo: 'Camera access requires a secure (HTTPS) connection for security reasons.'
      }
    } else {
      return {
        icon: Camera,
        title: 'Camera Access Error',
        description: 'Unable to initialize camera functionality',
        suggestions: [
          'Refresh the page and try again',
          'Check that your camera isn\'t being used by another application',
          'Ensure your browser supports camera access',
          'Try restarting your browser',
          'Check your system\'s camera privacy settings'
        ],
        additionalInfo: 'If the problem persists, try using a different browser or device.'
      }
    }
  }

  const errorDetails = isCameraError ? getCameraErrorDetails() : null
  const ErrorIcon = errorDetails?.icon || AlertTriangle

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-sm border border-gray-200 ${className || ''}`}>
      {/* App Icon */}
      <div className="mb-4">
        <ApperIcon size={48} />
      </div>
      
      {/* Error Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <ErrorIcon className="w-8 h-8 text-red-600" />
        </div>
      </div>
      
      {/* Error Content */}
      <div className="space-y-6 max-w-lg">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {errorDetails?.title || 'Error'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {errorDetails?.description || messageText}
          </p>
        </div>
        
        {/* Camera-specific suggestions */}
        {errorDetails?.suggestions && (
          <div className="text-left bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              How to fix this:
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
            
            {errorDetails.additionalInfo && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  💡 {errorDetails.additionalInfo}
</p>
              </div>
            )}
          </div>
        )}
        
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
        
<p className="text-xs text-gray-500 mt-4 max-w-md">
          🎥 Look for the camera icon in your browser's address bar to enable permissions, or try refreshing the page first
        </p>
      </div>
    </div>
  )
}

export default Error