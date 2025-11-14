// src/pages/PaymentPage.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CreditCard, Wallet, Loader2 } from "lucide-react";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { tableNumber, cart } = state || {};
  const [loading, setLoading] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [showCashInput, setShowCashInput] = useState(false);

  if (!cart || !tableNumber) {
    navigate("/");
    return null;
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const received = parseFloat(cashAmount) || 0;
  const balance = received - total;

  const handlePayment = async (mode) => {
    if (mode === "Online") {
      setLoading(true);
      setTimeout(() => {
        navigate("/success", { state: { tableNumber, total, mode: "Online", received: total, balance: 0 } });
      }, 1500);
      return;
    }

    // CASH WITH CUSTOM AMOUNT
    if (!cashAmount || received < total) {
      alert(`Please enter amount ≥ ₹${total}`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/cashier-orders/create_order/", {
        tableNumber,
        cart,
        total,
        paymentMode: "cash",
        received_amount: received,
        balance_amount: balance > 0 ? balance : 0
      });

      navigate("/cashier-wait", {
        state: {
          orderId: res.data.order_id,
          tableNumber,
          total,
          received,
          balance: balance > 0 ? balance : 0
        }
      });
    } catch (err) {
      setLoading(false);
      alert("Failed to send to cashier");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Table {tableNumber}</h1>
        
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <div className="text-3xl font-bold text-right text-indigo-600">₹{total}</div>
          <p className="text-gray-600 text-right">Total Bill</p>
        </div>

        {/* CASH INPUT */}
        {showCashInput && (
          <div className="mb-6 animate-fadeIn">
            <label className="block text-lg font-semibold mb-3 text-gray-700">Enter Cash Received</label>
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
                <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{Math.abs(balance).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handlePayment("Online")}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
          >
            <CreditCard size={28} /> Pay Online (UPI/Card)
          </button>

          <button
            onClick={() => setShowCashInput(true)}
            disabled={loading || showCashInput}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg"
          >
            <Wallet size={28} /> Pay Cash
          </button>

          {showCashInput && (
            <button
              onClick={() => handlePayment("Offline")}
              disabled={loading || received < total}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Send to Cashier →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
