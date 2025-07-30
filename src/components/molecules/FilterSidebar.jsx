import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const FilterSidebar = ({ 
  categories = [], 
  brands = [],
  priceRange = [0, 1000], 
  minRating = 0,
  onFilterChange,
  className = "",
  totalProducts = 0,
  filteredCount = 0
}) => {
const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRange);
  const [selectedRating, setSelectedRating] = useState(minRating);
  const [selectedAvailability, setSelectedAvailability] = useState([]);
  const [selectedSaleOnly, setSelectedSaleOnly] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState([]);
  const [minDiscount, setMinDiscount] = useState(0);
  const [brandSearch, setBrandSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true,
    sale: true,
    condition: true
  });

const handleCategoryChange = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(updated);
    emitFilterChange({
      categories: updated,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handleBrandChange = (brand) => {
    const updated = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    
    setSelectedBrands(updated);
    emitFilterChange({
      categories: selectedCategories,
      brands: updated,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handlePriceChange = (newRange) => {
    setSelectedPriceRange(newRange);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: newRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: rating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handleAvailabilityChange = (availability) => {
    const updated = selectedAvailability.includes(availability)
      ? selectedAvailability.filter(a => a !== availability)
      : [...selectedAvailability, availability];
    
    setSelectedAvailability(updated);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: updated,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handleConditionChange = (condition) => {
    const updated = selectedCondition.includes(condition)
      ? selectedCondition.filter(c => c !== condition)
      : [...selectedCondition, condition];
    
    setSelectedCondition(updated);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: updated,
      minDiscount
    });
  };

  const handleSaleChange = (saleOnly) => {
    setSelectedSaleOnly(saleOnly);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly,
      condition: selectedCondition,
      minDiscount
    });
  };

  const handleDiscountChange = (discount) => {
    setMinDiscount(discount);
    emitFilterChange({
      categories: selectedCategories,
      brands: selectedBrands,
      priceRange: selectedPriceRange,
      minRating: selectedRating,
      availability: selectedAvailability,
      saleOnly: selectedSaleOnly,
      condition: selectedCondition,
      minDiscount: discount
    });
  };

  const emitFilterChange = (filters) => {
    onFilterChange?.(filters);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRange([0, 1000]);
    setSelectedRating(0);
    setSelectedAvailability([]);
    setSelectedSaleOnly(false);
    setSelectedCondition([]);
    setMinDiscount(0);
    setBrandSearch('');
    
    onFilterChange?.({
      categories: [],
      brands: [],
      priceRange: [0, 1000],
      minRating: 0,
      availability: [],
      saleOnly: false,
      condition: [],
      minDiscount: 0
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (selectedPriceRange[0] > 0 || selectedPriceRange[1] < 1000) count++;
    if (selectedRating > 0) count++;
    if (selectedAvailability.length > 0) count += selectedAvailability.length;
    if (selectedSaleOnly) count++;
    if (selectedCondition.length > 0) count += selectedCondition.length;
    if (minDiscount > 0) count++;
    return count;
  };

  const removeFilter = (type, value) => {
    switch (type) {
      case 'category':
        handleCategoryChange(value);
        break;
      case 'brand':
        handleBrandChange(value);
        break;
      case 'price':
        handlePriceChange([0, 1000]);
        break;
      case 'rating':
        handleRatingChange(0);
        break;
      case 'availability':
        handleAvailabilityChange(value);
        break;
      case 'sale':
        handleSaleChange(false);
        break;
      case 'condition':
        handleConditionChange(value);
        break;
      case 'discount':
        handleDiscountChange(0);
        break;
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const pricePresets = [
    { label: "Under $25", range: [0, 25] },
    { label: "$25 - $50", range: [25, 50] },
    { label: "$50 - $100", range: [50, 100] },
    { label: "$100 - $200", range: [100, 200] },
    { label: "Over $200", range: [200, 1000] }
  ];

  const availabilityOptions = ["In Stock", "Out of Stock", "Pre-order"];
  const conditionOptions = ["New", "Refurbished", "Used"];
  const discountOptions = [
    { label: "10% or more", value: 10 },
    { label: "25% or more", value: 25 },
    { label: "50% or more", value: 50 }
  ];

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
{/* Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              {getActiveFilterCount()} Active Filter{getActiveFilterCount() !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-600">
              {filteredCount} of {totalProducts} products
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {cat}
                <button onClick={() => removeFilter('category', cat)} className="hover:text-blue-600">
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedBrands.map(brand => (
              <span key={brand} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {brand}
                <button onClick={() => removeFilter('brand', brand)} className="hover:text-green-600">
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            ))}
            {(selectedPriceRange[0] > 0 || selectedPriceRange[1] < 1000) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                ${selectedPriceRange[0]} - ${selectedPriceRange[1]}
                <button onClick={() => removeFilter('price')} className="hover:text-purple-600">
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {selectedRating}+ stars
                <button onClick={() => removeFilter('rating')} className="hover:text-yellow-600">
                  <ApperIcon name="X" className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('brands')}
            className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
          >
            <span>Brand</span>
            <ApperIcon 
              name={expandedSections.brands ? "ChevronUp" : "ChevronDown"} 
              className="w-4 h-4" 
            />
          </button>
          {expandedSections.brands && (
            <div className="space-y-3">
              {brands.length > 5 && (
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              )}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="text-primary focus:ring-primary rounded"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
        >
          <span>Price Range</span>
          <ApperIcon 
            name={expandedSections.price ? "ChevronUp" : "ChevronDown"} 
            className="w-4 h-4" 
          />
        </button>
        {expandedSections.price && (
          <div className="space-y-4">
            {/* Price Presets */}
            <div className="grid grid-cols-1 gap-2">
              {pricePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePriceChange(preset.range)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedPriceRange[0] === preset.range[0] && selectedPriceRange[1] === preset.range[1]
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Custom Range Inputs */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Custom Range</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={selectedPriceRange[0]}
                  onChange={(e) => handlePriceChange([Number(e.target.value), selectedPriceRange[1]])}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  min="0"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={selectedPriceRange[1]}
                  onChange={(e) => handlePriceChange([selectedPriceRange[0], Number(e.target.value)])}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  min="0"
                  placeholder="Max"
                />
              </div>
              
              {/* Range Slider Visual */}
              <div className="relative h-2 bg-gray-200 rounded-full">
                <div 
                  className="absolute h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{
                    left: `${(selectedPriceRange[0] / 1000) * 100}%`,
                    width: `${((selectedPriceRange[1] - selectedPriceRange[0]) / 1000) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>$0</span>
                <span>$1000+</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
        >
          <span>Customer Rating</span>
          <ApperIcon 
            name={expandedSections.rating ? "ChevronUp" : "ChevronDown"} 
            className="w-4 h-4" 
          />
        </button>
        {expandedSections.rating && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === rating}
                  onChange={() => handleRatingChange(rating)}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(rating)].map((_, i) => (
                      <ApperIcon key={i} name="Star" className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    {[...Array(5-rating)].map((_, i) => (
                      <ApperIcon key={i} name="Star" className="w-4 h-4 text-gray-300" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-700">& up</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('availability')}
          className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
        >
          <span>Availability</span>
          <ApperIcon 
            name={expandedSections.availability ? "ChevronUp" : "ChevronDown"} 
            className="w-4 h-4" 
          />
        </button>
        {expandedSections.availability && (
          <div className="space-y-2">
            {availabilityOptions.map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedAvailability.includes(option)}
                  onChange={() => handleAvailabilityChange(option)}
                  className="text-primary focus:ring-primary rounded"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sale & Discounts */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('sale')}
          className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
        >
          <span>Sale & Discounts</span>
          <ApperIcon 
            name={expandedSections.sale ? "ChevronUp" : "ChevronDown"} 
            className="w-4 h-4" 
          />
        </button>
        {expandedSections.sale && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedSaleOnly}
                onChange={(e) => handleSaleChange(e.target.checked)}
                className="text-primary focus:ring-primary rounded"
              />
              <span className="text-sm text-gray-700">On Sale Only</span>
            </label>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Minimum Discount</div>
              {discountOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="radio"
                    name="discount"
                    checked={minDiscount === option.value}
                    onChange={() => handleDiscountChange(option.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('condition')}
          className="flex items-center justify-between w-full font-semibold text-gray-900 mb-3 hover:text-primary transition-colors"
        >
          <span>Condition</span>
          <ApperIcon 
            name={expandedSections.condition ? "ChevronUp" : "ChevronDown"} 
            className="w-4 h-4" 
          />
        </button>
        {expandedSections.condition && (
          <div className="space-y-2">
            {conditionOptions.map((condition) => (
              <label key={condition} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedCondition.includes(condition)}
                  onChange={() => handleConditionChange(condition)}
                  className="text-primary focus:ring-primary rounded"
                />
                <span className="text-sm text-gray-700">{condition}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex-1"
          icon="X"
          disabled={getActiveFilterCount() === 0}
        >
          Clear All
        </Button>
        {getActiveFilterCount() > 0 && (
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            icon="Check"
          >
            Apply
          </Button>
        )}
      </div>
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