// src/components/PendingOrdersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  Coffee,
  CreditCard,
  Smartphone,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  IndianRupeeIcon, // Added Search icon
} from "lucide-react";
import API from "../../api";
import Sidebar from "./Sidebar";

const API_URL = "/cashier-orders/";

const safeFixed = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const PaymentIcon = ({ mode }) => {
  const icons = {
    cash: <IndianRupeeIcon size={18} className="text-green-700" />,
    card: <CreditCard size={18} className="text-indigo-700" />,
    upi: <Smartphone size={18} className="text-purple-700" />,
  };
  return icons[mode] || null;
};

const PendingOrderCard = ({ order, onPaid, onPrint, onCancel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = async () => {
    if (window.confirm(`Are you sure you want to cancel order #${order.order_id} for Table ${order.table_number}?`)) {
      setIsCanceling(true);
      await onCancel(order.order_id);
      setIsCanceling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
    >
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <PaymentIcon mode={order.payment_mode} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Table {order.table_number}</h3>
               <p className="text-sm">Seats:{order.selected_seats}</p>
              <p className="text-blue-100 text-sm">
                #{order.order_id} • {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/25 px-3 py-1 rounded-full text-sm font-semibold">
              ₹{safeFixed(order.total_amount)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Items */}
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto border-b border-gray-100">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-gray-800 font-medium text-sm"
                >
                  <span className="flex-1 truncate mr-2">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="text-blue-700 font-semibold whitespace-nowrap">
                    ₹{safeFixed(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="p-4 bg-gray-50">
              <div className="bg-white rounded-xl p-3 border border-gray-200 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-700">₹{safeFixed(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Received</span>
                  <span>₹{safeFixed(order.received_amount)}</span>
                </div>
                {parseFloat(order.balance_amount) > 0 && (
                  <div className="flex justify-between text-orange-700 font-semibold">
                    <span>Change</span>
                    <span>₹{safeFixed(order.balance_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPaid(order.order_id)}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
        >
          <CheckCircle size={18} />
          Mark Paid
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPrint(order)}
          className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 rounded-xl shadow-md flex items-center justify-center"
          title="Print KOT"
        >
          <Printer size={18} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCancel}
          disabled={isCanceling}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 rounded-xl shadow-md flex items-center justify-center disabled:opacity-50"
          title="Cancel Order"
        >
          {isCanceling ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Clock size={18} />
            </motion.div>
          ) : (
            <X size={18} />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const PendingOrdersPage = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setError("");
      const res = await API.get(API_URL);
      const allOrders = res.data;
      const pending = allOrders.filter((o) => o.status === "pending");
      setPendingOrders(pending);
      setFilteredOrders(pending); // Initialize filtered orders with all pending orders
    } catch (err) {
      setError("Failed to load pending orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(pendingOrders);
    } else {
      const filtered = pendingOrders.filter(order => 
        order.order_id.toString().includes(searchTerm.trim())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, pendingOrders]);

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const printSeparateKOT = (order, items, title) => {
    console.log("PRINT FUNCTION CALLED FOR:", title); 
    const printWindow = window.open("", "", "width=380,height=600");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${title} - T${order.table_number}</title>
      <style>
        body {font-family:'Courier New',monospace;padding:15px;font-size:14px;margin:0;}
        .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;}
        .item{display:flex;justify-content:space-between;margin:8px 0;}
        .footer{margin-top:20px;text-align:center;font-size:12px;}
        @media print{body{margin:0;}}
      </style></head><body>
        <div class="header">
          <h2>${title}</h2>
          <h3>TABLE ${order.table_number}</h3>
          <p>Order #${order.order_id}</p>
          <p>${new Date(order.created_at).toLocaleString()}</p>
        </div>

        ${items
          .map(
            (i) =>
              `<div class="item"><span>${i.quantity} × ${i.name}</span><span>₹${safeFixed(
                i.price * i.quantity
              )}</span></div>`
          )
          .join("")}

        <div class="footer">
          <p>Printed for ${title}</p>
        </div>
      </body></html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const markPaid = async (orderId) => {
    try {
      const order = pendingOrders.find(o => o.order_id === orderId);
      if (!order) return;
      await API.post(`${API_URL}${orderId}/mark_paid/`);
      fetchPendingOrders();

      const foodItems = order.items.filter(i => i.category === "food");
      const cafeItems = order.items.filter(i => i.category === "cafe");

      // PRINT FOOD
      if (foodItems.length > 0) {
        printSeparateKOT(order, foodItems, "FOOD SECTION");
        await new Promise(r => setTimeout(r, 500));
      }

      // PRINT CAFE
      if (cafeItems.length > 0) {
        printSeparateKOT(order, cafeItems, "CAFE SECTION");
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error("Mark paid error:", err);
    }
  };

  // Cancel Order Function
  const cancelOrder = async (orderId) => {
    try {
      await API.post(`${API_URL}${orderId}/cancel_order/`);
      fetchPendingOrders(); // Refresh the list
    } catch (err) {
      console.error("Cancel order error:", err);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const printKOT = (order) => {
    const printWindow = window.open("", "", "width=380,height=600");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>KOT - T${order.table_number}</title>
      <style>
        body {font-family:'Courier New',monospace;padding:15px;font-size:14px;margin:0;}
        .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;}
        .item{display:flex;justify-content:space-between;margin:8px 0;}
        .total{border-top:2px dashed #000;padding-top:10px;font-weight:bold;font-size:16px;}
        .footer{margin-top:20px;text-align:center;font-size:12px;}
        @media print{body{margin:0;}}
      </style></head><body>
        <div class="header">
          <h2>TABLE ${order.table_number}</h2>
          <p>Order #${order.order_id}</p>
          <p>${new Date(order.created_at).toLocaleString()}</p>
        </div>
        ${order.items
          .map(
            (i) =>
              `<div class="item"><span>${i.quantity}x ${
                i.name
              }</span><span>₹${safeFixed(i.price * i.quantity)}</span></div>`
          )
          .join("")}
        <div class="total">
          <div style="display:flex;justify-content:space-between">
            <span>TOTAL</span><span>₹${safeFixed(order.total_amount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px">
            <span>RECEIVED</span><span>₹${safeFixed(
              order.received_amount
            )}</span>
          </div>
          ${
            parseFloat(order.balance_amount) > 0
              ? `<div style="display:flex;justify-content:space-between;margin-top:8px;color:#d00">
            <span>CHANGE</span><span>₹${safeFixed(order.balance_amount)}</span>
          </div>`
              : ""
          }
        </div>
        <div class="footer"><p>Thank You!</p><p>Payment: ${order.payment_mode.toUpperCase()}</p></div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        active="pending"
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-72 p-6 md:p-10">
        {/* Mobile Header */}
        <div className="lg:hidden mb-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              ></button>
              <div>
                <h1 className="text-xl font-bold text-blue-900">
                  Pending Orders
                </h1>
                <p className="text-gray-600 text-sm">Manage payments</p>
              </div>
            </div>
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold text-sm">
              {pendingOrders.length} Pending
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Desktop Header */}
          <div className="mb-8 hidden lg:block">
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
                  Pending Orders
                </h1>
                <p className="text-gray-700 mt-2">
                  Manage and process pending payments
                </p>
              </div>
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-semibold">
                {pendingOrders.length} Pending
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-base shadow-lg bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredOrders.length} of {pendingOrders.length} orders
                {searchTerm && ` for order ID: ${searchTerm}`}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Pending Orders Grid */}
          <div>
            <AnimatePresence>
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-200">
                  {searchTerm ? (
                    <>
                      <Search size={80} className="mx-auto text-gray-400 mb-6" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        No Orders Found
                      </h3>
                      <p className="text-gray-600">
                        No pending orders found for order ID: <strong>"{searchTerm}"</strong>
                      </p>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        size={80}
                        className="mx-auto text-green-400 mb-6"
                      />
                      <h3 className="text-2xl font-bold text-green-900 mb-2">
                        All Clear!
                      </h3>
                      <p className="text-gray-600">
                        No pending orders at the moment
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <PendingOrderCard
                      key={order.order_id}
                      order={order}
                      onPaid={markPaid}
                      onPrint={printKOT}
                      onCancel={cancelOrder}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PendingOrdersPage;