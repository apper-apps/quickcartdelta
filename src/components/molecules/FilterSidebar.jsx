import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const FilterSidebar = ({ 
  categories = [], 
  priceRange = [0, 1000], 
  minRating = 0,
  onFilterChange,
  className = ""
}) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRange);
  const [selectedRating, setSelectedRating] = useState(minRating);
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryChange = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(updated);
    onFilterChange?.({
      categories: updated,
      priceRange: selectedPriceRange,
      minRating: selectedRating
    });
  };

  const handlePriceChange = (newRange) => {
    setSelectedPriceRange(newRange);
    onFilterChange?.({
      categories: selectedCategories,
      priceRange: newRange,
      minRating: selectedRating
    });
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
    onFilterChange?.({
      categories: selectedCategories,
      priceRange: selectedPriceRange,
      minRating: rating
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange([0, 1000]);
    setSelectedRating(0);
    onFilterChange?.({
      categories: [],
      priceRange: [0, 1000],
      minRating: 0
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700 capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={selectedPriceRange[0]}
              onChange={(e) => handlePriceChange([Number(e.target.value), selectedPriceRange[1]])}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              value={selectedPriceRange[1]}
              onChange={(e) => handlePriceChange([selectedPriceRange[0], Number(e.target.value)])}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={selectedRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="text-primary focus:ring-primary"
              />
              <div className="flex items-center gap-1">
                {[...Array(rating)].map((_, i) => (
                  <ApperIcon key={i} name="Star" className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-sm text-gray-700">& up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={clearFilters}
        className="w-full"
        icon="X"
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:block ${className}`}>
        <div className="card p-6">
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          icon="Filter"
          className="w-full mb-4"
        >
          Filters
        </Button>

        {/* Mobile Filter Modal */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ApperIcon name="X" className="w-5 h-5" />
                    </button>
                  </div>
                  <FilterContent />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default FilterSidebar;