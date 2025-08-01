import React from "react";
import { cn } from "@/utils/cn";

const Badge = ({ children, variant = "default", className, ...props }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-gradient-to-r from-primary to-secondary text-white",
    secondary: "bg-gradient-to-r from-secondary to-purple-600 text-white",
    success: "bg-gradient-to-r from-success to-green-600 text-white",
    warning: "bg-gradient-to-r from-warning to-orange-600 text-white",
    error: "bg-gradient-to-r from-error to-red-600 text-white",
    sale: "sale-badge",
    urgent: "bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse",
    normal: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    'ready-pickup': "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    'picked-up': "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    'in-transit': "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    'delivered': "bg-gradient-to-r from-green-500 to-green-600 text-white"
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