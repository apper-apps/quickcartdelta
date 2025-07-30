import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setQuery, setResults, openSearch, closeSearch, addRecentSearch } from "@/store/searchSlice";
import { productService } from "@/services/api/productService";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";
import { motion, AnimatePresence } from "framer-motion";

const SearchBar = ({ className = "" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { query, results, isOpen, recentSearches } = useSelector((state) => state.search);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        dispatch(closeSearch());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const products = await productService.search(query);
          setSuggestions(products.slice(0, 5));
          dispatch(setResults(products));
        } catch (error) {
          console.error("Search error:", error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, dispatch]);

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      dispatch(addRecentSearch(searchQuery.trim()));
      dispatch(closeSearch());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    dispatch(setQuery(value));
    if (value && !isOpen) {
      dispatch(openSearch());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (product) => {
    dispatch(closeSearch());
    navigate(`/product/${product.Id}`);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={() => dispatch(openSearch())}
        icon="Search"
        iconPosition="left"
        className="pr-12"
      />
      
      <button
        onClick={() => handleSearch()}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
      >
        <ApperIcon name="Search" className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-auto"
          >
            {loading && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              </div>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 px-3 py-2">Products</h4>
                {suggestions.map((product) => (
                  <button
                    key={product.Id}
                    onClick={() => handleSuggestionClick(product)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors duration-200"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <p className="text-sm text-primary font-semibold">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-gray-700 px-3 py-2">Recent Searches</h4>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors duration-200"
                  >
                    <ApperIcon name="Clock" className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length > 2 && suggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <ApperIcon name="Search" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No products found for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;