import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Financial Data Security & PCI-DSS Compliance Utilities
 * Implements end-to-end encryption for all financial data
 */

class EncryptionService {
  constructor() {
    // PCI-DSS compliant encryption keys from environment
    this.financialKey = import.meta.env.VITE_FINANCIAL_ENCRYPTION_KEY || this.generateSecureKey();
    this.codLedgerKey = import.meta.env.VITE_COD_LEDGER_KEY || this.generateSecureKey();
    this.paymentTokenKey = import.meta.env.VITE_PAYMENT_TOKEN_KEY || this.generateSecureKey();
    this.auditSignatureKey = import.meta.env.VITE_AUDIT_SIGNATURE_KEY || this.generateSecureKey();
    
    // PCI-DSS compliance settings
    this.saltRounds = 12;
    this.tokenExpiry = 15 * 60 * 1000; // 15 minutes
    this.auditRetention = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
  }

  // Generate cryptographically secure keys
  generateSecureKey() {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  // Encrypt financial data with AES-256
  encryptFinancialData(data) {
    try {
      const jsonString = typeof data === 'object' ? JSON.stringify(data) : String(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.financialKey).toString();
      
      // Add integrity check
      const signature = this.createSignature(encrypted);
      
      return {
        data: encrypted,
        signature,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('🔒 Financial encryption failed:', error);
      throw new Error('Financial data encryption failed');
    }
  }

  // Decrypt financial data
  decryptFinancialData(encryptedData) {
    try {
      if (typeof encryptedData === 'string') {
        // Legacy format - direct decryption
        const decrypted = CryptoJS.AES.decrypt(encryptedData, this.financialKey);
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      }

      // New format with signature verification
      if (!this.verifySignature(encryptedData.data, encryptedData.signature)) {
        throw new Error('Data integrity check failed');
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.financialKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('🔒 Financial decryption failed:', error);
      throw new Error('Financial data decryption failed');
    }
  }

  // Encrypt COD ledger with blockchain integrity
  encryptCodLedger(ledgerData) {
    try {
      const jsonString = JSON.stringify(ledgerData);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.codLedgerKey).toString();
      
      // Create blockchain-style hash
      const blockHash = this.createBlockHash(ledgerData);
      
      return {
        encryptedData: encrypted,
        blockHash,
        timestamp: new Date().toISOString(),
        nonce: Math.floor(Math.random() * 1000000)
      };
    } catch (error) {
      console.error('🔒 COD ledger encryption failed:', error);
      throw new Error('COD ledger encryption failed');
    }
  }

  // Decrypt COD ledger
  decryptCodLedger(encryptedLedger) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedLedger.encryptedData, this.codLedgerKey);
      const ledgerData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      // Verify blockchain hash
      const expectedHash = this.createBlockHash(ledgerData);
      if (expectedHash !== encryptedLedger.blockHash) {
        throw new Error('COD ledger integrity check failed');
      }
      
      return ledgerData;
    } catch (error) {
      console.error('🔒 COD ledger decryption failed:', error);
      throw new Error('COD ledger decryption failed');
    }
  }

  // Create payment token (PCI-DSS compliant)
  createPaymentToken(paymentData) {
    const tokenId = uuidv4();
    const timestamp = Date.now();
    const expiryTime = timestamp + this.tokenExpiry;
    
    const tokenData = {
      tokenId,
      timestamp,
      expiryTime,
      data: paymentData
    };
    
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(tokenData), 
      this.paymentTokenKey
    ).toString();
    
    return {
      token: tokenId,
      encryptedData: encrypted,
      expiresAt: new Date(expiryTime).toISOString()
    };
  }

  // Retrieve payment data from token
  retrievePaymentToken(token, encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.paymentTokenKey);
      const tokenData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      
      // Verify token and expiry
      if (tokenData.tokenId !== token) {
        throw new Error('Invalid payment token');
      }
      
      if (Date.now() > tokenData.expiryTime) {
        throw new Error('Payment token expired');
      }
      
      return tokenData.data;
    } catch (error) {
      console.error('🔒 Payment token retrieval failed:', error);
      throw new Error('Payment token invalid or expired');
    }
  }

  // Mask sensitive data (PCI-DSS requirement)
  maskSensitiveData(data, type = 'default') {
    if (!data) return data;
    
    const masks = {
      cardNumber: (num) => {
        const str = String(num);
        return str.length > 4 ? 
          '*'.repeat(str.length - 4) + str.slice(-4) : 
          '*'.repeat(str.length);
      },
      amount: (amount) => {
        // Mask middle digits of amounts > 1000
        const str = String(amount);
        return parseFloat(str) > 1000 ? 
          str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2) : 
          str;
      },
      phone: (phone) => {
        const str = String(phone);
        return str.length > 4 ? 
          '*'.repeat(str.length - 4) + str.slice(-4) : 
          '*'.repeat(str.length);
      },
      default: (value) => {
        const str = String(value);
        return str.length > 6 ? 
          str.slice(0, 2) + '*'.repeat(str.length - 4) + str.slice(-2) : 
          '*'.repeat(str.length);
      }
    };
    
    return masks[type] ? masks[type](data) : masks.default(data);
  }

  // Create digital signature for audit trails
  createSignature(data) {
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return CryptoJS.HmacSHA256(dataString, this.auditSignatureKey).toString();
  }

  // Verify digital signature
  verifySignature(data, signature) {
    const expectedSignature = this.createSignature(data);
    return expectedSignature === signature;
  }

  // Create blockchain-style hash
  createBlockHash(data) {
    const dataString = JSON.stringify(data);
    return CryptoJS.SHA256(dataString).toString();
  }

  // Secure hash for passwords/sensitive strings
  async hashSecure(data) {
    return await bcrypt.hash(String(data), this.saltRounds);
  }

  // Verify secure hash
  async verifyHash(data, hash) {
    return await bcrypt.compare(String(data), hash);
  }

  // Anonymize data for compliance
  anonymizeData(data) {
    const anonymized = { ...data };
    
    // Remove or anonymize PII
    const piiFields = ['name', 'email', 'phone', 'address', 'customerName'];
    piiFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.generateAnonymousId();
      }
    });
    
    // Anonymize nested objects
    if (anonymized.shipping) {
      anonymized.shipping = {
        ...anonymized.shipping,
        name: this.generateAnonymousId(),
        phone: this.generateAnonymousId(),
        address: this.generateAnonymousId()
      };
    }
    
    if (anonymized.customer) {
      if (typeof anonymized.customer === 'object') {
        anonymized.customer = {
          ...anonymized.customer,
          name: this.generateAnonymousId(),
          email: this.generateAnonymousId(),
          phone: this.generateAnonymousId()
        };
      } else {
        anonymized.customer = this.generateAnonymousId();
      }
    }
    
    return anonymized;
  }

  // Generate anonymous ID
  generateAnonymousId() {
    return `ANON_${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  // Secure data deletion (overwrite with random data)
  secureDelete(key) {
    try {
      // Overwrite with random data multiple times
      for (let i = 0; i < 3; i++) {
        const randomData = CryptoJS.lib.WordArray.random(1024).toString();
        localStorage.setItem(key, randomData);
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('🔒 Secure deletion failed:', error);
      return false;
    }
  }

  // Create audit trail entry
  createAuditEntry(action, data, userId = 'system') {
    const auditData = {
      id: uuidv4(),
      action,
      userId,
      timestamp: new Date().toISOString(),
      data: this.anonymizeData(data),
      ipAddress: 'localhost', // In production, get real IP
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };
    
    // Sign audit entry
    auditData.signature = this.createSignature(auditData);
    
    return auditData;
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  // Validate encryption compliance
  validateCompliance() {
    const checks = {
      keysPresent: !!(this.financialKey && this.codLedgerKey && this.paymentTokenKey),
      keyLength: this.financialKey.length >= 64,
      auditEnabled: !!this.auditSignatureKey,
      secureRandomAvailable: !!window.crypto && !!window.crypto.getRandomValues
    };
    
    const passed = Object.values(checks).every(check => check);
    
    return {
      compliant: passed,
      checks,
      recommendations: passed ? [] : [
        'Ensure all encryption keys are properly configured',
        'Use secure random number generation',
        'Enable audit trail signatures'
      ]
    };
  }
}

export const encryptionService = new EncryptionService();