// src/components/CashierLayout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";

const CashierLayout = ({ children, activePage, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
      {/* Sidebar for desktop */}
      {!isMobile && (
        <motion.div
          animate={{ 
            width: sidebarOpen ? 288 : 0, // 288px = 72 * 4 (w-72)
            opacity: sidebarOpen ? 1 : 0
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-screen fixed left-0 top-0 z-40 overflow-hidden"
        >
          <Sidebar 
            active={activePage} 
            onLogout={handleLogout} 
          />
        </motion.div>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-screen z-50"
            >
              <Sidebar 
                active={activePage} 
                onLogout={handleLogout} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen && !isMobile ? "lg:ml-72" : "ml-0"
        }`}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-xl font-bold text-blue-900">
                KOT<span className="text-blue-600">Pro</span>
              </h1>
              <div className="w-10"></div> {/* Spacer for balance */}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CashierLayout;