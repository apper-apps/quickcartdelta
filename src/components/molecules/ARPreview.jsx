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
      if (!navigator?.permissions?.query) {
        return 'unknown'; // Permissions API not supported
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
      // First check if we already have permission
      const permissionStatus = await checkPermissionStatus();
      
      if (permissionStatus === 'denied') {
        setError('Camera access was previously denied. Please click the camera icon in your browser\'s address bar to enable access, then refresh the page.');
        setHasPermission(false);
        return false;
      }

      // Try to get media to trigger permission request
      const stream = await mediaService.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      
      if (stream) {
        // Stop the stream immediately - we just wanted to check permission
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. To use AR features, please:\n1. Click "Allow" when prompted for camera access\n2. Or click the camera icon in your browser\'s address bar\n3. Refresh the page after enabling access');
      }
      
      return false;
    }
  }, [checkPermissionStatus]);

  const startCamera = useCallback(async () => {
    // Enhanced browser and API validation
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      return;
    }

    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setError('Camera access requires HTTPS. Please use a secure connection.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check permission status first
      const permissionStatus = await checkPermissionStatus();
      
      if (permissionStatus === 'denied') {
        setError('Camera access was denied. Please enable camera access in your browser settings and refresh the page.');
        setHasPermission(false);
        return;
      }

      // If permission is not granted, show guidance before requesting
      if (permissionStatus === 'prompt') {
        setError(null); // Clear any previous errors
        toast.info('Please allow camera access when prompted to use AR features.');
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let stream;
      try {
        // Try preferred camera settings
        stream = await mediaService.getCameraStream(facingMode);
      } catch (err) {
        console.warn('Preferred camera not available, trying fallback:', err);
        try {
          // Fallback to basic camera
          stream = await mediaService.getCameraStream('environment');
        } catch (fallbackErr) {
          // Last resort - try any available camera
          try {
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
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed:', playError);
        }
        
        setIsActive(true);
        toast.success('Camera started successfully!');
      }
      
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Camera access failed';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. To enable camera access:\n\n• Chrome: Click the camera icon in the address bar\n• Firefox: Click the shield icon and select "Allow"\n• Safari: Go to Safari > Preferences > Websites > Camera\n\nThen refresh the page.';
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device. Please connect a camera and refresh the page.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Please try Chrome, Firefox, or Safari with HTTPS enabled.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = 'Camera API context error. Please refresh the page and try again.';
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera API not available. Please ensure you\'re using HTTPS and a modern browser.';
      }
      
      setError(errorMessage);
      toast.error('Camera access failed. Check the AR preview for detailed instructions.');
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
        toast.success(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`);
        
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
      let errorMessage = 'Failed to switch camera. This may happen if your device only has one camera or if camera permissions were revoked.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied while switching. Please ensure camera access is allowed.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Requested camera not found. Your device may only have one camera.';
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = 'Camera switching context error. Please refresh and try again.';
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera switching not available. Please use a modern browser with HTTPS.';
      }
      
      setError(errorMessage);
      toast.error('Camera switch failed. Check the AR preview for details.');
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, checkPermissionStatus]);

const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [onClose, stopCamera]);

useEffect(() => {
    const checkPermissionAndStart = async () => {
      try {
        // Check permission status first to provide better user guidance
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          if (permission.state === 'denied') {
            setError('Camera access has been permanently denied. To enable AR preview: Chrome: Click the camera icon in the address bar and select "Allow". Firefox: Click the shield icon and enable camera. Safari: Go to Safari > Settings > Websites > Camera and allow this site.');
            setHasPermission(false);
            return;
          }
        }
        
        // Only start camera if component is still mounted
        if (mountedRef.current) {
          await startCamera();
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (mountedRef.current) {
          if (err.name === 'NotAllowedError') {
            setError('Camera access is required for AR preview. Please click "Allow" when prompted, or check your browser settings if you previously denied access.');
            setHasPermission(false);
          } else {
            setError(`Camera access failed: ${err.message || 'Please check your camera connection and try again'}`);
          }
        }
      }
    };

    checkPermissionAndStart();
    
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
                    {hasPermission === false ? 'Request Camera Access' : 'Enable Camera'}
                  </Button>
                  <Button
                    onClick={handleClose}
                    variant="secondary"
                    className="w-full"
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