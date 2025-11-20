// src/components/TableManage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";

const TableManage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [updatingSeat, setUpdatingSeat] = useState(null);
  const navigate = useNavigate();

  // Fetch all tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await API.get("tables/");
      setTables(response.data);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setMessage("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleViewSeats = (table) => {
    setSelectedTable(table);
    setShowSeatsModal(true);
  };

  const toggleSeatAvailability = async (seatId, currentStatus) => {
    try {
      setUpdatingSeat(seatId);
      await API.post(`seats/${seatId}/toggle-availability/`);

      const updatedTables = tables.map(table => {
        if (table.table_id === selectedTable.table_id) {
          return {
            ...table,
            seats: table.seats.map(seat =>
              seat.seat_id === seatId
                ? { ...seat, is_available: !currentStatus }
                : seat
            )
          };
        }
        return table;
      });

      setTables(updatedTables);
      if (selectedTable) {
        setSelectedTable(prev => ({
          ...prev,
          seats: prev.seats.map(seat =>
            seat.seat_id === seatId
              ? { ...seat, is_available: !currentStatus }
              : seat
          )
        }));
      }

      setMessage(`Seat status updated successfully`);
    } catch (err) {
      console.error("Error toggling seat availability:", err);
      setMessage("Failed to update seat availability");
    } finally {
      setUpdatingSeat(null);
    }
  };

  const getSeatArrangement = (table) => {
    if (!table.seats || table.seats.length === 0) return [];
    const rows = Math.ceil(table.total_seats / table.seats_per_row);
    const arrangement = [];
    for (let row = 1; row <= rows; row++) {
      const rowSeats = table.seats
        .filter(seat => seat.row_number === row)
        .sort((a, b) => a.seat_number.localeCompare(b.seat_number));
      arrangement.push(rowSeats);
    }
    return arrangement;
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const getTableStatus = (table) => {
    if (!table.seats) return { color: 'gray', text: 'No Data', available: 0 };
    const availableSeats = table.seats.filter(seat => seat.is_available).length;
    const totalSeats = table.total_seats;

    if (availableSeats === totalSeats) {
      return { color: 'green', text: 'Available', available: availableSeats };
    } else if (availableSeats === 0) {
      return { color: 'red', text: 'Full', available: availableSeats };
    } else {
      return { color: 'orange', text: 'Partial', available: availableSeats };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
        <Sidebar active="tables" onLogout={handleLogout} />
        <main className="flex-1 ml-72 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4"
            >
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </motion.div>
            <p className="text-blue-900 font-semibold text-lg">Loading Tables...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex">
      <Sidebar active="tables" onLogout={handleLogout} />

      <main className="flex-1 ml-72 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Table Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Monitor table status and manage seat availability in real-time
            </motion.p>
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl border bg-green-50 text-green-800 border-green-200 text-center"
            >
              {message}
            </motion.div>
          )}

          {/* Tables as Table Format */}
          {tables.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl shadow-lg"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tables Available</h3>
              <p className="text-gray-600 text-lg">Tables will appear here once they are added to the system.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Table</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Capacity</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Available</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Layout</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tables.map((table, index) => {
                      const status = getTableStatus(table);
                      return (
                        <motion.tr
                          key={table.table_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-5 font-bold text-gray-900">Table {table.table_number}</td>
                          <td className="px-6 py-5 text-gray-600">#{table.table_id}</td>
                          <td className="px-6 py-5 text-center font-medium">{table.total_seats} seats</td>
                          <td className="px-6 py-5 text-center font-semibold text-lg">
                            <span className={
                              status.color === 'green' ? 'text-green-600' :
                              status.color === 'red' ? 'text-red-600' : 'text-orange-600'
                            }>
                              {status.available}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center text-gray-700">{table.seats_per_row} per row</td>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewSeats(table)}
                              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                            >
                              Manage Seats
                            </motion.button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Footer Stats */}
          {tables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-700">{tables.length}</p>
                  <p className="text-gray-600 text-sm">Total Tables</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {tables.filter(table => getTableStatus(table).color === 'green').length}
                  </p>
                  <p className="text-gray-600 text-sm">Available</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">
                    {tables.filter(table => getTableStatus(table).color === 'orange').length}
                  </p>
                  <p className="text-gray-600 text-sm">Partial</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">
                    {tables.filter(table => getTableStatus(table).color === 'red').length}
                  </p>
                  <p className="text-gray-600 text-sm">Full</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Same Seat Management Modal (unchanged) */}
          {showSeatsModal && selectedTable && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Table {selectedTable.table_number} - Seat Management
                      </h2>
                      <p className="text-blue-100 mt-1">Click on seats to toggle availability</p>
                    </div>
                    <button
                      onClick={() => setShowSeatsModal(false)}
                      className="text-white hover:text-blue-200 transition p-2 rounded-lg hover:bg-blue-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-auto max-h-[60vh]">
                  <div className="space-y-8">
                    {getSeatArrangement(selectedTable).map((rowSeats, rowIndex) => (
                      <div key={rowIndex} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                          Row {rowIndex + 1}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {rowSeats.map(seat => (
                            <motion.button
                              key={seat.seat_id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleSeatAvailability(seat.seat_id, seat.is_available)}
                              disabled={updatingSeat === seat.seat_id}
                              className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                                seat.is_available
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 text-green-700 hover:from-green-100 hover:to-emerald-100'
                                  : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 text-red-700 hover:from-red-100 hover:to-pink-100'
                              } ${updatingSeat === seat.seat_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {updatingSeat === seat.seat_id && (
                                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <div className="text-center">
                                <div className="text-xl font-bold mb-1">{seat.seat_number}</div>
                                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  seat.is_available ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                }`}>
                                  {seat.is_available ? 'Available' : 'Occupied'}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedTable.total_seats}</p>
                        <p className="text-sm text-gray-600">Total Seats</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTable.seats.filter(seat => seat.is_available).length}
                        </p>
                        <p className="text-sm text-gray-600">Available Seats</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedTable.seats.filter(seat => !seat.is_available).length}
                        </p>
                        <p className="text-sm text-gray-600">Occupied Seats</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowSeatsModal(false)}
                      className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TableManage;