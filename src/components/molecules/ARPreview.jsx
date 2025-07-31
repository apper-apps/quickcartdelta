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
    initCamera();
    
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

  const initCamera = async () => {
try {
      setIsLoading(true);
      setError(null);
      
      // Check permissions first
      const permissions = await mediaService.requestPermissions();
      if (!permissions.camera) {
        throw new Error(permissions.cameraError || 'Camera permission denied');
      }
      
      if (!mountedRef.current) return;
      setHasPermission(true);
      
      const cameraStream = await mediaService.getCameraStream();
      if (!mountedRef.current) {
        // Component unmounted, cleanup stream
        cameraStream?.getTracks().forEach(track => track.stop());
        return;
      }
      
      setStream(cameraStream);
      
      if (videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        
        // Wait for video to be ready
        videoRef.current.addEventListener('loadedmetadata', () => {
          if (mountedRef.current && videoRef.current) {
            videoRef.current.play().catch(playError => {
              console.warn('Video play failed:', playError);
            });
          }
        });
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      if (mountedRef.current) {
        setError(error.message);
        toast.error('Failed to access camera: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
const startCamera = useCallback(async () => {
    // Enhanced browser and API validation
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia not properly available');
      }
      
      // Enhanced bound function with additional safety checks
      const getUserMediaBound = function(constraints) {
        // Double-check context before calling
        if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
          throw new Error('MediaDevices context lost');
        }
        return mediaDevices.getUserMedia.call(mediaDevices, constraints);
      };
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      let stream;
      try {
        stream = await getUserMediaBound({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err) {
        console.warn('Preferred camera not available, trying fallback:', err);
        try {
          stream = await getUserMediaBound({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (fallbackErr) {
          throw fallbackErr;
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
      }
      
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Camera access failed';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Please try a different browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (err.message?.includes('Illegal invocation')) {
        errorMessage = 'Camera API context error. Please refresh the page and try again.';
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera API not available. Please use a modern browser with HTTPS.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

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
    if (!streamRef.current) return;
    
    try {
      if (!navigator?.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
throw new Error('Camera switching not supported in this browser');
      }
      
      // Enhanced context binding to prevent "Illegal invocation"
      const getUserMediaBound = function(constraints) {
        // Double-check context before calling
        if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
          throw new Error('MediaDevices context lost during camera switch');
        }
        return mediaDevices.getUserMedia.call(mediaDevices, constraints);
      };
      
      setIsLoading(true);
      setError(null);
      
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop());
      
      // Toggle facing mode
      const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
      
      // Request opposite camera
      const stream = await getUserMediaBound({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
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
      
    } catch (err) {
      console.error('Camera switch error:', err);
      let errorMessage = 'Failed to switch camera. Please try again.';
      
      if (err.message?.includes('Illegal invocation')) {
        errorMessage = 'Camera switching context error. Please refresh and try again.';
      } else if (err.message?.includes('MediaDevices') || err.message?.includes('getUserMedia')) {
        errorMessage = 'Camera switching not available. Please use a modern browser with HTTPS.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [onClose, stopCamera]);

  useEffect(() => {
    const checkPermissionAndStart = async () => {
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          if (permission.state === 'denied') {
            setError('Camera access has been denied. Please enable camera permissions in your browser settings to use AR preview.');
            return;
          }
        }
        
        await startCamera();
      } catch (err) {
        console.error('Camera initialization error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera access is required for AR preview. Please click "Allow" when prompted or enable camera permissions in your browser settings.');
        } else {
          setError(`Camera access failed: ${err.message || 'Unknown error'}`);
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
                    Enable Camera
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