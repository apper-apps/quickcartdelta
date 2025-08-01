import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { orderService } from "@/services/api/orderService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderData = await orderService.getById(parseInt(orderId));
      setOrder(orderData);
    } catch (err) {
      setError("Order not found");
      console.error("Order confirmation error:", err);
    } finally {
      setLoading(false);
    }
  };
const handleContinueShopping = () => {
    navigate('/');
    toast.success('Continue browsing our amazing products!');
  };

  const handleViewAllOrders = () => {
    navigate('/orders');
    toast.info('View all your orders');
  };

  const handleShareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `Order #${order.Id}`,
        text: `Check out my order from QuickCart!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Order link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Loading type="product-detail" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Error message={error} onRetry={loadOrder} />
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "success";
      case "processing": return "warning";
      case "shipped": return "info";
      case "delivered": return "success";
      case "cancelled": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed": return "CheckCircle";
      case "processing": return "Clock";
      case "shipped": return "Truck";
      case "delivered": return "Package";
      case "cancelled": return "XCircle";
      default: return "Circle";
    }
  };

  const getTrackingSteps = (status) => {
    const steps = [
      { key: 'confirmed', label: 'Order Confirmed', icon: 'CheckCircle', time: '2 min ago' },
      { key: 'processing', label: 'Order Being Prepared', icon: 'Package', time: 'In progress' },
      { key: 'shipped', label: 'Out for Delivery', icon: 'Truck', time: 'Est. 2-3 hours' },
      { key: 'delivered', label: 'Delivered', icon: 'Home', time: 'Est. today' }
    ];

    const statusOrder = ['confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
      future: index > currentIndex
    }));
  };

  const trackingSteps = getTrackingSteps(order.status);
  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = order.total > 50 ? 0 : 6.40;
const tax = subtotal * 0.08;
  const discount = order.discount || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-success to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ApperIcon name="CheckCircle" className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-success mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          {/* Order Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold">Order #{order.Id}</h2>
              <p className="text-gray-600">
                Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
              <ApperIcon name={getStatusIcon(order.status)} className="w-4 h-4" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product?.images?.[0] || "/placeholder.jpg"}
                    alt={item.product?.title || "Product"}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product?.title || "Product"}</h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="gradient-text">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Shipping Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <h3 className="font-semibold mb-4">Shipping Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">
              {order.shipping.firstName} {order.shipping.lastName}
            </p>
            <p className="text-gray-600">
              {order.shipping.address}<br />
              {order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}<br />
              {order.shipping.country}
            </p>
            <p className="text-gray-600 mt-2">
              <ApperIcon name="Mail" className="w-4 h-4 inline mr-1" />
              {order.shipping.email}
            </p>
            <p className="text-gray-600">
              <ApperIcon name="Phone" className="w-4 h-4 inline mr-1" />
              {order.shipping.phone}
            </p>
          </div>
        </motion.div>

        {/* Tracking Information */}
{/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <h3 className="font-semibold mb-4">Order Summary</h3>
          
          {/* Order Items */}
          <div className="space-y-4 mb-6">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                <img 
                  src={item.product?.images?.[0] || '/api/placeholder/60/60'} 
                  alt={item.product?.title}
                  className="w-15 h-15 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product?.title}</h4>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Live Tracking & Delivery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Tracking & Delivery</h3>
            <Button variant="outline" size="sm" onClick={handleShareOrder}>
              <ApperIcon name="Share2" className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            {trackingSteps.map((step, index) => (
              <div 
                key={step.key}
                className={`flex items-center gap-3 ${
                  step.completed 
                    ? 'text-success' 
                    : step.current 
                      ? 'text-primary' 
                      : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-success/10' 
                    : step.current 
                      ? 'bg-primary/10' 
                      : 'bg-gray-100'
                }`}>
                  <ApperIcon name={step.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-medium">{step.label}</span>
                  {step.current && (
                    <div className="w-6 h-1 bg-primary rounded-full animate-pulse mt-1"></div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{step.time}</span>
              </div>
            ))}
          </div>

          {/* Live GPS Tracking */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <ApperIcon name="MapPin" className="w-5 h-5 text-blue-600" />
                Live GPS Tracking
              </h4>
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                <ApperIcon name="Navigation" className="w-4 h-4 mr-1" />
                View Live Map
              </Button>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-center border border-blue-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ApperIcon name="Truck" className="w-8 h-8 text-blue-600" />
              </div>
              <h5 className="font-medium text-gray-900 mb-2">Driver en route to your location</h5>
              <p className="text-sm text-gray-600 mb-3">
                Track your delivery in real-time once your order ships
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium text-blue-800">ETA</div>
                  <div className="text-blue-700">45-60 min</div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-medium text-green-800">Distance</div>
                  <div className="text-green-700">12.3 km</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ApperIcon name="Clock" className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Estimated Delivery</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Today, 3:00 PM - 6:00 PM</p>
              <p className="text-xs text-blue-600 mt-1">Standard delivery</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ApperIcon name="Phone" className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Delivery Contact</span>
              </div>
              <p className="text-sm text-green-700 font-medium">SMS alerts enabled</p>
              <p className="text-xs text-green-600 mt-1">+1 {order.shipping?.phone}</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ApperIcon name="MapPin" className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Delivery Address</span>
              </div>
              <p className="text-sm text-purple-700 font-medium">
                {order.shipping?.address}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {order.shipping?.city}, {order.shipping?.state} {order.shipping?.zipCode}
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <ApperIcon name="Info" className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium mb-1">Real-time Tracking Active</p>
                <p className="text-xs text-blue-700">
                  You'll receive live notifications and can track your delivery driver's location once your order ships. 
                  Download our mobile app for the best tracking experience.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shipping & Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 mb-6"
        >
          {/* Shipping Address */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ApperIcon name="MapPin" className="w-5 h-5 text-primary" />
              Shipping Address
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.shipping?.firstName} {order.shipping?.lastName}</p>
              <p>{order.shipping?.address}</p>
              <p>{order.shipping?.city}, {order.shipping?.state} {order.shipping?.zipCode}</p>
              <p>{order.shipping?.country}</p>
              <p className="text-gray-600 mt-2">{order.shipping?.phone}</p>
              <p className="text-gray-600">{order.shipping?.email}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ApperIcon name="CreditCard" className="w-5 h-5 text-primary" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Method</span>
                <div className="flex items-center gap-2">
                  <ApperIcon name="CreditCard" className="w-4 h-4" />
                  <span className="text-sm">•••• {order.payment?.last4}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transaction ID</span>
                <span className="text-sm font-mono">#{order.Id.toString().padStart(8, '0')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Order Date</span>
                <span className="text-sm">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button onClick={handleContinueShopping} className="flex-1 sm:flex-none">
            <ApperIcon name="ShoppingBag" className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          
          <Button variant="outline" onClick={handleViewAllOrders} className="flex-1 sm:flex-none">
            <ApperIcon name="Package" className="w-4 h-4 mr-2" />
            View All Orders
          </Button>
          
          <Button variant="outline" onClick={() => window.print()} className="flex-1 sm:flex-none">
            <ApperIcon name="Printer" className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            icon="ShoppingBag"
            className="flex-1"
          >
            Continue Shopping
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.print()}
            icon="Printer"
            className="flex-1"
          >
            Print Receipt
          </Button>
        </motion.div>

        {/* Contact Support */}
        <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Need help with your order?
          </p>
          <Button variant="ghost" size="sm" icon="MessageCircle">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;