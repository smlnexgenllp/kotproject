// src/pages/OrderSuccess.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, IndianRupee, ArrowLeft } from "lucide-react";

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // SAFE DEFAULT VALUES — NO MORE "undefined" ERRORS!
  const {
    tableNumber = "N/A",
    total = 0,
    mode = "Unknown",
    received = total,     // fallback if not sent
    balance = 0           // change amount
  } = state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full transform transition-all hover:scale-[1.02]">
        
        {/* SUCCESS HEADER */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
          <CheckCircle size={64} className="mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold">Order Placed Successfully!</h1>
          <p className="text-xl mt-2 opacity-90">Table {tableNumber}</p>
        </div>

        {/* DETAILS */}
        <div className="p-8 space-y-6">
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-gray-700">Bill Amount:</span>
              <span className="font-bold text-xl">₹{Number(total).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg">
              <span className="font-semibold text-gray-700">Cash Received:</span>
              <span className="font-bold text-green-600 text-xl">₹{Number(received).toFixed(2)}</span>
            </div>

            {balance > 0 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-5 animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-orange-600">Change Returned</span>
                  <span className="text-3xl font-extrabold text-orange-700">₹{Number(balance).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between text-lg pt-4 border-t-2 border-gray-200">
              <span className="font-semibold text-gray-700">Payment Mode:</span>
              <span className="font-bold text-emerald-600">{mode}</span>
            </div>
          </div>

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate("/menu")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 text-xl transition transform hover:scale-105"
          >
            <ArrowLeft size={28} />
            Back to Menu
          </button>
        </div>

       
      </div>
    </div>
  );
}