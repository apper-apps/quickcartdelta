import React from "react";
import { cn } from "@/utils/cn";

const Badge = ({ children, variant = "default", className, ...props }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 border border-gray-200",
    primary: "bg-gradient-to-r from-primary to-secondary text-white border-none",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300",
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white border-none",
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-none",
    error: "bg-gradient-to-r from-red-500 to-red-600 text-white border-none",
    sale: "sale-badge",
    urgent: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-none animate-pulse",
    normal: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300",
    "ready-pickup": "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
    "out-for-delivery": "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
    // Discrepancy-specific variants
    "pending-verification": "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-300",
    "auto-deducted": "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
    "escalated": "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 animate-pulse",
    "resolved": "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300",
    "customer-confirmed": "bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border border-teal-300"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;