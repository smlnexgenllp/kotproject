// src/components/CollectionSummary.jsx
import React from "react";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp } from "lucide-react";

const safeFixed = (value) => (parseFloat(value) || 0).toFixed(2);

const CollectionSummary = ({ today }) => {
  const stats = [
    { label: "Total", value: today.total, color: "blue" },
    { label: "Cash", value: today.cash, color: "green" },
    { label: "Card", value: today.card, color: "indigo" },
    { label: "UPI", value: today.upi, color: "purple" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md">
          <IndianRupee size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Today's Collection</h3>
          <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br from-${stat.color}-50 to-white p-4 rounded-xl border border-${stat.color}-200`}
          >
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-700 mt-1`}>
              ₹{safeFixed(stat.value)}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-green-600">
        <TrendingUp size={20} />
        <span className="text-sm font-medium">All payments settled</span>
      </div>
    </motion.div>
  );
};

export default CollectionSummary;