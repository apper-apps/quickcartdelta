import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Button from "@/components/atoms/Button";

function BiometricAuth({ isOpen, onClose, onSuccess, type = "fingerprint" }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            handleScanComplete();
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleScanComplete = () => {
    setIsScanning(false);
    setScanResult('success');
    toast.success('Authentication successful!');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

const [error, setError] = useState('');

  const startScan = async () => {
    try {
      setIsScanning(true);
      setProgress(0);
      setError('');
      setScanResult(null);

      // Check if WebAuthn is supported and try to create credential
      if (window.PublicKeyCredential) {
        let credential;
        try {
          // Use requestAnimationFrame for context-safe WebAuthn API calls
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve);
            });
          });

          // Enhanced context preservation for WebAuthn API
          const credentialsAPI = navigator.credentials;
          const createMethod = credentialsAPI.create;
          
          if (typeof createMethod !== 'function') {
            console.warn('WebAuthn create method not available');
            return;
          }

          credential = await createMethod.call(credentialsAPI, {
            publicKey: {
              challenge: new Uint8Array(32),
              rp: { name: "QuickCart" },
              user: {
                id: new Uint8Array(16),
                name: "user@quickcart.com",
                displayName: "QuickCart User"
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
              }
            }
          });
        } catch (contextError) {
          // Strategy 2: Explicit binding fallback
          if (contextError.message?.includes('Illegal invocation') || contextError.name === 'TypeError') {
            const createCredential = navigator.credentials.create.bind(navigator.credentials);
            credential = await createCredential({
              publicKey: {
                challenge: new Uint8Array(32),
                rp: { name: "QuickCart" },
                user: {
                  id: new Uint8Array(16),
                  name: "user@quickcart.com",
                  displayName: "QuickCart User"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: {
                  authenticatorAttachment: "platform",
                  userVerification: "required"
                }
              }
            });
          } else {
            throw contextError;
          }
        }
        
        if (credential) {
          handleScanComplete();
        }
      } else {
        // Fallback: simulate biometric scanning
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              handleScanComplete();
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setError(error.message || 'Authentication failed');
      setIsScanning(false);
      setScanResult('error');
      toast.error('Authentication failed. Please try again.');
    }
  };

  const handleFallback = () => {
    onClose();
    // This would typically trigger a PIN/password flow
    toast.info('Please use your PIN to authenticate');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold mb-2">
            {type === 'fingerprint' ? 'Fingerprint' : 'Face ID'} Authentication
          </h3>
          
          <p className="text-gray-600 mb-6">
            {type === 'fingerprint' 
              ? 'Place your finger on the sensor to authenticate'
              : 'Look at your device to authenticate with Face ID'
            }
          </p>

          {error && (
            <Error message={error} className="mb-4" />
          )}
          {/* Biometric Scanner Visual */}
          <div className="mb-6 relative">
            <motion.div
              className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center relative ${
                scanResult === 'success' 
                  ? 'border-green-500 bg-green-50' 
                  : isScanning 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-300 bg-gray-50'
              }`}
              animate={isScanning ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: isScanning ? Infinity : 0 }}
            >
              <ApperIcon 
                name={type === 'fingerprint' ? 'Fingerprint' : 'Scan'} 
                size={32}
                className={
                  scanResult === 'success' 
                    ? 'text-green-600' 
                    : isScanning 
                      ? 'text-primary' 
                      : 'text-gray-400'
                }
              />

              {/* Scanning Animation */}
              {isScanning && (
                <motion.div
                  className="absolute inset-0 border-4 border-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: `conic-gradient(from 0deg, transparent, rgba(74, 144, 226, 0.3), transparent)`
                  }}
                />
              )}

              {/* Success Check */}
              {scanResult === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <ApperIcon name="Check" size={40} className="text-green-600" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Progress Bar */}
            {isScanning && (
              <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="mb-6">
            {scanResult === 'success' ? (
              <p className="text-green-600 font-medium">✓ Authentication Successful</p>
            ) : isScanning ? (
              <p className="text-primary font-medium">Scanning... {progress}%</p>
            ) : (
              <p className="text-gray-600">Tap to scan</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isScanning && !scanResult && (
              <Button
                onClick={startScan}
                className="w-full"
                variant="primary"
              >
                <ApperIcon 
                  name={type === 'fingerprint' ? 'Fingerprint' : 'Scan'} 
                  className="mr-2" 
                  size={16} 
                />
                Start {type === 'fingerprint' ? 'Fingerprint' : 'Face ID'} Scan
              </Button>
            )}

            <Button
              onClick={handleFallback}
              variant="outline"
              className="w-full"
              disabled={isScanning}
            >
              <ApperIcon name="Lock" className="mr-2" size={16} />
              Use PIN Instead
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Your biometric data is processed securely on your device and never stored on our servers.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BiometricAuth;