import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { posService } from "@/services/api/posService";
import { productService } from "@/services/api/productService";
import ApperIcon from "@/components/ApperIcon";
import ProductCard from "@/components/molecules/ProductCard";
import SearchBar from "@/components/molecules/SearchBar";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Cart from "@/components/pages/Cart";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { addToCart, clearCart, generateReceipt, setOfflineMode, syncOfflineData, togglePOSMode } from "@/store/cartSlice";

const POS = () => {
  const dispatch = useDispatch();
  const { items, total, pos } = useSelector(state => state.cart);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentCustomer, setCurrentCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    dispatch(togglePOSMode());
    loadProducts();
    
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      dispatch(setOfflineMode(false));
      syncPendingData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      dispatch(setOfflineMode(true));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncPendingData = async () => {
    try {
      await posService.syncOfflineData();
      dispatch(syncOfflineData());
      toast.success('Offline data synced successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync offline data');
    }
  };

  const handleAddToCart = (product, quantity = 1) => {
    dispatch(addToCart({ 
      product, 
      quantity,
      customerId: currentCustomer || null
    }));
    toast.success(`${product.name} added to cart`);
  };

  const handleProcessPayment = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      const receiptNumber = `RCP-${Date.now()}`;
      dispatch(generateReceipt(receiptNumber));

      const orderData = {
        items,
        total,
        paymentMethod,
        customer: currentCustomer,
        receiptNumber,
        posMode: true,
        splitBill: pos.splitBill.enabled ? pos.splitBill : null,
        offlineCreated: !isOnline
      };

      await posService.processPayment(orderData);
      
      dispatch(clearCart());
      setCurrentCustomer('');
      
      toast.success('Payment processed successfully!');
      
      // Print receipt (mock)
      setTimeout(() => {
        toast.info('Receipt printed');
      }, 1000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment processing failed');
    }
  };

  const handleSearch = (results) => {
    setSearchResults(results);
  };

  if (loading) return <Loading type="grid" count={8} />;
  if (error) return <Error message={error} onRetry={loadProducts} />;

  const displayProducts = searchResults.length > 0 ? searchResults : products;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">POS System</h1>
              <Badge variant={isOnline ? "success" : "error"}>
                <ApperIcon name={isOnline ? "Wifi" : "WifiOff"} size={12} className="mr-1" />
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/marketplace'}
                icon="Globe"
              >
                Marketplace
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                icon="Home"
              >
                Back to Store
              </Button>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SearchBar onSearch={handleSearch} className="w-full" />
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={currentCustomer}
                onChange={(e) => setCurrentCustomer(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Pay</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <motion.div
                  key={product.Id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => handleAddToCart(product)}
                >
                  <ProductCard product={product} showQuickAdd />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Current Sale</h3>
              
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in cart</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.Id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold gradient-text">${total.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleProcessPayment}
                        className="w-full"
                        icon="CreditCard"
                      >
                        Process Payment
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch(clearCart())}
                        className="w-full"
                        icon="Trash2"
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;