import React from 'react'
import { Camera, RefreshCw, AlertTriangle } from 'lucide-react'
import ApperIcon from '@/components/ApperIcon'

function Error({ message, onRetry, className }) {
  const isCameraError = message?.toLowerCase().includes('camera') || message?.toLowerCase().includes('permission')
  
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
        {isCameraError ? 'Camera Access Required' : 'Oops! Something went wrong'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        {message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {isCameraError ? 'Grant Camera Access' : 'Try Again'}
        </button>
      )}
    </div>
  )
}

export default Error