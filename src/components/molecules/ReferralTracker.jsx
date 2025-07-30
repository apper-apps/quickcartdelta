import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { loyaltyService } from '@/services/api/loyaltyService';

function ReferralTracker({ userId = "user1" }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const data = await loyaltyService.generateReferralCode(userId);
      setReferralData({
        ...data,
        stats: {
          totalReferrals: 12,
          pendingRewards: 3,
          earnedPoints: 1200,
          thisMonth: 5
        }
      });
    } catch (error) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.url) return;
    
    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralData.url);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      setCopying(false);
    }
  };

  const shareReferral = async (platform) => {
    if (!referralData?.url) return;

    const message = `Check out this amazing shopping app! Use my referral link and we both get rewards: ${referralData.url}`;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.url)}`,
      email: `mailto:?subject=Join me on QuickCart&body=${encodeURIComponent(message)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold gradient-text">Referral Program</h3>
          <p className="text-gray-600 text-sm">
            Invite friends and earn 100 points for each successful referral
          </p>
        </div>
        <div className="text-right">
          <Badge variant="primary" className="text-sm">
            {referralData?.stats.totalReferrals} Referrals
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {referralData?.stats.totalReferrals}
          </div>
          <div className="text-sm text-blue-700">Total Referrals</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {referralData?.stats.earnedPoints}
          </div>
          <div className="text-sm text-green-700">Points Earned</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {referralData?.stats.pendingRewards}
          </div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {referralData?.stats.thisMonth}
          </div>
          <div className="text-sm text-purple-700">This Month</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Your Referral Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralData?.url || ''}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyReferralLink}
            disabled={copying}
          >
            {copying ? (
              <ApperIcon name="Loader2" className="animate-spin" size={16} />
            ) : (
              <ApperIcon name="Copy" size={16} />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ApperIcon name="Clock" size={12} />
          Expires: {new Date(referralData?.expires || Date.now()).toLocaleDateString()}
        </div>
      </div>

      {/* Share Options */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Share with Friends
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareReferral('whatsapp')}
            className="flex items-center gap-2"
          >
            <ApperIcon name="MessageCircle" size={16} className="text-green-500" />
            WhatsApp
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareReferral('email')}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Mail" size={16} className="text-blue-500" />
            Email
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareReferral('twitter')}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Twitter" size={16} className="text-blue-400" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareReferral('facebook')}
            className="flex items-center gap-2"
          >
            <ApperIcon name="Facebook" size={16} className="text-blue-600" />
            Facebook
          </Button>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
          <ApperIcon name="Info" size={16} />
          How it Works
        </h4>
        <div className="space-y-2 text-sm text-purple-700">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Share your unique referral link with friends
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            They sign up and make their first purchase
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            You both get 100 loyalty points as reward!
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralTracker;