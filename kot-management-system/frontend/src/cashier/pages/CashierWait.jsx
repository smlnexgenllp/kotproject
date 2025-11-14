import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CashierWait() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { orderId } = state || {};

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/cashier-orders/${orderId}/`);
        if (res.data.status === "paid") {
          navigate("/success", { state: { tableNumber: res.data.table_number, total: res.data.total_amount, mode: "Cash" } });
        }
      } catch (err) {}
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
        <div className="animate-spin text-blue-600 mb-6">
          <div className="w-20 h-20 border-8 border-blue-200 border-t-blue-600 rounded-full"></div>
        </div>
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Waiting for Cashier...</h1>
        <p className="text-gray-600 text-lg">Order #{orderId}</p>
        <p className="text-gray-500 mt-4">Please wait while cashier confirms payment</p>
      </div>
    </div>
  );
}