// src/components/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, CheckCircle, Settings, LogOut
} from "lucide-react";

const Sidebar = ({ active, onLogout }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuItems = [
    { id: "dashboard", label: "Cashier Dashboard", icon: LayoutDashboard, path: "/cashier" },
    { id: "pending", label: "Pending Orders", icon: ShoppingCart, path: "/cashier/pending-orders" },
    { id: "completed", label: "Completed Orders", icon: CheckCircle, path: "/cashier/completed-orders" },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <motion.aside
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      className="w-72 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 shadow-xl z-50"
    >
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
          KOT<span className="text-blue-600">Pro</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">Cashier Portal</p>
      </div>

      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
            {user.username?.[0]?.toUpperCase() || "C"}
          </div>
          <div>
            <p className="text-gray-900 font-semibold">{user.username || "Cashier"}</p>
            <p className="text-blue-700 text-xs font-medium">cashier</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-4">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-4 mb-2 rounded-xl transition-all ${
              active === item.id
                ? "bg-blue-700 text-white shadow-lg"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon size={22} />
            <span className="font-medium">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
        >
          <LogOut size={22} />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;