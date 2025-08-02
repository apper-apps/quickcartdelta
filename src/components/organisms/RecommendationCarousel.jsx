import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { productService } from "@/services/api/productService";
import ProductCard from "@/components/molecules/ProductCard";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import { toast } from "react-toastify";

const RecommendationCarousel = ({ 
  title = "Recommended for You", 
  currentProductId = null,
  className = "" 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const browsingHistory = useSelector((state) => state.browsing?.history || []);
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    loadRecommendations();
  }, [currentProductId, browsingHistory, cartItems]);

  useEffect(() => {
    updateScrollButtons();
  }, [currentIndex, recommendations]);

  const loadRecommendations = async () => {
try {
      setLoading(true);
      setError(null);
      
      // Enhanced collaborative filtering recommendations
      const recs = await productService.getBrowsingRecommendations(
        currentProductId,
        browsingHistory,
        cartItems,
        {
          includeCollaborativeFiltering: true,
          includeTrendingProducts: true,
          includeSeasonalRecommendations: true,
          maxRecommendations: 12
        }
      );
      
      setRecommendations(recs);
      setCurrentIndex(0);
      
      // Track recommendation views for ML improvement
      if (recs.length > 0) {
        console.log(`🎯 Loaded ${recs.length} personalized recommendations`);
      }
      
    } catch (err) {
      setError("Failed to load recommendations");
      console.error("Recommendations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateScrollButtons = () => {
    if (!carouselRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollTo = (direction) => {
    if (!carouselRef.current) return;
    
    const cardWidth = 280; // Approximate card width + gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    const currentScroll = carouselRef.current.scrollLeft;
    
    const newScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollAmount)
      : currentScroll + scrollAmount;
    
    carouselRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
    
    // Update current index for mobile dots
    const newIndex = Math.round(newScroll / cardWidth);
    setCurrentIndex(Math.max(0, Math.min(newIndex, recommendations.length - 1)));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && canScrollRight) {
      scrollTo('right');
    }
    if (isRightSwipe && canScrollLeft) {
      scrollTo('left');
    }
  };

  const scrollToIndex = (index) => {
    if (!carouselRef.current) return;
    
    const cardWidth = 280;
    carouselRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Loading type="products" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Error message={error} onRetry={loadRecommendations} />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {/* Desktop Navigation Buttons */}
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon="ChevronLeft"
            onClick={() => scrollTo('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 p-0"
          />
          <Button
            variant="outline"
            size="sm"
            icon="ChevronRight"
            onClick={() => scrollTo('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 p-0"
          />
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={updateScrollButtons}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {recommendations.map((product, index) => (
            <motion.div
              key={product.Id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex-none w-64 md:w-72"
            >
              <ProductCard 
                product={product}
                className="h-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile Dots Indicator */}
        <div className="flex md:hidden justify-center mt-4 gap-2">
          {Array.from({ length: Math.ceil(recommendations.length / 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index * 2)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                Math.floor(currentIndex / 2) === index
                  ? 'bg-primary'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Fade overlays for visual indication */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none opacity-50" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-50" />
    </div>
  );
};

export default RecommendationCarousel;