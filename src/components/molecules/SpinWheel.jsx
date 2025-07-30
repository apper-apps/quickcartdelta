import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { loyaltyService } from '@/services/api/loyaltyService';

function SpinWheel({ isOpen, onClose, userId, tier = "Bronze" }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  const prizes = [
    { label: "50 Points", color: "#4CAF50", angle: 0 },
    { label: "10% Off", color: "#FF6B6B", angle: 45 },
    { label: "100 Points", color: "#4A90E2", angle: 90 },
    { label: "15% Off", color: "#FF9800", angle: 135 },
    { label: "Free Ship", color: "#7B68EE", angle: 180 },
    { label: "25% Off", color: "#F44336", angle: 225 },
    { label: "50 Points", color: "#4CAF50", angle: 270 },
    { label: "5% Off", color: "#9C27B0", angle: 315 }
  ];

  const handleSpin = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);
    
    try {
      const prize = await loyaltyService.spinWheel(userId, tier);
      
      // Calculate random spins (3-5 full rotations) plus final position
      const spins = 3 + Math.random() * 2;
      const finalAngle = Math.random() * 360;
      const totalRotation = rotation + (spins * 360) + finalAngle;
      
      setRotation(totalRotation);
      
      // Show result after animation
      setTimeout(() => {
        setResult(prize);
        setIsSpinning(false);
        toast.success(prize.message);
      }, 3000);
      
    } catch (error) {
      console.error('Spin wheel error:', error);
      setIsSpinning(false);
      toast.error('Something went wrong. Please try again!');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md mx-4 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ApperIcon name="X" size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-2">
              🎯 Spin to Win!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase! Spin the wheel for exclusive rewards.
            </p>

            {/* Wheel Container */}
            <div className="relative mx-auto w-64 h-64 mb-6">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-800"></div>
              </div>

              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-gray-300 overflow-hidden relative"
                animate={{ rotate: rotation }}
                transition={{
                  duration: isSpinning ? 3 : 0,
                  ease: "easeOut"
                }}
              >
                {prizes.map((prize, index) => (
                  <div
                    key={index}
                    className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: `conic-gradient(from ${prize.angle}deg, ${prize.color} 0deg, ${prize.color} 45deg, transparent 45deg)`,
                      clipPath: `polygon(50% 50%, 100% 0%, 100% 100%)`
                    }}
                  >
                    <span className="transform rotate-45">{prize.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {result && !isSpinning && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-lg"
                >
                  <h3 className="text-lg font-bold text-green-800">
                    🎉 Congratulations!
                  </h3>
                  <p className="text-green-700">{result.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className="w-full"
              variant="primary"
            >
              {isSpinning ? (
                <>
                  <ApperIcon name="Loader2" className="animate-spin mr-2" size={16} />
                  Spinning...
                </>
              ) : (
                <>
                  <ApperIcon name="Play" className="mr-2" size={16} />
                  Spin the Wheel!
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              * One spin per purchase. Terms and conditions apply.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SpinWheel;