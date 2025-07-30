import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

function ARPreview({ product, isOpen, onClose }) {
const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [showCameraView, setShowCameraView] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

useEffect(() => {
    if (isOpen) {
      initializeAR();
    } else {
      cleanup();
    }
    
    return () => cleanup();
  }, [isOpen]);

  const initializeAR = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check camera permission status
      const permissionStatus = await checkCameraPermission();
      setCameraPermission(permissionStatus);
      
      if (permissionStatus === 'granted') {
        // Simulate AR loading with camera access
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('AR initialization error:', err);
      setError('Failed to initialize AR preview');
      setIsLoading(false);
    }
  };

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        return permission.state;
      }
      return 'prompt';
    } catch (err) {
      console.error('Permission check error:', err);
      return 'prompt';
    }
  };

const requestCameraAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
// Enhanced MediaDevices context preservation - multiple strategies to prevent "Illegal invocation"
      // Strategy 1: Preserve native context with proper async handling
      let stream;
      try {
        // Direct call with preserved context
        const mediaDevices = navigator.mediaDevices;
        stream = await mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (contextError) {
        // Strategy 2: Explicit binding fallback for context preservation
        if (contextError.message?.includes('Illegal invocation') || contextError.name === 'TypeError') {
          try {
            const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
            stream = await getUserMedia({ 
              video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } 
            });
          } catch (bindError) {
            // Strategy 3: Legacy getUserMedia fallback
            if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
              const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
              stream = await new Promise((resolve, reject) => {
                legacyGetUserMedia.call(navigator, {
                  video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                  }
                }, resolve, reject);
              });
            } else {
              throw new Error('getUserMedia not supported in this browser');
            }
          }
        } else {
          throw contextError;
        }
      }
      
      // Check if component is still mounted before updating state
      if (!containerRef.current) return;
      
      setCameraStream(stream);
      setCameraPermission('granted');
      setShowCameraView(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      
      // Check if component is still mounted before updating state
      if (!containerRef.current) return;
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable camera permissions to use AR features.');
        setCameraPermission('denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera to use AR features.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else if (err.name === 'TypeError' && (err.message.includes('Illegal invocation') || err.message.includes('getUserMedia'))) {
        // Enhanced detection for context binding issues
        setError('Camera API context error. Please refresh the page and try again.');
        console.warn('MediaDevices context binding failed - this may be due to browser security restrictions');
      } else if (err.message === 'MediaDevices API not supported in this browser') {
        setError('AR features are not supported in this browser. Please use a modern browser.');
      } else {
        setError('Unable to access camera. Please check your camera settings.');
      }
      
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraView(false);
  };

  const retryPermission = async () => {
    setCameraPermission('prompt');
    await requestCameraAccess();
  };

const handleDrag = (event, info) => {
    const newRotation = rotationY + info.delta.x * 0.5;
    setRotationY(newRotation);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleCameraView = async () => {
    if (showCameraView) {
      cleanup();
    } else {
      await requestCameraAccess();
    }
  };
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 ${
          isFullscreen ? 'p-0' : 'p-4'
        }`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`bg-white rounded-2xl relative ${
            isFullscreen ? 'w-full h-full rounded-none' : 'max-w-4xl w-full max-h-[90vh]'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold">AR Preview</h2>
              <p className="text-gray-600">{product?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                <ApperIcon 
                  name={isFullscreen ? "Minimize2" : "Maximize2"} 
                  size={16} 
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <ApperIcon name="X" size={16} />
              </Button>
            </div>
          </div>

          {/* AR Viewer */}
<div 
            ref={containerRef}
            className={`relative bg-gradient-to-b from-gray-50 to-gray-100 ${
              isFullscreen ? 'h-[calc(100%-80px)]' : 'h-96'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ApperIcon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
                  <p className="text-gray-600">
                    {cameraPermission === 'prompt' ? 'Requesting camera access...' : 'Loading AR Preview...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {cameraPermission === 'prompt' ? 'Please allow camera permissions' : 'Setting up 3D visualization'}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm mx-auto p-6">
                  <ApperIcon name="AlertCircle" className="mx-auto mb-4 text-error" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Camera Access Required</h3>
                  <p className="text-gray-600 mb-4 text-sm">{error}</p>
                  
                  {cameraPermission === 'denied' ? (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p className="font-medium mb-1">Enable Camera Permissions:</p>
                        <p>1. Click the camera icon in your browser's address bar</p>
                        <p>2. Select "Allow" for camera access</p>
                        <p>3. Refresh the page and try again</p>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={retryPermission}
                        className="w-full"
                      >
                        <ApperIcon name="RotateCcw" className="mr-2" size={16} />
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={requestCameraAccess}
                      className="w-full"
                    >
                      <ApperIcon name="Camera" className="mr-2" size={16} />
                      Enable Camera
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setError(null)}
                    className="w-full mt-2"
                  >
                    Continue without Camera
                  </Button>
                </div>
              </div>
            ) : showCameraView && cameraStream ? (
              <div className="h-full relative">
                {/* Camera View */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* AR Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    drag
                    onDrag={handleDrag}
                    className="relative cursor-grab active:cursor-grabbing"
                    style={{
                      transform: `rotateY(${rotationY}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-48 h-48 relative">
                      <img
                        src={product?.image}
                        alt={product?.title}
                        className="w-full h-full object-contain drop-shadow-2xl opacity-90"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-lg animate-pulse"></div>
                    </div>
                  </motion.div>
                </div>

                {/* AR Camera Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <ApperIcon name="Camera" size={16} />
                    Live AR View • Drag to rotate
                  </div>
                </div>

                {/* AR Features */}
                <div className="absolute top-4 right-4 space-y-2">
                  <motion.div
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <ApperIcon name="Video" size={14} />
                    Live Camera
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center relative">
                {/* 3D Product Mockup */}
                <motion.div
                  drag="x"
                  onDrag={handleDrag}
                  className="relative cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `rotateY(${rotationY}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-64 h-64 relative">
                    <img
                      src={product?.image}
                      alt={product?.title}
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                    
                    {/* 3D Rotation Indicator */}
                    <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-lg animate-pulse"></div>
                  </div>
                </motion.div>

                {/* AR Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <ApperIcon name="RotateCw" size={16} />
                    Drag to rotate • Pinch to zoom
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="absolute top-4 right-4 space-y-2">
                  <motion.div
                    className="bg-primary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <ApperIcon name="Eye" size={14} />
                    360° View
                  </motion.div>
                  <motion.div
                    className="bg-secondary text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <ApperIcon name="Smartphone" size={14} />
                    AR Ready
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
<Button 
                variant={showCameraView ? "secondary" : "outline"} 
                size="sm"
                onClick={toggleCameraView}
                disabled={cameraPermission === 'denied'}
              >
                <ApperIcon 
                  name={showCameraView ? "CameraOff" : "Camera"} 
                  className="mr-2" 
                  size={16} 
                />
                {showCameraView ? "Exit AR" : "Try in AR"}
              </Button>
              <Button variant="outline" size="sm">
                <ApperIcon name="Share" className="mr-2" size={16} />
                Share View
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Compatible with iOS Safari & Chrome
              </span>
              <div className="flex items-center gap-1">
                <ApperIcon name="Smartphone" size={16} className="text-primary" />
                <ApperIcon name="Chrome" size={16} className="text-primary" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ARPreview;