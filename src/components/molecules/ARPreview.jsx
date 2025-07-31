import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Cart from "@/components/pages/Cart";
import Button from "@/components/atoms/Button";

function ARPreview({ product, isOpen, onClose }) {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [permissionStatus, setPermissionStatus] = useState('prompt')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraView, setCameraView] = useState('user')

  async function checkCameraPermission() {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' })
      setPermissionStatus(permissionStatus.state)
      
      permissionStatus.addEventListener('change', () => {
        setPermissionStatus(permissionStatus.state)
      })
      
      return permissionStatus.state
    } catch (error) {
      console.warn('Permission API not supported:', error)
      return 'prompt'
    }
  }

async function requestCameraAccess() {
    try {
      setIsLoading(true)
      setError(null)
      
      // Enhanced browser compatibility checks
      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API not supported in this browser')
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser')
      }
      
      // Check for secure context (HTTPS required for getUserMedia)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS or localhost')
async function initializeAR() {
    try {
      setLoading(true);
      
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device or browser');
      }
      
      // Properly bind the getUserMedia method to maintain context
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      const stream = await getUserMedia({
        video: {
          facingMode: cameraView,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStream(stream);
        setError(null);
      }
          console.warn('Video play failed:', playError)
          // Continue anyway, stream is still valid
        }
      }
      
      setStream(stream)
      setPermissionStatus('granted')
    } catch (error) {
      console.error('Camera access error:', error)
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to access camera'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked due to security restrictions.'
      } else if (error.message && error.message.includes('Illegal invocation')) {
        errorMessage = 'Browser security error. Please try refreshing the page and allow camera access.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setPermissionStatus('denied')
    } finally {
      setIsLoading(false)
    }
  }

  async function initializeAR() {
    if (!isOpen) return
    
    const permission = await checkCameraPermission()
    
    if (permission === 'granted') {
      await requestCameraAccess()
    } else if (permission === 'prompt') {
      // Don't auto-request, let user trigger it
      setError('Camera permission required for AR preview')
    } else {
      setError('Camera access denied. Please enable camera permissions.')
    }
  }

  function cleanup() {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  async function retryPermission() {
    setError(null)
    await requestCameraAccess()
  }

  function handleDrag(event, info) {
    const newRotation = {
      x: rotation.x + info.delta.y * 0.5,
      y: rotation.y + info.delta.x * 0.5
    }
    setRotation(newRotation)
  }

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen)
  }

  async function toggleCameraView() {
    const newView = cameraView === 'user' ? 'environment' : 'user'
    setCameraView(newView)
    
    if (stream) {
      cleanup()
      setTimeout(() => {
        requestCameraAccess()
      }, 100)
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        initializeAR()
      }, 300)
      
      return () => {
        clearTimeout(timer)
        cleanup()
      }
    } else {
      cleanup()
    }
  }, [isOpen, cameraView])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
          isFullscreen ? 'p-0' : ''
        }`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          drag
          dragConstraints={containerRef}
          onDrag={handleDrag}
          className={`relative bg-surface rounded-2xl overflow-hidden shadow-2xl ${
            isFullscreen ? 'w-full h-full rounded-none' : 'max-w-2xl w-full aspect-video'
          }`}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">{product?.name} - AR Preview</h3>
              <p className="text-white/70 text-sm">Drag to rotate • Try it on virtually</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleCameraView}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
                disabled={isLoading || !stream}
              >
                <ApperIcon name="RefreshCw" size={20} />
              </Button>
              <Button
                onClick={toggleFullscreen}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
              >
                <ApperIcon name={isFullscreen ? "Minimize2" : "Maximize2"} size={20} />
              </Button>
              <Button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
              >
                <ApperIcon name="X" size={20} />
              </Button>
            </div>
          </div>

          {/* Camera View */}
          <div className="relative w-full h-full bg-gray-900">
            {stream && !error ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {isLoading ? (
                  <div className="text-center text-white">
                    <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                    <p>Initializing camera...</p>
                  </div>
                ) : error ? (
                  <div className="text-center text-white max-w-md mx-auto px-4">
                    <ApperIcon name="AlertCircle" size={48} className="mx-auto mb-4 text-red-400" />
                    <h4 className="text-lg font-semibold mb-2">Camera Access Required</h4>
                    <p className="text-white/70 mb-4">{error}</p>
                    {permissionStatus !== 'denied' && (
                      <Button
                        onClick={retryPermission}
                        className="btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Requesting...' : 'Enable Camera'}
                      </Button>
                    )}
                    {permissionStatus === 'denied' && (
                      <p className="text-sm text-white/50 mt-2">
                        Please enable camera permissions in your browser settings
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <ApperIcon name="Camera" size={48} className="mx-auto mb-4 text-white/50" />
                    <p>Camera not initialized</p>
                  </div>
                )}
              </div>
            )}

            {/* AR Overlay - Virtual Product */}
            {stream && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                  }}
                  className="relative"
                >
                  <img
                    src={product?.image}
                    alt={product?.name}
                    className="w-48 h-48 object-contain drop-shadow-2xl"
                  />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    ${product?.price}
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          {stream && !error && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4">
              <div className="flex items-center justify-center gap-4">
                <Button className="btn-primary flex items-center gap-2">
                  <ApperIcon name="ShoppingCart" size={16} />
                  Add to Cart
                </Button>
                <Button className="btn-secondary flex items-center gap-2">
                  <ApperIcon name="Heart" size={16} />
                  Save
                </Button>
                <Button className="btn-secondary flex items-center gap-2">
                  <ApperIcon name="Share2" size={16} />
                  Share
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ARPreview