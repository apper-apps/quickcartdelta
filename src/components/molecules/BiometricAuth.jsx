import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Error from "@/components/ui/Error";
import Button from "@/components/atoms/Button";

function BiometricAuth({ isOpen, onClose, onSuccess, type = 'fingerprint' }) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)
  const [authMethod, setAuthMethod] = useState(type)

  function handleScanComplete() {
    setScanProgress(100)
    setTimeout(() => {
      onSuccess()
      onClose()
      toast.success('Authentication successful!')
    }, 500)
  }

  async function startScan() {
    try {
      setIsScanning(true)
      setError(null)
      setScanProgress(0)

      // Check WebAuthn support
      if (!window.PublicKeyCredential || !navigator.credentials) {
        throw new Error('Biometric authentication not supported in this browser')
      }

      // Animate scan progress
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 150)

      // Use direct method call to avoid context binding issues
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "QuickCart",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: "user@example.com",
            displayName: "User",
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      })

      if (credential) {
        clearInterval(interval)
        handleScanComplete()
      }
    } catch (error) {
      console.error('Biometric authentication error:', error)
      setError(`Authentication failed: ${error.message}`)
      setIsScanning(false)
      setScanProgress(0)
    }
  }

  function handleFallback() {
    // Fallback to password/PIN authentication
    toast.info('Redirecting to alternative authentication...')
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      // Check biometric support on mount
      const checkSupport = async () => {
        try {
          if (!window.PublicKeyCredential) {
            setIsSupported(false)
            return
          }

          const createCredential = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setIsSupported(createCredential)
        } catch (error) {
          console.warn('Biometric support check failed:', error)
          setIsSupported(false)
        }
      }

      checkSupport()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          {!isSupported ? (
            <div className="text-center">
              <ApperIcon name="AlertTriangle" size={64} className="mx-auto mb-4 text-warning" />
              <h3 className="text-xl font-bold mb-2">Biometric Auth Unavailable</h3>
              <p className="text-gray-600 mb-6">
                Your device doesn't support biometric authentication or it's not set up.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleFallback} className="btn-primary flex-1">
                  Use Password Instead
                </Button>
                <Button onClick={onClose} className="btn-secondary">
                  Cancel
                </Button>
              </div>
            </div>
          ) : error ? (
            <Error
              message={error}
              onRetry={() => {
                setError(null)
                startScan()
              }}
              onCancel={onClose}
              showRetry
            />
          ) : (
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <ApperIcon 
                    name={authMethod === 'face' ? "Scan" : "Fingerprint"} 
                    size={40} 
                    className="text-white" 
                  />
                </div>
                
                {isScanning && (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 border-4 border-primary/30 rounded-full"
                  />
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">
                {authMethod === 'face' ? 'Face Authentication' : 'Fingerprint Authentication'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {isScanning
                  ? `Scanning ${authMethod}... Please don't move.`
                  : `Place your ${authMethod === 'face' ? 'face in view' : 'finger on the sensor'} to authenticate.`
                }
              </p>

              {isScanning && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{scanProgress}% complete</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {!isScanning ? (
                  <Button onClick={startScan} className="btn-primary">
                    Start {authMethod === 'face' ? 'Face' : 'Fingerprint'} Scan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setIsScanning(false)
                      setScanProgress(0)
                    }} 
                    className="btn-secondary"
                  >
                    Cancel Scan
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => setAuthMethod(authMethod === 'face' ? 'fingerprint' : 'face')}
                    className="btn-secondary flex-1 text-sm"
                    disabled={isScanning}
                  >
                    Switch to {authMethod === 'face' ? 'Fingerprint' : 'Face'}
                  </Button>
                  <Button onClick={handleFallback} className="btn-secondary flex-1 text-sm">
                    Use Password
                  </Button>
                </div>

                <Button onClick={onClose} className="text-gray-500 text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BiometricAuth