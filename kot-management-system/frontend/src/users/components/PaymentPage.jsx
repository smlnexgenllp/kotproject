// src/pages/PaymentPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useRef } from "react";
import {
  CreditCard,
  Wallet,
  Loader2,
  Smartphone,
  CheckCircle,
} from "lucide-react";
import Navbar from "./Navbar.jsx";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { tableNumber, cart } = state || {};
  const [loading, setLoading] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [showCashInput, setShowCashInput] = useState(false);
  

  // ────── ONLINE PAYMENT STATE ──────
  const [showOnlineOptions, setShowOnlineOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  if (!cart || !tableNumber) {
    navigate("/");
    return null;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const received = parseFloat(cashAmount) || 0;
  const balance = received - total;
const submittingRef = useRef(false);
  const handlePayment = async (mode, method = null) => {
    if (submittingRef.current) return;
  submittingRef.current = true;

    // ────── PRESERVE FULL CART WITH food_id & name ──────
    const fullCart = cart.map((item) => ({
      food_id: item.food_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const payload = {
      tableNumber: parseInt(tableNumber),
      total,
      paymentMode: mode === "Online" ? method.toLowerCase() : "cash",
      received_amount: mode === "Offline" ? received : total,
      waiter_id: JSON.parse(localStorage.getItem("user") || "{}").id,
      cart: fullCart,
    };

    setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/cashier-orders/create_order/",
        payload
      );

      if (mode === "Online") {
        // Simulate gateway delay
        setTimeout(() => {
          navigate("/success", {
            state: {
              tableNumber,
              total,
              mode: "Online",
              method,
              received: total,
              balance: 0,
            },
          });
        }, 1500);
      } else {
        navigate("/cashier-wait", {
          state: {
            orderId: res.data.order_id,
            tableNumber,
            total,
            received,
            balance: balance > 0 ? balance : 0,
          },
        });
      }
    } catch (err) {
      setLoading(false);
      alert(
        "Failed to process payment: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-200 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
            Table {tableNumber}
          </h1>

          <div className="bg-gray-50 rounded-2xl p-6 mb-3">
            <div className="text-3xl font-bold text-right text-indigo-600">
              ₹{total}
            </div>
            <p className="text-gray-600 text-right">Total Bill</p>
          </div>

          <div className="max-h-56 overflow-y-auto bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm border-b border-gray-200 pb-2 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium">#{item.food_id}</span>
                  <span className="truncate max-w-[140px]">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-600">
                    {item.quantity} × ₹{item.price}
                  </span>
                  <span className="ml-2 font-semibold">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ────── CASH INPUT (Unchanged) ────── */}
          {showCashInput && (
            <div className="mb-6 animate-fadeIn">
              <label className="block text-lg font-semibold mb-3 text-gray-700">
                Enter Cash Received
              </label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-6 py-4 text-2xl font-bold text-center border-4 border-indigo-300 rounded-2xl focus:border-indigo-600 outline-none"
                autoFocus
              />
              {cashAmount && (
                <div className="mt-4 text-center">
                  <p className="text-lg text-gray-600">Change to Return:</p>
                  <p
                    className={`text-3xl font-bold ${
                      balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{Math.abs(balance).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ────── PAYMENT BUTTONS ────── */}
          <div className="space-y-4">
            {/* ── PAY ONLINE (Enhanced) ── */}
            <button
              onClick={() => setShowOnlineOptions(true)}
              disabled={loading || showCashInput}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              <CreditCard size={28} /> Pay Online (UPI/Card)
            </button>

            {/* Online Method Selector */}
            {showOnlineOptions && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 space-y-4 border border-blue-200">
                <h3 className="text-lg font-bold text-center text-indigo-700">
                  Choose Payment Method
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedMethod("UPI")}
                    className={`p-4 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all ${
                      selectedMethod === "UPI"
                        ? "border-blue-600 bg-blue-100 text-blue-700"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <Smartphone size={20} />
                    UPI
                  </button>

                  <button
                    onClick={() => setSelectedMethod("Card")}
                    className={`p-4 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all ${
                      selectedMethod === "Card"
                        ? "border-indigo-600 bg-indigo-100 text-indigo-700"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    <CreditCard size={20} />
                    Card
                  </button>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={() => handlePayment("Online", selectedMethod)}
                  disabled={loading || !selectedMethod}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <>
                      <CheckCircle size={22} />
                      Confirm & Pay ₹{total.toFixed(2)}
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowOnlineOptions(false);
                    setSelectedMethod("");
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
              </div>
            )}

            {/* ── PAY CASH (Unchanged) ── */}
            <button
              onClick={() => setShowCashInput(true)}
              disabled={loading || showOnlineOptions}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              <Wallet size={28} /> Pay Cash
            </button>

            {showCashInput && (
              <button
                onClick={() => handlePayment("Offline")}
                disabled={loading || received < total}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Send to Cashier →"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
