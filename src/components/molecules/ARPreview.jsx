import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RotateCw, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ARPreview = ({ product, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check AR support on mount
  useEffect(() => {
    checkARSupport();
  }, []);

  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen && isARSupported) {
      initializeCamera();
    }
    
    return () => {
      if (stream) {
        cleanup();
      }
    };
  }, [isOpen, isARSupported]);

  const checkARSupport = async () => {
    try {
      const hasUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      const hasWebRTC = window.RTCPeerConnection;
      setIsARSupported(hasUserMedia && hasWebRTC);
    } catch (err) {
      console.error('AR support check failed:', err);
      setIsARSupported(false);
    }
  };

const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Enhanced browser compatibility checks
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      // Check for secure context (HTTPS required for getUserMedia)
      if (!window.isSecureContext && location.protocol !== 'file:') {
        throw new Error('Camera access requires HTTPS connection');
      }

      // Enhanced getUserMedia binding to prevent "Illegal invocation" error
      let mediaStream;
      
      try {
        // Primary approach: Direct call with proper context
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (bindingError) {
        // Fallback approach: Explicit binding if direct call fails
        if (bindingError.message.includes('Illegal invocation') || bindingError.name === 'TypeError') {
          console.warn('Direct getUserMedia call failed, trying with explicit binding:', bindingError.message);
          
          const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          mediaStream = await getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } else {
          // Re-throw if not a binding issue
          throw bindingError;
        }
      }

      // Validate stream before proceeding
      if (!mediaStream || !mediaStream.getVideoTracks().length) {
        throw new Error('No video track available in media stream');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
    } catch (err) {
console.error('Camera initialization failed:', err);
      setError(
        err.message.includes('Illegal invocation')
          ? 'Camera access failed due to browser compatibility. Please try refreshing the page.'
          : err.name === 'NotAllowedError' 
          ? 'Camera access denied. Please enable camera permissions in your browser settings and click the camera icon in your address bar to allow access, then try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device. Please ensure your camera is connected and working properly.'
          : err.name === 'NotSupportedError'
          ? 'Camera not supported on this device. Please try using a different browser or device.'
          : err.name === 'SecurityError'
          ? 'Camera access blocked due to security restrictions. Please check your browser settings and ensure you\'re using HTTPS.'
          : err.message === 'Camera API not supported in this browser'
          ? 'Camera API not supported in this browser. Please try using Chrome, Firefox, or Safari for the best AR experience.'
          : 'Failed to initialize camera. Please check your camera permissions and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCapturedImage(null);
    setError(null);
  };

  const capturePhoto = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame
      context.drawImage(video, 0, 0);

      // Add product overlay (simulated AR)
      if (product?.image) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = product.image;
        });

        // Draw product overlay in center
        const overlaySize = Math.min(canvas.width, canvas.height) * 0.3;
        const x = (canvas.width - overlaySize) / 2;
        const y = (canvas.height - overlaySize) / 2;
        
        context.drawImage(img, x, y, overlaySize, overlaySize);
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
    } catch (err) {
      console.error('Photo capture failed:', err);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;

    try {
      const link = document.createElement('a');
      link.download = `ar-preview-${product?.name || 'product'}-${Date.now()}.jpg`;
      link.href = capturedImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download image.');
    }
  };

  const retryCamera = () => {
    cleanup();
    if (isARSupported) {
      initializeCamera();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-secondary text-white">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">AR Preview</h2>
                <p className="text-sm opacity-90">
                  {product?.name || 'Product Preview'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative aspect-video bg-gray-900">
            {!isARSupported ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">AR Not Supported</h3>
                <p className="text-gray-300 mb-4">
                  Your device doesn't support AR features. Please try on a different device with camera access.
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={retryCamera}
                  className="btn-primary flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
                <p className="text-lg">Initializing AR Camera...</p>
              </div>
            ) : capturedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="AR Capture"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={downloadImage}
                    className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* AR Overlay Indicators */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner indicators */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60"></div>
                  
                  {/* Center crosshair */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/80 rounded-full"></div>
                  </div>
                  
                  {/* Product info overlay */}
                  {product && (
                    <div className="absolute bottom-6 left-6 bg-black/60 text-white p-4 rounded-lg backdrop-blur-sm">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm opacity-90">${product.price}</p>
                    </div>
                  )}
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ARPreview;