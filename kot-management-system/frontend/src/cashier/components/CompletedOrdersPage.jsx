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
  Coffee // Added Coffee import
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
  const navigate = useNavigate();

  const fetchCompletedOrders = async () => {
    try {
      const res = await API.get(API_URL);
      const allOrders = res.data;
      
      // Get completed orders (status paid and has paid_at)
      const completed = allOrders.filter(o => o.status === "paid" && o.paid_at);
      setCompletedOrders(completed);
      applyFilters(completed, dateFilter, paymentFilter);
    } catch (err) {
      console.error("Failed to load completed orders", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (orders, dateFilter, paymentFilter) => {
    let filtered = [...orders];

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === "today") {
      filtered = filtered.filter(order => order.paid_at?.startsWith(today));
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filtered = filtered.filter(order => order.paid_at?.startsWith(yesterdayStr));
    }

    // Payment mode filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(order => order.payment_mode === paymentFilter);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
    
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    applyFilters(completedOrders, dateFilter, paymentFilter);
  }, [dateFilter, paymentFilter, completedOrders]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getTotalAmount = () => {
    return filteredOrders.reduce((total, order) => total + (parseFloat(order.total_amount) || 0), 0);
  };

  const getOrderCountByPayment = (mode) => {
    return filteredOrders.filter(order => order.payment_mode === mode).length;
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
      <Sidebar active="completed" onLogout={handleLogout} />

      <main className="flex-1 ml-72 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/cashier')}
              className="flex items-center gap-2 text-blue-700 hover:text-blue-900 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
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

          {/* Filters and Summary */}
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
                  <span className="text-xl">₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <p className="text-sm text-blue-600">Total Collection</p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Completed Orders</h3>
                <p className="text-gray-500">No orders found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Table</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Completed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order, index) => (
                      <motion.tr
                        key={order.order_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
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
                            {(parseFloat(order.total_amount) || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'}
                        </td>
                      </motion.tr>
                    ))}
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