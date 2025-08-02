import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { orderService } from "@/services/api/orderService";
import ApperIcon from "@/components/ApperIcon";
import CartItem from "@/components/molecules/CartItem";
import Loyalty from "@/components/pages/Loyalty";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import { clearCart } from "@/store/cartSlice";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
const { items, total, itemCount, discount, checkout, bnpl, crypto } = useSelector((state) => state.cart);
  const loyaltyData = useSelector((state) => state.loyalty);

  const [loading, setLoading] = useState(false);
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cryptoDetails, setCryptoDetails] = useState({ coin: 'BTC', amount: 0 });
  const [bnplPlan, setBnplPlan] = useState(null);
  const [formData, setFormData] = useState({
    // Shipping Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    
    // Payment Information
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
    
    // Options
    saveInfo: false,
    sameAsShipping: true,
    usePoints: false,
    pointsToUse: 0,
  });
  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState(1);

// Enhanced pricing calculations
  const shippingCost = (total >= 50 || discount.freeShipping) ? 0 : 9.99;
  const discountAmount = discount.isValid ? (total * discount.percentage) / 100 : 0;
  const discountedTotal = total - discountAmount;
  
  // Loyalty points calculation
  const pointsDiscount = formData.usePoints ? (formData.pointsToUse * 0.01) : 0; // 1 cent per point
  
  // Crypto payment discount
  const cryptoDiscount = selectedPaymentMethod === 'crypto' ? discountedTotal * 0.02 : 0; // 2% crypto discount
  
  const afterAllDiscounts = discountedTotal - pointsDiscount - cryptoDiscount;
  const tax = afterAllDiscounts * 0.08;
  const finalTotal = Math.max(0, afterAllDiscounts + shippingCost + tax);

  // BNPL calculations
  const bnplEligible = finalTotal >= 50 && finalTotal <= 3000;
  const installmentAmount = bnplEligible && bnplPlan ? finalTotal / bnplPlan.installments : 0;
  // Redirect if cart is empty - moved to useEffect to prevent setState during render
  React.useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  // Show loading while redirect is happening for empty cart
  if (items.length === 0) {
    return null;
  }
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Shipping validation
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    }

    if (step === 2) {
      // Payment validation
      if (!formData.cardNumber.trim()) newErrors.cardNumber = "Card number is required";
      else if (formData.cardNumber.replace(/\s/g, "").length < 16) newErrors.cardNumber = "Card number is invalid";
      if (!formData.expiryDate.trim()) newErrors.expiryDate = "Expiry date is required";
      if (!formData.cvv.trim()) newErrors.cvv = "CVV is required";
      else if (formData.cvv.length < 3) newErrors.cvv = "CVV is invalid";
      if (!formData.cardName.trim()) newErrors.cardName = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePreviousStep = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;
    
setLoading(true);
    
    try {
      // Enhanced order data with new payment options
      const orderData = {
        items: items.map(item => ({
          productId: item.Id,
          quantity: item.quantity,
          price: item.price,
          name: item.title
        })),
        discount: discount.isValid ? {
          ...discount,
          amount: discountAmount
        } : null,
        pointsUsed: formData.usePoints ? formData.pointsToUse : 0,
        loyaltyTier: loyaltyData.tier,
        total: finalTotal,
        subtotal: total,
        tax,
        shippingCost,
        shipping: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        payment: {
          method: selectedPaymentMethod,
          ...(selectedPaymentMethod === 'card' && {
            last4: formData.cardNumber.slice(-4),
            cardType: 'visa' // Mock detection
          }),
          ...(selectedPaymentMethod === 'crypto' && {
            cryptocurrency: cryptoDetails.coin,
            cryptoAmount: cryptoDetails.amount,
            exchangeRate: 45000, // Mock rate
            walletAddress: 'bc1q...mock...address'
          }),
          ...(selectedPaymentMethod === 'bnpl' && {
            provider: bnpl.selectedProvider || 'afterpay',
            installments: bnplPlan?.installments || 4,
            installmentAmount
          })
        },
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          checkoutDuration: Date.now() - formData.startTime,
          biometricUsed: checkout.biometricEnabled && biometricOpen
        }
      };

      console.log('🛒 Processing enhanced checkout:', {
        paymentMethod: selectedPaymentMethod,
        total: finalTotal,
        discounts: {
          code: discount.code,
          amount: discountAmount,
          points: pointsDiscount,
          crypto: cryptoDiscount
        }
      });

      const order = await orderService.create(orderData);
      
      // Show celebration and clear cart
      toast.success(`🎉 Order #${order.Id} placed successfully! ${selectedPaymentMethod === 'crypto' ? '₿' : selectedPaymentMethod === 'bnpl' ? '📅' : '💳'}`);
      
      // Award loyalty points for purchase
      const pointsEarned = Math.floor(finalTotal * 0.01); // 1 point per dollar
      if (pointsEarned > 0) {
        setTimeout(() => {
          toast.info(`⭐ You earned ${pointsEarned} loyalty points!`);
        }, 2000);
      }
      
      dispatch(clearCart());
      navigate(`/order-confirmation/${order.Id}`);
      
    } catch (error) {
      console.error("Checkout error:", error);
      
      let errorMessage = "Failed to place order. Please try again.";
      if (selectedPaymentMethod === 'crypto') {
        errorMessage = "Cryptocurrency payment failed. Please check your wallet and try again.";
      } else if (selectedPaymentMethod === 'bnpl') {
        errorMessage = "Buy Now, Pay Later approval failed. Please try a different payment method.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Shipping", icon: "Truck" },
    { number: 2, title: "Payment", icon: "CreditCard" },
    { number: 3, title: "Review", icon: "Eye" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeStep >= step.number
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <ApperIcon name={step.icon} className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 font-medium ${
                  activeStep >= step.number ? "text-primary" : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  activeStep > step.number ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Shipping Information */}
            {activeStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6"
              >
                <h2 className="text-xl font-semibold mb-6">Shipping Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    required
                  />
                </div>

                <Input
                  label="Street Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  required
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    error={errors.state}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    error={errors.zipCode}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    icon="ArrowRight"
                    iconPosition="right"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment Information */}
{activeStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6"
              >
                <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
{/* Enhanced One-Click Checkout */}
                {checkout.oneClickEnabled && checkout.savedPayments.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <ApperIcon name="Zap" size={16} />
                      Express Checkout
                    </h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => setBiometricOpen(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <ApperIcon name="Fingerprint" className="mr-2" size={16} />
                        Pay with {checkout.biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                      </Button>
                      <p className="text-xs text-green-700 text-center">
                        Secure • Fast • Uses saved payment method
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Method</h3>
                  
                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        selectedPaymentMethod === 'card'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ApperIcon name="CreditCard" className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">Card</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('bnpl')}
                      disabled={!bnplEligible}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        selectedPaymentMethod === 'bnpl'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : bnplEligible
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ApperIcon name="Calendar" className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">Pay Later</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('crypto')}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        selectedPaymentMethod === 'crypto'
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ApperIcon name="Bitcoin" className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">Crypto</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('wallet')}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                        selectedPaymentMethod === 'wallet'
                          ? 'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ApperIcon name="Smartphone" className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">Wallet</span>
                    </button>
                  </div>

                  {/* Digital Wallet Options */}
                  {selectedPaymentMethod === 'wallet' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                      <button className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors duration-200">
                        <ApperIcon name="Apple" className="w-5 h-5" />
                        <span className="font-medium">Apple Pay</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors duration-200">
                        <ApperIcon name="Chrome" className="w-5 h-5" />
                        <span className="font-medium">Google Pay</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors duration-200">
                        <ApperIcon name="Smartphone" className="w-5 h-5" />
                        <span className="font-medium">Samsung Pay</span>
                      </button>
                    </div>
                  )}

                  {/* BNPL Options */}
                  {selectedPaymentMethod === 'bnpl' && bnplEligible && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-3">Buy Now, Pay Later Options</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['afterpay', 'klarna', 'tabby'].map(provider => (
                          <button
                            key={provider}
                            onClick={() => setBnplPlan({ provider, installments: 4 })}
                            className={`p-3 border rounded-lg transition-colors ${
                              bnplPlan?.provider === provider
                                ? 'border-blue-500 bg-blue-100'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium capitalize">{provider}</div>
                            <div className="text-sm text-gray-600">4 payments of ${(finalTotal / 4).toFixed(2)}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        No interest when you pay on time. Subject to approval.
                      </p>
                    </div>
                  )}

                  {/* Crypto Payment Options */}
                  {selectedPaymentMethod === 'crypto' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                        <ApperIcon name="Bitcoin" size={16} />
                        Cryptocurrency Payment
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {['BTC', 'ETH', 'USDC', 'USDT'].map(coin => (
                          <button
                            key={coin}
                            onClick={() => setCryptoDetails({ ...cryptoDetails, coin })}
                            className={`p-2 border rounded-lg text-center transition-colors ${
                              cryptoDetails.coin === coin
                                ? 'border-orange-500 bg-orange-100 text-orange-700'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="font-mono font-bold">{coin}</div>
                          </button>
                        ))}
                      </div>
                      <div className="bg-orange-100 rounded p-3">
                        <div className="text-sm text-orange-700">
                          <p className="font-medium">Pay: {(finalTotal / 45000).toFixed(6)} {cryptoDetails.coin}</p>
                          <p className="text-xs">Rate: 1 {cryptoDetails.coin} = $45,000 USD</p>
                          <p className="text-xs text-green-600 font-medium">💰 2% crypto discount applied!</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Traditional card form for card payments */}
                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="flex items-center my-4">
                        <hr className="flex-1 border-gray-300" />
                        <span className="px-3 text-sm text-gray-500">Credit or Debit Card</span>
                        <hr className="flex-1 border-gray-300" />
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Cardholder Name"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  error={errors.cardName}
                  required
                />

                <Input
                  label="Card Number"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  error={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                  required
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    error={errors.expiryDate}
                    placeholder="MM/YY"
                    required
                  />
                  <Input
                    label="CVV"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    error={errors.cvv}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>

                {/* Loyalty Points Usage */}
{/* Enhanced Loyalty Points Section */}
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ApperIcon 
                        name={loyaltyData.tier === 'Platinum' ? 'Crown' : loyaltyData.tier === 'Gold' ? 'Award' : 'Star'} 
                        className="w-5 h-5 text-yellow-600" 
                      />
                      <span className="font-medium text-yellow-800">
                        {loyaltyData.tier} Member - Use Loyalty Points
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-yellow-700">
                        Available: {loyaltyData.points} points
                      </span>
                      <p className="text-xs text-yellow-600">
                        Worth ${(loyaltyData.points * 0.01).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="usePoints" 
                        className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                        checked={formData.usePoints}
                        onChange={(e) => {
                          const maxUsablePoints = Math.min(loyaltyData.points, Math.floor(finalTotal * 100)); // Max 100% of order
                          setFormData({
                            ...formData, 
                            usePoints: e.target.checked, 
                            pointsToUse: e.target.checked ? Math.min(200, maxUsablePoints) : 0
                          });
                        }}
                      />
                      <label htmlFor="usePoints" className="text-sm text-yellow-700">
                        Use loyalty points for instant discount (1 point = $0.01)
                      </label>
                    </div>
                    
                    {formData.usePoints && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-yellow-700 min-w-[80px]">Points to use:</span>
                          <input
                            type="range"
                            min="0"
                            max={Math.min(loyaltyData.points, Math.floor(finalTotal * 100))}
                            step="10"
                            value={formData.pointsToUse}
                            onChange={(e) => setFormData({...formData, pointsToUse: parseInt(e.target.value)})}
                            className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-sm font-medium text-yellow-800 min-w-[100px] text-right">
                            {formData.pointsToUse} pts
                          </span>
                        </div>
                        
                        <div className="bg-yellow-100 rounded-lg p-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-yellow-700">Points Discount:</span>
                            <span className="font-bold text-yellow-800">
                              -${(formData.pointsToUse * 0.01).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-yellow-700">Remaining Points:</span>
                            <span className="font-medium text-yellow-700">
                              {loyaltyData.points - formData.pointsToUse} points
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick preset buttons */}
                        <div className="flex gap-2">
                          {[25, 50, 100].map(percent => {
                            const points = Math.floor((loyaltyData.points * percent) / 100);
                            const maxPoints = Math.min(loyaltyData.points, Math.floor(finalTotal * 100));
                            const actualPoints = Math.min(points, maxPoints);
                            
                            if (actualPoints < 10) return null;
                            
                            return (
                              <button
                                key={percent}
                                onClick={() => setFormData({...formData, pointsToUse: actualPoints})}
                                className="px-3 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-full transition-colors"
                              >
                                Use {percent}% ({actualPoints} pts)
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Order Summary */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    
                    {discount.isValid && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {formData.usePoints && pointsDiscount > 0 && (
                      <div className="flex justify-between text-yellow-600">
                        <span>Points Discount ({formData.pointsToUse} pts)</span>
                        <span>-${pointsDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {selectedPaymentMethod === 'crypto' && cryptoDiscount > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Crypto Payment Bonus</span>
                        <span>-${cryptoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    
                    <hr className="border-gray-300" />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                    
                    {selectedPaymentMethod === 'bnpl' && bnplPlan && (
                      <div className="text-blue-600 text-xs mt-2">
                        Or 4 payments of ${installmentAmount.toFixed(2)} with {bnplPlan.provider}
                      </div>
                    )}
                    
                    {selectedPaymentMethod === 'crypto' && (
                      <div className="text-orange-600 text-xs mt-2">
                        ₿ {(finalTotal / 45000).toFixed(6)} {cryptoDetails.coin}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    icon="ArrowLeft"
                  >
                    Back to Shipping
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    icon="ArrowRight"
                    iconPosition="right"
                  >
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Order Review */}
            {activeStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-6"
              >
                <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>

                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <CartItem key={item.Id} item={item} showRemove={false} />
                  ))}
                </div>

                {/* Shipping Address */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p className="text-sm text-gray-600">
                    {formData.firstName} {formData.lastName}<br />
                    {formData.address}<br />
                    {formData.city}, {formData.state} {formData.zipCode}<br />
                    {formData.country}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <p className="text-sm text-gray-600">
                    **** **** **** {formData.cardNumber.slice(-4)}
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    icon="ArrowLeft"
                  >
                    Back to Payment
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    icon="CreditCard"
                    className="bg-gradient-to-r from-success to-green-600"
                  >
                    Place Order (${finalTotal.toFixed(2)})
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
<div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              
              {discount.isValid && discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({discount.percentage}% off):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {formData.usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-yellow-600">
                  <span>Points Used ({formData.pointsToUse} pts):</span>
                  <span>-${pointsDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={`font-medium ${shippingCost === 0 ? "text-success" : ""}`}>
                  {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>

              <hr className="border-gray-200" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="gradient-text">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <ApperIcon name="Shield" className="w-4 h-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ApperIcon name="Lock" className="w-4 h-4" />
                <span>SSL encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;