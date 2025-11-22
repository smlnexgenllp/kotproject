// src/components/Navbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  ChevronDown,
  ShoppingCart,
  Coffee,
  Table,
  AlertTriangle,
  Armchair,
  History // ← THIS WAS MISSING! Fixed now
} from "lucide-react";

const Navbar = ({
  user,
  cartCount,
  onShowCart,
  tableNumber,
  onShowTable,
  selectedSeats = [],
  occupiedTables = [],
  onOccupiedTableSelect
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOccupiedDropdown, setShowOccupiedDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const userMenuItems = [
    { label: "Order History", icon: History, action: () => navigate("/waiter/history") }, // Now works!
    { label: "Logout", icon: LogOut, action: handleLogout },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-white p-1.5 rounded-xl shadow-md">
              <Coffee className="text-blue-600" size={24} />
            </div>
            <h1 className="text-xl font-bold text-white">KOTPro</h1>
          </motion.div>

          {/* Right Side - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Occupied Tables - Compact on Mobile */}
            {occupiedTables.length > 0 && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOccupiedDropdown(!showOccupiedDropdown)}
                  className="relative flex items-center gap-1 px-2.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition-all"
                  title={`Occupied Tables (${occupiedTables.length})`}
                >
                  <AlertTriangle size={20} />
                  <span className="hidden sm:inline text-sm font-bold ml-1">
                    {occupiedTables.length}
                  </span>
                  <motion.span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                    {occupiedTables.length}
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {showOccupiedDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-orange-200 z-50 overflow-hidden"
                    >
                      <div className="p-3 bg-orange-50 border-b">
                        <h3 className="font-bold text-orange-800 text-sm">Occupied Tables</h3>
                        <p className="text-xs text-orange-600">Tap to manage seats</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {occupiedTables.map((table) => (
                          <button
                            key={table.table_id}
                            onClick={() => {
                              onOccupiedTableSelect(table);
                              setShowOccupiedDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 flex justify-between items-center border-b last:border-0"
                          >
                            <span className="font-medium">Table {table.table_number}</span>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Table Button - Clean & Mobile Friendly */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowTable}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-md font-medium transition-all ${
                tableNumber
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-blue-800 hover:bg-blue-900 text-white"
              }`}
              title={tableNumber ? `Table ${tableNumber}` : "Select Table"}
            >
              {tableNumber ? (
                <>
                  <Armchair size={20} />
                  <span className="text-sm font-bold">
                    <span className="hidden sm:inline">Table </span>
                    {tableNumber}
                  </span>
                  {selectedSeats.length > 0 && (
                    <span className="hidden md:inline ml-1 text-xs opacity-90">
                      ({selectedSeats.map(s => s.seat_number).join(",")})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Table size={20} />
                  <span className="hidden sm:inline text-sm">Select</span>
                </>
              )}
            </motion.button>

            {/* Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowCart}
              className="relative p-2.5 bg-blue-800 rounded-xl hover:bg-blue-900 transition-all shadow-md"
            >
              <ShoppingCart className="text-white" size={22} />
              {cartCount > 0 && (
                <motion.span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {cartCount}
                </motion.span>
              )}
            </motion.button>

            {/* User Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-blue-800 px-3 py-2 rounded-xl hover:bg-blue-900 transition-all shadow-md"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <ChevronDown size={16} className={`text-white transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-blue-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user?.username || "Guest"}</p>
                          <p className="text-sm text-blue-600">{user?.role || "Waiter"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {userMenuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            item.action();
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition text-left"
                        >
                          <item.icon size={18} className="text-blue-600" />
                          <span className="font-medium text-gray-700">{item.label}</span>
                        </button>
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