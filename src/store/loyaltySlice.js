import { createSlice } from "@reduxjs/toolkit";

const loyaltySlice = createSlice({
  name: "loyalty",
  initialState: {
    points: 250,
    tier: "Bronze", // Bronze, Silver, Gold, Platinum
    transactions: [],
    availableRewards: [
      {
        id: 1,
        name: "$5 Discount",
        pointsCost: 100,
        description: "Save $5 on your next order",
        type: "discount"
      },
      {
        id: 2,
        name: "$10 Discount", 
        pointsCost: 200,
        description: "Save $10 on your next order",
        type: "discount"
      },
      {
        id: 3,
        name: "Free Shipping",
        pointsCost: 50,
        description: "Free shipping on your next order",
        type: "shipping"
      },
      {
        id: 4,
        name: "$25 Discount",
        pointsCost: 500,
        description: "Save $25 on your next order",
        type: "discount"
      }
    ],
    redeemedRewards: []
  },
  reducers: {
    addPoints: (state, action) => {
      const { points, source, orderId } = action.payload;
      state.points += points;
      state.transactions.unshift({
        id: Date.now(),
        type: "earned",
        points: points,
        source: source || "purchase",
        orderId: orderId,
        date: new Date().toISOString()
      });
      
      // Update tier based on total earned points
      const totalEarned = state.transactions
        .filter(t => t.type === "earned")
        .reduce((sum, t) => sum + t.points, 0);
      
      if (totalEarned >= 2000) state.tier = "Platinum";
      else if (totalEarned >= 1000) state.tier = "Gold";
      else if (totalEarned >= 500) state.tier = "Silver";
      else state.tier = "Bronze";
    },
    redeemReward: (state, action) => {
      const { rewardId, pointsCost } = action.payload;
      const reward = state.availableRewards.find(r => r.id === rewardId);
      
      if (reward && state.points >= pointsCost) {
        state.points -= pointsCost;
        state.redeemedRewards.push({
          ...reward,
          redeemedAt: new Date().toISOString(),
          used: false
        });
        state.transactions.unshift({
          id: Date.now(),
          type: "redeemed",
          points: -pointsCost,
          source: reward.name,
          date: new Date().toISOString()
        });
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

export const { addPoints, redeemReward, useReward, resetPoints } = loyaltySlice.actions;
export default loyaltySlice.reducer;