import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { closeCart, clearCart } from "@/store/cartSlice";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/atoms/Button";
import CartItem from "@/components/molecules/CartItem";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";

const CartDrawer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total, isOpen, itemCount } = useSelector((state) => state.cart);

  const handleCheckout = () => {
    dispatch(closeCart());
    navigate("/checkout");
  };

  const handleViewCart = () => {
    dispatch(closeCart());
    navigate("/cart");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => dispatch(closeCart())}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                Shopping Cart ({itemCount})
              </h2>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ApperIcon name="X" className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Empty
                    title="Your cart is empty"
                    description="Add some products to get started"
                    actionText="Continue Shopping"
                    actionPath="/"
                    icon="ShoppingCart"
                  />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <CartItem key={item.Id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span className="gradient-text">${total.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCheckout}
                    className="w-full"
                    icon="CreditCard"
                  >
                    Checkout
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewCart}
                      className="flex-1"
                      icon="Eye"
                    >
                      View Cart
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(clearCart())}
                      className="flex-1 text-gray-600"
                      icon="Trash2"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Free shipping notice */}
                <div className="text-center text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                  <ApperIcon name="Truck" className="w-4 h-4 inline mr-1" />
                  Free shipping on orders over $50
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;