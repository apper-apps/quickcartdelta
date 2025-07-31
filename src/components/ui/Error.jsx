import React from 'react'
import { Camera, RefreshCw, AlertTriangle, Settings, Shield } from 'lucide-react'
import ApperIcon from '@/components/ApperIcon'

function Error({ message, onRetry, className }) {
  const messageText = message || ''
  const isCameraError = messageText.toLowerCase().includes('camera') || messageText.toLowerCase().includes('permission')
  const isPermissionDenied = messageText.toLowerCase().includes('denied') || messageText.toLowerCase().includes('notallowederror')
  const isDeviceError = messageText.toLowerCase().includes('not found') || messageText.toLowerCase().includes('notfounderror')
  
  const getCameraErrorDetails = () => {
    if (isPermissionDenied) {
      return {
        title: 'Camera Permission Required',
        subtitle: 'Enable camera access to continue',
        instructions: [
          'Click the camera icon in your browser\'s address bar',
          'Select "Allow" for camera access',
          'Or go to browser Settings > Privacy > Camera permissions'
        ]
      }
    }
    
    if (isDeviceError) {
      return {
        title: 'Camera Not Found',
        subtitle: 'No camera device detected',
        instructions: [
          'Check that your camera is connected',
          'Close other apps that might be using the camera',
          'Try refreshing the page'
        ]
      }
    }
    
    return {
      title: 'Camera Access Required',
      subtitle: 'Unable to access camera',
      instructions: [
        'Please allow camera access when prompted',
        'Check your browser settings',
        'Make sure no other apps are using the camera'
      ]
    }
  }

  const errorDetails = isCameraError ? getCameraErrorDetails() : null
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className || ''}`}>
      <div className="w-16 h-16 mb-4 text-gray-400">
        {isCameraError ? (
          <Camera className="w-full h-full" />
        ) : (
          <AlertTriangle className="w-full h-full" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {errorDetails?.title || 'Oops! Something went wrong'}
      </h3>
      
      {errorDetails?.subtitle && (
        <p className="text-sm text-gray-500 mb-4">{errorDetails.subtitle}</p>
      )}
      
      <p className="text-gray-600 mb-4 max-w-md leading-relaxed">
        {messageText || 'An unexpected error occurred. Please try again.'}
      </p>

      {errorDetails?.instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">How to fix this:</span>
          </div>
          <ol className="text-xs text-blue-700 text-left space-y-1">
            {errorDetails.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isCameraError ? 'Try Camera Access Again' : 'Try Again'}
        </button>
      )}

      {isCameraError && isPermissionDenied && (
        <p className="text-xs text-gray-500 mt-4 max-w-md">
          💡 Tip: Look for a camera icon in your browser's address bar or check your browser's privacy settings
        </p>
      )}
    </div>
  )
}

export default Error