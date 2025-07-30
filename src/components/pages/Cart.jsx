import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import CartItem from "@/components/molecules/CartItem";
import Empty from "@/components/ui/Empty";
import Loyalty from "@/components/pages/Loyalty";
import Checkout from "@/components/pages/Checkout";
import Button from "@/components/atoms/Button";
import { applyDiscount, applyDynamicPricing, clearCart, removeDiscount } from "@/store/cartSlice";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
const { items, total, itemCount, discount, dynamicPricing } = useSelector((state) => state.cart);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
const [showSpinWheel, setShowSpinWheel] = useState(false);

  const discountAmount = discount.isValid ? (total * discount.percentage) / 100 : 0;
  const discountedTotal = total - discountAmount;
  const shippingCost = discountedTotal >= 50 ? 0 : 9.99;
  const tax = discountedTotal * 0.08; // 8% tax
  const finalTotal = discountedTotal + shippingCost + tax;

  // Apply dynamic pricing on component mount
  useEffect(() => {
    if (items.length > 0) {
      dispatch(applyDynamicPricing({
        personalizedDiscount: total > 100 ? 10 : 5,
        tierDiscount: 8, // Would come from loyalty service
        bulkDiscount: items.length > 5 ? 12 : 0
      }));
    }
  }, [items, total, dispatch]);
  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Empty
          title="Your cart is empty"
          description="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
          actionText="Start Shopping"
          actionPath="/"
          icon="ShoppingCart"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart ({itemCount} items)</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(clearCart())}
          icon="Trash2"
        >
          Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.Id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CartItem item={item} showRemove={true} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
<div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              {/* Dynamic Pricing Alert */}
              {(dynamicPricing.personalizedDiscount > 0 || dynamicPricing.tierDiscount > 0 || dynamicPricing.bulkDiscount > 0) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <ApperIcon name="Zap" size={16} />
                    Smart Pricing Active
                  </h3>
                  <div className="space-y-1 text-sm text-green-700">
                    {dynamicPricing.personalizedDiscount > 0 && (
                      <div>• Personalized discount: {dynamicPricing.personalizedDiscount}%</div>
                    )}
                    {dynamicPricing.tierDiscount > 0 && (
                      <div>• Loyalty tier bonus: {dynamicPricing.tierDiscount}%</div>
                    )}
                    {dynamicPricing.bulkDiscount > 0 && (
                      <div>• Bulk order discount: {dynamicPricing.bulkDiscount}%</div>
                    )}
                  </div>
                </div>
              )}

              {/* Promo Code Section */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ApperIcon name="Tag" size={16} />
                  Promo Code
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError("");
                    }}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(applyDiscount({ code: promoCode, type: 'manual' }))}
                    disabled={!promoCode.trim()}
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <p className="text-sm text-error mt-2">{promoError}</p>
                )}
                {discount.isValid && (
                  <div className="mt-3 p-2 bg-success/10 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-success font-medium">
                      {discount.type === 'dynamic' ? (
                        'Smart pricing applied!'
                      ) : (
                        `Code "${discount.code}" applied! ${discount.percentage}% off`
                      )}
                    </span>
                    {discount.type !== 'dynamic' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch(removeDiscount())}
                        className="text-success hover:text-success/80 p-1"
                      >
                        <ApperIcon name="X" size={14} />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>

              {/* Discount */}
{discount.isValid && discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    {discount.type === 'dynamic' ? 'Smart Discount' : `Discount (${discount.percentage}% off)`}
                  </span>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={`font-medium ${shippingCost === 0 ? "text-success" : ""}`}>
                  {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>

              {/* Free shipping progress */}
              {discountedTotal < 50 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800 mb-2">
                    Add ${(50 - discountedTotal).toFixed(2)} more for free shipping!
                  </p>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(discountedTotal / 50) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tax */}
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>

              <hr className="border-gray-200" />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="gradient-text">${finalTotal.toFixed(2)}</span>
              </div>
              
{discount.isValid && (
                <div className="text-sm text-success text-center">
                  You saved ${discountAmount.toFixed(2)} {discount.type === 'dynamic' ? 'with smart pricing!' : 'with promo code!'}
                </div>
              )}

              {/* Gamification - Spin Wheel CTA */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ApperIcon name="Gift" size={20} className="text-purple-600" />
                  <span className="font-medium text-purple-800">Feeling Lucky?</span>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Spin our wheel after checkout for a chance to win exclusive rewards!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpinWheel(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <ApperIcon name="RotateCw" className="mr-2" size={14} />
                  Preview Spin Wheel
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                className="w-full"
                icon="CreditCard"
              >
                Proceed to Checkout
              </Button>
              
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate("/")}
                className="w-full"
                icon="ArrowLeft"
              >
                Continue Shopping
              </Button>
            </div>

            {/* Security Features */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <ApperIcon name="Shield" className="w-4 h-4" />
                <span>Secure checkout guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ApperIcon name="Lock" className="w-4 h-4" />
                <span>SSL encrypted payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;