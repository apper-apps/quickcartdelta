import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/molecules/ProductCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import ApperIcon from "@/components/ApperIcon";

const ProductGrid = ({ 
  products = [], 
  loading = false, 
  error = null, 
  onRetry,
  sortBy = "featured",
  onSortChange,
  viewMode = "grid",
  onViewModeChange,
  className = ""
}) => {
  const [sortedProducts, setSortedProducts] = useState([]);

  useEffect(() => {
    if (!products.length) return;

    let sorted = [...products];
    
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // featured
        // Keep original order or sort by featured flag
        break;
    }
    
    setSortedProducts(sorted);
  }, [products, sortBy]);

  if (loading) {
    return <Loading type="products" count={8} />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

  if (!sortedProducts.length) {
    return (
      <Empty
        title="No products found"
        description="Try adjusting your filters or search terms"
        actionText="Clear Filters"
        icon="Package"
      />
    );
  }

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "rating", label: "Customer Rating" },
    { value: "newest", label: "Newest First" },
    { value: "name", label: "Name A-Z" },
  ];

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {sortedProducts.length} product{sortedProducts.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          {onSortChange && (
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ApperIcon name="Grid3X3" className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ApperIcon name="List" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <motion.div
        layout
        className={
          viewMode === "list"
            ? "space-y-4"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        }
      >
        <AnimatePresence>
          {sortedProducts.map((product, index) => (
            <motion.div
              key={product.Id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard
                product={product}
                className={viewMode === "list" ? "flex-row" : ""}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ProductGrid;