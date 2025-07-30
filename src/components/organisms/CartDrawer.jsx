import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import CartItem from "@/components/molecules/CartItem";
import Empty from "@/components/ui/Empty";
import Cart from "@/components/pages/Cart";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { 
  clearCart, 
  closeCart, 
  disableSplitBill, 
  enableSplitBill, 
  saveCustomerTab, 
  loadCustomerTab 
} from "@/store/cartSlice";

const CartDrawer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total, isOpen, itemCount, discount, dynamicPricing, pos } = useSelector((state) => state.cart);
  
  const discountAmount = discount.isValid ? (total * discount.percentage) / 100 : 0;
  const discountedTotal = total - discountAmount;
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
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {pos.mode ? 'POS Cart' : 'Shopping Cart'} ({itemCount})
                </h2>
                {pos.offlineMode && (
                  <Badge variant="warning" className="text-xs">
                    <ApperIcon name="WifiOff" size={12} className="mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ApperIcon name="X" className="w-5 h-5" />
              </button>
            </div>

            {/* POS Controls */}
            {pos.mode && (
              <div className="p-4 border-b bg-gray-50 space-y-3">
                {/* Split Bill Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Split Bill</span>
                  <Button
                    variant={pos.splitBill.enabled ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (pos.splitBill.enabled) {
                        dispatch(disableSplitBill());
                      } else {
                        const customers = prompt('Enter customer names (comma-separated):');
                        if (customers) {
                          dispatch(enableSplitBill(customers.split(',').map(name => name.trim())));
                        }
                      }
                    }}
                    icon="Users"
                  >
                    {pos.splitBill.enabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>

                {/* Customer Tab Management */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Tab</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const customerName = prompt('Enter customer name:');
                        if (customerName) {
                          const customerId = `tab_${Date.now()}`;
                          dispatch(saveCustomerTab({ customerId, customerName }));
                        }
                      }}
                      icon="Save"
                    >
                      Save Tab
                    </Button>
                    {Object.keys(pos.customerTabs).length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            dispatch(loadCustomerTab(e.target.value));
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Load Tab</option>
                        {Object.entries(pos.customerTabs).map(([id, tab]) => (
                          <option key={id} value={id}>{tab.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  {/* Split Bill Customer Assignment */}
                  {pos.splitBill.enabled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Split Bill Customers:</h4>
                      <div className="flex flex-wrap gap-2">
                        {pos.splitBill.customers.map((customer, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {customer}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {items.map((item) => (
                      <CartItem key={item.Id} item={item} showCustomerAssignment={pos.splitBill.enabled} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
{items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Dynamic Pricing Alert */}
                {(dynamicPricing.personalizedDiscount > 0 || dynamicPricing.tierDiscount > 0) && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <ApperIcon name="Zap" size={16} />
                      <span className="text-sm font-medium">
                        Special pricing applied! Save ${Math.max(dynamicPricing.personalizedDiscount, dynamicPricing.tierDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span className={discount.isValid ? "line-through text-gray-500" : "gradient-text font-semibold"}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  
                  {discount.isValid && (
                    <>
                      <div className="flex items-center justify-between text-success">
                        <span className="text-sm">Discount ({discount.percentage}% off):</span>
                        <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="gradient-text">${discountedTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCheckout}
                    className="w-full"
                    icon={pos.mode ? "Receipt" : "CreditCard"}
                  >
                    {pos.mode ? 'Process Payment' : 'Checkout'}
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

                {/* Free shipping notice - hide in POS mode */}
                {!pos.mode && (
                  <div className="text-center text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                    <ApperIcon name="Truck" className="w-4 h-4 inline mr-1" />
                    Free shipping on orders over $50
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;