import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { loyaltyService } from "@/services/api/loyaltyService";
import { redeemReward } from "@/store/loyaltySlice";
import { toast } from "react-toastify";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import ApperIcon from "@/components/ApperIcon";

const Loyalty = () => {
  const dispatch = useDispatch();
  const { points, tier, transactions } = useSelector(state => state.loyalty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [tierProgress, setTierProgress] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rewards, progress] = await Promise.all([
        loyaltyService.getAvailableRewards(),
        loyaltyService.getTierProgress(points)
      ]);
      
      setAvailableRewards(rewards);
      setTierProgress(progress);
    } catch (err) {
      setError("Failed to load loyalty data");
      console.error("Loyalty page error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward) => {
    if (points < reward.pointsCost) {
      toast.error("Insufficient points for this reward");
      return;
    }

    try {
      await loyaltyService.redeemReward(reward.id, points);
      dispatch(redeemReward({ 
        rewardId: reward.id, 
        pointsCost: reward.pointsCost 
      }));
      toast.success(`Successfully redeemed ${reward.name}!`);
    } catch (error) {
      toast.error("Failed to redeem reward. Please try again.");
    }
  };

  const getTierColor = (tierName) => {
    const colors = {
      Bronze: "text-amber-600 bg-amber-100",
      Silver: "text-gray-600 bg-gray-100", 
      Gold: "text-yellow-600 bg-yellow-100",
      Platinum: "text-purple-600 bg-purple-100"
    };
    return colors[tierName] || colors.Bronze;
  };

  const getTierIcon = (tierName) => {
    const icons = {
      Bronze: "Award",
      Silver: "Award",
      Gold: "Crown", 
      Platinum: "Gem"
    };
    return icons[tierName] || "Award";
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadLoyaltyData} />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2"
        >
          Loyalty Rewards
        </motion.h1>
        <p className="text-gray-600">
          Earn points with every purchase and unlock exclusive rewards
        </p>
      </div>

      {/* Points & Tier Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 mb-8"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Points */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-3">
              <ApperIcon name="Star" className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-1">{points}</h3>
            <p className="text-gray-600">Available Points</p>
          </div>

          {/* Current Tier */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${getTierColor(tier)}`}>
              <ApperIcon name={getTierIcon(tier)} className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-1">{tier}</h3>
            <p className="text-gray-600">Current Tier</p>
          </div>

          {/* Progress */}
          {tierProgress?.nextTier && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-3">
                <ApperIcon name="TrendingUp" className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-1">{tierProgress.pointsToNext}</h3>
              <p className="text-gray-600">Points to {tierProgress.nextTier.name}</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {tierProgress?.nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{tier}</span>
              <span>{tierProgress.nextTier.name}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                style={{ width: `${tierProgress.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: "overview", label: "Overview", icon: "BarChart3" },
          { id: "rewards", label: "Available Rewards", icon: "Gift" },
          { id: "history", label: "Points History", icon: "History" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-primary"
            }`}
          >
            <ApperIcon name={tab.icon} className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Earning Opportunities */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ApperIcon name="Plus" className="w-5 h-5 text-success" />
              Ways to Earn Points
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Make a Purchase</span>
                <Badge variant="success">1 pt per $1</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Write a Review</span>
                <Badge variant="success">25 pts</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Refer a Friend</span>
                <Badge variant="success">100 pts</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Birthday Bonus</span>
                <Badge variant="success">50 pts</Badge>
              </div>
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ApperIcon name="Crown" className="w-5 h-5 text-yellow-600" />
              Tier Benefits
            </h3>
            <div className="space-y-3">
              {[
                { tier: "Bronze", multiplier: "1x", shipping: "Standard rates" },
                { tier: "Silver", multiplier: "1.25x", shipping: "Standard rates" },
                { tier: "Gold", multiplier: "1.5x", shipping: "Free shipping" },
                { tier: "Platinum", multiplier: "2x", shipping: "Free express" }
              ].map((benefit) => (
                <div key={benefit.tier} className={`p-3 rounded-lg ${
                  benefit.tier === tier ? "bg-primary/10 border border-primary/20" : "bg-gray-50"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${benefit.tier === tier ? "text-primary" : ""}`}>
                      {benefit.tier}
                    </span>
                    <div className="text-right text-sm">
                      <div>{benefit.multiplier} points</div>
                      <div className="text-gray-600">{benefit.shipping}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "rewards" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {availableRewards.map((reward) => (
            <div key={reward.id} className="card p-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-3">
                  <ApperIcon 
                    name={reward.type === "shipping" ? "Truck" : "DollarSign"} 
                    className="w-6 h-6 text-accent" 
                  />
                </div>
                <h3 className="font-semibold mb-1">{reward.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                <Badge variant="primary" className="text-lg font-bold">
                  {reward.pointsCost} points
                </Badge>
              </div>
              
              <Button
                variant={points >= reward.pointsCost ? "primary" : "secondary"}
                disabled={points < reward.pointsCost}
                onClick={() => handleRedeemReward(reward)}
                className="w-full"
              >
                {points >= reward.pointsCost ? "Redeem" : "Insufficient Points"}
              </Button>
              
              {reward.minOrderValue && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Min. order: ${reward.minOrderValue}
                </p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-6"
        >
          <h3 className="font-semibold mb-4">Points History</h3>
          <div className="space-y-4">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === "earned" ? "bg-success/10" : "bg-accent/10"
                  }`}>
                    <ApperIcon 
                      name={transaction.type === "earned" ? "Plus" : "Minus"} 
                      className={`w-4 h-4 ${
                        transaction.type === "earned" ? "text-success" : "text-accent"
                      }`} 
                    />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.source}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.type === "earned" ? "text-success" : "text-accent"
                }`}>
                  {transaction.type === "earned" ? "+" : ""}{transaction.points} pts
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Loyalty;