// src/pages/WaiterOrderHistory.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Smartphone,
  Table as TableIcon,
  Calendar,
  Filter,
} from "lucide-react";
import API from "../../api";

const API_URL = "/cashier-orders/";

const safeFixed = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const PaymentIcon = ({ mode }) => {
  const icons = {
    cash: <DollarSign size={16} className="text-green-600" />,
    card: <CreditCard size={16} className="text-indigo-600" />,
    upi: <Smartphone size={16} className="text-purple-600" />,
  };
  return (
    icons[mode?.toLowerCase()] || (
      <DollarSign size={16} className="text-gray-500" />
    )
  );
};

const StatusBadge = ({ status, hasRefund }) => {
  const config = {
    pending: {
      color: "bg-orange-100 text-orange-700",
      icon: <Clock size={14} />,
    },
    paid: {
      color: "bg-green-100 text-green-700",
      icon: <CheckCircle size={14} />,
    },
    refunded: {
      color: "bg-red-100 text-red-700",
      icon: <AlertCircle size={14} />,
    },
    partially_refunded: {
      color: "bg-yellow-100 text-yellow-700",
      icon: <AlertCircle size={14} />,
    },
  };

  let displayStatus = status;
  if (hasRefund) {
    displayStatus = hasRefund === "full" ? "refunded" : "partially_refunded";
  }

  const item = config[displayStatus] || config.pending;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${item.color}`}
    >
      {item.icon}
      {displayStatus.charAt(0).toUpperCase() +
        displayStatus.slice(1).replace("_", " ")}
    </span>
  );
};

const WaiterOrderHistory = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("today"); // NEW
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
    const [openSeats, setOpenSeats] = useState({});
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const currentWaiterName = user?.name || user?.username || "Waiter";

  useEffect(() => {
    if (!currentWaiterName || currentWaiterName === "Waiter") {
      setLoading(false);
      return;
    }

    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const res = await API.get(API_URL);

        const myOrders = res.data
          .filter((order) => order.waiter_name === currentWaiterName)
          .map((order) => ({
            ...order,
            // Compute remaining amount after refund
            remaining_amount:
              parseFloat(order.total_amount) -
              parseFloat(order.refunded_amount || 0),
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setAllOrders(myOrders);
      } catch (err) {
        console.error(err);
        alert("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [currentWaiterName]);

  // Apply filters: tab + date + search
  useEffect(() => {
    let list = [...allOrders];

    // Status Tab
    if (activeTab !== "all") {
      if (activeTab === "refunded") {
        list = list.filter((o) => o.refunded_amount > 0);
      } else {
        list = list.filter((o) => o.status === activeTab);
      }
    }

    // Date Filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday

    if (dateFilter === "today") {
      list = list.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= today;
      });
    } else if (dateFilter === "yesterday") {
      list = list.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= yesterday && orderDate < today;
      });
    } else if (dateFilter === "this_week") {
      list = list.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= weekStart;
      });
    }
    // "all" → no filter

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_id?.toString().includes(term) ||
          o.table_number?.toString().includes(term)
      );
    }

    setFilteredOrders(list);
  }, [allOrders, activeTab, dateFilter, searchTerm]);

  const getCount = (status) => {
    const source =
      filteredOrders.length < allOrders.length ? filteredOrders : allOrders;

    if (status === "all") return source.length;
    if (status === "refunded")
      return source.filter((o) => o.refunded_amount > 0).length;
    return source.filter((o) => o.status === status).length;
  };

  const totalCollected = filteredOrders.reduce(
    (sum, o) => sum + (o.remaining_amount || 0),
    0
  );

  if (!currentWaiterName || currentWaiterName === "Waiter") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Login Required</h2>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Clock size={64} className="text-blue-700" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 text-blue-700 font-medium"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-900">My Orders</h1>
            <p className="text-gray-600">
              All orders by {currentWaiterName} —{" "}
              <span className="font-semibold text-blue-700">
                {dateFilter === "today" && "Today"}
                {dateFilter === "yesterday" && "Yesterday"}
                {dateFilter === "this_week" && "This Week"}
                {dateFilter === "all" && "All Time"}
              </span>
            </p>
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs + Date Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-3 bg-white rounded-2xl shadow-md p-2 flex-1">
            {["all", "pending", "paid", "refunded"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab === "all"
                  ? "All Orders"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {getCount(tab)}
                </span>
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="bg-white rounded-2xl shadow-md p-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-5 py-3 rounded-xl font-medium text-gray-700 bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
              size={20}
            />
            <input
              type="text"
              placeholder="Search Order ID or Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X size={18} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg text-center">
              <p className="text-blue-100">Total Orders</p>
              <p className="text-4xl font-bold">{filteredOrders.length}</p>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-2xl shadow-lg text-center">
              <p className="text-green-100">Collected</p>
              <p className="text-4xl font-bold">₹{safeFixed(totalCollected)}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-2xl shadow-lg text-center">
              <p className="text-orange-100">Pending</p>
              <p className="text-4xl font-bold">{getCount("pending")}</p>
            </div>
            <div className="bg-gradient-to-r from-red-600 to-pink-700 text-white p-6 rounded-2xl shadow-lg text-center">
              <p className="text-red-100">Refunded</p>
              <p className="text-4xl font-bold">{getCount("refunded")}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Order ID</th>
                  <th className="px-6 py-4 text-left">Table</th>
                  <th className="px-6 py-4 text-center">Items</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Payment</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16 text-gray-500">
                      <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No orders found</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const hasRefund = order.refunded_amount > 0;
                    const refundType =
                      hasRefund && order.refunded_amount >= order.total_amount
                        ? "full"
                        : "partial";

                    return (
                      <tr key={order.order_id} className="hover:bg-blue-50">
                        <td className="px-6 py-4 font-bold text-blue-900">
                          #{order.order_id}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                              <div className="flex items-center gap-2">
                                <span>Table {order.table_number}</span>

                                {/* Dropdown icon */}
                                {order.selected_seats &&
                                  order.selected_seats.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setOpenSeats((prev) => ({
                                          ...prev,
                                          [order.id]: !prev[order.id],
                                        }))
                                      }
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      {openSeats[order.id] ? (
                                        <ChevronUp size={16} />
                                      ) : (
                                        <ChevronDown size={16} />
                                      )}
                                    </button>
                                  )}
                              </div>

                              {/* Seats Dropdown Content */}
                              {openSeats[order.id] && (
                                <div className="mt-1 text-xs text-gray-700 bg-gray-100 p-2 rounded">
                                  Seats: {order.selected_seats.join(", ")}
                                </div>
                              )}
                            </td>
                        
                        <td className="px-6 py-4 text-center">
                          {order.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge
                            status={order.status}
                            hasRefund={hasRefund ? refundType : null}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <PaymentIcon mode={order.payment_mode} />
                            <span className="text-xs uppercase">
                              {order.payment_mode || "cash"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-green-600">
                            ₹{safeFixed(order.remaining_amount)}
                            {hasRefund && (
                              <div className="text-xs text-red-600 font-medium">
                                −₹{safeFixed(order.refunded_amount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterOrderHistory;
