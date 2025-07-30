import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { productService } from "@/services/api/productService";
import ProductGrid from "@/components/organisms/ProductGrid";
import FilterSidebar from "@/components/molecules/FilterSidebar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const Category = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategoryData();
  }, [category]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getByCategory(category),
        productService.getCategories()
      ]);
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setCategories(categoriesData.map(cat => cat.name));
    } catch (err) {
      setError("Failed to load category products");
      console.error("Category page error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...products];

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category)
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

    setFilteredProducts(filtered);
  };

  const categoryTitle = category === "all" 
    ? "All Products" 
    : category.split("-").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ");

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{categoryTitle}</h1>
        <p className="text-gray-600">
          Discover our amazing collection of {categoryTitle.toLowerCase()}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filter Sidebar */}
        <FilterSidebar
          categories={categories}
          priceRange={[0, 1000]}
          minRating={0}
          onFilterChange={handleFilterChange}
          className="w-64 flex-shrink-0"
        />

        {/* Main Content */}
        <div className="flex-1">
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            error={error}
            onRetry={loadCategoryData}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    </div>
  );
};

export default Category;