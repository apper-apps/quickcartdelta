import React from "react";
import { useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";

const Empty = ({ 
  title = "Nothing here yet", 
  description = "We couldn't find what you're looking for.",
  actionText = "Start Shopping",
  actionPath = "/",
  icon = "Package",
  className = ""
}) => {
  const navigate = useNavigate();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-full mb-6">
        <ApperIcon name={icon} className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md">{description}</p>
      <button
        onClick={() => navigate(actionPath)}
        className="btn-primary inline-flex items-center gap-2"
      >
        <ApperIcon name="ShoppingBag" className="w-4 h-4" />
        {actionText}
      </button>
    </div>
  );
};

export default Empty;