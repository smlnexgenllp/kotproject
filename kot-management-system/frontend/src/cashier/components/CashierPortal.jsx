// src/components/CashierDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  CheckCircle,
  IndianRupee,
  Clock,
  AlertCircle,
  Coffee,
  CreditCard,
  Smartphone,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Package,
  Table,
  Users as TableUsers,
  Package2,
} from "lucide-react";
import API from "../../api";
import CashierLayout from "./CashierLayout";

const API_URL = "cashier-orders/";
const TABLES_API_URL = "tables/";

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
//  TABLE STATUS COMPONENT
// ──────────────────────────────────────
const TableStatus = ({ tables = [] }) => {
  const getTableStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cleaning":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTableStatusIcon = (status) => {
    switch (status) {
      case "available":
        return "🟢";
      case "occupied":
        return "🟡";
      case "reserved":
        return "🔵";
      case "cleaning":
        return "🔴";
      default:
        return "⚫";
    }
  };

  const statusCounts = tables.reduce((acc, table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md">
          <Table size={20} className="sm:size-6" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Table Status</h3>
          <p className="text-xs sm:text-sm text-gray-600">Real-time table occupancy</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl border ${getTableStatusColor(
              status
            )}`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-base sm:text-lg">{getTableStatusIcon(status)}</span>
              <span className="font-medium capitalize text-sm sm:text-base">{status}</span>
            </div>
            <span className="font-bold text-base sm:text-lg">{count}</span>
          </motion.div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-3 sm:py-4 text-gray-500 text-sm">
          No table data available
        </div>
      )}

      <div className="mt-3 sm:mt-4 text-xs text-gray-500 text-center">
        Total Tables: {tables.length}
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────
//  COLLECTION SUMMARY COMPONENT
// ──────────────────────────────────────
const CollectionSummary = ({ today, pendingCount, tableStats }) => {
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
    {
      label: "Occupied Tables",
      value: tableStats.occupied || 0,
      color: "red",
      icon: TableUsers,
    },
  ];

  const getColorClass = (color) => {
    const colorMap = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md">
          <IndianRupee size={20} className="sm:size-6" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Today's Summary</h3>
          <p className="text-xs sm:text-sm text-gray-600">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {stats.map((stat, i) => {
          const colorClass = getColorClass(stat.color);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br from-${stat.color}-50 to-white p-3 sm:p-4 rounded-lg sm:rounded-xl border ${colorClass.border} flex items-center justify-between`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={16} className={`${colorClass.text} sm:size-5`} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-lg sm:text-xl font-bold ${colorClass.text} mt-1`}>
                    {["Pending Orders", "Occupied Tables"].includes(stat.label)
                      ? stat.value
                      : `₹${safeFixed(stat.value)}`}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-green-200 text-xs sm:text-sm">
        <TrendingUp size={16} className="sm:size-5" />
        <span className="font-medium">Real-time updates</span>
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────
//  ORDER HISTORY COMPONENT
// ──────────────────────────────────────
const OrderHistory = ({ orders = [] }) => {
  const recentOrders = orders.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 h-full"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recent Orders</h3>
        <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
          {orders.length} total
        </span>
      </div>

      {recentOrders.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <CheckCircle size={40} className="mx-auto text-gray-400 mb-3 sm:mb-4 sm:size-12" />
          <p className="text-gray-500 text-sm sm:text-base">No completed orders today</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {recentOrders.map((order, i) => {
            const amount = parseFloat(order.total_amount) || 0;
            return (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <PaymentIcon mode={order.payment_mode} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      Table {order.table_number}
                      <span className="text-gray-600 ml-1 sm:ml-2 text-xs sm:text-sm">
                        #{order.order_id}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600">
                      {order.paid_at
                        ? new Date(order.paid_at).toLocaleTimeString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700 flex items-center justify-end gap-1 text-sm sm:text-base">
                    <IndianRupee size={14} className="sm:size-4" />
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
const QuickActions = ({ pendingCount, onNavigate, tableStats }) => {
  const actions = [
    {
      label: "Table Management",
      description: "Manage table status and occupancy",
      count: tableStats.total,
      icon: Table,
      color: "green",
      path: "/cashier/tablemanage",
    },
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
      color: "blue",
      path: "/cashier/completed-orders",
    },
    {
      label: "Stocks",
      description: "Stock Management",
      icon: Package2,
      color: "purple",
      path: "/stocks",
    },
  ];

  const getColorClass = (color) => {
    const colorMap = {
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200"
    >
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const colorClass = getColorClass(action.color);
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(action.path)}
              className={`bg-gradient-to-br from-${action.color}-50 to-white rounded-lg sm:rounded-xl border ${colorClass.border} hover:shadow-md transition-all group flex flex-col justify-between h-full p-3 sm:p-4`}
            >
              {/* TOP CONTENT */}
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon size={18} className={`${colorClass.text} sm:size-5`} />
                  </div>

                  {action.count !== undefined && (
                    <span className={`${colorClass.bg} ${colorClass.text} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold`}>
                      {action.count}
                    </span>
                  )}
                </div>

                <h4 className={`font-bold ${colorClass.text} text-base sm:text-lg mb-1 sm:mb-2`}>
                  {action.label}
                </h4>

                <p className="text-gray-600 text-xs sm:text-sm">{action.description}</p>
              </div>

              {/* BOTTOM BUTTON */}
              <div className="flex justify-end items-center text-blue-600 font-medium text-xs sm:text-sm mt-2 sm:mt-3">
                <span>View Details</span>
                <ArrowRight
                  size={14}
                  className="ml-1 group-hover:translate-x-1 transition-transform sm:size-4"
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────
//  MAIN DASHBOARD COMPONENT
// ──────────────────────────────────────
const CashierDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [todayCollection, setTodayCollection] = useState({
    total: 0,
    cash: 0,
    card: 0,
    upi: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Memoized data fetching functions
  const fetchTables = useCallback(async () => {
    try {
      const res = await API.get(TABLES_API_URL);
      setTables(res.data || []);
    } catch (err) {
      console.error("Tables fetch error:", err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await API.get(API_URL);
      const allOrders = res.data;

      // Filter pending orders
      const pending = allOrders.filter((o) => o.status === "pending");

      // Get all settled (non-pending) orders
      const settled = allOrders
        .filter((o) => o.status !== "pending")
        .map((order) => {
          let items = [];
          if (typeof order.items === "string") {
            try {
              items = JSON.parse(order.items);
            } catch (e) {
              items = [];
            }
          } else if (Array.isArray(order.items)) {
            items = order.items;
          } else if (order.items && typeof order.items === "object") {
            items = Object.values(order.items);
          }

          return {
            ...order,
            items,
            refunded_amount: parseFloat(order.refunded_amount || 0),
            total_amount: parseFloat(order.total_amount || 0),
          };
        });

      // Today's date filter
      const today = new Date().toISOString().split("T")[0];
      const todaySettled = settled.filter((o) => {
        const date = (o.paid_at || o.updated_at || o.created_at)?.split("T")[0];
        return date === today;
      });

      // Calculate NET collection (after refunds & excluding canceled)
      const collection = todaySettled.reduce(
        (acc, order) => {
          // Skip fully canceled orders
          if (order.status === "canceled" || order.status === "cancelled") {
            return acc;
          }

          // Net amount = total - refunded
          const netAmount = order.total_amount - order.refunded_amount;

          // Only include if net amount > 0
          if (netAmount <= 0) return acc;

          acc.total += netAmount;

          const mode = (order.payment_mode || "cash").toLowerCase();
          if (["cash", "card", "upi"].includes(mode)) {
            acc[mode] += netAmount;
          } else {
            acc.cash += netAmount; // fallback
          }

          return acc;
        },
        { total: 0, cash: 0, card: 0, upi: 0 }
      );

      // Update state
      setPendingOrders(pending);
      setCompletedOrders(todaySettled.filter(
        (o) =>
          (o.status === "paid" || o.refunded_amount > 0) &&
          o.total_amount - o.refunded_amount > 0
      ));
      setTodayCollection(collection);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
    }
  }, []);

  const loadAllData = useCallback(async () => {
    if (loading) return;

    try {
      await Promise.all([fetchData(), fetchTables()]);
    } catch (err) {
      console.error("Background data update error:", err);
    }
  }, [fetchData, fetchTables, loading]);

  // Initial data load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchData(), fetchTables()]);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, [fetchData, fetchTables]);

  // Background data updates - silent refresh every 5 seconds
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [loadAllData, loading]);

  const handleNavigate = (path) => {
    window.location.href = path;
  };

  // Calculate table statistics
  const tableStats = {
    total: tables.length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    available: tables.filter((t) => t.status === "available").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    cleaning: tables.filter((t) => t.status === "cleaning").length,
  };

  if (loading) {
    return (
      <CashierLayout activePage="dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4"
            >
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </motion.div>
            <p className="text-blue-900 font-semibold text-lg">Loading Dashboard...</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout activePage="dashboard">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3"
          >
            Cashier Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-700"
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
              className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl text-red-700 flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <AlertCircle size={20} className="sm:size-6" />
              <div className="flex-1">
                <p className="font-semibold">Connection Error</p>
                <p className="text-xs sm:text-sm">{error}</p>
              </div>
              <button
                onClick={loadAllData}
                className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <QuickActions
            pendingCount={pendingOrders.length}
            tableStats={tableStats}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Summary & Tables */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8">
            <CollectionSummary
              today={todayCollection}
              pendingCount={pendingOrders.length}
              tableStats={tableStats}
            />
            <TableStatus tables={tables} />
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
          className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                {pendingOrders.length}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm">Pending Orders</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                {completedOrders.length}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm">Completed Today</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-purple-700">
                ₹{safeFixed(todayCollection.total)}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm">Today's Revenue</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-orange-700">
                {tableStats.occupied}/{tableStats.total}
              </p>
              <p className="text-gray-600 text-xs sm:text-sm">Tables Occupied</p>
            </div>
          </div>
        </motion.div>
      </div>
    </CashierLayout>
  );
};

export default CashierDashboard;