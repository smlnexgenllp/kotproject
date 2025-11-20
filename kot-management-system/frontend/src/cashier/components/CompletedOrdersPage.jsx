// src/pages/CompletedOrdersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coffee, Package, IndianRupee } from "lucide-react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  DollarSign,
  Smartphone,
  User,
  Undo2,
  X,
  ChevronDown,
  ChevronUp,
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
  return icons[mode?.toLowerCase()] || null;
};

const StatusBadge = ({ status, refundedAmount = 0, totalAmount = 0 }) => {
  const isFullyRefunded = refundedAmount >= totalAmount;
  const isPartiallyRefunded = refundedAmount > 0 && refundedAmount < totalAmount;

  if (status === "canceled" || status === "cancelled") {
    return (
      <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
        <XCircle size={14} />
        Canceled
      </span>
    );
  }

  if (isFullyRefunded) {
    return (
      <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle size={14} />
        Fully Refunded
      </span>
    );
  }

  if (isPartiallyRefunded) {
    return (
      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle size={14} />
        Partially Refunded
      </span>
    );
  }

  return (
    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
      <CheckCircle size={14} />
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

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await API.get(API_URL);
      const orders = res.data;

      const settled = orders
        .filter((o) => o.status !== "pending")
        .map((order) => {
          let items = [];
          if (typeof order.items === "string") {
            try { items = JSON.parse(order.items); } catch (e) { items = []; }
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
        .sort((a, b) => new Date(b.updated_at || b.paid_at || b.created_at) - new Date(a.updated_at || a.paid_at || a.created_at));

      setAllSettledOrders(settled);
      applyFilters(settled, dateFilter, statusFilter);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (orders, dateF, statusF) => {
    let filtered = [...orders];

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

    if (statusF !== "all") {
      if (statusF === "canceled") {
        filtered = filtered.filter((o) => ["canceled", "cancelled"].includes(o.status));
      } else if (statusF === "refunded") {
        filtered = filtered.filter((o) => o.refunded_amount > 0);
      } else {
        filtered = filtered.filter((o) => o.status === statusF);
      }
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters(allSettledOrders, dateFilter, statusFilter);
  }, [dateFilter, statusFilter, allSettledOrders]);

  // ACCURATE COLLECTION BREAKDOWN
 // ACCURATE COLLECTION BREAKDOWN - FIXED VERSION
// ACCURATE COLLECTION BREAKDOWN — FIXED FOR ORDER-LEVEL REFUNDS
const { foodCollection, cafeCollection, totalCollection } = filteredOrders.reduce(
  (acc, order) => {
    // 1. Skip fully canceled orders
    if (order.status === "canceled" || order.status === "cancelled") {
      return acc;
    }

    // 2. Net amount after total refund
    const netOrderAmount = order.total_amount - order.refunded_amount;
    if (netOrderAmount <= 0) return acc;

    // 3. Distribute the net amount proportionally between Food & Cafe
    let foodSubtotal = 0;
    let cafeSubtotal = 0;

    order.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      if (
        item.category === "cafe" ||
        item.category === "beverage" ||
        item.category === "drinks"
      ) {
        cafeSubtotal += itemTotal;
      } else {
        foodSubtotal += itemTotal;
      }
    });

    const grandTotal = foodSubtotal + cafeSubtotal;
    if (grandTotal === 0) return acc;

    // Pro-rate the net amount based on original subtotal ratios
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
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Coffee className="text-blue-700" size={64} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      <Sidebar active="completed" onLogout={() => { localStorage.clear(); navigate("/"); }} />

      <main className="flex-1 lg:ml-72 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate("/cashier")} className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-4">
              <ArrowLeft size={20} /> Back
            </button>
            <h1 className="text-4xl font-extrabold text-blue-900">All Settled Orders</h1>
            <p className="text-gray-600">Paid, Canceled & Refunded Orders</p>
          </div>

          {/* COLLECTION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Food */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl shadow-xl p-6 flex items-center gap-4"
            >
              <div className="bg-white/20 p-4 rounded-xl">
                <Package size={40} />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Food Collection</p>
                <p className="text-3xl font-bold">₹{foodCollection.toFixed(2)}</p>
              </div>
            </motion.div>

            {/* Cafe */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl shadow-xl p-6 flex items-center gap-4"
            >
              <div className="bg-white/20 p-4 rounded-xl">
                <Coffee size={40} />
              </div>
              <div>
                <p className="text-teal-100 text-sm font-medium">Cafe Collection</p>
                <p className="text-3xl font-bold">₹{cafeCollection.toFixed(2)}</p>
              </div>
            </motion.div>

            {/* Total */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl shadow-xl p-6 flex items-center gap-4"
            >
              <div className="bg-white/20 p-4 rounded-xl">
                <IndianRupee size={40} />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">Total Net</p>
                <p className="text-4xl font-bold">₹{totalCollection.toFixed(2)}</p>
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-300 font-medium">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-300 font-medium">
                <option value="all">All Status</option>
                <option value="paid">Paid Only</option>
                <option value="canceled">Canceled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <CheckCircle size={64} className="mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium">No settled orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Order ID</th>
                      <th className="px-6 py-4 text-left">Table</th>
                      <th className="px-6 py-4 text-left">Waiter</th>
                      <th className="px-6 py-4 text-left">Payment</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-left">Time</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const remaining = order.total_amount - order.refunded_amount;
                      const isCanceled = ["canceled", "cancelled"].includes(order.status);

                      return (
                        <React.Fragment key={order.order_id}>
                          <tr className="hover:bg-blue-50 transition">
                            <td className="px-6 py-4 font-bold text-blue-900">#{order.order_id}</td>
                            <td className="px-6 py-4 font-semibold">Table {order.table_number}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                {order.waiter_name || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <PaymentIcon mode={order.payment_mode} />
                                <span className="capitalize">{order.payment_mode || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`font-bold ${isCanceled ? "text-gray-500" : "text-green-700"}`}>
                                ₹{remaining.toFixed(2)}
                                {order.refunded_amount > 0 && (
                                  <div className="text-xs text-red-600">−₹{order.refunded_amount.toFixed(2)}</div>
                                )}
                                {isCanceled && <div className="text-xs text-gray-500">Canceled</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <StatusBadge
                                status={order.status}
                                refundedAmount={order.refunded_amount}
                                totalAmount={order.total_amount}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(order.paid_at || order.updated_at || order.created_at).toLocaleString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => toggleExpand(order.order_id)} className="text-blue-600 hover:text-blue-800">
                                  {expanded[order.order_id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                {!isCanceled && remaining > 0 && (
                                  <button onClick={() => openRefundModal(order)} className="text-red-600 hover:text-red-800" title="Refund">
                                    <Undo2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED: Items by Category */}
                          {expanded[order.order_id] && (
                            <tr>
                              <td colSpan={8} className="bg-gray-50 p-6">
                                <div className="space-y-6">
                                  {/* Food Items */}
                                  {order.items?.filter(i => i.category !== "cafe" && i.category !== "beverage").length > 0 && (
                                    <div>
                                      <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                                        <Package size={18} /> Food Items
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {order.items
                                          .filter(i => i.category !== "cafe" && i.category !== "beverage")
                                          .map((item, i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex justify-between text-sm">
                                              <span className="font-medium">{item.name}</span>
                                              <span className="text-orange-600 font-bold">
                                                {item.quantity} × ₹{item.price}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Cafe Items */}
                                  {order.items?.filter(i => i.category === "cafe" || i.category === "beverage").length > 0 && (
                                    <div>
                                      <h4 className="font-bold text-teal-700 mb-3 flex items-center gap-2">
                                        <Coffee size={18} /> Cafe Items
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {order.items
                                          .filter(i => i.category === "cafe" || i.category === "beverage")
                                          .map((item, i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex justify-between text-sm">
                                              <span className="font-medium">{item.name}</span>
                                              <span className="text-teal-600 font-bold">
                                                {item.quantity} × ₹{item.price}
                                              </span>
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
        </motion.div>
      </main>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-red-700 mb-4">Issue Refund</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-bold">Order #{refundModal.order.order_id}</p>
                <p className="text-sm text-gray-600">Table {refundModal.order.table_number}</p>
              </div>
              <input
                type="number"
                value={refundModal.amount}
                onChange={(e) => setRefundModal({ ...refundModal, amount: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl text-lg font-bold"
                max={refundModal.order.total_amount - refundModal.order.refunded_amount}
              />
              <textarea
                placeholder="Reason (optional)"
                value={refundModal.reason}
                onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl"
                rows={3}
              />
              <div className="flex gap-3">
                <button onClick={() => setRefundModal(null)} className="flex-1 py-3 border rounded-xl font-bold">Cancel</button>
                <button onClick={handleRefund} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                  Confirm Refund
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CompletedOrdersPage;