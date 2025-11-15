// src/components/CashierDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  CheckCircle,
  Users,
  Settings,
  LogOut,
  IndianRupee,
  Clock,
  AlertCircle,
  Coffee,
  CreditCard,
  Smartphone,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import API from "../../api";

const API_URL = "cashier-orders/";

// ──────────────────────────────────────
//  SAFE NUMBER FORMATTER
// ──────────────────────────────────────
const safeFixed = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

// ──────────────────────────────────────
//  PAYMENT ICON
// ──────────────────────────────────────
const PaymentIcon = ({ mode }) => {
  const icons = {
    cash: <DollarSign size={18} className="text-green-700" />,
    card: <CreditCard size={18} className="text-indigo-700" />,
    upi: <Smartphone size={18} className="text-purple-700" />,
  };
  return icons[mode] || null;
};

// ──────────────────────────────────────
//  SIDEBAR COMPONENT
// ──────────────────────────────────────
const Sidebar = ({ active, setActive, onLogout }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const menuItems = [
    {
      id: "dashboard",
      label: "Cashier Dashboard",
      icon: LayoutDashboard,
      path: "/cashier",
    },
    {
      id: "pending",
      label: "Pending Orders",
      icon: ShoppingCart,
      path: "/cashier/pending-orders",
    },
    {
      id: "completed",
      label: "Completed Orders",
      icon: CheckCircle,
      path: "/cashier/completed-orders",
    },
    { id: "waiter", label: "Waiter Menu", icon: Users, path: "/menu" },
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
            <p className="text-gray-900 font-semibold">
              {user.username || "Cashier"}
            </p>
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
            onClick={() => {
              setActive(item.id);
              if (item.path) navigate(item.path);
            }}
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

// ──────────────────────────────────────
//  COLLECTION SUMMARY COMPONENT
// ──────────────────────────────────────
const CollectionSummary = ({ today, pendingCount }) => {
  const stats = [
    {
      label: "Total Collection",
      value: today.total,
      color: "blue",
      icon: IndianRupee,
    },
    { label: "Cash", value: today.cash, color: "green", icon: DollarSign },
    { label: "Card", value: today.card, color: "indigo", icon: CreditCard },
    { label: "UPI", value: today.upi, color: "purple", icon: Smartphone },
    {
      label: "Pending Orders",
      value: pendingCount,
      color: "orange",
      icon: ShoppingCart,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md">
          <IndianRupee size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Today's Summary</h3>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br from-${stat.color}-50 to-white p-4 rounded-xl border border-${stat.color}-200 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
              >
                <stat.icon size={20} className={`text-${stat.color}-700`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold text-${stat.color}-700 mt-1`}>
                  {stat.label === "Pending Orders"
                    ? stat.value
                    : `₹${safeFixed(stat.value)}`}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl border border-green-200">
        <TrendingUp size={20} />
        <span className="text-sm font-medium">Real-time updates</span>
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────
//  ORDER HISTORY COMPONENT
// ──────────────────────────────────────
const OrderHistory = ({ orders = [] }) => {
  const recentOrders = orders.slice(0, 5); // Show only last 5 orders

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {orders.length} total
        </span>
      </div>

      {recentOrders.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No completed orders today</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentOrders.map((order, i) => {
            const amount = parseFloat(order.total_amount) || 0;
            return (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PaymentIcon mode={order.payment_mode} />
                  <div>
                    <p className="font-semibold text-gray-800">
                      Table {order.table_number}
                      <span className="text-gray-600 ml-2">
                        #{order.order_id}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.paid_at
                        ? new Date(order.paid_at).toLocaleTimeString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700 flex items-center justify-end gap-1">
                    <IndianRupee size={16} />
                    {amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 capitalize mt-1">
                    {order.payment_mode}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

// ──────────────────────────────────────
//  QUICK ACTIONS COMPONENT
// ──────────────────────────────────────
const QuickActions = ({ pendingCount, onNavigate }) => {
  const actions = [
    {
      label: "Pending Orders",
      description: "Manage unpaid orders",
      count: pendingCount,
      icon: ShoppingCart,
      color: "orange",
      path: "/cashier/pending-orders",
    },
    {
      label: "Completed Orders",
      description: "View order history",
      icon: CheckCircle,
      color: "green",
      path: "/cashier/completed-orders",
    },
    {
      label: "Print Reports",
      description: "Generate daily reports",
      icon: Clock,
      color: "blue",
      path: "/cashier/reports",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(action.path)}
            className={`bg-gradient-to-br from-${action.color}-50 to-white p-5 rounded-xl border border-${action.color}-200 text-left hover:shadow-md transition-all group`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon size={24} className={`text-${action.color}-700`} />
              </div>
              {action.count !== undefined && (
                <span
                  className={`bg-${action.color}-100 text-${action.color}-800 px-2 py-1 rounded-full text-sm font-bold`}
                >
                  {action.count}
                </span>
              )}
            </div>

            <h4 className={`font-bold text-${action.color}-900 text-lg mb-2`}>
              {action.label}
            </h4>
            <p className="text-gray-600 text-sm mb-3">{action.description}</p>

            <div className="flex items-center text-blue-600 font-medium text-sm">
              <span>View Details</span>
              <ArrowRight
                size={16}
                className="ml-1 group-hover:translate-x-1 transition-transform"
              />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────
//  MAIN DASHBOARD COMPONENT
// ──────────────────────────────────────
const CashierDashboard = () => {
  const [active, setActive] = useState("dashboard");
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [todayCollection, setTodayCollection] = useState({
    total: 0,
    cash: 0,
    card: 0,
    upi: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setError("");
      const res = await API.get(API_URL);
      const allOrders = res.data;

      // Filter orders
      const pending = allOrders.filter((o) => o.status === "pending");
      const completed = allOrders.filter(
        (o) => o.status === "paid" && o.paid_at
      );

      // Calculate today's collection
      const today = new Date().toISOString().split("T")[0];
      const todayPaid = completed.filter((o) => o.paid_at?.startsWith(today));

      const collection = todayPaid.reduce(
        (acc, o) => {
          const amount = parseFloat(o.total_amount) || 0;
          acc.total += amount;
          if (o.payment_mode in acc) acc[o.payment_mode] += amount;
          return acc;
        },
        { total: 0, cash: 0, card: 0, upi: 0 }
      );

      setPendingOrders(pending);
      setCompletedOrders(todayPaid);
      setTodayCollection(collection);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Coffee className="text-blue-700" size={64} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-900 font-semibold text-lg"
          >
            Loading Dashboard...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />

      <main className="flex-1 ml-72 p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-10">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-extrabold text-blue-900 mb-3"
            >
              Cashier Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-700 text-lg"
            >
              Real-time overview of orders, payments, and restaurant operations
            </motion.p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3"
              >
                <AlertCircle size={24} />
                <div>
                  <p className="font-semibold">Connection Error</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={fetchData}
                  className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActions
              pendingCount={pendingOrders.length}
              onNavigate={handleNavigate}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Summary */}
            <div className="lg:col-span-1">
              <CollectionSummary
                today={todayCollection}
                pendingCount={pendingOrders.length}
              />
            </div>

            {/* Right Column - Recent Orders */}
            <div className="lg:col-span-2">
              <OrderHistory orders={completedOrders} />
            </div>
          </div>

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {pendingOrders.length}
                </p>
                <p className="text-gray-600 text-sm">Pending Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {completedOrders.length}
                </p>
                <p className="text-gray-600 text-sm">Completed Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  ₹{safeFixed(todayCollection.total)}
                </p>
                <p className="text-gray-600 text-sm">Today's Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-700">
                  {new Date().getHours().toString().padStart(2, "0")}:
                  {new Date().getMinutes().toString().padStart(2, "0")}
                </p>
                <p className="text-gray-600 text-sm">Current Time</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default CashierDashboard;
