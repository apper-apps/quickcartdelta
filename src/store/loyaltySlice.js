import { createSlice } from "@reduxjs/toolkit";
const loyaltySlice = createSlice({
  name: "loyalty",
initialState: {
    points: 1250,
    tier: "Gold", // Bronze, Silver, Gold, Platinum, Diamond
    tierProgress: {
      currentTierPoints: 1250,
      nextTierPoints: 2500,
      nextTierName: "Platinum"
    },
    transactions: [],
    availableRewards: [
      // Basic Discounts
      {
        id: 1,
        name: "$5 Discount",
        pointsCost: 500,
        description: "Save $5 on your next order",
        type: "discount",
        value: 5,
        category: "discount"
      },
      {
        id: 2,
        name: "$10 Discount", 
        pointsCost: 1000,
        description: "Save $10 on your next order",
        type: "discount",
        value: 10,
        category: "discount"
      },
      {
        id: 3,
        name: "$25 Discount",
        pointsCost: 2500,
        description: "Save $25 on your next order",
        type: "discount",
        value: 25,
        category: "discount"
      },
      
      // Shipping Benefits
      {
        id: 4,
        name: "Free Shipping",
        pointsCost: 300,
        description: "Free shipping on your next order",
        type: "shipping",
        category: "shipping"
      },
      {
        id: 5,
        name: "Express Shipping",
        pointsCost: 500,
        description: "Free express shipping (2-day delivery)",
        type: "shipping",
        category: "shipping"
      },
      
      // Exclusive Experiences
      {
        id: 6,
        name: "VIP Customer Service",
        pointsCost: 800,
        description: "Priority customer service line for 3 months",
        type: "service",
        category: "vip"
      },
      {
        id: 7,
        name: "Early Access",
        pointsCost: 1200,
        description: "Early access to sales and new products for 6 months",
        type: "access",
        category: "vip"
      },
      
      // Tier-Specific Rewards
      {
        id: 8,
        name: "Gold Member Bonus",
        pointsCost: 1500,
        description: "20% off entire order (Gold+ members only)",
        type: "discount",
        value: 20,
        category: "tier",
        requiredTier: "Gold"
      },
      {
        id: 9,
        name: "Platinum Exclusive",
        pointsCost: 3000,
        description: "30% off + free express shipping (Platinum+ only)",
        type: "combo",
        value: 30,
        category: "tier",
        requiredTier: "Platinum"
      },
      
      // Special Items
      {
        id: 10,
        name: "Branded Merchandise",
        pointsCost: 2000,
        description: "Exclusive branded t-shirt and accessories",
        type: "merchandise",
        category: "special"
      },
      {
        id: 11,
        name: "Spin Wheel Tokens",
        pointsCost: 600,
        description: "3 additional spin wheel chances",
        type: "tokens",
        value: 3,
        category: "special"
      }
    ],
    redeemedRewards: [],
    tierBenefits: {
      Bronze: {
        pointsMultiplier: 1.0,
        discountBonus: 0,
        freeShippingThreshold: 50,
        specialOffers: false,
        prioritySupport: false
      },
      Silver: {
        pointsMultiplier: 1.2,
        discountBonus: 5,
        freeShippingThreshold: 35,
        specialOffers: true,
        prioritySupport: false
      },
      Gold: {
        pointsMultiplier: 1.5,
        discountBonus: 10,
        freeShippingThreshold: 25,
        specialOffers: true,
        prioritySupport: true,
        earlyAccess: true
      },
      Platinum: {
        pointsMultiplier: 2.0,
        discountBonus: 15,
        freeShippingThreshold: 0, // Always free
        specialOffers: true,
        prioritySupport: true,
        earlyAccess: true,
        exclusiveDeals: true
      },
      Diamond: {
        pointsMultiplier: 3.0,
        discountBonus: 25,
        freeShippingThreshold: 0,
        specialOffers: true,
        prioritySupport: true,
        earlyAccess: true,
        exclusiveDeals: true,
        personalShopper: true
      }
    },
    referralProgram: {
      active: true,
      referralBonus: 200, // Points for referrer
      refereeBonus: 100, // Points for new customer
      totalReferrals: 0,
      successfulReferrals: 0
    }
  },
  reducers: {
addPoints: (state, action) => {
      const { points, source, orderId, multiplier = 1 } = action.payload;
      
      // Apply tier multiplier
      const tierMultiplier = state.tierBenefits[state.tier]?.pointsMultiplier || 1.0;
      const finalPoints = Math.floor(points * tierMultiplier * multiplier);
      
      state.points += finalPoints;
      state.transactions.unshift({
        id: Date.now(),
        type: "earned",
        points: finalPoints,
        basePoints: points,
        multiplier: tierMultiplier * multiplier,
        source: source || "purchase",
        orderId: orderId,
        tier: state.tier,
        date: new Date().toISOString()
      });
      
      // Enhanced tier progression system
      const totalEarned = state.transactions
        .filter(t => t.type === "earned")
        .reduce((sum, t) => sum + t.basePoints, 0); // Use base points for tier calculation
      
      let newTier = state.tier;
      let tierProgress = {};
      
      if (totalEarned >= 10000) {
        newTier = "Diamond";
        tierProgress = {
          currentTierPoints: totalEarned,
          nextTierPoints: null,
          nextTierName: null,
          maxTier: true
        };
      } else if (totalEarned >= 5000) {
        newTier = "Platinum";
        tierProgress = {
          currentTierPoints: totalEarned,
          nextTierPoints: 10000,
          nextTierName: "Diamond",
          progressPercent: Math.min(100, (totalEarned / 10000) * 100)
        };
      } else if (totalEarned >= 2500) {
        newTier = "Gold";
        tierProgress = {
          currentTierPoints: totalEarned,
          nextTierPoints: 5000,
          nextTierName: "Platinum",
          progressPercent: Math.min(100, (totalEarned / 5000) * 100)
        };
      } else if (totalEarned >= 1000) {
        newTier = "Silver";
        tierProgress = {
          currentTierPoints: totalEarned,
          nextTierPoints: 2500,
          nextTierName: "Gold",
          progressPercent: Math.min(100, (totalEarned / 2500) * 100)
        };
      } else {
        newTier = "Bronze";
        tierProgress = {
          currentTierPoints: totalEarned,
          nextTierPoints: 1000,
          nextTierName: "Silver",
          progressPercent: Math.min(100, (totalEarned / 1000) * 100)
        };
      }
      
      // Check for tier upgrade
      if (newTier !== state.tier) {
        const oldTier = state.tier;
        state.tier = newTier;
        
        // Add tier upgrade bonus
        const upgradeBonus = {
          Silver: 100,
          Gold: 250,
          Platinum: 500,
          Diamond: 1000
        };
        
        if (upgradeBonus[newTier]) {
          state.points += upgradeBonus[newTier];
          state.transactions.unshift({
            id: Date.now() + 1,
            type: "earned",
            points: upgradeBonus[newTier],
            source: `tier_upgrade_${newTier.toLowerCase()}`,
            description: `Tier upgrade bonus: ${oldTier} → ${newTier}`,
            tier: newTier,
            date: new Date().toISOString()
          });
        }
        
        console.log(`🎉 Tier upgraded: ${oldTier} → ${newTier} (+${upgradeBonus[newTier] || 0} bonus points)`);
      }
      
      state.tierProgress = tierProgress;
},
    redeemReward: (state, action) => {
      const { rewardId, pointsCost } = action.payload;
      const reward = state.availableRewards.find(r => r.id === rewardId);
      
      if (!reward) {
        console.error('Reward not found:', rewardId);
        return;
      }
      
      // Check tier requirements
      if (reward.requiredTier && !checkTierEligibility(state.tier, reward.requiredTier)) {
        console.error('Insufficient tier level for reward:', reward.name);
        return;
      }
      
      if (reward && state.points >= pointsCost) {
        state.points -= pointsCost;
        
        // Generate unique redemption code
        const redemptionCode = `${reward.type.toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        
        const redeemedReward = {
          ...reward,
          redeemedAt: new Date().toISOString(),
          redemptionCode,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          used: false,
          tier: state.tier
        };
        
        state.redeemedRewards.unshift(redeemedReward);
        
        state.transactions.unshift({
          id: Date.now(),
          type: "redeemed",
          points: -pointsCost,
          source: reward.name,
          rewardId: reward.id,
          redemptionCode,
          tier: state.tier,
          date: new Date().toISOString()
        });
        
        console.log(`✅ Reward redeemed: ${reward.name} (${pointsCost} points) - Code: ${redemptionCode}`);
      } else {
        console.error('Insufficient points for reward:', reward.name, 'Required:', pointsCost, 'Available:', state.points);
      }
    },
    addReferralBonus: (state, action) => {
      const { isReferrer, friendName } = action.payload;
      const bonus = isReferrer ? state.referralProgram.referralBonus : state.referralProgram.refereeBonus;
      
      state.points += bonus;
      state.transactions.unshift({
        id: Date.now(),
        type: "earned",
        points: bonus,
        source: isReferrer ? "referral_bonus" : "referee_bonus",
        description: isReferrer 
          ? `Referred ${friendName}` 
          : `Welcome bonus (referred by friend)`,
        tier: state.tier,
        date: new Date().toISOString()
      });
      
      if (isReferrer) {
        state.referralProgram.totalReferrals += 1;
        state.referralProgram.successfulReferrals += 1;
      }
      
      console.log(`🎁 Referral bonus: +${bonus} points (${isReferrer ? 'referrer' : 'referee'})`);
    },
    
    markRewardAsUsed: (state, action) => {
      const { redemptionCode } = action.payload;
      const reward = state.redeemedRewards.find(r => r.redemptionCode === redemptionCode);
      
      if (reward) {
        reward.used = true;
        reward.usedAt = new Date().toISOString();
        console.log(`✅ Reward marked as used: ${reward.name}`);
      }
},
    
    useReward: (state, action) => {
      const { rewardId } = action.payload;
      const reward = state.redeemedRewards.find(r => r.id === rewardId && !r.used);
      if (reward) {
        reward.used = true;
        reward.usedAt = new Date().toISOString();
      }
    },
    resetPoints: (state) => {
      state.points = 0;
      state.transactions = [];
      state.redeemedRewards = [];
      state.tier = "Bronze";
    }
}
});

// Helper function to check tier eligibility
const checkTierEligibility = (currentTier, requiredTier) => {
  const tierHierarchy = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Platinum': 4,
    'Diamond': 5
  };
  
  return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
};

export const { addPoints, redeemReward, useReward, resetPoints, addReferralBonus, markRewardAsUsed } = loyaltySlice.actions;
export { checkTierEligibility };
export default loyaltySlice.reducer;