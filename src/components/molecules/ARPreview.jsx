import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Download, Maximize2, RotateCcw, X } from "lucide-react";
import { toast } from "react-toastify";
import mediaService from "@/services/api/mediaService";
import Error from "@/components/ui/Error";
import Button from "@/components/atoms/Button";

const ARPreview = ({ product, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
const [isActive, setIsActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  
useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
    }
    if (mediaService) {
      mediaService.cleanup();
    }
  };

// Check camera permission status before requesting access
const checkPermissionStatus = useCallback(async () => {
    try {
      // Enhanced permission checking with better fallback
      if (!navigator?.permissions?.query) {
        // Fallback: attempt quick camera access test
        try {
          const testStream = await mediaService.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
          });
          if (testStream) {
            testStream.getTracks().forEach(track => track.stop());
            return 'granted';
          }
        } catch (testError) {
          if (testError.name === 'NotAllowedError') return 'denied';
          if (testError.name === 'NotFoundError') return 'unavailable';
          return 'prompt';
        }
        return 'unknown';
      }
      
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.warn('Permission status check failed:', error);
      return 'unknown';
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      // Proactive permission status check
const permissionStatus = await checkPermissionStatus();
      console.log('Camera permission status:', permissionStatus);
      
      if (permissionStatus === 'denied') {
        const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
          'Please enable camera access in your browser settings.';
        setError(`🚫 Camera access was denied.\n\n${browserGuidance}\n\n✅ After enabling permissions, please refresh this page.`);
        setHasPermission(false);
setShowPermissionHelp(true);
        toast.error('🎥 Camera access needed for AR preview. Please allow camera permission in your browser.');
        return false;
      }

      if (permissionStatus === 'unavailable') {
        setError('📷 No camera found on this device. AR features require a camera.\n\n📱 Solutions:\n• Connect a webcam to your computer\n• Use a device with a built-in camera\n• Check camera drivers and connections');
        setHasPermission(false);
        toast.error('Camera device not found. AR requires camera access.');
        return false;
      }

      // Show user-friendly prompt before requesting permission
      if (permissionStatus === 'prompt') {
        setShowPermissionHelp(true);
        toast.info('AR Preview needs camera access. Please click "Allow" when prompted.');
      }

      // Request camera permission with enhanced error handling
      const stream = await mediaService.requestCameraPermission();
      
      if (stream) {
        // Stop the stream immediately - we just wanted to check permission
        if (typeof stream === 'object' && stream.getTracks) {
          stream.getTracks().forEach(track => track.stop());
        }
        setHasPermission(true);
        setShowPermissionHelp(false);
        toast.success('🎉 Camera permission granted! AR features are now available.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Camera permission request failed:', error);
      setHasPermission(false);
      
      let errorMessage = 'Camera access failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
          'Enable camera access in browser settings';
        errorMessage = `🚫 Camera permission denied.\n\n${browserGuidance}\n\n✅ Refresh the page after enabling camera access.`;
        setShowPermissionHelp(true);
        toast.error('Camera permission denied. Follow the step-by-step guide shown below.');
      } else if (error.name === 'NotFoundError') {
        errorMessage = '📷 No camera detected. AR features require a camera device.\n\n📱 Solutions:\n• Connect a webcam\n• Use device with built-in camera\n• Check camera connections';
        toast.error('Camera not found. Connect a camera device to use AR features.');
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '🌐 Camera not supported in this browser or environment.\n\n🔧 Requirements:\n• Modern browser (Chrome 53+, Firefox 36+, Safari 11+)\n• HTTPS connection\n• Camera device available';
        toast.error('Browser or environment not supported for camera access.');
      } else if (error.message?.includes('HTTPS')) {
        errorMessage = '🔒 Camera access requires HTTPS connection.\n\n📋 Please use:\n• https:// URL for this site\n• localhost for development\n• Valid SSL certificate';
        toast.error('HTTPS required for camera access. Use secure connection.');
      }
      
      setError(errorMessage);
      return false;
    }
  }, [checkPermissionStatus]);

const startCamera = useCallback(async () => {
    // Enhanced browser and API validation
    if (!navigator?.mediaDevices?.getUserMedia) {
      const errorMsg = 'Camera not supported in this browser.\n\n🌐 Please use:\n• Chrome 53+ (recommended)\n• Firefox 36+\n• Safari 11+\n• Edge 79+\n\nwith HTTPS connection.';
      setError(errorMsg);
      toast.error('Browser not supported for camera access.');
      return;
    }

    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      const errorMsg = 'Camera access requires HTTPS connection.\n\n🔒 Please use:\n• https:// URL\n• localhost for development\n• Valid SSL certificate';
      setError(errorMsg);
      toast.error('HTTPS required for camera access.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Proactive permission checking with better user experience
const permissionStatus = await checkPermissionStatus();
      console.log('Starting camera - permission status:', permissionStatus);
      
      if (permissionStatus === 'denied') {
        const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
          'Please enable camera access in your browser settings.';
        setError(`🚫 Camera access was denied.\n\n${browserGuidance}\n\n✅ Refresh this page after enabling camera access.`);
        setHasPermission(false);
        setShowPermissionHelp(true);
toast.error('🎥 Camera permission required. Please click "Allow" when your browser asks for camera access.');
        return;
      }

      if (permissionStatus === 'unavailable') {
        setError('📷 No camera found on this device. AR features require a camera.\n\n📱 Solutions:\n• Connect a webcam to your computer\n• Use a device with a built-in camera\n• Check camera drivers and connections');
        setHasPermission(false);
        toast.error('Camera device not found.');
        return;
      }

      // Show helpful message for permission prompts
      if (permissionStatus === 'prompt') {
        setError(null); // Clear any previous errors
        setShowPermissionHelp(true);
        toast.info('Please allow camera access when prompted to use AR features.');
      }
      
      // Clean up any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let stream;
      try {
        // Try preferred camera settings with enhanced error handling
        stream = await mediaService.getCameraStream(facingMode);
      } catch (err) {
        console.warn('Preferred camera not available, trying fallback:', err);
        try {
          // Fallback to basic camera
          stream = await mediaService.getCameraStream('environment');
        } catch (fallbackErr) {
          console.warn('Environment camera failed, trying any available camera:', fallbackErr);
          try {
            // Last resort - try any available camera
            stream = await mediaService.getUserMedia({ video: true, audio: false });
          } catch (finalErr) {
            throw finalErr;
          }
        }
      }
      
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setShowPermissionHelp(false);
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed:', playError);
          // Continue - video might play on user interaction
        }
        
        setIsActive(true);
        toast.success('🎉 Camera started successfully! AR features are now active.');
      } else {
        throw new Error('Failed to initialize camera stream');
      }
      
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Camera access failed. Please try again.';
      
      if (err.name === 'NotAllowedError') {
        const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
          'Click "Allow" when prompted or enable in browser settings';
        errorMessage = `🚫 Camera permission denied.\n\n${browserGuidance}\n\n✅ Refresh this page after enabling camera access.`;
        setHasPermission(false);
setShowPermissionHelp(true);
        toast.error('🎥 Camera access required for AR preview. Please enable camera permissions in your browser.');
      } else if (err.name === 'NotFoundError') {
        errorMessage = '📷 No camera found on this device. AR features require a camera.\n\n📱 Solutions:\n• Connect a webcam to your computer\n• Use a device with a built-in camera\n• Check camera connections and drivers\n\n🔄 Refresh after connecting a camera.';
        toast.error('Camera not found. Connect a camera device to use AR features.');
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '🌐 Camera not supported in this browser or environment.\n\n🔧 Requirements:\n• Chrome 53+, Firefox 36+, Safari 11+, or Edge 79+\n• HTTPS connection for security\n• Camera device properly connected\n\n🔄 Use supported browser with HTTPS.';
        toast.error('Browser or environment not supported for camera access.');
      } else if (err.name === 'NotReadableError') {
        errorMessage = '📱 Camera is busy - another application is using it.\n\n💡 Solutions:\n• Close video conferencing apps (Zoom, Teams, etc.)\n• Close other browser tabs using camera\n• Restart your browser completely\n• Check running applications using camera\n\n🔄 Try again after closing conflicting apps.';
        toast.error('Camera busy. Close other apps using the camera and try again.');
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = '⚡ Camera API context error detected.\n\n🔧 Browser compatibility issue. The page will refresh automatically to resolve this.\n\n💭 This typically happens due to browser security contexts.';
        toast.error('Camera API error. Refreshing page automatically...');
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = '🔧 Camera API not available in this environment.\n\n📋 Requirements:\n• HTTPS connection (secure context)\n• Modern browser with WebRTC support\n• Camera device properly connected\n• Valid SSL certificate\n\n🔄 Ensure requirements are met and refresh.';
        toast.error('Camera API unavailable. Check HTTPS and browser compatibility.');
      } else if (err.message?.includes('HTTPS')) {
        errorMessage = '🔒 Camera access requires HTTPS connection.\n\n📋 Please use:\n• https:// URL for this site\n• localhost for development\n• Valid SSL certificate';
        toast.error('HTTPS required for camera access.');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, checkPermissionStatus]);

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
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }
      
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add product overlay (simple demonstration)
      ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
      ctx.fillRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
      ctx.strokeStyle = '#4A90E2';
      ctx.lineWidth = 3;
      ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
      
      // Add product name
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = '#4A90E2';
      ctx.textAlign = 'center';
      ctx.fillText(product?.name || 'AR Preview', canvas.width / 2, canvas.height * 0.9);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ar-preview-${product?.name?.replace(/\s+/g, '-') || 'product'}-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      console.error('Photo capture error:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
}, [product, isCapturing]);

const switchCamera = useCallback(async () => {
    if (!streamRef.current) {
      toast.warning('Please start the camera first before switching.');
      return;
    }
    
    try {
      if (!navigator?.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Check permission status before switching
      const permissionStatus = await checkPermissionStatus();
      if (permissionStatus === 'denied') {
        setError('Camera permission denied. Please enable camera access in your browser settings.');
        return;
      }
      
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop());
      
      // Toggle facing mode
      const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
      
      try {
        // Use mediaService for consistent error handling
        const stream = await mediaService.getCameraStream(newFacingMode);
        
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn('Video play failed:', playError);
          }
        }
// Update facing mode state
        setFacingMode(newFacingMode);
        toast.success(`🎉 Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`);
        
      } catch (switchError) {
        // Try to restart with original camera if switching fails
        console.warn('Camera switch failed, attempting to restore original camera:', switchError);
        try {
          const fallbackStream = await mediaService.getCameraStream(facingMode);
          if (fallbackStream && videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            streamRef.current = fallbackStream;
            await videoRef.current.play();
          }
          throw new Error('Camera switch failed, but original camera restored');
        } catch (restoreError) {
          throw switchError; // Throw original error if restore also fails
        }
      }
      
} catch (err) {
      console.error('Camera switch error:', err);
      let errorMessage = 'Failed to switch camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '🚫 Camera permission denied while switching.\n\n🔧 Solution:\nEnsure camera access is still allowed in your browser settings. Permission may have been revoked.\n\n🔄 Refresh the page if needed.';
        setShowPermissionHelp(true);
        toast.error('Camera permission revoked. Please re-enable camera access.');
      } else if (err.name === 'NotFoundError') {
        errorMessage = '📷 Camera not found for switching.\n\n📱 Common causes:\n• Device has only one camera\n• Requested camera is not available\n• Camera was disconnected\n\n💡 This is normal on devices with single cameras.';
        toast.error('Camera switch unavailable. Your device may have only one camera.');
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = '⚡ Camera switching context error.\n\n🔧 Browser API issue detected. The page will refresh automatically to resolve this.';
        toast.error('Camera API error. Refreshing automatically...');
        setTimeout(() => window.location.reload(), 2000);
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = '🔧 Camera switching not supported in this environment.\n\n📋 Requirements:\n• Modern browser with camera support\n• HTTPS connection\n• Proper camera permissions\n\n🔄 Check requirements and refresh.';
        toast.error('Camera switching unavailable. Check browser compatibility.');
      } else {
        errorMessage = '📱 Camera switch failed.\n\n💡 Possible causes:\n• Device has only one camera (normal)\n• Camera hardware issue\n• Browser compatibility issue\n\n🔄 Try refreshing if the issue persists.';
        toast.error('Camera switch failed. Try refreshing the page.');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, checkPermissionStatus]);

const handleClose = useCallback(() => {
    stopCamera();
    setShowPermissionHelp(false);
    onClose?.();
  }, [onClose, stopCamera]);

useEffect(() => {
    const checkPermissionAndStart = async () => {
      try {
        // Enhanced permission status checking with better user experience
        console.log('AR Preview initializing - checking camera permissions...');
        
        const permissionStatus = await checkPermissionStatus();
        console.log('Initial permission status:', permissionStatus);
        
        if (permissionStatus === 'denied') {
const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
            'Please enable camera access in your browser settings.';
          setError(`🚫 Camera access has been denied.\n\n${browserGuidance}\n\n✅ Refresh this page after enabling camera access.`);
          setHasPermission(false);
setShowPermissionHelp(true);
          toast.error('🎥 Please allow camera access to use AR preview. Check your browser\'s address bar for the camera icon.');
          return;
        }

        if (permissionStatus === 'unavailable') {
          setError('📷 No camera found on this device. AR preview requires a camera.\n\n📱 Solutions:\n• Connect a webcam to your computer\n• Use a device with a built-in camera\n• Check camera drivers and connections');
          setHasPermission(false);
          toast.error('Camera device not found for AR preview.');
          return;
        }
        
        // Only start camera if component is still mounted and we have potential access
        if (mountedRef.current && permissionStatus !== 'denied') {
          console.log('Starting camera for AR preview...');
          await startCamera();
        }
      } catch (err) {
        console.error('AR Preview camera initialization error:', err);
        if (mountedRef.current) {
          if (err.name === 'NotAllowedError') {
            const browserGuidance = mediaService?.getBrowserSpecificPermissionGuidance() || 
              'Please enable camera access in your browser settings.';
            setError(`🚫 Camera access denied.\n\n${browserGuidance}\n\n✅ Refresh this page after enabling camera access.`);
            setHasPermission(false);
setShowPermissionHelp(true);
            toast.error('🎥 AR preview requires camera access. Please allow camera permission and refresh the page.');
          } else if (err.name === 'NotFoundError') {
            setError('📷 No camera found. AR preview requires a camera device.\n\n📱 Solutions:\n• Connect a webcam\n• Use device with built-in camera\n• Check camera connections');
            setHasPermission(false);
            toast.error('Camera not found for AR preview.');
          } else {
            setError(`⚠️ Camera initialization failed: ${err.message || 'Please check your camera connection and browser settings, then try again'}`);
            toast.error('Camera initialization failed. Check your camera and try again.');
          }
        }
      }
    };

    checkPermissionAndStart();
    
    return () => {
      stopCamera();
      setShowPermissionHelp(false);
    };
  }, [startCamera, stopCamera, checkPermissionStatus]);
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
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
<div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4 safe-top">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-bold">{product?.name || 'AR Preview'}</h2>
              <p className="text-sm opacity-80">Augmented Reality Preview</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="absolute top-20 left-4 right-4 z-20 bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Camera Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
<div className="flex-1 relative">
          {!isActive && (hasPermission === null || isLoading) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="relative">
                  <Camera className="w-20 h-20 mx-auto mb-4 text-white/60" />
                  <div className="absolute inset-0 animate-ping">
                    <Camera className="w-20 h-20 mx-auto text-primary/40" />
                  </div>
                </div>
                <p className="text-xl font-medium mb-2">Initializing AR Camera</p>
                <p className="text-sm opacity-70">Please allow camera access when prompted</p>
              </div>
            </div>
          ) : isActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* AR Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full relative">
                  {/* Corner markers for AR frame */}
                  <div className="absolute top-1/4 left-1/4 w-8 h-8 border-l-4 border-t-4 border-primary/60"></div>
                  <div className="absolute top-1/4 right-1/4 w-8 h-8 border-r-4 border-t-4 border-primary/60"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-8 h-8 border-l-4 border-b-4 border-primary/60"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-8 h-8 border-r-4 border-b-4 border-primary/60"></div>
                  
                  {/* Product info overlay */}
                  <div className="absolute bottom-32 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-4 rounded-lg">
                    <h3 className="font-bold text-lg">{product?.name}</h3>
                    <p className="text-sm opacity-80">Use AR to visualize this product in your space</p>
                  </div>
                </div>
              </div>
              
              {/* Capture indicator */}
              {isCapturing && (
                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                  <div className="bg-black/80 text-white px-6 py-3 rounded-full">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Capturing...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white max-w-sm mx-4">
                <AlertCircle className="w-20 h-20 mx-auto mb-4 text-red-400" />
                <p className="text-xl font-medium mb-2">Camera Access Required</p>
                <p className="text-sm opacity-80 mb-4">{error}</p>
                <div className="space-y-2">
<Button
                    onClick={startCamera}
                    variant="primary"
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {hasPermission === false ? '🎥 Enable Camera for AR' : 'Start Camera'}
                  </Button>
                  {showPermissionHelp && (
<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        🎥 <span className="ml-2">Enable Camera Access</span>
                      </h4>
                      <div className="text-sm text-blue-800 space-y-3">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <p className="font-medium mb-2">Quick Fix:</p>
                          <p>1. Look for the 🎥 camera icon in your browser's address bar</p>
                          <p>2. Click it and select <strong>"Allow"</strong> or <strong>"Always allow"</strong></p>
                          <p>3. Refresh this page to activate AR preview</p>
                        </div>
                        <div className="text-xs text-blue-600 bg-white p-2 rounded border">
                          <strong>💡 Pro tip:</strong> If you don't see the camera icon, try refreshing the page first, then look for a permission popup.
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleClose}
                    variant="secondary"
                    className="w-full mt-2"
                  >
                    Close AR Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 safe-bottom">
          <div className="flex items-center justify-center gap-8">
<button
              onClick={switchCamera}
              disabled={!isActive || isLoading}
              className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Switch Camera"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={capturePhoto}
              disabled={!isActive || isCapturing}
              className="p-6 bg-white rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title="Capture Photo"
            >
              {isCapturing ? (
                <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download className="w-8 h-8 text-gray-800" />
              )}
            </button>
            
            <button
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                }
              }}
              disabled={!isActive}
              className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fullscreen"
            >
              <Maximize2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ARPreview;