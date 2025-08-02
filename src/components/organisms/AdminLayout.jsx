import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApperIcon } from '@/components/ApperIcon';
import { toast } from 'react-toastify';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
    { path: '/admin/products', label: 'Products', icon: 'Package' },
    { path: '/admin/users', label: 'Users', icon: 'Users' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
    { path: '/admin/settings', label: 'Settings', icon: 'Settings' }
  ];

  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    // Navigate to main app or login
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ApperIcon name="Menu" size={20} />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toast.info('Notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 relative"
            >
              <ApperIcon name="Bell" size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ApperIcon name="LogOut" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toast.info('Notifications')}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <ApperIcon name="Bell" size={18} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 lg:mt-0">
            <div className="px-4 py-2">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                      ${isActiveRoute(item.path)
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <ApperIcon name={item.icon} size={18} className="mr-3" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <ApperIcon name="User" size={16} className="text-white" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Admin User</div>
                  <div className="text-xs text-gray-500">admin@example.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to="/"
                  className="flex-1 btn-secondary text-sm py-2 text-center"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ApperIcon name="ArrowLeft" size={14} className="mr-1" />
                  Back to Store
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Logout"
                >
                  <ApperIcon name="LogOut" size={16} />
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;