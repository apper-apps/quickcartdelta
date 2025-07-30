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
      Bronze: { multiplier: 1, freeShipping: false },
      Silver: { multiplier: 1.25, freeShipping: false },
      Gold: { multiplier: 1.5, freeShipping: true },
      Platinum: { multiplier: 2, freeShipping: true }
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
      { name: "Bronze", minPoints: 0, maxPoints: 499 },
      { name: "Silver", minPoints: 500, maxPoints: 999 },
      { name: "Gold", minPoints: 1000, maxPoints: 1999 },
      { name: "Platinum", minPoints: 2000, maxPoints: Infinity }
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
        : 100
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