import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { addToComparison, removeFromComparison } from "@/store/comparisonSlice";
import { addToHistory } from "@/store/browsingSlice";
import { toggleWishlist } from "@/store/wishlistSlice";
import { addToCart } from "@/store/cartSlice";

const ProductCard = ({ product, className = "" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const comparisonItems = useSelector((state) => state.comparison.items);
  const isInWishlist = wishlistItems.some(item => item.Id === product.Id);
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

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  const handleCardClick = () => {
    // Track product view for recommendations
    dispatch(addToHistory(product.Id));
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
          onClick={handleWishlistToggle}
        >
          <ApperIcon 
            name="Heart" 
            className={`w-4 h-4 transition-colors duration-200 ${
              isInWishlist ? 'text-red-500 fill-current' : 'text-gray-600'
            }`} 
          />
        </button>
      </div>

      {/* Product Image */}
<div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100 relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
<img
          src={imageError ? (() => {
            try {
              const title = product?.title?.trim() || "Product";
              let truncatedTitle = title.length <= 25 ? title : title.slice(0, 25);
              
              if (title.length > 25) {
                const lastSpaceIndex = truncatedTitle.lastIndexOf(' ');
                if (lastSpaceIndex > 10) {
                  truncatedTitle = truncatedTitle.slice(0, lastSpaceIndex);
                }
              }
              
              const cleanTitle = truncatedTitle
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              return `https://via.placeholder.com/400x400/e5e7eb/6b7280?text=${encodeURIComponent(cleanTitle || 'Product')}`;
            } catch (error) {
              return 'https://via.placeholder.com/400x400/e5e7eb/6b7280?text=Product';
            }
          })() : product.images[0]}
          alt={product.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <ApperIcon name="ImageOff" size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500">Image unavailable</p>
            </div>
          </div>
        )}
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