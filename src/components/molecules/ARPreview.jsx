import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';

function ARPreview({ product, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Simulate AR loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDrag = (event, info) => {
    setRotationY(prev => prev + info.delta.x);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
                  <p className="text-gray-600">Loading AR Preview...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Setting up 3D visualization
                  </p>
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
              <Button variant="outline" size="sm">
                <ApperIcon name="Download" className="mr-2" size={16} />
                Try in AR
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