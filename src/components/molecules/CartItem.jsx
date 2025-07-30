import React from "react";
import { useDispatch } from "react-redux";
import { updateQuantity, removeFromCart } from "@/store/cartSlice";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const CartItem = ({ item, showRemove = true }) => {
  const dispatch = useDispatch();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    dispatch(updateQuantity({ productId: item.Id, quantity: newQuantity }));
  };

  const handleRemove = () => {
    dispatch(removeFromCart(item.Id));
    toast.success(`${item.title} removed from cart`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow duration-200"
    >
      {/* Product Image */}
      <img
        src={item.images[0]}
        alt={item.title}
        className="w-16 h-16 object-cover rounded-lg"
      />

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
        <p className="text-sm text-gray-500">
          ${item.price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="p-1 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors duration-200"
          disabled={item.quantity <= 1}
        >
          <ApperIcon name="Minus" className="w-4 h-4" />
        </button>
        
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="p-1 text-gray-500 hover:text-primary hover:bg-primary/10 rounded transition-colors duration-200"
        >
          <ApperIcon name="Plus" className="w-4 h-4" />
        </button>
      </div>

      {/* Total Price */}
      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      {showRemove && (
        <button
          onClick={handleRemove}
          className="p-2 text-gray-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors duration-200"
        >
          <ApperIcon name="Trash2" className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export default CartItem;