// src/components/Navbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, LogOut, Settings, ChevronDown, ShoppingCart,
  Coffee, Pizza, Home, Table
} from "lucide-react";

const Navbar = ({ user, cartCount, onShowCart, tableNumber, onShowTable }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const userMenuItems = [
    { label: "Profile", icon: User, action: () => navigate("/profile") },
    { label: "Settings", icon: Settings, action: () => navigate("/settings") },
    { label: "Logout", icon: LogOut, action: handleLogout },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-white p-1.5 rounded-xl shadow-md">
              <Coffee className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">KOTPro</h1>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="text-blue-100 hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-all duration-300 flex items-center gap-1 text-sm"
            >
              <Home size={16} />
              Home
            </button>
            <button
              onClick={() => navigate("/menu")}
              className="text-blue-100 hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-all duration-300 flex items-center gap-1 text-sm"
            >
              <Pizza size={16} />
              Menu
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Table Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowTable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-md ${
                tableNumber 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "bg-blue-800 hover:bg-blue-900 text-white"
              }`}
            >
              <Table size={18} />
              <span className="text-sm font-semibold">
                {tableNumber ? `Table ${tableNumber}` : "Select Table"}
              </span>
            </motion.button>

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowCart}
              className="relative p-2 bg-blue-800 rounded-lg hover:bg-blue-900 transition-all duration-300 shadow-md"
            >
              <ShoppingCart className="text-white" size={20} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-all duration-300 shadow-md"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <ChevronDown 
                  size={14} 
                  className={`text-white transition-transform duration-300 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {user?.username || "Guest User"}
                          </p>
                          <p className="text-blue-600 text-xs font-medium">
                            {user?.role || "Customer"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                      {userMenuItems.map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            item.action();
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group text-sm"
                        >
                          <item.icon 
                            size={16} 
                            className="text-blue-600 group-hover:text-blue-700" 
                          />
                          <span className="font-medium group-hover:text-blue-800">
                            {item.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;