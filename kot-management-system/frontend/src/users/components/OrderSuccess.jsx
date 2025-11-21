// src/pages/OrderSuccess.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, IndianRupee, ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    orderId = "N/A",
    tableNumber = "N/A",
    selected_seats = "N/A",
    total = 0,
    mode = "Unknown",
    received = total,
    balance = 0,
  } = state || {};

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-gray-100">
          {/* SUCCESS HEADER */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white text-center">
            <CheckCircle size={48} className="mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-1">Order Successful</h1>
            <p className="text-sm opacity-90">Table {tableNumber} • Order #{orderId}</p>
          </div>

          {/* DETAILS */}
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Bill Amount:</span>
                <span className="font-bold text-lg flex items-center gap-1">
                  <IndianRupee size={16} />
                  {Number(total).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Amount Received:</span>
                <span className="font-bold text-green-600 text-lg flex items-center gap-1">
                  <IndianRupee size={16} />
                  {Number(received).toFixed(2)}
                </span>
              </div>

              {balance > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-yellow-800">Change:</span>
                    <span className="font-bold text-yellow-700 text-lg flex items-center gap-1">
                      <IndianRupee size={16} />
                      {Number(balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-gray-600 font-medium">Payment Mode:</span>
                <span className="font-semibold text-emerald-600 capitalize">{mode}</span>
              </div>
            </div>

            {/* BACK BUTTON */}
            <button
              onClick={() => navigate("/menu")}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <ArrowLeft size={18} />
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}