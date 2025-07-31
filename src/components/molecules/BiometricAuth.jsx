import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Shield, User, X } from "lucide-react";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Button from "@/components/atoms/Button";

const BiometricAuth = ({ onAuth, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Enhanced browser compatibility checks
      if (!navigator?.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      // Store reference to prevent context issues
const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia not supported in this browser');
      }
      
// Use .bind() to ensure proper context binding and prevent "Illegal invocation"
      const getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
      const stream = await getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      // Clean up any existing stream before setting new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed:', playError);
          // Continue - this might work on user interaction
        }
      }
      setHasPermission(true);
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Camera access failed';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera API not available. Please use a modern browser with HTTPS.';
      }
      
      setError(errorMessage);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleAuth = useCallback(() => {
    if (!streamRef.current) {
      setError('Camera not available for authentication');
      return;
    }
    
    // Simulate biometric authentication with proper error handling
    setIsAuthenticating(true);
    setError(null);
    
    setTimeout(() => {
      setIsAuthenticating(false);
      // Simulate random success/failure for demo
      const success = Math.random() > 0.3;
      if (success) {
        onAuth?.(true);
      } else {
        setError('Biometric authentication failed. Please try again.');
      }
    }, 2000);
  }, [onAuth]);

  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel?.();
}, [onCancel, stopCamera]);

  useEffect(() => {
    // Enhanced camera initialization with permission handling
    const initializeBiometricAuth = async () => {
      try {
        // Check camera permission status first
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          if (permission.state === 'denied') {
            setError('Camera access denied. Biometric authentication requires camera permissions. Please enable camera access in your browser settings.');
            return;
          }
        }
        
        // Inform user about camera requirement
        console.log('Initializing biometric authentication - camera access required');
        await startCamera();
      } catch (err) {
        console.error('Biometric auth camera error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access to use biometric authentication, or try alternative authentication methods.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Biometric authentication requires a camera device.');
        } else {
          setError(`Camera initialization failed: ${err.message || 'Please check your camera and try again'}`);
        }
      }
    };

    initializeBiometricAuth();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle visibility change to pause/resume camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (hasPermission) {
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
}, [hasPermission, startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Biometric Authentication
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isAuthenticating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Authentication Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '4/3' }}>
            {hasPermission === null || isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-gray-600 font-medium">Initializing camera...</p>
                  <p className="text-xs text-gray-500 mt-1">Please allow camera access when prompted</p>
                </div>
              </div>
            ) : hasPermission ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isAuthenticating && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Authenticating...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-red-600">Camera Access Required</p>
                  <p className="text-xs text-red-500 mt-1">Please enable camera permissions and refresh</p>
                  <Button
                    onClick={startCamera}
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
              disabled={isAuthenticating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuth}
              disabled={!hasPermission || isLoading || isAuthenticating}
              className="flex-1"
            >
              {isAuthenticating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Authenticate
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricAuth;