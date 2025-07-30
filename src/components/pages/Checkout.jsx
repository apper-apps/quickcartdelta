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
const { items, total, itemCount, discount, checkout } = useSelector((state) => state.cart);

  const [loading, setLoading] = useState(false);
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
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

  const shippingCost = total >= 50 ? 0 : 9.99;
const discountAmount = discount.isValid ? (total * discount.percentage) / 100 : 0;
  const discountedTotal = total - discountAmount;
  const pointsDiscount = formData.usePoints ? (formData.pointsToUse * 0.1) : 0; // 10 cents per point
  const afterPointsTotal = discountedTotal - pointsDiscount;
  const tax = afterPointsTotal * 0.08;
  const finalTotal = afterPointsTotal + shippingCost + tax;

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
      const orderData = {
        items: items.map(item => ({
          productId: item.Id,
          quantity: item.quantity,
          price: item.price
        })),
        discount: discount.isValid ? discount : null,
        pointsUsed: formData.usePoints ? formData.pointsToUse : 0,
        total: finalTotal,
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
          method: "credit_card",
          last4: formData.cardNumber.slice(-4),
        }
      };

      const order = await orderService.create(orderData);
      
      dispatch(clearCart());
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${order.Id}`);
      
    } catch (error) {
      toast.error("Failed to place order. Please try again.");
      console.error("Checkout error:", error);
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
{/* One-Click Checkout */}
                {checkout.oneClickEnabled && checkout.savedPayments.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <ApperIcon name="Zap" size={16} />
                      One-Click Checkout
                    </h3>
                    <Button
                      onClick={() => setBiometricOpen(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <ApperIcon name="Fingerprint" className="mr-2" size={16} />
                      Pay with Biometric Authentication
                    </Button>
                    <p className="text-xs text-green-700 mt-2">
                      Use saved payment method with fingerprint or Face ID
                    </p>
                  </div>
                )}

                {/* Digital Wallet Options */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Payment Options</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors duration-200">
                      <ApperIcon name="Smartphone" className="w-5 h-5" />
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
                  <div className="flex items-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-sm text-gray-500">or pay with card</span>
                    <hr className="flex-1 border-gray-300" />
                  </div>
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
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ApperIcon name="Star" className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Use Loyalty Points</span>
                    </div>
                    <span className="text-sm text-yellow-700">Available: 250 points</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="usePoints" 
                        className="rounded"
                        checked={formData.usePoints}
                        onChange={(e) => setFormData({...formData, usePoints: e.target.checked, pointsToUse: e.target.checked ? 200 : 0})}
                      />
                      <label htmlFor="usePoints" className="text-sm text-yellow-700">
                        Use loyalty points for discount
                      </label>
                    </div>
                    {formData.usePoints && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-700">Points to use:</span>
                        <input
                          type="range"
                          min="0"
                          max="250"
                          step="10"
                          value={formData.pointsToUse}
                          onChange={(e) => setFormData({...formData, pointsToUse: parseInt(e.target.value)})}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-yellow-800">
                          {formData.pointsToUse} pts = ${(formData.pointsToUse * 0.1).toFixed(2)}
                        </span>
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