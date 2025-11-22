// src/pages/OrderSuccess.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, IndianRupee, ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import { useState } from "react";
import { useRef, useEffect } from "react";

export default function OrderSuccess() {
  const { state } = useLocation();
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const { tableNumber, cart, selectedSeats = [], tableId } = state || {};
  const [occupiedTables, setOccupiedTables] = useState([]); // NEW: Occupied tables state
  const OCCUPIED_TABLES_API = "http://127.0.0.1:8000/api/tables/occupied-tables/";
  const navigate = useNavigate();

  const {
    orderId = "N/A",
    tableNumbers = "N/A",
    selected_seats = "N/A",
    total = 0,
    mode = "Unknown",
    received = total,
    balance = 0,
  } = state || {};

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