// src/components/TimingManager.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../api";
import SubcategoryTimings from "../../admin/components/SubcategoryTiming";
import FoodItemTimings from "../../admin/components/FoodItemTimings";
import StockManagement from "../../admin/components/StockManage";
import CashierLayout from "../components/CashierLayout";
import { useNavigate } from "react-router-dom";
const TimingManagers = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("subcategories");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const tabs = [
    { id: "subcategories", name: "Subcategory Timings", icon: "📅" },
    { id: "fooditems", name: "Food Item Timings", icon: "🍽️" },
    { id: "stock", name: "Stock Management", icon: "📦" },
  ];

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <CashierLayout activePage="stocks">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900"
          >
            Timing & Stock Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-600 mt-2"
          >
            Manage food availability timings and stock levels
          </motion.p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 sm:p-4 rounded-lg border text-sm sm:text-base ${
              message.includes("success") || message.includes("Success")
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Mobile Tabs - Only show on small screens */}
        <div className="sm:hidden bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-colors flex-1 min-w-0 justify-center ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2 text-base">{tab.icon}</span>
                <span>
                  {tab.name.split(' ')[0].substring(0, 3)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Tabs - Only show on larger screens */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm transition-colors flex-1 justify-center ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-3 sm:p-4 md:p-6">
            {activeTab === "subcategories" && (
              <SubcategoryTimings onMessage={setMessage} />
            )}
            {activeTab === "fooditems" && (
              <FoodItemTimings onMessage={setMessage} />
            )}
            {activeTab === "stock" && (
              <StockManagement onMessage={setMessage} />
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
                />
                <p className="text-gray-700 font-medium">Loading...</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </CashierLayout>
  );
};

export default TimingManagers;
