// src/pages/CompletedOrdersPage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  Package,
  IndianRupeeIcon,
  IndianRupee,
  Download,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  User,
  Undo2,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import API from "../../api";
import CashierLayout from "../components/CashierLayout";

const API_URL = "cashier-orders/";

const PaymentIcon = ({ mode }) => {
  const icons = {
    cash: <IndianRupeeIcon size={16} className="text-green-600" />,
    card: <CreditCard size={16} className="text-indigo-600" />,
    upi: <Smartphone size={16} className="text-purple-600" />,
  };
  return icons[mode?.toLowerCase()] || null;
};

const StatusBadge = ({ status, refundedAmount = 0, totalAmount = 0 }) => {
  const isFullyRefunded = refundedAmount >= totalAmount;
  const isPartiallyRefunded = refundedAmount > 0 && refundedAmount < totalAmount;

  if (status === "canceled" || status === "cancelled") {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
        <XCircle size={12} />
        Canceled
      </span>
    );
  }

  if (isFullyRefunded) {
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle size={12} />
        Fully Refunded
      </span>
    );
  }

  if (isPartiallyRefunded) {
    return (
      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle size={12} />
        Partially Refunded
      </span>
    );
  }

  return (
    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
      <CheckCircle size={12} />
      Paid
    </span>
  );
};

const CompletedOrdersPage = () => {
  const [allSettledOrders, setAllSettledOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [refundModal, setRefundModal] = useState(null);
  const [openSeats, setOpenSeats] = useState({});
  const [downloadCategory, setDownloadCategory] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get(API_URL);
      const orders = res.data;

      const settled = orders
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
        })
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.paid_at || b.created_at) -
            new Date(a.updated_at || a.paid_at || a.created_at)
        );

      setAllSettledOrders(settled);
      applyFilters(settled, dateFilter, statusFilter);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      console.error("Failed to load orders", err);
      alert("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const applyFilters = (orders, dateF, statusF) => {
    let filtered = [...orders];

    // Date Filter
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    if (dateF === "today") {
      filtered = filtered.filter((o) => {
        const date = (o.paid_at || o.updated_at || o.created_at)?.split("T")[0];
        return date === today;
      });
    } else if (dateF === "yesterday") {
      filtered = filtered.filter((o) => {
        const date = (o.paid_at || o.updated_at || o.created_at)?.split("T")[0];
        return date === yStr;
      });
    }

    // Status Filter
    if (statusF !== "all") {
      if (statusF === "canceled") {
        filtered = filtered.filter((o) =>
          ["canceled", "cancelled"].includes(o.status)
        );
      } else if (statusF === "refunded") {
        filtered = filtered.filter((o) => o.refunded_amount > 0);
      } else if (statusF === "paid") {
        filtered = filtered.filter((o) => 
          o.status === "paid" && o.refunded_amount === 0
        );
      }
    }

    // Search Filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(order => 
        order.order_id.toString().includes(searchTerm.trim()) ||
        order.table_number.toString().includes(searchTerm.trim()) ||
        (order.waiter_name && order.waiter_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    applyFilters(allSettledOrders, dateFilter, statusFilter);
  }, [dateFilter, statusFilter, allSettledOrders, searchTerm]);

  // Accurate Collection Breakdown
  const { foodCollection, cafeCollection, totalCollection } =
    filteredOrders.reduce(
      (acc, order) => {
        if (order.status === "canceled" || order.status === "cancelled") {
          return acc;
        }

        const netOrderAmount = order.total_amount - order.refunded_amount;
        if (netOrderAmount <= 0) return acc;

        let foodSubtotal = 0;
        let cafeSubtotal = 0;

        order.items.forEach((item) => {
          const itemTotal = item.price * item.quantity;
          if (["cafe", "beverage", "drinks"].includes(item.category)) {
            cafeSubtotal += itemTotal;
          } else {
            foodSubtotal += itemTotal;
          }
        });

        const grandTotal = foodSubtotal + cafeSubtotal;
        if (grandTotal === 0) return acc;

        const foodRatio = foodSubtotal / grandTotal;
        const cafeRatio = cafeSubtotal / grandTotal;

        acc.foodCollection += netOrderAmount * foodRatio;
        acc.cafeCollection += netOrderAmount * cafeRatio;
        acc.totalCollection += netOrderAmount;

        return acc;
      },
      { foodCollection: 0, cafeCollection: 0, totalCollection: 0 }
    );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openRefundModal = (order) => {
    const remaining = order.total_amount - order.refunded_amount;
    if (remaining <= 0) return;

    setRefundModal({
      order,
      amount: remaining.toFixed(2),
      reason: "",
    });
  };

  const handleRefund = async () => {
    if (!refundModal?.amount || refundModal.amount <= 0) return;

    try {
      await API.post(`/cashier-orders/${refundModal.order.order_id}/refund/`, {
        amount: parseFloat(refundModal.amount),
        reason: refundModal.reason || "Customer request",
      });

      alert(`₹${refundModal.amount} refunded successfully`);
      setRefundModal(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Refund failed");
    }
  };

  const handleDownload = () => {
    let data = [];

    filteredOrders.forEach((order) => {
      const items = order.items.filter((item) => {
        if (downloadCategory === "food")
          return !["cafe", "beverage", "drinks"].includes(item.category);
        if (downloadCategory === "cafe")
          return ["cafe", "beverage", "drinks"].includes(item.category);
        return true;
      });

      if (items.length === 0) return;

      items.forEach((item) => {
        data.push({
          OrderID: order.order_id,
          Table: order.table_number,
          Waiter: order.waiter_name || "",
          Category: item.category,
          Item: item.name,
          Quantity: item.quantity,
          Price: item.price,
          Amount: item.quantity * item.price,
          PaymentMode: order.payment_mode,
          Status: order.status,
          CreatedAt: order.created_at,
        });
      });
    });

    if (data.length === 0) {
      alert("No matching items found for this category.");
      return;
    }

    const csvHeader = Object.keys(data[0]).join(",") + "\n";
    const csvRows = data.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${downloadCategory}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <CashierLayout activePage="completed">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4"
            >
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </motion.div>
            <p className="text-blue-900 font-semibold text-lg">Loading Orders...</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout activePage="completed">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
              >
                All Settled Orders
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-gray-600 mt-2"
              >
                Paid, Canceled & Refunded Orders
              </motion.p>
              {lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Last updated: <strong>{lastUpdated}</strong>
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-blue-600"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Order ID, Table, or Waiter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-sm sm:text-base shadow-lg bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>

        {/* COLLECTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <motion.div 
            whileHover={{ scale: 1.03 }} 
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <Package size={24} className="sm:size-8" />
            </div>
            <div>
              <p className="text-orange-100 text-xs sm:text-sm font-medium">Food Collection</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">₹{foodCollection.toFixed(2)}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }} 
            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <Coffee size={24} className="sm:size-8" />
            </div>
            <div>
              <p className="text-teal-100 text-xs sm:text-sm font-medium">Cafe Collection</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">₹{cafeCollection.toFixed(2)}</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.03 }} 
            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <IndianRupee size={24} className="sm:size-8" />
            </div>
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium">Total Collection</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">₹{totalCollection.toFixed(2)}</p>
            </div>
          </motion.div>
        </div>

        {/* Filters + Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="px-3 sm:px-4 py-2.5 rounded-lg border font-medium text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="px-3 sm:px-4 py-2.5 rounded-lg border font-medium text-sm"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="canceled">Canceled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select 
              value={downloadCategory} 
              onChange={(e) => setDownloadCategory(e.target.value)} 
              className="px-3 sm:px-4 py-2.5 rounded-lg border font-medium text-sm"
            >
              <option value="all">Download: All</option>
              <option value="food">Food Only</option>
              <option value="cafe">Cafe Only</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className="px-3 sm:px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 rounded-lg font-bold text-sm"
            >
              <Download size={16} />
              <span className="hidden xs:inline">Download</span>
              <span className="xs:hidden">CSV</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchOrders}
              className="px-3 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 rounded-lg font-bold text-sm"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 sm:p-16 text-center text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-gray-400 sm:size-16" />
              <p className="text-lg sm:text-xl font-medium">No settled orders found</p>
              <p className="text-sm text-gray-600 mt-2">
                {searchTerm ? "Try adjusting your search or filters" : "No orders match the current filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-4 p-4">
                {filteredOrders.map((order) => {
                  const remaining = order.total_amount - order.refunded_amount;
                  const isCanceled = ["canceled", "cancelled"].includes(order.status);
                  
                  return (
                    <div key={order.order_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-blue-900">#{order.order_id}</h3>
                          <p className="text-sm text-gray-600">Table {order.table_number}</p>
                        </div>
                        <StatusBadge status={order.status} refundedAmount={order.refunded_amount} totalAmount={order.total_amount} />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Waiter:</span>
                          <span>{order.waiter_name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment:</span>
                          <span className="flex items-center gap-1 capitalize">
                            <PaymentIcon mode={order.payment_mode} />
                            {order.payment_mode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className={`font-bold ${isCanceled ? "text-gray-500" : "text-green-700"}`}>
                            ₹{remaining.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="text-xs">
                            {new Date(order.paid_at || order.updated_at || order.created_at).toLocaleString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                        <button 
                          onClick={() => toggleExpand(order.order_id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {expanded[order.order_id] ? "Hide Items" : "Show Items"}
                        </button>
                        {!isCanceled && remaining > 0 && (
                          <button 
                            onClick={() => openRefundModal(order)} 
                            className="text-red-600 hover:text-red-800"
                            title="Refund"
                          >
                            <Undo2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Expanded Items for Mobile */}
                      {expanded[order.order_id] && (
                        <div className="mt-4 space-y-4">
                          {order.items?.filter((i) => !["cafe", "beverage", "drinks"].includes(i.category)).length > 0 && (
                            <div>
                              <h4 className="font-bold text-orange-700 text-sm mb-2">Food Items</h4>
                              <div className="space-y-2">
                                {order.items
                                  .filter((i) => !["cafe", "beverage", "drinks"].includes(i.category))
                                  .map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs bg-white p-2 rounded">
                                      <span>{item.name}</span>
                                      <span className="text-orange-600 font-bold">{item.quantity} × ₹{item.price}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {order.items?.filter((i) => ["cafe", "beverage", "drinks"].includes(i.category)).length > 0 && (
                            <div>
                              <h4 className="font-bold text-teal-700 text-sm mb-2">Cafe Items</h4>
                              <div className="space-y-2">
                                {order.items
                                  .filter((i) => ["cafe", "beverage", "drinks"].includes(i.category))
                                  .map((item, i) => (
                                    <div key={i} className="flex justify-between text-xs bg-white p-2 rounded">
                                      <span>{item.name}</span>
                                      <span className="text-teal-600 font-bold">{item.quantity} × ₹{item.price}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <table className="w-full hidden sm:table">
                <thead className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Table</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Waiter</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const remaining = order.total_amount - order.refunded_amount;
                    const isCanceled = ["canceled", "cancelled"].includes(order.status);

                    return (
                      <React.Fragment key={order.order_id}>
                        <tr className="hover:bg-blue-50 transition">
                          <td className="px-4 py-3 font-bold text-blue-900 text-sm">#{order.order_id}</td>
                          <td className="font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              <span>Table {order.table_number}</span>
                              {order.selected_seats && order.selected_seats.length > 0 && (
                                <button
                                  onClick={() => setOpenSeats((prev) => ({ ...prev, [order.order_id]: !prev[order.order_id] }))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {openSeats[order.order_id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              )}
                            </div>
                            {openSeats[order.order_id] && (
                              <div className="mt-1 text-xs text-gray-700 bg-gray-100 p-2 rounded">
                                Seats: {order.selected_seats.join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User size={12} />
                              {order.waiter_name || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <PaymentIcon mode={order.payment_mode} />
                              <span className="capitalize">{order.payment_mode || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <div className={`font-bold ${isCanceled ? "text-gray-500" : "text-green-700"}`}>
                              ₹{remaining.toFixed(2)}
                              {order.refunded_amount > 0 && (
                                <div className="text-xs text-red-600">−₹{order.refunded_amount.toFixed(2)}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={order.status} refundedAmount={order.refunded_amount} totalAmount={order.total_amount} />
                          </td>
                          <td className="text-sm text-gray-600">
                            {new Date(order.paid_at || order.updated_at || order.created_at).toLocaleString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => toggleExpand(order.order_id)} className="text-blue-600 hover:text-blue-800">
                                {expanded[order.order_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              {!isCanceled && remaining > 0 && (
                                <button onClick={() => openRefundModal(order)} className="text-red-600 hover:text-red-800" title="Refund">
                                  <Undo2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {expanded[order.order_id] && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50 p-4">
                              <div className="space-y-4">
                                {order.items?.filter((i) => !["cafe", "beverage", "drinks"].includes(i.category)).length > 0 && (
                                  <div>
                                    <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2 text-sm">
                                      <Package size={14} /> Food Items
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {order.items
                                        .filter((i) => !["cafe", "beverage", "drinks"].includes(i.category))
                                        .map((item, i) => (
                                          <div key={i} className="bg-white p-2 rounded shadow-sm flex justify-between text-xs">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-orange-600 font-bold">{item.quantity} × ₹{item.price}</span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {order.items?.filter((i) => ["cafe", "beverage", "drinks"].includes(i.category)).length > 0 && (
                                  <div>
                                    <h4 className="font-bold text-teal-700 mb-2 flex items-center gap-2 text-sm">
                                      <Coffee size={14} /> Cafe Items
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {order.items
                                        .filter((i) => ["cafe", "beverage", "drinks"].includes(i.category))
                                        .map((item, i) => (
                                          <div key={i} className="bg-white p-2 rounded shadow-sm flex justify-between text-xs">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-teal-600 font-bold">{item.quantity} × ₹{item.price}</span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
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
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-red-700 mb-4">Issue Refund</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="font-bold">Order #{refundModal.order.order_id}</p>
                <p className="text-sm text-gray-600">Table {refundModal.order.table_number}</p>
              </div>
              <input
                type="number"
                value={refundModal.amount}
                onChange={(e) => setRefundModal({ ...refundModal, amount: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 border rounded-lg text-base font-bold"
                max={refundModal.order.total_amount - refundModal.order.refunded_amount}
              />
              <textarea
                placeholder="Reason (optional)"
                value={refundModal.reason}
                onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 border rounded-lg text-sm"
                rows={3}
              />
              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => setRefundModal(null)} className="flex-1 py-2.5 border rounded-lg font-bold text-sm">
                  Cancel
                </button>
                <button onClick={handleRefund} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-sm">
                  Confirm Refund
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </CashierLayout>
  );
};

export default CompletedOrdersPage;