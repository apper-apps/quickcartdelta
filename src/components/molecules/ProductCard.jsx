import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { productService } from "@/services/api/productService";
import ApperIcon from "@/components/ApperIcon";
import ARPreview from "@/components/molecules/ARPreview";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { addToComparison, removeFromComparison } from "@/store/comparisonSlice";
import { addToHistory } from "@/store/browsingSlice";
import { toggleWishlist } from "@/store/wishlistSlice";
import { addToCart, applyDynamicPricing } from "@/store/cartSlice";
const ProductCard = ({ product, className = "" }) => {
  const navigate = useNavigate();
const dispatch = useDispatch();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const comparisonItems = useSelector((state) => state.comparison.items);
  const cartItems = useSelector((state) => state.cart.items || []);
  const browsingHistory = useSelector((state) => state.browsing.history || []);
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
    
    // Enable price drop alerts for wishlisted items
    toast.info("💝 Price drop alerts enabled for this item!");
  };

  const handleCardClick = () => {
    // Track product view for recommendations
    dispatch(addToHistory(product.Id));
    navigate(`/product/${product.Id}`);
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

// Enhanced state for AR and dynamic features
  const [showARPreview, setShowARPreview] = useState(false);
  const [arCapability, setArCapability] = useState(null);
  const [dynamicPrice, setDynamicPrice] = useState(product.price);
  const [personalizedDiscount, setPersonalizedDiscount] = useState(0);
  const loyaltyData = useSelector((state) => state.loyalty);

  // Load AR capability and dynamic pricing on mount
  useEffect(() => {
    const loadEnhancements = async () => {
      try {
        // Check AR capability
        const arData = await productService.getARCapability(product.Id);
        setArCapability(arData);

        // Apply dynamic pricing based on user context
        const userContext = {
          loyaltyTier: loyaltyData.tier,
          cartValue: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          browsingHistory: browsingHistory.length,
          isReturningCustomer: browsingHistory.length > 5
        };

        // Dynamic discount calculation
        let discount = 0;
        if (userContext.loyaltyTier === 'Platinum') discount = 0.15;
        else if (userContext.loyaltyTier === 'Gold') discount = 0.10;
        else if (userContext.loyaltyTier === 'Silver') discount = 0.05;
        
        if (userContext.cartValue > 100) discount += 0.05; // Bulk discount
        if (userContext.isReturningCustomer) discount += 0.03; // Loyalty bonus

        const discountedPrice = product.price * (1 - discount);
        setDynamicPrice(discountedPrice);
        setPersonalizedDiscount(Math.round(discount * 100));

        // Apply dynamic pricing to cart
        if (discount > 0) {
          dispatch(applyDynamicPricing({
            personalizedDiscount: Math.round(discount * 100),
            tierDiscount: userContext.loyaltyTier === 'Platinum' ? 15 : userContext.loyaltyTier === 'Gold' ? 10 : 5,
            bulkDiscount: userContext.cartValue > 100 ? 5 : 0
          }));
        }
      } catch (error) {
        console.warn('Failed to load product enhancements:', error);
      }
    };

    loadEnhancements();
  }, [product.Id, loyaltyData.tier, cartItems.length, browsingHistory.length]);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className={`card p-4 cursor-pointer group relative overflow-hidden ${className}`}
        onClick={handleCardClick}
      >
        {/* Enhanced Sale Badge with Dynamic Pricing */}
        {(discountPercent > 0 || personalizedDiscount > 0) && (
          <Badge variant="sale" className="absolute top-2 left-2 z-10">
            -{Math.max(discountPercent, personalizedDiscount)}%
            {personalizedDiscount > 0 && (
              <span className="block text-xs">Personal</span>
            )}
          </Badge>
        )}
        
        {/* Enhanced Action Buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {/* AR Preview Button */}
          {arCapability?.hasAR && (
            <button 
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setShowARPreview(true);
                toast.info("🥽 Launching AR Preview...");
              }}
              title="AR Preview"
            >
              <ApperIcon name="Camera" className="w-4 h-4 text-purple-600" />
            </button>
          )}
          
          {/* 3D View Button */}
          {arCapability?.has3D && (
            <button 
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("🔄 3D Product View coming soon!");
              }}
              title="3D View"
            >
              <ApperIcon name="RotateCcw" className="w-4 h-4 text-blue-600" />
            </button>
          )}
          
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

        {/* Product Image with Enhanced Features */}
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
          
          {/* Frequently Bought Together Indicator */}
          {product.frequentlyBoughtWith && product.frequentlyBoughtWith.length > 0 && (
            <div className="absolute bottom-2 left-2 bg-green-600/90 text-white px-2 py-1 rounded-full text-xs font-medium">
              Bundle Deal
            </div>
          )}
        </div>

        {/* Enhanced Product Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.title}
          </h3>
          
          {/* Rating with Social Proof */}
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
            {product.reviews > 100 && (
              <Badge variant="secondary" className="text-xs">Popular</Badge>
            )}
          </div>

          {/* Enhanced Pricing with Dynamic Discounts */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="price-text">${dynamicPrice.toFixed(2)}</span>
                {(product.originalPrice || personalizedDiscount > 0) && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.originalPrice?.toFixed(2) || product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {personalizedDiscount > 0 && (
                <span className="text-xs text-primary font-medium">
                  🎯 Your {loyaltyData.tier} price
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

          {/* Frequently Bought Together */}
          {product.frequentlyBoughtWith && product.frequentlyBoughtWith.length > 0 && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <span className="font-medium">💡 Often bought with:</span>
              <span className="ml-1">{product.frequentlyBoughtWith.slice(0, 2).join(', ')}</span>
              {product.frequentlyBoughtWith.length > 2 && <span> +{product.frequentlyBoughtWith.length - 2} more</span>}
            </div>
          )}

          {/* Enhanced Quick Add Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 space-y-2"
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
            
            {product.frequentlyBoughtWith && product.frequentlyBoughtWith.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info("🛍️ Bundle deals coming soon!");
                }}
              >
                View Bundle Deal
              </Button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* AR Preview Modal */}
      {showARPreview && arCapability?.hasAR && (
        <ARPreview
          product={product}
          onClose={() => setShowARPreview(false)}
        />
      )}
    </>
  );
};

export default ProductCard;