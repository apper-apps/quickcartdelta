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
        throw new Error('MediaDevices API not supported in this browser. Please use Chrome, Firefox, or Safari.');
      }
      
      // Store reference to prevent context issues
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia not supported in this browser. Please update your browser.');
      }
      
      // Clean up any existing stream before setting new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      const stream = await mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
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
        errorMessage = 'Camera permission denied. Biometric authentication requires camera access.\n\n🎯 To enable camera access:\n\n• Click "Allow" when prompted\n• Or enable manually:\n  - Chrome: Click 🎥 in address bar → "Allow"\n  - Firefox: Click 🛡️ shield → "Allow Camera"\n  - Safari: Safari > Settings > Websites > Camera → "Allow"\n  - Edge: Click 🎥 in address bar → "Allow"\n\n↻ Refresh this page after enabling camera access.\n\n🔒 Camera access is required for secure biometric authentication.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Biometric authentication requires a camera.\n\n📱 Solutions:\n• Connect a webcam to your computer\n• Use a device with built-in camera\n• Check camera connection and drivers\n\n🔒 Biometric authentication needs camera access for security verification.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported for biometric authentication.\n\n🌐 Compatible browsers:\n• Chrome 53+ (recommended for WebRTC)\n• Firefox 36+ with secure context\n• Safari 11+ with camera permissions\n• Edge 79+ with HTTPS\n\n🔒 HTTPS connection required for security.\n\n💡 Use a modern browser for best biometric features.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera busy. Another application is using the camera.\n\n📱 Solutions:\n• Close other video conferencing apps (Zoom, Teams, etc.)\n• Close other browser tabs using camera\n• Restart your browser completely\n• Check running applications using camera\n\n🔒 Camera must be available for biometric verification.';
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = 'Camera API context error detected.\n\n⚡ Browser compatibility issue. The page will refresh automatically to resolve this.\n\n🔧 This typically happens due to browser security contexts and resolves with refresh.';
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera API unavailable for biometric authentication.\n\n🔧 Requirements:\n• HTTPS connection (secure context)\n• Modern browser with WebRTC support\n• Camera device properly connected\n• Valid SSL certificate\n\n🔒 Secure connection required for biometric features.\n\n↻ Ensure requirements are met and refresh.';
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
        // Check camera permission status first for better user experience
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          if (permission.state === 'denied') {
            setError('Camera access has been permanently denied. Biometric authentication requires camera access. To enable: Chrome: Click the camera icon in the address bar. Firefox: Click the shield icon and select "Allow Camera". Safari: Go to Safari > Settings > Websites > Camera and allow this site.');
            setHasPermission(false);
            return;
          }
        }
        
        // Only request camera if not explicitly denied
        console.log('Initializing biometric authentication - requesting camera access');
        await startCamera();
      } catch (err) {
        console.error('Biometric auth camera error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Biometric authentication requires camera access. Please click "Allow" when prompted, or check your browser settings if you previously denied access. You can also use alternative authentication methods.');
          setHasPermission(false);
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Biometric authentication requires a camera device. Please connect a webcam or use a device with a built-in camera.');
        } else {
          setError(`Camera initialization failed: ${err.message || 'Please check your camera connection and browser settings, then try again'}`);
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
                    {hasPermission === false ? 'Request Camera Access' : 'Try Again'}
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