import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "@/store/wishlistSlice";
import { addToComparison, removeFromComparison } from "@/store/comparisonSlice";
import { addToHistory } from "@/store/browsingSlice";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { productService } from "@/services/api/productService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Home from "@/components/pages/Home";
import Cart from "@/components/pages/Cart";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { addToCart } from "@/store/cartSlice";
import RecommendationCarousel from "@/components/organisms/RecommendationCarousel";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
const wishlistItems = useSelector((state) => state.wishlist.items);
  const comparisonItems = useSelector((state) => state.comparison.items);
  
// State declarations - must be before useEffect hooks that reference them
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});
  // Derived state calculations
  const isInWishlist = wishlistItems.some(item => item.Id === parseInt(id));
  const isInComparison = comparisonItems.some(item => item.Id === parseInt(id));

  // Track product viewing for recommendations
  useEffect(() => {
    if (product && product.Id) {
      dispatch(addToHistory(product.Id));
    }
  }, [product, dispatch]);

  const handleCompareToggle = () => {
    if (isInComparison) {
      dispatch(removeFromComparison(product.Id));
      toast.success("Removed from comparison");
    } else {
      if (comparisonItems.length >= 4) {
        toast.error("Maximum 4 products can be compared");
        return;
      }
      dispatch(addToComparison(product));
      toast.success("Added to comparison");
    }
  };
const handleWishlistToggle = () => {
    if (product) {
      dispatch(toggleWishlist(product));
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);
const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const productData = await productService.getById(parseInt(id));
      setProduct(productData);
      // Reset image states when product changes
      setImageErrors({});
      setImageLoading({});
    } catch (err) {
      setError("Product not found");
      console.error("Product detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (imageIndex) => {
    setImageErrors(prev => ({ ...prev, [imageIndex]: true }));
    setImageLoading(prev => ({ ...prev, [imageIndex]: false }));
  };

  const handleImageLoad = (imageIndex) => {
    setImageLoading(prev => ({ ...prev, [imageIndex]: false }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    dispatch(addToCart({ product, quantity }));
    toast.success(`${quantity} x ${product.title} added to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  if (loading) {
    return <Loading type="product-detail" />;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Error message={error} onRetry={loadProduct} />
      </div>
    );
  }

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const tabs = [
    { id: "description", name: "Description", icon: "FileText" },
    { id: "specifications", name: "Specifications", icon: "Settings" },
    { id: "reviews", name: "Reviews", icon: "Star" },
    { id: "shipping", name: "Shipping", icon: "Truck" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate("/")} className="hover:text-primary">
            Home
          </button>
          <ApperIcon name="ChevronRight" className="w-4 h-4" />
          <button 
            onClick={() => navigate(`/category/${product.category}`)}
            className="hover:text-primary capitalize"
          >
            {product.category}
          </button>
          <ApperIcon name="ChevronRight" className="w-4 h-4" />
          <span className="text-gray-900 truncate">{product.title}</span>
        </div>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
<motion.div 
            className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative"
            layoutId={`product-image-${product.Id}`}
          >
            {discountPercent > 0 && (
              <Badge variant="sale" className="absolute top-4 left-4 z-10">
                -{discountPercent}%
              </Badge>
            )}
            {imageLoading[selectedImage] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent"></div>
              </div>
            )}
            <img
              src={imageErrors[selectedImage] ? 
                `https://via.placeholder.com/600x600/e5e7eb/6b7280?text=${encodeURIComponent(product.title.slice(0, 30))}` : 
                product.images[selectedImage]
              }
              alt={product.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading[selectedImage] ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => handleImageLoad(selectedImage)}
              onError={() => handleImageError(selectedImage)}
            />
            {imageErrors[selectedImage] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center p-6">
                  <ApperIcon name="ImageOff" size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500">Image unavailable</p>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <ApperIcon
                    key={i}
                    name="Star"
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <p className="text-success font-medium">
                You save ${(product.originalPrice - product.price).toFixed(2)} ({discountPercent}% off)
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${product.inStock ? "bg-success" : "bg-error"}`} />
            <span className={`font-medium ${product.inStock ? "text-success" : "text-error"}`}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={quantity <= 1}
              >
                <ApperIcon name="Minus" className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <ApperIcon name="Plus" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              icon="ShoppingCart"
              className="w-full"
            >
              Add to Cart
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              icon="Zap"
              className="w-full"
            >
              Buy Now
            </Button>
            
<div className="flex gap-3">
              <Button 
                variant={isInComparison ? "primary" : "outline"} 
                size="md" 
                icon="GitCompare" 
                onClick={handleCompareToggle}
                className="flex-1"
              >
                {isInComparison ? "Remove Compare" : "Add to Compare"}
              </Button>
<Button 
                variant="outline" 
                size="md" 
                icon="Heart" 
                className={`flex-1 ${isInWishlist ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                onClick={handleWishlistToggle}
              >
                {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
              <Button variant="outline" size="md" icon="Share2" className="flex-1">
                Share
              </Button>
            </div>
          </div>

          {/* Product Features */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ApperIcon name="Truck" className="w-5 h-5 text-primary" />
              <span className="text-sm">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="RotateCcw" className="w-5 h-5 text-primary" />
              <span className="text-sm">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Shield" className="w-5 h-5 text-primary" />
              <span className="text-sm">1 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Headphones" className="w-5 h-5 text-primary" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ApperIcon name={tab.icon} className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700 capitalize">{key}:</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <ApperIcon name="MessageCircle" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to review this product</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Write a Review
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Free Standard Shipping</h4>
                    <p className="text-green-700">On orders over $50. Delivered in 3-5 business days.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Express Shipping</h4>
                    <p className="text-blue-700">$9.99 - Delivered in 1-2 business days.</p>
                  </div>
<div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Same Day Delivery</h4>
                    <p className="text-purple-700">$19.99 - Available in select areas. Order by 2PM.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Product Recommendations */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <RecommendationCarousel 
            title="You might also like"
            currentProductId={product?.Id}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;