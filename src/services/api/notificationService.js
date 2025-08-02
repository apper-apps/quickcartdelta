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
          await this.sendSMS(alertData.userPhone, notification.message);
          break;
        case 'whatsapp':
          console.log(`💬 WhatsApp message sent to ${alertData.userPhone}`);
          // In real app, integrate with WhatsApp Business API
          await this.sendWhatsAppMessage(alertData.userPhone, `🛍️ Price Alert: ${alertData.productName} is now $${alertData.newPrice}! Shop now: ${alertData.productUrl}`);
          break;
        case 'push':
          await this.sendPushNotification(userId, notification);
          break;
      }
    }

    return notification;
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
    // Mock SMS API integration
    await this.delay(500);
    console.log(`📱 SMS API: Sending to ${phoneNumber}: ${message}`);
    
    // In real implementation:
    // const response = await fetch('https://api.sms-provider.com/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.smsGateway.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     to: phoneNumber,
    //     from: this.smsGateway.senderId,
    //     text: message
    //   })
    // });
    
    return { success: true, messageId: `sms_${Date.now()}` };
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
            default:
              throw new Error(`Unsupported channel: ${notification.channel}`);
          }
          
          return { success: true, notification, result };
        } catch (error) {
          return { success: false, notification, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
      
      // Small delay between batches
      if (i + batchSize < notifications.length) {
        await this.delay(500);
      }
    }
    
    console.log(`📡 Batch notifications completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }

  // Request notification permissions
  async requestNotificationPermissions() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }

  async sendWhatsAppCatalog(phoneNumber, products) {
    await this.delay(1000);
    console.log(`📱 WhatsApp Catalog: Sending to ${phoneNumber} with ${products.length} products`);
    
    // Mock catalog message with product list
    const catalogMessage = {
      type: 'interactive',
      interactive: {
        type: 'product_list',
        header: { type: 'text', text: '🛍️ Our Products' },
        body: { text: 'Browse our latest collection:' },
        action: {
          catalog_id: 'YOUR_CATALOG_ID',
          sections: [{
            title: 'Featured Products',
            product_items: products.slice(0, 10).map(product => ({
              product_retailer_id: product.Id.toString()
            }))
          }]
        }
      }
    };
    
    return { success: true, catalogId: 'catalog_' + Date.now() };
  }
}
export const notificationService = new NotificationService();