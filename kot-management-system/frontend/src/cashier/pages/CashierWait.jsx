// src/pages/CashierWait.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, AlertCircle, ArrowLeft, Clock } from "lucide-react";
import Navbar from "../../users/components/Navbar.jsx";
import API from "../../api"; 
import { CheckCircle } from "lucide-react";

export default function CashierWait() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { orderId } = state || {};

  const [status, setStatus] = useState("waiting");
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const { tableNumber, cart, selectedSeats = [], tableId } = state || {};
  const [occupiedTables, setOccupiedTables] = useState([]); // NEW: Occupied tables state
  const OCCUPIED_TABLES_API = "http://127.0.0.1:8000/api/tables/occupied-tables/";

    useEffect(() => {
      const fetchTables = async () => {
        try {
          setTablesLoading(true);
          const res = await axios.get(TABLES_API);
          setActiveTables(res.data);
        } catch (err) {
          setTablesError("Failed to load tables");
          console.error(err);
        } finally {
          setTablesLoading(false);
        }
      };
      fetchTables();
    }, []);
  
    // NEW: Fetch occupied tables
    const fetchOccupiedTables = async () => {
      try {
        const res = await axios.get(OCCUPIED_TABLES_API);
        setOccupiedTables(res.data);
      } catch (err) {
        console.error("Error fetching occupied tables:", err);
        setOccupiedTables([]);
      }
    };
  
    // Fetch occupied tables on component mount and when seats change
    useEffect(() => {
      fetchOccupiedTables();
    }, []);
  
    // NEW: Handle occupied table selection
    const handleOccupiedTableSelect = async (table) => {
      setTableNumber(table.table_number);
      await fetchTableSeats(table.table_number);
      setShowSeatsModal(true);
    };

  useEffect(() => {
    if (!orderId) {
      navigate("/menu");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await API.get(`/cashier-orders/${orderId}/`);

        if (res.data.status === "paid") {
          setStatus("paid");
          // Redirect to success with full details
          setTimeout(() => {
            navigate("/success", {
              state: {
                orderId: res.data.order_id,
                tableNumber: res.data.table_number,
                total: res.data.total_amount,
                received: res.data.received_amount,
                balance: res.data.balance_amount,
                mode: res.data.payment_mode || "Cash",
              },
            });
          }, 1500);
        } 
        else if (["canceled", "cancelled"].includes(res.data.status)) {
          setStatus("canceled");
        }
        // else → still pending/waiting
      } catch (err) {
        console.error("Failed to check order status", err);
        // Optional: retry or show error
      }
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [orderId, navigate]);

  // Loading / Waiting State
  if (status === "waiting") {
    return (
      <>
          <Navbar
        user={user}
        onShowCart={() => setShowCartModal(true)}
        tableNumber={tableNumber}
        onShowTable={() => setShowTableModal(true)}
        selectedSeats={selectedSeats}
        occupiedTables={occupiedTables} // NEW: Pass occupied tables
        onOccupiedTableSelect={handleOccupiedTableSelect} // NEW: Pass handler
      />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Clock size={80} className="text-blue-600 mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold text-blue-900 mb-4">
              Waiting for Cashier...
            </h1>
            <p className="text-xl text-gray-700 font-semibold">Order #{orderId}</p>
            <p className="text-gray-600 mt-4 text-lg">
              Please wait while the cashier confirms your payment
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  // CANCELED State
  if (status === "canceled") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full border-4 border-red-200"
          >
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <XCircle size={100} className="mx-auto text-red-600 mb-6" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-red-700 mb-4">
              Order Canceled
            </h1>
            <p className="text-xl text-gray-700 font-semibold mb-2">
              Order #{orderId}
            </p>
            <p className="text-lg text-gray-600 mb-8">
              The cashier has canceled this order. No payment was processed.
            </p>

            <button
              onClick={() => navigate("/menu")}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-5 rounded-2xl text-xl shadow-lg flex items-center justify-center gap-3 transition transform hover:scale-105"
            >
              <ArrowLeft size={28} />
              Back to Menu
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // PAID State (Brief celebration before redirect)
  if (status === "paid") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              <CheckCircle size={100} className="mx-auto text-green-600 mb-6" />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-green-700">
              Payment Confirmed!
            </h1>
            <p className="text-xl text-gray-700 mt-4">Redirecting to receipt...</p>
          </motion.div>
        </div>
      </>
    );
  }

  return null;
}