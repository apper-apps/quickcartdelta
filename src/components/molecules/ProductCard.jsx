import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToComparison, removeFromComparison } from "@/store/comparisonSlice";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { addToCart } from "@/store/cartSlice";

const ProductCard = ({ product, className = "" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const comparisonItems = useSelector((state) => state.comparison.items);
  const isInComparison = comparisonItems.some(item => item.Id === product.Id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.title} added to cart!`);
  };

  const handleCompareToggle = () => {
    if (isInComparison) {
      dispatch(removeFromComparison(product.Id));
      toast.info(`${product.title} removed from comparison`);
    } else {
      if (comparisonItems.length >= 4) {
        toast.warning("You can only compare up to 4 products");
        return;
      }
      dispatch(addToComparison(product));
      toast.success(`${product.title} added to comparison`);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.Id}`);
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`card p-4 cursor-pointer group relative overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      {/* Sale Badge */}
      {discountPercent > 0 && (
        <Badge variant="sale" className="absolute top-2 left-2 z-10">
          -{discountPercent}%
        </Badge>
      )}
      
{/* Action Buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button 
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            handleCompareToggle();
          }}
        >
          <ApperIcon 
            name="GitCompare" 
            className={`w-4 h-4 ${isInComparison ? "text-primary" : "text-gray-600"}`} 
          />
        </button>
        <button 
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ApperIcon name="Heart" className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Product Image */}
      <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {product.title}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <ApperIcon
                key={i}
                name="Star"
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="price-text">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${product.inStock ? "bg-success" : "bg-error"}`} />
            <span className={`text-xs ${product.inStock ? "text-success" : "text-error"}`}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        </div>

        {/* Quick Add Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Button
            variant="primary"
            size="sm"
            icon="ShoppingCart"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="w-full"
          >
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProductCard;