class NotificationService {
  constructor() {
    this.apiEndpoint = '/api/notifications'; // Mock endpoint
    
    // Enhanced notification system for COD management
    this.pushNotificationEndpoints = new Map();
    this.whatsappBusinessAPI = {
      phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
      accessToken: 'YOUR_ACCESS_TOKEN'
    };
    this.smsGateway = {
      apiKey: 'YOUR_SMS_API_KEY',
      senderId: 'DELIVERY'
    };
    
    // Initialize push notification support
    this.initializePushNotifications();
  }

  initializePushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Register service worker for push notifications
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('📱 Service Worker registered for push notifications');
          this.serviceWorkerRegistration = registration;
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async sendPriceDropAlert(userId, productId, alertData, channels = ['email']) {
    await this.delay();
    
    // Enhanced price drop alert with personalization
    const urgencyEmoji = alertData.urgency === 'high' ? '🔥' : alertData.urgency === 'medium' ? '⚡' : '💰';
    const personalizedTitle = `${urgencyEmoji} Price Drop Alert - ${alertData.dropPercentage}% Off!`;
    
    const notification = {
      id: Date.now(),
      userId,
      productId,
      type: 'price_drop',
      title: personalizedTitle,
      message: `Great news! "${alertData.productName}" is now $${alertData.currentPrice} (was $${alertData.previousPrice}). Save ${alertData.dropPercentage}%!`,
      data: {
        ...alertData,
        actionUrl: `/product/${productId}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        priority: alertData.urgency || 'medium'
      },
      channels,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Enhanced multi-channel notification delivery
    const deliveryResults = {};
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            console.log(`📧 Sending personalized email to ${alertData.userEmail}`);
            deliveryResults.email = await this.sendEmailAlert(alertData.userEmail, notification);
            break;
            
          case 'sms':
            const smsMessage = `${urgencyEmoji} PRICE DROP: ${alertData.productName} now $${alertData.currentPrice} (${alertData.dropPercentage}% off)! Limited time. Shop now: ${alertData.actionUrl}`;
            console.log(`📱 SMS sent to ${alertData.userPhone}`);
            deliveryResults.sms = await this.sendSMS(alertData.userPhone, smsMessage);
            break;
            
          case 'whatsapp':
            const whatsappMessage = `🛍️ *PRICE ALERT* ${urgencyEmoji}\n\n${alertData.productName}\n💰 Now: $${alertData.currentPrice}\n~~Was: $${alertData.previousPrice}~~\n\n✨ Save ${alertData.dropPercentage}%!\n\n🛒 Shop now: ${alertData.actionUrl}`;
            console.log(`💬 WhatsApp message sent to ${alertData.userPhone}`);
            deliveryResults.whatsapp = await this.sendWhatsAppMessage(alertData.userPhone, whatsappMessage);
            break;
            
          case 'push':
            deliveryResults.push = await this.sendPushNotification(userId, {
              ...notification,
              badge: alertData.dropPercentage,
              icon: '/icons/price-drop.png',
              requireInteraction: alertData.urgency === 'high'
            });
            break;
            
          case 'in_app':
            deliveryResults.in_app = await this.sendInAppNotification(userId, notification);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        deliveryResults[channel] = { success: false, error: error.message };
      }
    }

    notification.deliveryResults = deliveryResults;
    return notification;
  }
  
  async sendEmailAlert(email, notification) {
    // Mock enhanced email service
    await this.delay(200);
    console.log(`📧 Enhanced email alert sent to ${email}:`, {
      subject: notification.title,
      template: 'price_drop_alert',
      personalizedContent: true
    });
    return { success: true, messageId: `email_${Date.now()}` };
  }
  
  async sendInAppNotification(userId, notification) {
    // Mock in-app notification service
    await this.delay(100);
    console.log(`🔔 In-app notification sent to user ${userId}`);
    return { success: true, notificationId: `in_app_${Date.now()}` };
  }

  // Enhanced COD-specific notification methods
  async sendCodAssignmentNotification(driverId, orderData) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      driverId,
      orderId: orderData.Id,
      type: 'cod_assignment',
      title: `🚚 New COD Assignment`,
      message: `ORDER #${orderData.Id} - ₹${orderData.codAmount} COD`,
      data: {
        orderId: orderData.Id,
        codAmount: orderData.codAmount,
        customerName: orderData.shipping?.firstName,
        deliveryAddress: orderData.shipping?.address,
        estimatedTime: orderData.estimatedDeliveryTime || 30,
        priority: orderData.priority || 'normal',
        routeMap: orderData.shipping?.coordinates ? 
          `maps://route/${orderData.shipping.coordinates.lat},${orderData.shipping.coordinates.lng}` : null
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Send push notification to driver app
    await this.sendPushNotification(driverId, notification);
    
    // Send SMS as backup
    if (orderData.driverPhone) {
      await this.sendSMS(orderData.driverPhone, 
        `🚚 New Assignment: ORDER #${orderData.Id} - ₹${orderData.codAmount} COD - ${orderData.shipping?.address}. Check app for route.`
      );
    }

    console.log('📱 COD assignment notification sent:', notification);
    return notification;
  }

  async sendDeliveryCompletionSMS(customerPhone, orderData) {
    await this.delay();
    
    const message = `✅ ORDER #${orderData.Id} Delivered (${new Date().toLocaleTimeString()})
💰 Collected: ₹${orderData.codCollectedAmount} ${orderData.codDiscrepancy === 0 ? '(No discrepancy)' : `(₹${orderData.codDiscrepancy} discrepancy)`}
📍 GPS Verified: ${orderData.gpsVerification?.latitude?.toFixed(6)}° N, ${orderData.gpsVerification?.longitude?.toFixed(6)}° E
📧 Digital receipt: ${orderData.digitalReceiptId}`;

    await this.sendSMS(customerPhone, message);
    
    console.log('📱 Delivery completion SMS sent:', { customerPhone, orderId: orderData.Id });
    return { success: true, message: 'SMS sent successfully' };
  }

  async sendWalletLimitAlert(driverId, walletData) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      driverId,
      type: 'wallet_limit_alert',
      title: `⚠️ Wallet Limit Alert`,
      message: `You're at ${walletData.utilizationPercent}% of your daily limit (₹${walletData.currentBalance}/₹${walletData.limit})`,
      data: walletData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    await this.sendPushNotification(driverId, notification);
    
    console.log('🚨 Wallet limit alert sent:', notification);
    return notification;
  }

  async sendComplianceAlert(adminUsers, alertData) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      type: 'compliance_alert',
      title: `🚨 Compliance Alert: ${alertData.type}`,
      message: alertData.description,
      data: alertData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Send to all admin users
    for (const adminId of adminUsers) {
      await this.sendPushNotification(adminId, notification);
    }
    
    console.log('🚨 Compliance alert sent to admins:', notification);
    return notification;
  }

async sendCartAbandonmentReminder(userId, cartData) {
    await this.delay();
    
    // Enhanced cart abandonment with personalized recovery strategies
    const abandonmentDuration = Date.now() - cartData.lastActivity;
    const hours = Math.floor(abandonmentDuration / (1000 * 60 * 60));
    
    // Progressive discount strategy
    let discountPercentage = 5; // Base discount
    if (hours > 24) discountPercentage = 15; // 1 day+
    if (hours > 72) discountPercentage = 20; // 3 days+
    if (cartData.total > 100) discountPercentage += 5; // High value cart bonus
    
    const discountCode = `COMEBACK${discountPercentage}`;
    const urgencyMessage = hours > 48 ? '⏰ Limited time offer!' : '💝 Special offer for you!';
    
    const reminderMessage = `${urgencyMessage} Your cart with ${cartData.itemCount} items ($${cartData.total.toFixed(2)}) is waiting. Complete your purchase and save ${discountPercentage}% with code ${discountCode}!`;
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'cart_abandonment',
      title: '🛒 Your Cart Is Waiting!',
      message: reminderMessage,
      data: {
        ...cartData,
        discountCode,
        discountPercentage,
        abandonmentHours: hours,
        expiresIn: 48 * 60 * 60 * 1000, // 48 hours
        actionUrl: '/cart',
        urgencyLevel: hours > 48 ? 'high' : hours > 24 ? 'medium' : 'low'
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Multi-channel recovery campaign
    const channels = ['email', 'push'];
    if (cartData.userPhone) channels.push('sms');
    if (hours > 24) channels.push('whatsapp'); // Escalate to WhatsApp after 24 hours

    const deliveryResults = {};
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            const emailContent = {
              subject: `${urgencyMessage} Complete Your Purchase & Save ${discountPercentage}%`,
              template: 'cart_abandonment',
              cartItems: cartData.items,
              discountCode,
              personalizedRecommendations: true
            };
            deliveryResults.email = await this.sendEmailAlert(cartData.userEmail, { ...notification, emailContent });
            break;
            
          case 'sms':
            const smsMessage = `🛒 ${cartData.itemCount} items waiting! Save ${discountPercentage}% with ${discountCode}. Complete purchase: ${notification.data.actionUrl}`;
            deliveryResults.sms = await this.sendSMS(cartData.userPhone, smsMessage);
            break;
            
          case 'whatsapp':
            const whatsappMessage = `🛒 *Cart Reminder*\n\nHi! You have ${cartData.itemCount} items waiting in your cart (Total: $${cartData.total.toFixed(2)})\n\n💰 *Special Offer*: Save ${discountPercentage}% with code *${discountCode}*\n\n⏰ Limited time offer!\n\n👆 Complete your purchase: ${notification.data.actionUrl}`;
            deliveryResults.whatsapp = await this.sendWhatsAppMessage(cartData.userPhone, whatsappMessage);
            break;
            
          case 'push':
            deliveryResults.push = await this.sendPushNotification(userId, {
              ...notification,
              badge: cartData.itemCount,
              icon: '/icons/cart-reminder.png',
              actions: [
                { action: 'complete', title: `Save ${discountPercentage}%` },
                { action: 'view', title: 'View Cart' }
              ]
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} cart reminder:`, error);
        deliveryResults[channel] = { success: false, error: error.message };
      }
    }

    notification.deliveryResults = deliveryResults;
    console.log(`🛒 Cart abandonment reminder sent to user ${userId} (${hours}h ago, ${discountPercentage}% discount)`);
    
    return notification;
  }

async sendReferralReward(userId, referralData) {
    await this.delay();
    
    // Enhanced referral reward system with tier-based bonuses
    const baseBonusPoints = referralData.rewardPoints || 100;
    const tierMultiplier = {
      'Bronze': 1.0,
      'Silver': 1.2,
      'Gold': 1.5,
      'Platinum': 2.0
    };
    
    const userTier = referralData.userTier || 'Bronze';
    const totalPoints = Math.floor(baseBonusPoints * tierMultiplier[userTier]);
    const bonusAmount = totalPoints - baseBonusPoints;
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'referral_success',
      title: '🎉 Referral Success! Points Earned!',
      message: `Congratulations! You earned ${totalPoints} points for referring ${referralData.friendName}${bonusAmount > 0 ? ` (includes ${bonusAmount} ${userTier} tier bonus!)` : ''}`,
      data: {
        ...referralData,
        totalPointsEarned: totalPoints,
        basePoints: baseBonusPoints,
        tierBonus: bonusAmount,
        userTier,
        friendPurchaseAmount: referralData.friendPurchaseAmount || 0,
        nextTierProgress: this.calculateTierProgress(userTier, totalPoints)
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Multi-channel celebration
    const channels = ['push', 'in_app'];
    if (referralData.userEmail) channels.push('email');
    
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          await this.sendEmailAlert(referralData.userEmail, {
            ...notification,
            emailContent: {
              subject: `🎉 ${totalPoints} Points Earned! Your Referral Was Successful`,
              template: 'referral_success',
              showTierProgress: true,
              personalizedOffers: true
            }
          });
          break;
          
        case 'push':
          await this.sendPushNotification(userId, {
            ...notification,
            badge: totalPoints,
            icon: '/icons/referral-success.png',
            requireInteraction: true
          });
          break;
          
        case 'in_app':
          await this.sendInAppNotification(userId, {
            ...notification,
            celebrationType: 'confetti',
            autoHide: false
          });
          break;
      }
    }

    console.log(`🎁 Enhanced referral reward sent: ${totalPoints} points (${userTier} tier) for user ${userId}`);
    return notification;
  }
  
  calculateTierProgress(currentTier, newPoints) {
    const tierThresholds = {
      'Bronze': { min: 0, max: 500 },
      'Silver': { min: 500, max: 1500 },
      'Gold': { min: 1500, max: 3000 },
      'Platinum': { min: 3000, max: Infinity }
    };
    
    const nextTiers = {
      'Bronze': 'Silver',
      'Silver': 'Gold', 
      'Gold': 'Platinum',
      'Platinum': null
    };
    
    const nextTier = nextTiers[currentTier];
    if (!nextTier) return null;
    
    const currentThreshold = tierThresholds[currentTier];
    const nextThreshold = tierThresholds[nextTier];
    
    return {
      nextTier,
      pointsNeeded: nextThreshold.min - newPoints,
      progressPercent: Math.min(100, (newPoints / nextThreshold.min) * 100)
    };
  }

async sendSpinWheelResult(userId, prizeData) {
    await this.delay();
    
    // Enhanced spin wheel results with dynamic prize categorization
    const prizeCategories = {
      'discount': { emoji: '💰', celebration: 'coins' },
      'points': { emoji: '⭐', celebration: 'stars' },
      'free_shipping': { emoji: '🚚', celebration: 'bounce' },
      'product': { emoji: '🎁', celebration: 'confetti' },
      'cashback': { emoji: '💸', celebration: 'money' }
    };
    
    const category = prizeCategories[prizeData.type] || { emoji: '🎉', celebration: 'default' };
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'spin_wheel_prize',
      title: `${category.emoji} Spin Winner! You Got Lucky!`,
      message: `Congratulations! You won: ${prizeData.message}`,
      data: {
        ...prizeData,
        category: prizeData.type,
        celebrationType: category.celebration,
        redemptionCode: this.generateRedemptionCode(prizeData.type),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        howToRedeem: this.getRedemptionInstructions(prizeData.type)
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Enhanced celebration notification
    const deliveryPromises = [
      // Always send push notification for immediate impact
      this.sendPushNotification(userId, {
        ...notification,
        badge: 1,
        icon: '/icons/spin-winner.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200] // Celebration vibration pattern
      }),
      
      // In-app notification with animation
      this.sendInAppNotification(userId, {
        ...notification,
        celebrationType: category.celebration,
        duration: 5000, // Show longer for wins
        interactive: true
      })
    ];
    
    // Email for valuable prizes
    if (prizeData.value > 10 && prizeData.userEmail) {
      deliveryPromises.push(
        this.sendEmailAlert(prizeData.userEmail, {
          ...notification,
          emailContent: {
            subject: `${category.emoji} You're a Winner! Claim Your Prize`,
            template: 'spin_wheel_winner',
            showRedemptionDetails: true
          }
        })
      );
    }
    
    await Promise.all(deliveryPromises);

    console.log(`🎰 Enhanced spin wheel result sent: ${prizeData.message} (${prizeData.type}) for user ${userId}`);
    return notification;
  }
  
  generateRedemptionCode(prizeType) {
    const prefix = {
      'discount': 'SPIN',
      'points': 'LUCKY',
      'free_shipping': 'SHIP',
      'product': 'GIFT',
      'cashback': 'CASH'
    };
    
    const codePrefix = prefix[prizeType] || 'WIN';
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${codePrefix}${randomSuffix}`;
  }
  
  getRedemptionInstructions(prizeType) {
    const instructions = {
      'discount': 'Apply the code at checkout to get your discount.',
      'points': 'Points have been automatically added to your account.',
      'free_shipping': 'Use the code on your next order for free shipping.',
      'product': 'Visit the prize section to claim your free product.',
      'cashback': 'Cashback will be credited to your account within 24 hours.'
    };
    
    return instructions[prizeType] || 'Check your account for prize details.';
  }

  async subscribeToNotifications(userId, preferences) {
    await this.delay();
    
    // Mock subscription
    const subscription = {
      userId,
      channels: preferences.channels || ['email', 'push'],
      categories: preferences.categories || ['price_drops', 'promotions', 'order_updates'],
      frequency: preferences.frequency || 'immediate',
      timestamp: new Date().toISOString()
    };

    console.log('📋 Notification preferences updated:', subscription);
    return subscription;
  }

  async getNotificationHistory(userId, limit = 50) {
    await this.delay();
    
    // Mock notification history
    const notifications = [
      {
        id: 1,
        type: 'price_drop',
        title: 'Price Drop Alert!',
        message: 'iPhone 15 Pro is now $100 cheaper!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: 2,
        type: 'cart_abandonment',
        title: 'Complete Your Purchase',
        message: 'Your cart is waiting! Use code COMEBACK10 for 10% off.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: 3,
        type: 'referral_success',
        title: 'Referral Reward!',
        message: 'You earned 100 points for referring John!',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ];

return notifications.slice(0, limit);
  }

  async sendPushNotification(userId, notification) {
    // Mock push notification - in real app would use Firebase/APNs
    await this.delay(300);
    
    if ('serviceWorker' in navigator && 'PushManager' in window && this.serviceWorkerRegistration) {
      try {
        // Create browser notification for demo
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: notification.data,
            tag: `${notification.type}-${userId}`,
            requireInteraction: notification.type.includes('alert')
          });
        }
      } catch (error) {
        console.error('Push notification error:', error);
      }
    }
    
    console.log(`📱 Push notification sent to ${userId}:`, notification);
    return { success: true, notificationId: `push_${Date.now()}` };
  }

async sendSMS(phoneNumber, message) {
    // Enhanced SMS service with delivery tracking and rate limiting
    await this.delay(300);
    
    try {
      // Validate phone number format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Invalid phone number format');
      }
      
      // Check rate limiting (prevent spam)
      const rateLimitKey = `sms_${cleanPhone}`;
      const lastSent = this.rateLimit.get(rateLimitKey);
      const now = Date.now();
      
      if (lastSent && (now - lastSent) < 60000) { // 1 minute rate limit
        console.warn(`📱 SMS rate limit hit for ${phoneNumber}`);
        return { success: false, error: 'Rate limit exceeded', retryAfter: 60 };
      }
      
      // Update rate limit
      this.rateLimit.set(rateLimitKey, now);
      
      // Enhanced message formatting
      const formattedMessage = this.formatSMSMessage(message);
      
      console.log(`📱 Enhanced SMS API: Sending to ${phoneNumber}:`, {
        message: formattedMessage,
        length: formattedMessage.length,
        segments: Math.ceil(formattedMessage.length / 160),
        timestamp: new Date().toISOString()
      });
      
      // Mock SMS provider integration with delivery status
      const deliveryStatus = Math.random() > 0.1 ? 'delivered' : 'failed'; // 90% success rate
      const messageId = `sms_${now}_${Math.random().toString(36).substring(2, 8)}`;
      
      // In real implementation, integrate with providers like Twilio, AWS SNS, etc.
      /*
      const response = await fetch('https://api.sms-gateway.com/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.smsConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: `+${cleanPhone}`,
          from: this.smsConfig.senderId,
          text: formattedMessage,
          delivery_receipt: 'true'
        })
      });
      */
      
      return { 
        success: deliveryStatus === 'delivered', 
        messageId,
        deliveryStatus,
        segments: Math.ceil(formattedMessage.length / 160),
        cost: Math.ceil(formattedMessage.length / 160) * 0.02 // Mock cost calculation
      };
      
    } catch (error) {
      console.error(`📱 SMS sending failed for ${phoneNumber}:`, error);
      return { 
        success: false, 
        error: error.message,
        messageId: null 
      };
    }
  }
  
  formatSMSMessage(message) {
    // SMS formatting best practices
    return message
      .replace(/\n\n+/g, '\n') // Remove multiple line breaks
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 320); // Limit to 2 SMS segments
  }

  async sendWhatsAppMessage(phoneNumber, message) {
    // Enhanced WhatsApp Business API integration for COD notifications
    await this.delay(1000);
    console.log(`📱 WhatsApp API: Sending to ${phoneNumber}: ${message}`);
    
    // In real implementation:
    // const response = await fetch(`https://graph.facebook.com/v18.0/${this.whatsappBusinessAPI.phoneNumberId}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.whatsappBusinessAPI.accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: phoneNumber,
    //     type: 'text',
    //     text: { body: message }
    //   })
    // });
    
    return { success: true, messageId: `wa_${Date.now()}` };
  }

  // Batch notification method for multiple agents
  async sendBatchNotifications(notifications) {
    await this.delay(200);
    
    const results = [];
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (notification) => {
try {
          let result;
          const startTime = Date.now();
          
          switch (notification.channel) {
            case 'push':
              result = await this.sendPushNotification(notification.userId, notification);
              break;
            case 'sms':
              result = await this.sendSMS(notification.phone, notification.message);
              break;
            case 'whatsapp':
              result = await this.sendWhatsAppMessage(notification.phone, notification.message);
              break;
            case 'email':
              result = await this.sendEmailAlert(notification.email, notification);
              break;
            case 'in_app':
              result = await this.sendInAppNotification(notification.userId, notification);
              break;
            default:
              throw new Error(`Unsupported channel: ${notification.channel}`);
          }
          
          const deliveryTime = Date.now() - startTime;
          
          return { 
            success: true, 
            notification, 
            result: {
              ...result,
              deliveryTime,
              channel: notification.channel
            }
          };
        } catch (error) {
          return { 
            success: false, 
            notification, 
            error: error.message,
            channel: notification.channel,
            timestamp: new Date().toISOString()
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      const processedResults = batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason);
      results.push(...processedResults);
      
      // Enhanced batch analytics
      const batchSuccess = processedResults.filter(r => r.success).length;
      const batchTotal = processedResults.length;
      
      console.log(`📊 Batch ${Math.floor(i / batchSize) + 1}: ${batchSuccess}/${batchTotal} successful`);
      
      // Adaptive delay based on success rate
      if (i + batchSize < notifications.length) {
        const successRate = batchSuccess / batchTotal;
        const delay = successRate > 0.9 ? 300 : successRate > 0.7 ? 500 : 1000;
        await this.delay(delay);
      }
    }
    
    // Enhanced batch completion analytics
    const totalSuccess = results.filter(r => r.success).length;
    const channelStats = {};
    
    results.forEach(result => {
      const channel = result.channel || 'unknown';
      if (!channelStats[channel]) {
        channelStats[channel] = { success: 0, failed: 0, avgDeliveryTime: 0 };
      }
      
      if (result.success) {
        channelStats[channel].success++;
        channelStats[channel].avgDeliveryTime += result.result?.deliveryTime || 0;
      } else {
        channelStats[channel].failed++;
      }
    });
    
    // Calculate average delivery times
    Object.keys(channelStats).forEach(channel => {
      const stats = channelStats[channel];
      if (stats.success > 0) {
        stats.avgDeliveryTime = Math.round(stats.avgDeliveryTime / stats.success);
      }
    });
    
    console.log(`📡 Enhanced batch notifications completed:`, {
      totalSent: results.length,
      successful: totalSuccess,
      successRate: `${Math.round((totalSuccess / results.length) * 100)}%`,
      channelBreakdown: channelStats
    });
    
    return results;
  }

  // Enhanced notification permissions with granular control
  async requestNotificationPermissions() {
    const permissions = {
      notifications: false,
      background: false,
      sound: false,
      vibration: true // Usually always available
    };
    
    // Request basic notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        permissions.notifications = permission === 'granted';
        console.log(`🔔 Notification permission: ${permission}`);
      } else {
        permissions.notifications = Notification.permission === 'granted';
      }
    }
    
    // Check for service worker support (required for background notifications)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        permissions.background = !!registration;
        console.log('🔄 Service worker ready for background notifications');
      } catch (error) {
        console.warn('Service worker not available:', error);
      }
    }
    
    // Check for Web Audio API (for custom notification sounds)
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      permissions.sound = true;
    }
    
    console.log('🔔 Notification permissions summary:', permissions);
    return permissions;
  }

  async sendWhatsAppCatalog(phoneNumber, products, catalogOptions = {}) {
    await this.delay(800);
    
    const {
      catalogTitle = '🛍️ Our Product Catalog',
      maxProducts = 30,
      includeCategories = true,
      includePricing = true
    } = catalogOptions;
    
    console.log(`📱 Enhanced WhatsApp Catalog: Sending to ${phoneNumber} with ${products.length} products`);
    
    // Group products by category for better organization
    const categorizedProducts = {};
    products.slice(0, maxProducts).forEach(product => {
      const category = product.category || 'Other';
      if (!categorizedProducts[category]) {
        categorizedProducts[category] = [];
      }
      categorizedProducts[category].push(product);
    });
    
    // Enhanced catalog message structure
    const catalogSections = Object.entries(categorizedProducts).map(([category, categoryProducts]) => ({
      title: category.charAt(0).toUpperCase() + category.slice(1),
      product_items: categoryProducts.map(product => ({
        product_retailer_id: product.Id.toString(),
        title: product.title,
        description: product.description?.substring(0, 100) + '...',
        price: includePricing ? product.price : undefined,
        currency: includePricing ? 'USD' : undefined,
        image_url: product.images?.[0]
      }))
    }));
    
    const catalogMessage = {
      type: 'interactive',
      interactive: {
        type: 'product_list',
        header: { 
          type: 'text', 
          text: catalogTitle 
        },
        body: { 
          text: `Browse our latest collection of ${products.length} products across ${Object.keys(categorizedProducts).length} categories. Tap any product for details and instant ordering!` 
        },
        footer: {
          text: '🚚 Free shipping on orders over $50'
        },
        action: {
          catalog_id: `catalog_${Date.now()}`,
          sections: catalogSections
        }
      },
      metadata: {
        total_products: products.length,
        categories: Object.keys(categorizedProducts),
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    };
    
    // Mock WhatsApp Business API response
    const response = {
      success: true,
      catalogId: catalogMessage.action.catalog_id,
      messageId: `whatsapp_catalog_${Date.now()}`,
      recipientPhone: phoneNumber,
      productCount: products.length,
      categoryCount: Object.keys(categorizedProducts).length,
      estimatedDeliveryTime: '2-5 seconds',
      cost: Math.ceil(products.length / 10) * 0.05 // Mock cost calculation
    };
    
    console.log(`📱 WhatsApp catalog sent successfully:`, response);
    return response;
  }
}
export const notificationService = new NotificationService();