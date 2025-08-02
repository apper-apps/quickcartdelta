import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SearchIcon } from "lucide-react";
import { productService } from "@/services/api/productService";
import FilterSidebar from "@/components/molecules/FilterSidebar";
import SearchBar from "@/components/molecules/SearchBar";
import ProductGrid from "@/components/organisms/ProductGrid";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import { setQuery, setResults } from "@/store/searchSlice";

export default function Search() {
const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { query, results } = useSelector((state) => state.search);
  const { items: cartItems = [] } = useSelector((state) => state.cart || {});
  const { items: wishlistItems = [] } = useSelector((state) => state.wishlist || {});
  const { browsingHistory = [] } = useSelector((state) => state.user || {});
const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState("grid");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== query) {
      dispatch(setQuery(q));
      performSearch(q);
}
  }, [searchParams, dispatch, query]);
  useEffect(() => {
loadCategories();
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const products = await productService.getAll();
      const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
      setBrands(uniqueBrands);
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  const loadCategories = async () => {
    try {
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData.map(cat => cat.name));
    } catch (err) {
      console.error("Categories error:", err);
    }
  };

const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      dispatch(setResults([]));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Enhanced search with NLP-like intent analysis
      const searchResults = await productService.search(searchQuery, {
        includeRecommendations: true,
        userContext: {
          browsing: browsingHistory,
          cart: cartItems,
          wishlist: wishlistItems
        }
      });
      
      dispatch(setResults(searchResults));
      
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

const handleFilterChange = (filters) => {
    let filtered = [...results];

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
      );
    }

    // Filter by brands
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter(product => 
        filters.brands.includes(product.brand)
      );
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && 
      product.price <= filters.priceRange[1]
    );

    // Filter by rating
    if (filters.minRating > 0) {
      filtered = filtered.filter(product => 
        product.rating >= filters.minRating
      );
    }

    // Filter by availability
    if (filters.availability && filters.availability.length > 0) {
      filtered = filtered.filter(product => {
        if (filters.availability.includes('In Stock') && product.stock > 0) return true;
        if (filters.availability.includes('Out of Stock') && product.stock === 0) return true;
        if (filters.availability.includes('Pre-order') && product.preOrder) return true;
        return false;
      });
    }

    // Filter by sale only
    if (filters.saleOnly) {
      filtered = filtered.filter(product => 
        product.salePrice && product.salePrice < product.price
      );
    }

    // Filter by minimum discount
    if (filters.minDiscount > 0) {
      filtered = filtered.filter(product => {
        if (product.salePrice) {
          const discount = ((product.price - product.salePrice) / product.price) * 100;
          return discount >= filters.minDiscount;
        }
        return false;
      });
    }

    // Filter by condition  
    if (filters.condition && filters.condition.length > 0) {
      filtered = filtered.filter(product => 
        filters.condition.includes(product.condition || 'New')
      );
    }

    setFilteredResults(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        
        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar />
        </div>
        
        {/* Search Results Info */}
        {query && (
          <div className="mt-4">
            <p className="text-gray-600">
              {loading ? (
                "Searching..."
              ) : (
                <>
                  {filteredResults.length > 0 
                    ? `${filteredResults.length} result${filteredResults.length !== 1 ? "s" : ""} for "${query}"`
                    : `No results found for "${query}"`
                  }
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      {query ? (
        <div className="flex gap-8">
          {/* Filter Sidebar */}
<FilterSidebar
            categories={categories}
            brands={brands}
            priceRange={[0, 1000]}
            minRating={0}
            onFilterChange={handleFilterChange}
            className="w-64 flex-shrink-0"
            totalProducts={results.length}
            filteredCount={filteredResults.length}
          />

          {/* Search Results */}
          <div className="flex-1">
            {loading ? (
              <Loading type="products" count={8} />
            ) : error ? (
              <Error message={error} onRetry={() => performSearch(query)} />
            ) : filteredResults.length > 0 ? (
              <ProductGrid
                products={filteredResults}
                loading={false}
                error={null}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            ) : query ? (
              <Empty
                title="No products found"
                description={`We couldn't find any products matching "${query}". Try different keywords or browse our categories.`}
                actionText="Browse Categories"
                actionPath="/"
                icon="Search"
              />
) : null}
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="w-12 h-12 text-primary/60" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Search for Products</h2>
          <p className="text-gray-600 mb-6">
            Enter a search term above to find products you're looking for.
          </p>
          
          {/* Popular Searches */}
          <div className="text-left">
            <h3 className="font-medium mb-3">Popular Searches:</h3>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Clothing", "Home & Garden", "Sports", "Books"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    dispatch(setQuery(term));
                    performSearch(term);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-primary hover:text-white rounded-full text-sm transition-colors duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}