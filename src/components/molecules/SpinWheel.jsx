import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, Gift, Star, Truck, X, Zap } from "lucide-react";
import { toast } from "react-toastify";
import { notificationService } from "@/services/api/notificationService";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const SpinWheel = ({ 
  isOpen, 
  onClose, 
  onPrizeWon,
  userId = 'user_123',
  userTier = 'Bronze',
  availableSpins = 1 
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(availableSpins);
  const wheelRef = useRef(null);

  // Enhanced prize configuration with tier-based rewards
  const basePrizes = [
    { 
      id: 1, 
      type: 'discount', 
      value: 10, 
      message: '10% Off Your Next Order!', 
      color: '#FF6B6B',
      icon: 'Percent',
      probability: 0.25
    },
    { 
      id: 2, 
      type: 'points', 
      value: 50, 
      message: '50 Loyalty Points!', 
      color: '#4ECDC4',
      icon: 'Star',
      probability: 0.20
    },
    { 
      id: 3, 
      type: 'free_shipping', 
      value: 0, 
      message: 'Free Shipping!', 
      color: '#45B7D1',
      icon: 'Truck',
      probability: 0.18
    },
    { 
      id: 4, 
      type: 'discount', 
      value: 20, 
      message: '20% Off Your Next Order!', 
      color: '#FFA07A',
      icon: 'DollarSign',
      probability: 0.15
    },
    { 
      id: 5, 
      type: 'points', 
      value: 100, 
      message: '100 Loyalty Points!', 
      color: '#98D8C8',
      icon: 'Zap',
      probability: 0.12
    },
    { 
      id: 6, 
      type: 'discount', 
      value: 5, 
      message: '5% Off Your Next Order!', 
      color: '#F7DC6F',
      icon: 'Gift',
      probability: 0.10
    }
  ];

  // Tier-based prize enhancement
  const getTierEnhancedPrizes = () => {
    const multipliers = {
      'Bronze': 1.0,
      'Silver': 1.2,
      'Gold': 1.5,
      'Platinum': 2.0
    };

    const multiplier = multipliers[userTier] || 1.0;

    return basePrizes.map(prize => ({
      ...prize,
      value: prize.type === 'points' ? Math.floor(prize.value * multiplier) : prize.value,
      message: prize.type === 'points' 
        ? `${Math.floor(prize.value * multiplier)} Loyalty Points!`
        : prize.message,
      enhanced: multiplier > 1.0
    }));
  };

  const prizes = getTierEnhancedPrizes();
  const segmentAngle = 360 / prizes.length;

  useEffect(() => {
    setSpinsLeft(availableSpins);
  }, [availableSpins]);

  const selectPrizeBasedOnProbability = () => {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const prize of prizes) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        return prize;
      }
    }

    // Fallback to last prize if no match (shouldn't happen)
    return prizes[prizes.length - 1];
  };

  const spinWheel = async () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setSpinsLeft(prev => prev - 1);

    // Select prize based on probability
    const wonPrize = selectPrizeBasedOnProbability();
    const prizeIndex = prizes.findIndex(p => p.id === wonPrize.id);
    
    // Calculate target rotation
    const targetSegment = prizeIndex;
    const baseRotation = 1800; // 5 full rotations
    const targetAngle = (360 - (targetSegment * segmentAngle + segmentAngle / 2)) % 360;
    const finalRotation = currentRotation + baseRotation + targetAngle;

    setCurrentRotation(finalRotation);

    // Show result after spin animation
    setTimeout(async () => {
      setSelectedPrize(wonPrize);
      setShowResult(true);
      setIsSpinning(false);

      // Send notification about the prize
      try {
        await notificationService.sendSpinWheelResult(userId, {
          type: wonPrize.type,
          value: wonPrize.value,
          message: wonPrize.message,
          userTier,
          enhanced: wonPrize.enhanced,
          userEmail: 'user@example.com' // In real app, get from user context
        });
      } catch (error) {
        console.error('Failed to send spin result notification:', error);
      }

      // Callback to parent component
      if (onPrizeWon) {
        onPrizeWon({
          ...wonPrize,
          userTier,
          enhanced: wonPrize.enhanced
        });
      }

      // Enhanced toast notification
      const tierEmoji = wonPrize.enhanced ? '👑' : '🎉';
      toast.success(`${tierEmoji} ${wonPrize.message}${wonPrize.enhanced ? ` (${userTier} Bonus!)` : ''}`);

    }, 3000); // Wait for spin animation
  };

  const closeModal = () => {
    if (!isSpinning) {
      setShowResult(false);
      setSelectedPrize(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🎰 Spin to Win!
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {userTier} Member • {spinsLeft} spin{spinsLeft !== 1 ? 's' : ''} left
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSpinning}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Spin Wheel */}
          <div className="p-6">
            <div className="relative w-80 h-80 mx-auto mb-6">
              {/* Wheel */}
              <motion.div
                ref={wheelRef}
                animate={{ rotate: currentRotation }}
                transition={{ 
                  duration: 3, 
                  ease: [0.23, 1, 0.32, 1],
                  type: "tween"
                }}
                className="w-full h-full rounded-full relative overflow-hidden shadow-lg border-4 border-white"
                style={{
                  background: `conic-gradient(${prizes.map((prize, index) => 
                    `${prize.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`
                  ).join(', ')})`
                }}
              >
                {/* Prize segments */}
                {prizes.map((prize, index) => {
                  const angle = index * segmentAngle;
                  const midAngle = angle + segmentAngle / 2;
                  const x = 50 + 30 * Math.cos((midAngle - 90) * Math.PI / 180);
                  const y = 50 + 30 * Math.sin((midAngle - 90) * Math.PI / 180);
                  
                  return (
                    <div
                      key={prize.id}
                      className="absolute text-white font-bold text-xs"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <ApperIcon name={prize.icon} className="w-4 h-4 mb-1" />
                        <span className="text-center leading-tight">
                          {prize.type === 'discount' ? `${prize.value}%` : 
                           prize.type === 'points' ? `${prize.value}pts` : 
                           'FREE'}
                        </span>
                        {prize.enhanced && (
                          <span className="text-xs">👑</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Center circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <motion.div
                      animate={isSpinning ? { rotate: 360 } : {}}
                      transition={{ 
                        duration: 1, 
                        repeat: isSpinning ? Infinity : 0,
                        ease: "linear" 
                      }}
                    >
                      <Gift className="w-8 h-8 text-purple-600" />
                    </motion.div>
</div>
                </div>
              </motion.div>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500 drop-shadow-lg"></div>
              </div>
            </div>

            {/* Spin Button */}
            <div className="text-center mb-4">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || spinsLeft <= 0}
                className={`px-8 py-3 text-lg font-bold rounded-full shadow-lg transition-all duration-200 ${
                  isSpinning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : spinsLeft <= 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 active:scale-95'
                }`}
              >
                {isSpinning ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    Spinning...
                  </div>
                ) : spinsLeft <= 0 ? (
                  'No Spins Left'
                ) : (
                  `🎯 SPIN NOW!`
                )}
              </Button>
            </div>

            {/* Tier Benefits */}
            {userTier !== 'Bronze' && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-600">👑</span>
                  <span className="font-medium text-yellow-800">
                    {userTier} Member Bonus: Enhanced rewards!
                  </span>
                </div>
              </div>
            )}

            {/* Prize Display */}
            <AnimatePresence>
              {showResult && selectedPrize && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-6 rounded-xl text-center shadow-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                  >
                    <h3 className="text-xl font-bold mb-2">🎉 Congratulations!</h3>
                    <p className="text-lg">{selectedPrize.message}</p>
                    {selectedPrize.enhanced && (
                      <p className="text-sm mt-2 bg-white/20 rounded-full px-3 py-1 inline-block">
                        👑 {userTier} Member Bonus Applied!
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* How to earn more spins */}
            {spinsLeft <= 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h4 className="font-medium text-blue-800 mb-2">Earn More Spins!</h4>
                <div className="text-sm text-blue-600 space-y-1">
                  <p>• Make a purchase (+1 spin)</p>
                  <p>• Refer a friend (+2 spins)</p>
                  <p>• Daily login streak (+1 spin)</p>
                  <p>• Tier upgrade bonus (up to +5 spins)</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SpinWheel;