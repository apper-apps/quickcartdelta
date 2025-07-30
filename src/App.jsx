import React from "react";
import { Route, Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "@/index.css";
import Layout from "@/components/organisms/Layout";
import Search from "@/components/pages/Search";
import Loyalty from "@/components/pages/Loyalty";
import Wishlist from "@/components/pages/Wishlist";
import Checkout from "@/components/pages/Checkout";
import OrderConfirmation from "@/components/pages/OrderConfirmation";
import Home from "@/components/pages/Home";
import ProductDetail from "@/components/pages/ProductDetail";
import Category from "@/components/pages/Category";
import Compare from "@/components/pages/Compare";
import Cart from "@/components/pages/Cart";
import POS from "@/components/pages/POS";
import MarketplaceIntegration from "@/components/pages/MarketplaceIntegration";

function AppComponent() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Layout>
<Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/search" element={<Search />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/loyalty" element={<Loyalty />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/marketplace" element={<MarketplaceIntegration />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default AppComponent;