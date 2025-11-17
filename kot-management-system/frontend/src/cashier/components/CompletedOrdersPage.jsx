// src/components/CompletedOrdersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  IndianRupee,
  CheckCircle,
  CreditCard,
  DollarSign,
  Smartphone,
  Filter,
  Coffee,
  Package,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import API from "../../api";
import Sidebar from "./Sidebar";

const API_URL = "cashier-orders/";

const PaymentIcon = ({ mode }) => {
  const icons = {
    cash: <DollarSign size={16} className="text-green-600" />,
    card: <CreditCard size={16} className="text-indigo-600" />,
    upi: <Smartphone size={16} className="text-purple-600" />,
  };
  return icons[mode] || null;
};

const CompletedOrdersPage = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expanded, setExpanded] = useState({}); // which order rows are open

  const navigate = useNavigate();

  // ────── FETCH ──────
  // ────── FETCH ──────
const fetchCompletedOrders = async () => {
  try {
    const res = await API.get(API_URL);
    const allOrders = res.data;

    const completed = allOrders
      .filter((o) => o.status === "paid" && o.paid_at)
      .map((order) => {
        let items = [];

        if (typeof order.items === "string") {
          try {
            items = JSON.parse(order.items);
          } catch (e) {
            console.warn("Failed to parse items JSON", order.items);
            items = [];
          }
        } else if (Array.isArray(order.items)) {
          items = order.items;
        } else if (order.items && typeof order.items === "object") {
          items = Object.values(order.items);
        }

        return { ...order, items };
      });

    setCompletedOrders(completed);
    applyFilters(completed, dateFilter, paymentFilter);
  } catch (err) {
    console.error("Failed to load completed orders", err);
  } finally {
    setLoading(false);
  }
};

  // ────── FILTERS ──────
  const applyFilters = (orders, dateF, payF) => {
    let filtered = [...orders];

    const today = new Date().toISOString().split("T")[0];
    if (dateF === "today") {
      filtered = filtered.filter((o) => o.paid_at?.startsWith(today));
    } else if (dateF === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      filtered = filtered.filter((o) => o.paid_at?.startsWith(yStr));
    }

    if (payF !== "all") {
      filtered = filtered.filter((o) => o.payment_mode === payF);
    }

    filtered.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    applyFilters(completedOrders, dateFilter, paymentFilter);
  }, [dateFilter, paymentFilter, completedOrders]);

  // ────── HELPERS ──────
  const toggleExpand = (orderId) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getTotalAmount = () =>
    filteredOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total_amount) || 0),
      0
    );

  const getOrderCountByPayment = (mode) =>
    filteredOrders.filter((o) => o.payment_mode === mode).length;

  // ────── UI ──────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="text-blue-700" size={64} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      <Sidebar
        active="completed"
        onLogout={() => {
          localStorage.clear();
          navigate("/");
        }}
      />

      <main className="flex-1 ml-72 p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* ── Header ── */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/cashier")}
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-blue-900">
                  Completed Orders
                </h1>
                <p className="text-gray-700 mt-2">
                  History of all settled payments
                </p>
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                {filteredOrders.length} Orders
              </div>
            </div>
          </div>

          {/* ── Filters + Summary ── */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-600" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div className="bg-blue-50 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-2 text-blue-800 font-bold">
                  <IndianRupee size={20} />
                  <span className="text-xl">
                    ₹{getTotalAmount().toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-blue-600">Total Collection</p>
              </div>
            </div>
          </div>

          {/* ── Orders Table ── */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  No Completed Orders
                </h3>
                <p className="text-gray-500">
                  No orders found for the selected filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Table
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Waiter
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Completed At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Items
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order, idx) => {
                      const isOpen = expanded[order.order_id];
                      return (
                        <React.Fragment key={order.order_id}>
                          {/* ── MAIN ROW ── */}
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono font-semibold text-gray-900">
                                #{order.order_id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-800">
                                Table {order.table_number}
                              </span>
                            </td>

                            {/* ── WAITER NAME ── */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-gray-700">
                                <User size={14} className="text-blue-600" />
                                <span className="font-medium">
                                  {order.waiter_name || "—"}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <PaymentIcon mode={order.payment_mode} />
                                <span className="capitalize font-medium text-gray-700">
                                  {order.payment_mode}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 font-bold text-green-700">
                                <IndianRupee size={16} />
                                {(parseFloat(order.total_amount) || 0).toFixed(
                                  2
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-gray-600">
                              {order.paid_at
                                ? new Date(order.paid_at).toLocaleString()
                                : "—"}
                            </td>

                            {/* ── EXPAND BUTTON ── */}
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleExpand(order.order_id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {isOpen ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </button>
                            </td>
                          </motion.tr>

                          {/* ── COLLAPSIBLE ITEM LIST ── */}
                          {isOpen && (
                            <tr>
                              <td colSpan={7} className="bg-gray-50 p-0">
                                <div className="p-4 space-y-2">
                                  {order.items && order.items.length > 0 ? (
                                    order.items.map((it, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between text-sm text-gray-700"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Package
                                            size={14}
                                            className="text-blue-500"
                                          />
                                          <span className="font-medium">
                                            #{it.food_id}
                                          </span>
                                          <span className="truncate max-w-[200px]">
                                            {it.name}
                                          </span>
                                        </div>
                                        <span className="text-gray-600">
                                          {it.quantity} × ₹{it.price}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 italic">
                                      No items recorded
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CompletedOrdersPage;
