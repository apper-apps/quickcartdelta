import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeFromComparison, clearComparison } from "@/store/comparisonSlice";
import { addToCart } from "@/store/cartSlice";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { productService } from "@/services/api/productService";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Loading from "@/components/ui/Loading";
import Empty from "@/components/ui/Empty";
import ApperIcon from "@/components/ApperIcon";

const Compare = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const comparisonItems = useSelector((state) => state.comparison.items);
  
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (comparisonItems.length > 0) {
      loadSuggestedProducts();
    }
  }, [comparisonItems]);

  const loadSuggestedProducts = async () => {
    if (comparisonItems.length === 0) return;
    
    setLoading(true);
    try {
      const suggested = await productService.getComparableProducts(comparisonItems[0].Id);
      setSuggestedProducts(suggested.slice(0, 4 - comparisonItems.length));
    } catch (error) {
      console.error("Error loading suggested products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromComparison = (productId) => {
    dispatch(removeFromComparison(productId));
    toast.success("Product removed from comparison");
  };

  const handleClearAll = () => {
    dispatch(clearComparison());
    toast.success("Comparison cleared");
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      Id: product.Id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      quantity: 1
    }));
    toast.success("Added to cart");
  };

  const getComparisonRows = () => {
    if (comparisonItems.length === 0) return [];

    const rows = [
      { key: "image", label: "Product", type: "image" },
      { key: "title", label: "Name", type: "text" },
      { key: "price", label: "Price", type: "price" },
      { key: "rating", label: "Rating", type: "rating" },
      { key: "reviews", label: "Reviews", type: "text", format: (value) => `${value} reviews` },
      { key: "category", label: "Category", type: "text", format: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
      { key: "inStock", label: "Availability", type: "stock" },
    ];

    // Add specification rows
    const allSpecs = new Set();
    comparisonItems.forEach(product => {
      if (product.specifications) {
        Object.keys(product.specifications).forEach(spec => allSpecs.add(spec));
      }
    });

    allSpecs.forEach(spec => {
      rows.push({
        key: `spec_${spec}`,
        label: spec.charAt(0).toUpperCase() + spec.slice(1),
        type: "spec",
        specKey: spec
      });
    });

    return rows;
  };

  const renderCellContent = (product, row) => {
    switch (row.type) {
      case "image":
        return (
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddToCart(product)}
                disabled={!product.inStock}
                icon="ShoppingCart"
                className="w-full"
              >
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/product/${product.Id}`)}
                className="w-full"
              >
                View Details
              </Button>
            </div>
          </div>
        );
      
      case "text":
        const value = product[row.key];
        return (
          <span className="text-sm text-gray-700">
            {row.format ? row.format(value) : value}
          </span>
        );
      
      case "price":
        return (
          <div className="space-y-1">
            <div className="price-text">${product.price.toFixed(2)}</div>
            {product.originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </div>
            )}
          </div>
        );
      
      case "rating":
        return (
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
            <span className="text-sm text-gray-600">{product.rating}</span>
          </div>
        );
      
      case "stock":
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.inStock ? "bg-success" : "bg-error"}`} />
            <span className={`text-sm font-medium ${product.inStock ? "text-success" : "text-error"}`}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>
        );
      
      case "spec":
        const specValue = product.specifications?.[row.specKey];
        return (
          <span className="text-sm text-gray-700">
            {specValue || "N/A"}
          </span>
        );
      
      default:
        return null;
    }
  };

  if (comparisonItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Comparison</h1>
          <p className="text-gray-600">Compare products side by side to make informed decisions</p>
        </div>

        <Empty
          icon="GitCompare"
          title="No products to compare"
          description="Add products to your comparison list to see them here"
          action={
            <Button variant="primary" onClick={() => navigate("/")} icon="ShoppingBag">
              Browse Products
            </Button>
          }
        />
      </div>
    );
  }

  const rows = getComparisonRows();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Comparison</h1>
          <p className="text-gray-600">
            Comparing {comparisonItems.length} product{comparisonItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClearAll} icon="Trash2">
            Clear All
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 text-left font-medium text-gray-900 w-40">
                  Specifications
                </th>
                {comparisonItems.map((product) => (
                  <th key={product.Id} className="p-4 text-center min-w-64 relative">
                    <button
                      onClick={() => handleRemoveFromComparison(product.Id)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <ApperIcon name="X" className="w-4 h-4" />
                    </button>
                    <div className="mt-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2">
                        {product.title}
                      </h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">
                    {row.label}
                  </td>
                  {comparisonItems.map((product) => (
                    <td key={product.Id} className="p-4 text-center">
                      {renderCellContent(product, row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Similar Products You Might Like
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedProducts.map((product) => (
              <motion.div
                key={product.Id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 cursor-pointer group"
                onClick={() => navigate(`/product/${product.Id}`)}
              >
                <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                  {product.title}
                </h3>
                <div className="price-text">${product.price.toFixed(2)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;