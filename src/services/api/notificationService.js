class NotificationService {
  constructor() {
    this.apiEndpoint = '/api/notifications'; // Mock endpoint
  }

  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendPriceDropAlert(userId, productId, alertData, channels = ['email']) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      userId,
      productId,
      type: 'price_drop',
      title: `Price Drop Alert! 🔥`,
      message: `The price of "${alertData.productName}" has dropped by ${alertData.dropPercentage}%!`,
      data: alertData,
      channels,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Mock sending notifications
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          console.log(`📧 Email sent to ${alertData.userEmail}`);
          break;
        case 'sms':
          console.log(`📱 SMS sent to ${alertData.userPhone}`);
          break;
        case 'whatsapp':
          console.log(`💬 WhatsApp message sent to ${alertData.userPhone}`);
          break;
        case 'push':
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Mock push notification
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
            });
          }
          break;
      }
    }

    return notification;
  }

  async sendCartAbandonmentReminder(userId, cartData) {
    await this.delay();
    
    const reminderMessage = `Don't forget about your cart! Complete your purchase of ${cartData.itemCount} items (${cartData.total.toFixed(2)}) and get 10% off with code COMEBACK10.`;
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'cart_abandonment',
      title: 'Complete Your Purchase 🛒',
      message: reminderMessage,
      data: {
        ...cartData,
        discountCode: 'COMEBACK10',
        discountPercentage: 10,
        expiresIn: 24 * 60 * 60 * 1000 // 24 hours
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Send via multiple channels
    await this.sendPriceDropAlert(userId, null, {
      userEmail: cartData.userEmail,
      userPhone: cartData.userPhone,
      productName: `${cartData.itemCount} items in your cart`
    }, ['email', 'push']);

    return notification;
  }

  async sendReferralReward(userId, referralData) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'referral_success',
      title: 'Referral Reward! 🎉',
      message: `Congratulations! You earned ${referralData.rewardPoints} points for referring ${referralData.friendName}.`,
      data: referralData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    console.log(`🎁 Referral reward notification sent: ${notification.message}`);
    return notification;
  }

  async sendSpinWheelResult(userId, prizeData) {
    await this.delay();
    
    const notification = {
      id: Date.now(),
      userId,
      type: 'spin_wheel_prize',
      title: 'Spin Wheel Winner! 🎯',
      message: `You won: ${prizeData.message}`,
      data: prizeData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    console.log(`🎰 Spin wheel result notification sent: ${notification.message}`);
    return notification;
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
}

export const notificationService = new NotificationService();