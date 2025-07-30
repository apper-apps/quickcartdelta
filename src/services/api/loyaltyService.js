class LoyaltyService {
  constructor() {
    this.pointsRates = {
      purchase: 1, // 1 point per $1 spent
      review: 25,
      referral: 100,
      birthday: 50,
      signup: 100
    };
    
this.tierBenefits = {
      Bronze: { multiplier: 1, freeShipping: false, discount: 0, arAccess: false },
      Silver: { multiplier: 1.25, freeShipping: false, discount: 5, arAccess: true },
      Gold: { multiplier: 1.5, freeShipping: true, discount: 10, arAccess: true },
      Platinum: { multiplier: 2, freeShipping: true, discount: 15, arAccess: true },
      Diamond: { multiplier: 2.5, freeShipping: true, discount: 20, arAccess: true }
    };

    this.cartAbandonmentTracking = new Map();
    this.dynamicDiscounts = {
      cartAbandoner: 10,
      firstTime: 15,
      returning: 5,
      bulkOrder: 8
    };
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async calculateEarnedPoints(orderTotal, tier = "Bronze") {
    await this.delay();
    const basePoints = Math.floor(orderTotal * this.pointsRates.purchase);
    const multiplier = this.tierBenefits[tier]?.multiplier || 1;
    return Math.floor(basePoints * multiplier);
  }

  async calculateDynamicDiscount(userId, orderTotal, tier = "Bronze") {
    await this.delay();
    let discount = 0;
    
    // Tier-based discount
    discount += this.tierBenefits[tier]?.discount || 0;
    
    // Cart abandonment discount
    if (this.cartAbandonmentTracking.has(userId)) {
      const abandonmentData = this.cartAbandonmentTracking.get(userId);
      if (Date.now() - abandonmentData.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
        discount += this.dynamicDiscounts.cartAbandoner;
        this.cartAbandonmentTracking.delete(userId);
      }
    }
    
    // Bulk order discount
    if (orderTotal > 200) {
      discount += this.dynamicDiscounts.bulkOrder;
    }
    
    return Math.min(discount, 25); // Max 25% discount
  }

  trackCartAbandonment(userId, cartItems) {
    this.cartAbandonmentTracking.set(userId, {
      timestamp: Date.now(),
      items: cartItems,
      total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  }

  async generateReferralCode(userId) {
    await this.delay();
    const code = `REF${userId.toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return {
      code,
      url: `${window.location.origin}?ref=${code}`,
      reward: 100, // points for successful referral
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  async spinWheel(userId, tier = "Bronze") {
    await this.delay();
    const prizes = [
      { type: 'points', value: 50, probability: 0.3 },
      { type: 'discount', value: 10, probability: 0.25 },
      { type: 'points', value: 100, probability: 0.2 },
      { type: 'discount', value: 15, probability: 0.15 },
      { type: 'freeShipping', value: 1, probability: 0.08 },
      { type: 'discount', value: 25, probability: 0.02 }
    ];

    // Higher tier users get better odds
    const tierMultiplier = this.tierBenefits[tier]?.multiplier || 1;
    
    const random = Math.random() / tierMultiplier;
    let cumulative = 0;
    
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return {
          type: prize.type,
          value: prize.value,
          message: this.getPrizeMessage(prize.type, prize.value)
        };
      }
    }
    
    return prizes[0]; // Fallback
  }

  getPrizeMessage(type, value) {
    switch (type) {
      case 'points':
        return `Congratulations! You won ${value} loyalty points!`;
      case 'discount':
        return `Amazing! You got ${value}% off your next purchase!`;
      case 'freeShipping':
        return `Fantastic! You earned free shipping on your next order!`;
      default:
        return `You won a prize worth ${value}!`;
    }
  }

  async getPointsHistory(userId = "user1") {
    await this.delay();
    return [
      {
        id: 1,
        type: "earned",
        points: 45,
        source: "Purchase #1234",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        type: "earned",
        points: 25,
        source: "Product Review",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: "redeemed",
        points: -100,
        source: "$5 Discount Reward",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        type: "earned",
        points: 100,
        source: "Friend Referral",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        type: "earned",
        points: 100,
        source: "Account Signup Bonus",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getAvailableRewards() {
    await this.delay();
    return [
      {
        id: 1,
        name: "$5 Off Next Order",
        description: "Save $5 on any order over $25",
        pointsCost: 100,
        discountValue: 5,
        type: "discount",
        minOrderValue: 25
      },
      {
        id: 2,
        name: "$10 Off Next Order", 
        description: "Save $10 on any order over $50",
        pointsCost: 200,
        discountValue: 10,
        type: "discount",
        minOrderValue: 50
      },
      {
        id: 3,
        name: "Free Standard Shipping",
        description: "Free shipping on your next order",
        pointsCost: 50,
        type: "shipping"
      },
      {
        id: 4,
        name: "$25 Off Next Order",
        description: "Save $25 on any order over $100",
        pointsCost: 500,
        discountValue: 25,
        type: "discount",
        minOrderValue: 100
      },
      {
        id: 5,
        name: "Free Express Shipping",
        description: "Free express shipping on your next order",
        pointsCost: 100,
        type: "shipping"
      }
    ];
  }

  async redeemReward(rewardId, currentPoints) {
    await this.delay();
    const rewards = await this.getAvailableRewards();
    const reward = rewards.find(r => r.id === rewardId);
    
    if (!reward) {
      throw new Error("Reward not found");
    }
    
    if (currentPoints < reward.pointsCost) {
      throw new Error("Insufficient points");
    }
    
    return {
      success: true,
      reward: {
        ...reward,
        redeemedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        code: this.generateRewardCode()
      }
    };
  }

  generateRewardCode() {
    return 'RWD' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

async getTierProgress(currentPoints) {
    await this.delay();
    const tiers = [
      { name: "Bronze", minPoints: 0, maxPoints: 499, color: "#CD7F32", icon: "Award" },
      { name: "Silver", minPoints: 500, maxPoints: 999, color: "#C0C0C0", icon: "Medal" },
      { name: "Gold", minPoints: 1000, maxPoints: 1999, color: "#FFD700", icon: "Crown" },
      { name: "Platinum", minPoints: 2000, maxPoints: 4999, color: "#E5E4E2", icon: "Gem" },
      { name: "Diamond", minPoints: 5000, maxPoints: Infinity, color: "#B9F2FF", icon: "Diamond" }
    ];
    
    const currentTier = tiers.find(tier => 
      currentPoints >= tier.minPoints && currentPoints <= tier.maxPoints
    );
    
    const nextTier = tiers.find(tier => tier.minPoints > currentPoints);
    
    return {
      currentTier,
      nextTier,
      pointsToNext: nextTier ? nextTier.minPoints - currentPoints : 0,
      progressPercent: nextTier 
        ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
        : 100,
      benefits: this.tierBenefits[currentTier?.name] || this.tierBenefits.Bronze
    };
  }

  async validateRewardCode(code) {
    await this.delay();
    // Mock validation - in real app would check database
    if (code.startsWith('RWD')) {
      return {
        valid: true,
        discount: 5,
        type: "fixed"
      };
    }
    return { valid: false };
  }
}

export const loyaltyService = new LoyaltyService();