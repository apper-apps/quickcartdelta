import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { orderService } from "@/services/api/orderService";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import ApperIcon from "@/components/ApperIcon";
import { format } from "date-fns";

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Loading type="product-detail" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
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
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed": return "CheckCircle";
      case "processing": return "Clock";
      case "shipped": return "Truck";
      case "delivered": return "Package";
      default: return "Circle";
    }
  };

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
<motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-6"
        >
          <h3 className="font-semibold mb-4">Live Tracking & Delivery</h3>
          
          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-success">
              <ApperIcon name="CheckCircle" className="w-5 h-5" />
              <span>Order confirmed</span>
              <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-3 text-primary">
              <ApperIcon name="Package" className="w-5 h-5" />
              <span>Order being prepared</span>
              <span className="text-xs text-gray-500 ml-auto">In progress</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <ApperIcon name="Truck" className="w-5 h-5" />
              <span>Out for delivery</span>
              <span className="text-xs text-gray-500 ml-auto">Est. 2-3 hours</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <ApperIcon name="Home" className="w-5 h-5" />
              <span>Delivered</span>
              <span className="text-xs text-gray-500 ml-auto">Est. today</span>
            </div>
          </div>

          {/* Live GPS Tracking Placeholder */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Live GPS Tracking</h4>
              <Button size="sm" variant="outline">
                <ApperIcon name="MapPin" className="w-4 h-4 mr-1" />
                View Map
              </Button>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <ApperIcon name="Map" className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Interactive map will show here once your order ships
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Get real-time location updates and ETA notifications
              </p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ApperIcon name="Clock" className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Estimated Delivery</span>
              </div>
              <p className="text-sm text-blue-700">Today, 3:00 PM - 6:00 PM</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ApperIcon name="Phone" className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Delivery Contact</span>
              </div>
              <p className="text-sm text-green-700">SMS alerts enabled</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <ApperIcon name="Info" className="w-4 h-4 inline mr-1" />
              You'll receive real-time notifications and can track your delivery driver live once shipped.
            </p>
          </div>
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