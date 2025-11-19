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
  AlertCircle,
  Undo2,
  X,
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
  const [expanded, setExpanded] = useState({});
  const [refundModal, setRefundModal] = useState(null); // { order, amount, reason }

  const navigate = useNavigate();

  // FETCH ORDERS
  const fetchCompletedOrders = async () => {
    try {
      const res = await API.get(API_URL);
      const allOrders = res.data;

      const completed = allOrders
        .filter((o) => o.status === "paid" && o.paid_at)
        .map((order) => {
          let items = [];
          if (typeof order.items === "string") {
            try { items = JSON.parse(order.items); } catch (e) { items = []; }
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
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  // FILTERS
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

  // REFUND LOGIC
  const openRefundModal = (order) => {
    setRefundModal({
      order,
      amount: order.total_amount,
      reason: "",
    });
  };

  const handleRefund = async () => {
    if (!refundModal?.amount || refundModal.amount <= 0) {
      alert("Enter valid refund amount");
      return;
    }

    try {
      await API.refundOrder(
        refundModal.order.order_id,
        parseFloat(refundModal.amount),
        refundModal.reason || "Customer request"
      );

      alert(`₹${refundModal.amount} refunded successfully`);
      setRefundModal(null);
      fetchCompletedOrders(); // Refresh list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Refund failed");
    }
  };

  const toggleExpand = (orderId) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getTotalAmount = () =>
  filteredOrders.reduce((sum, o) => {
    const remaining = parseFloat(o.total_amount) - parseFloat(o.refunded_amount || 0);
    return sum + remaining;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Coffee className="text-blue-700" size={64} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      <Sidebar active="completed" onLogout={() => { localStorage.clear(); navigate("/"); }} />

      <main className="flex-1 ml-72 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => navigate("/cashier")} className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-4">
              <ArrowLeft size={20} /> Back to Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-blue-900">Completed Orders</h1>
                <p className="text-gray-700 mt-2">History of all settled payments</p>
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                {filteredOrders.length} Orders
              </div>
            </div>
          </div>

          {/* Filters + Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-wrap gap-4">
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="all">All Time</option>
                </select>
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
                  <option value="all">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div className="bg-blue-50 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-2 text-blue-800 font-bold">
                  <IndianRupee size={20} />
                  <span className="text-xl">₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <p className="text-sm text-blue-600">Total Collection</p>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Completed Orders</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Table</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Waiter</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Completed At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order, idx) => {
                      const isOpen = expanded[order.order_id];
                      const isRefunded = order.refunded_amount > 0;
                      const remaining = parseFloat(order.total_amount) - parseFloat(order.refunded_amount || 0);

                      return (
                        <React.Fragment key={order.order_id}>
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono font-semibold">#{order.order_id}</td>
                            <td className="px-6 py-4 font-semibold">Table {order.table_number}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <User size={14} className="text-blue-600" />
                                <span>{order.waiter_name || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <PaymentIcon mode={order.payment_mode} />
                                <span className="capitalize">{order.payment_mode}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-green-700">
                                ₹{remaining.toFixed(2)}
                                {isRefunded && <span className="block text-xs text-red-600">−₹{order.refunded_amount}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isRefunded ? (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Refunded</span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Paid</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(order.paid_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleExpand(order.order_id)} className="text-blue-600 hover:text-blue-800">
                                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                {!isRefunded && remaining > 0 && (
                                  <button
                                    onClick={() => openRefundModal(order)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                                  >
                                    <Undo2 size={14} />
                                    Refund
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>

                          {/* Expanded Items */}
                          {isOpen && (
                            <tr>
                              <td colSpan={8} className="bg-gray-50 p-4">
                                <div className="space-y-2">
                                  {order.items?.length > 0 ? (
                                    order.items.map((it, i) => (
                                      <div key={i} className="flex justify-between text-sm">
                                        <span>#{it.food_id} {it.name}</span>
                                        <span>{it.quantity} × ₹{it.price}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 italic">No items</p>
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

      {/* REFUND MODAL */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-700">Issue Refund</h3>
              <button onClick={() => setRefundModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-bold text-lg">#{refundModal.order.order_id}</p>
                <p className="text-sm text-gray-600 mt-1">Table {refundModal.order.table_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={parseFloat(refundModal.order.total_amount) - (refundModal.order.refunded_amount || 0)}
                  value={refundModal.amount}
                  onChange={(e) => setRefundModal({ ...refundModal, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: ₹{(parseFloat(refundModal.order.total_amount) - (refundModal.order.refunded_amount || 0)).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  rows={3}
                  value={refundModal.reason}
                  onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Wrong order, customer unhappy..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRefundModal(null)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                >
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