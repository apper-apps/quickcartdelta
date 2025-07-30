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
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    loadCategoryData();
  }, [category]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
const [productsData, categoriesData, allProducts] = await Promise.all([
        productService.getByCategory(category),
        productService.getCategories(),
        productService.getAll()
      ]);
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      setCategories(categoriesData.map(cat => cat.name));
      
      // Extract brands from all products for filter options
      const uniqueBrands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
      setBrands(uniqueBrands);
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
          brands={brands}
          priceRange={[0, 1000]}
          minRating={0}
          onFilterChange={handleFilterChange}
          className="w-64 flex-shrink-0"
          totalProducts={products.length}
          filteredCount={filteredProducts.length}
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