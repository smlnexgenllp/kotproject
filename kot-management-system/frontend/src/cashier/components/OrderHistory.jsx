// src/components/OrderHistory.jsx
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, IndianRupee } from "lucide-react";

const getStatusIcon = (status) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="text-green-600" size={18} />;
    case "cancelled":
      return <XCircle className="text-red-600" size={18} />;
    default:
      return <Clock className="text-orange-600" size={18} />;
  }
};

const OrderHistory = ({ orders = [] }) => {
  if (!orders || orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-5">Order History</h3>
        <p className="text-center text-gray-500 py-8">
          No completed orders today
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-5">Order History</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {orders.map((order, i) => {
          // SAFE: Convert to number
          const amount = parseFloat(order.total_amount) || 0;

          return (
            <motion.div
              key={order.order_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <p className="font-semibold text-gray-800">
                    Table {order.table_number} #{order.order_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.paid_at
                      ? new Date(order.paid_at).toLocaleTimeString()
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-700 flex items-center justify-end gap-1">
                  <IndianRupee size={16} />
                  {amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {order.payment_mode}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default OrderHistory;
