import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  children, 
  loading = false, 
  icon,
  iconPosition = "left",
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-primary hover:bg-primary/10",
    danger: "bg-gradient-to-r from-error to-red-600 text-white hover:brightness-110"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-6 py-3 text-base rounded-lg",
    lg: "px-8 py-4 text-lg rounded-xl"
  };

  const renderIcon = (iconName) => (
    <ApperIcon 
      name={loading ? "Loader2" : iconName} 
      className={cn(
        "w-4 h-4",
        loading && "animate-spin",
        children && (iconPosition === "left" ? "mr-2" : "ml-2")
      )} 
    />
  );

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        loading && "cursor-wait",
        className
      )}
      ref={ref}
      disabled={loading}
      {...props}
    >
      {icon && iconPosition === "left" && renderIcon(icon)}
      {children}
      {icon && iconPosition === "right" && renderIcon(icon)}
    </button>
  );
});

Button.displayName = "Button";

export default Button;