import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import "@/index.css";
import Layout from "@/components/organisms/Layout";
import Error from "@/components/ui/Error";
import Search from "@/components/pages/Search";
import Loyalty from "@/components/pages/Loyalty";
import MarketplaceIntegration from "@/components/pages/MarketplaceIntegration";
import Wishlist from "@/components/pages/Wishlist";
import Account from "@/components/pages/Account";
import Checkout from "@/components/pages/Checkout";
import OrderConfirmation from "@/components/pages/OrderConfirmation";
import Home from "@/components/pages/Home";
import POS from "@/components/pages/POS";
import ProductDetail from "@/components/pages/ProductDetail";
import Category from "@/components/pages/Category";
import Compare from "@/components/pages/Compare";
import Cart from "@/components/pages/Cart";
import { store } from "@/store/store";

function App() {
return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <ErrorBoundary>
            <Layout>
              <ErrorBoundary fallback={(error, retry) => (
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Page Error
                  </h2>
                  <p className="text-gray-600 mb-4">
                    This page encountered an error. Please try again.
                  </p>
                  <button
                    onClick={retry}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              )}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:id" element={<Category />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
<Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/order/:id" element={<OrderConfirmation />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/loyalty" element={<Loyalty />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/marketplace" element={<MarketplaceIntegration />} />
<Route path="/account" element={<Account />} />
                </Routes>
              </ErrorBoundary>
            </Layout>
          </ErrorBoundary>
        </div>
<ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;