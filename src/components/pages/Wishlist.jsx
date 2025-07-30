import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { removeFromWishlist, clearWishlist, markAlertAsRead } from '@/store/wishlistSlice';
import { addToCart } from '@/store/cartSlice';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const priceAlerts = useSelector((state) => state.wishlist.priceAlerts);
  const [loading, setLoading] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRemoveItem = (productId, productTitle) => {
    dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      Id: item.Id,
      title: item.title,
      price: item.currentPrice,
      images: item.images,
      quantity: 1
    }));
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      dispatch(clearWishlist());
    }
  };

  const handleMarkAlertRead = (alertId) => {
    dispatch(markAlertAsRead(alertId));
  };

  const unreadAlerts = priceAlerts.filter(alert => !alert.read);

  if (loading) {
    return <Loading />;
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gradient-text">My Wishlist</h1>
        </div>
        <Empty
          icon="Heart"
          title="Your wishlist is empty"
          description="Save items you love to see them here"
          actionText="Start Shopping"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold gradient-text">My Wishlist</h1>
          <Badge variant="secondary" className="text-sm">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Price Alerts */}
          {unreadAlerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon="Bell"
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative"
            >
              Price Alerts
              <Badge variant="accent" className="absolute -top-2 -right-2 min-w-[20px] h-5 text-xs">
                {unreadAlerts.length}
              </Badge>
            </Button>
          )}
          
          {/* Clear Wishlist */}
          <Button
            variant="ghost"
            size="sm"
            icon="Trash2"
            onClick={handleClearWishlist}
            className="text-gray-500 hover:text-red-500"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Price Alerts Panel */}
      <AnimatePresence>
        {showAlerts && unreadAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                <ApperIcon name="TrendingDown" className="w-5 h-5" />
                Price Drop Alerts 🎉
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon="X"
                onClick={() => setShowAlerts(false)}
              />
            </div>
            
            <div className="space-y-3">
              {unreadAlerts.map((alert) => (
                <motion.div
                  key={alert.Id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.productTitle}</p>
                    <p className="text-sm text-gray-600">
                      Price dropped from <span className="line-through">${alert.oldPrice}</span> to{' '}
                      <span className="text-green-600 font-bold">${alert.newPrice}</span>{' '}
                      <Badge variant="success" className="ml-2">
                        {alert.priceDropPercent}% OFF
                      </Badge>
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleMarkAlertRead(alert.Id);
                      navigate(`/product/${alert.productId}`);
                    }}
                  >
                    View Deal
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {wishlistItems.map((item) => (
            <motion.div
              key={item.Id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.images?.[0] || '/placeholder-image.jpg'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Price Drop Badge */}
                {item.priceDropAlert && (
                  <Badge
                    variant="success"
                    className="absolute top-3 left-3 animate-pulse"
                  >
                    Price Drop!
                  </Badge>
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.Id, item.title)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <ApperIcon name="X" className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 
                  className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                  onClick={() => handleViewProduct(item.Id)}
                >
                  {item.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-primary">
                    ${item.currentPrice}
                  </span>
                  {item.originalPrice !== item.currentPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      ${item.originalPrice}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon="ShoppingCart"
                    onClick={() => handleAddToCart(item)}
                    className="flex-1"
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="Eye"
                    onClick={() => handleViewProduct(item.Id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State for Filtered Results */}
      {wishlistItems.length === 0 && (
        <Empty
          icon="Heart"
          title="No items found"
          description="Try adjusting your filters or add more items to your wishlist"
        />
      )}
    </div>
  );
};

export default Wishlist;