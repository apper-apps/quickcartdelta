import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import CartDrawer from "@/components/organisms/CartDrawer";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { setCategory, setQuery } from "@/store/searchSlice";
import { toggleCart } from "@/store/cartSlice";

const Header = () => {
  const navigate = useNavigate();
const dispatch = useDispatch();
const cartItems = useSelector((state) => state.cart.items);
  const comparisonItems = useSelector((state) => state.comparison.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [loyaltyData, setLoyaltyData] = useState({ points: 250, tier: "Gold" });
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
<button 
              onClick={() => navigate("/wishlist")}
              className="hidden sm:flex relative p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
            >
              <ApperIcon name="Heart" className="w-5 h-5" />
{wishlistItems.length > 0 && (
                <Badge variant="primary" className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs">
                  {wishlistItems.length}
                </Badge>
              )}
            </button>

            {/* Cart */}
            <motion.button
whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
            >
              <ApperIcon name="ShoppingCart" className="w-5 h-5" />
              {cartItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge variant="primary" className="min-w-[20px] h-5 text-xs">
                    {cartItems.length}
                  </Badge>
                </motion.div>
              )}
            </motion.button>

            {/* Comparison */}
            <button
              onClick={() => navigate("/compare")}
              className="relative p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
            >
              <ApperIcon name="GitCompare" className="w-5 h-5" />
              {comparisonItems.length > 0 && (
                <Badge variant="primary" className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs">
                  {comparisonItems.length}
                </Badge>
              )}
            </button>

            {/* User Menu */}
{/* Language & Currency Selector */}
            <div className="hidden lg:flex items-center gap-2">
              <select className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
              </select>
              <select className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>

            {/* Enhanced Loyalty Points */}
            <button
              onClick={() => navigate("/loyalty")}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-lg hover:from-yellow-200 hover:to-yellow-300 transition-colors duration-200 border border-yellow-300"
            >
              <div className="flex items-center gap-1">
                <ApperIcon 
                  name={loyaltyData.tier === "Diamond" ? "Diamond" : loyaltyData.tier === "Platinum" ? "Gem" : loyaltyData.tier === "Gold" ? "Crown" : "Star"} 
                  className="w-4 h-4" 
                  style={{ color: loyaltyData.tier === "Diamond" ? "#B9F2FF" : loyaltyData.tier === "Platinum" ? "#E5E4E2" : loyaltyData.tier === "Gold" ? "#FFD700" : "#C0C0C0" }}
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium text-xs">{loyaltyData.points} pts</span>
                  <span className="text-xs opacity-75">{loyaltyData.tier}</span>
                </div>
              </div>
            </button>
{/* User Menu & Delivery Access */}
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                icon="Truck"
                onClick={() => navigate('/delivery')}
                className="text-blue-600 hover:text-blue-700"
              >
                Driver
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                icon="User"
                onClick={() => navigate('/account')}
              >
                Account
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center justify-center py-3 border-t border-gray-100">
          <div className="flex items-center space-x-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors duration-200"
                onClick={() => {
                  dispatch(setCategory(category.name.toLowerCase()));
                  dispatch(setQuery(""));
                }}
              >
                {category.name}
              </Link>
            ))}
            <Link
              to="/deals"
              className="text-sm font-medium text-accent hover:text-red-600 transition-colors duration-200"
            >
              🔥 Hot Deals
            </Link>
          </div>
        </nav>

        {/* Search Bar - Mobile */}
        <div className="md:hidden py-3 border-t border-gray-100">
          <SearchBar />
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  );
};

export default Header;