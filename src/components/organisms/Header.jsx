import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleCart } from "@/store/cartSlice";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import ApperIcon from "@/components/ApperIcon";
import { motion } from "framer-motion";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { itemCount } = useSelector((state) => state.cart);

  const categories = [
    { name: "Electronics", path: "/category/electronics" },
    { name: "Clothing", path: "/category/clothing" },
    { name: "Home & Garden", path: "/category/home-garden" },
    { name: "Sports", path: "/category/sports" },
    { name: "Books", path: "/category/books" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <ApperIcon name="ShoppingBag" className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QuickCart</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search - Mobile */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
              onClick={() => navigate("/search")}
            >
              <ApperIcon name="Search" className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <button className="hidden sm:flex p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200">
              <ApperIcon name="Heart" className="w-5 h-5" />
            </button>

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
            >
              <ApperIcon name="ShoppingCart" className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge variant="primary" className="min-w-[20px] h-5 text-xs">
                    {itemCount}
                  </Badge>
                </motion.div>
              )}
            </motion.button>

            {/* User Menu */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" icon="User">
                Account
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-6 py-3 border-t border-gray-100">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              className="text-sm text-gray-600 hover:text-primary transition-colors duration-200 relative group"
            >
              {category.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
          <Link
            to="/deals"
            className="text-sm font-medium text-accent hover:text-red-600 transition-colors duration-200"
          >
            🔥 Hot Deals
          </Link>
        </nav>

        {/* Search Bar - Mobile */}
        <div className="md:hidden py-3 border-t border-gray-100">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;