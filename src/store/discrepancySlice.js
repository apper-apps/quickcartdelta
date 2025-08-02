import { createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

const initialState = {
  discrepancies: [],
  customerVerifications: [],
  agentDeductions: [],
  analytics: {
    totalDiscrepancies: 0,
    pendingVerifications: 0,
    escalatedCases: 0,
    totalAmount: 0,
    resolved: 0
  },
  loading: false,
  error: null
};

const discrepancySlice = createSlice({
  name: 'discrepancy',
  initialState,
  reducers: {
    // Discrepancy Management
    addDiscrepancy: (state, action) => {
      const discrepancy = {
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
        status: 'detected'
      };
      state.discrepancies.push(discrepancy);
      state.analytics.totalDiscrepancies += 1;
      state.analytics.totalAmount += discrepancy.amount;
      
      if (discrepancy.customerVerificationSent) {
        state.analytics.pendingVerifications += 1;
      }
      
      toast.warning(`Discrepancy detected: ₹${discrepancy.amount} for Order #${discrepancy.orderId}`);
    },

    updateDiscrepancyStatus: (state, action) => {
      const { discrepancyId, status, resolution } = action.payload;
      const discrepancy = state.discrepancies.find(d => d.id === discrepancyId);
      
      if (discrepancy) {
        const oldStatus = discrepancy.status;
        discrepancy.status = status;
        discrepancy.resolution = resolution;
        discrepancy.resolvedAt = new Date().toISOString();
        
        // Update analytics
        if (oldStatus === 'pending_verification' && status === 'resolved') {
          state.analytics.pendingVerifications -= 1;
          state.analytics.resolved += 1;
        }
        
        if (status === 'escalated') {
          state.analytics.escalatedCases += 1;
        }
        
        toast.success(`Discrepancy #${discrepancyId} ${status}`);
      }
    },

    // Customer Verification Management
    addCustomerVerification: (state, action) => {
      const verification = {
        id: Date.now(),
        ...action.payload,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
      state.customerVerifications.push(verification);
      toast.info(`Verification SMS sent to customer for Order #${verification.orderId}`);
    },

    updateVerificationStatus: (state, action) => {
      const { verificationId, status, customerResponse } = action.payload;
      const verification = state.customerVerifications.find(v => v.id === verificationId);
      
      if (verification) {
        verification.status = status;
        verification.customerResponse = customerResponse;
        verification.respondedAt = new Date().toISOString();
        
        const statusMessages = {
          'confirmed': 'Customer confirmed the amount',
          'disputed': 'Customer disputed the amount',
          'expired': 'Verification request expired',
          'resolved': 'Verification resolved'
        };
        
        toast.success(statusMessages[status] || 'Verification status updated');
      }
    },

    // Agent Deduction Management
    addAgentDeduction: (state, action) => {
      const deduction = {
        id: Date.now(),
        ...action.payload,
        processedAt: new Date().toISOString(),
        status: 'processed'
      };
      state.agentDeductions.push(deduction);
      toast.warning(`Agent deduction processed: ₹${deduction.amount} for ${deduction.driverId}`);
    },

    reverseAgentDeduction: (state, action) => {
      const { deductionId, reason } = action.payload;
      const deduction = state.agentDeductions.find(d => d.id === deductionId);
      
      if (deduction) {
        deduction.status = 'reversed';
        deduction.reversalReason = reason;
        deduction.reversedAt = new Date().toISOString();
        
        toast.success(`Deduction reversed: ₹${deduction.amount} refunded to ${deduction.driverId}`);
      }
    },

    // Analytics Updates
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },

    // Bulk Operations
    bulkResolveDiscrepancies: (state, action) => {
      const { discrepancyIds, resolution, notes } = action.payload;
      let resolvedCount = 0;
      
      discrepancyIds.forEach(id => {
        const discrepancy = state.discrepancies.find(d => d.id === id);
        if (discrepancy && discrepancy.status !== 'resolved') {
          discrepancy.status = 'resolved';
          discrepancy.resolution = resolution;
          discrepancy.resolutionNotes = notes;
          discrepancy.resolvedAt = new Date().toISOString();
          resolvedCount++;
        }
      });
      
      state.analytics.resolved += resolvedCount;
      state.analytics.pendingVerifications = Math.max(0, state.analytics.pendingVerifications - resolvedCount);
      
      if (resolvedCount > 0) {
        toast.success(`${resolvedCount} discrepancies resolved`);
      }
    },

    bulkEscalateDiscrepancies: (state, action) => {
      const { discrepancyIds, escalationReason } = action.payload;
      let escalatedCount = 0;
      
      discrepancyIds.forEach(id => {
        const discrepancy = state.discrepancies.find(d => d.id === id);
        if (discrepancy && discrepancy.status !== 'escalated') {
          discrepancy.status = 'escalated';
          discrepancy.escalationReason = escalationReason;
          discrepancy.escalatedAt = new Date().toISOString();
          escalatedCount++;
        }
      });
      
      state.analytics.escalatedCases += escalatedCount;
      
      if (escalatedCount > 0) {
        toast.warning(`${escalatedCount} cases escalated to management`);
      }
    },

    // Loading and Error States
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      if (action.payload) {
        toast.error(`Discrepancy Error: ${action.payload}`);
      }
    },

    clearError: (state) => {
      state.error = null;
    },

    // Reset State
    resetDiscrepancyState: (state) => {
      return initialState;
    }
  }
});

export const {
  addDiscrepancy,
  updateDiscrepancyStatus,
  addCustomerVerification,
  updateVerificationStatus,
  addAgentDeduction,
  reverseAgentDeduction,
  updateAnalytics,
  bulkResolveDiscrepancies,
  bulkEscalateDiscrepancies,
  setLoading,
  setError,
  clearError,
  resetDiscrepancyState
} = discrepancySlice.actions;

export default discrepancySlice.reducer;