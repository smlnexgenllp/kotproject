// src/components/TableManage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../api";
import CashierLayout from "./CashierLayout";
import { Eye, X, RefreshCw, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

const TableManage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [updatingSeat, setUpdatingSeat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedTable, setExpandedTable] = useState(null);
  const itemsPerPage = 8;

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleViewSeats = (table) => {
    setSelectedTable(table);
    setShowSeatsModal(true);
  };

  const toggleSeatAvailability = async (seatId, currentStatus) => {
    try {
      setUpdatingSeat(seatId);
      await API.post(`seats/${seatId}/toggle-availability/`);

      const updatedTables = tables.map((table) => {
        if (table.table_id === selectedTable.table_id) {
          return {
            ...table,
            seats: table.seats.map((seat) =>
              seat.seat_id === seatId
                ? { ...seat, is_available: !currentStatus }
                : seat
            ),
          };
        }
        return table;
      });

      setTables(updatedTables);
      if (selectedTable) {
        setSelectedTable((prev) => ({
          ...prev,
          seats: prev.seats.map((seat) =>
            seat.seat_id === seatId
              ? { ...seat, is_available: !currentStatus }
              : seat
          ),
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
        .filter((seat) => seat.row_number === row)
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
    if (!table.seats) return { color: "gray", text: "No Data", available: 0 };
    const availableSeats = table.seats.filter(
      (seat) => seat.is_available
    ).length;
    const totalSeats = table.total_seats;

    if (availableSeats === totalSeats) {
      return { color: "green", text: "Available", available: availableSeats };
    } else if (availableSeats === 0) {
      return { color: "red", text: "Full", available: availableSeats };
    } else {
      return { color: "orange", text: "Partial", available: availableSeats };
    }
  };

  // Pagination
  const totalPages = Math.ceil(tables.length / itemsPerPage);
  const currentTables = tables.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const toggleExpandTable = (tableId) => {
    setExpandedTable(expandedTable === tableId ? null : tableId);
  };

  if (loading) {
    return (
      <CashierLayout activePage="tables">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-4"
            >
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </motion.div>
            <p className="text-blue-900 font-semibold text-lg">
              Loading Tables...
            </p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout activePage="tables">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header with Refresh Button */}
        <div className="text-center mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
            <div className="text-left">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg sm:text-xl md:text-3xl font-bold text-gray-900"
              >
                Table Management
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs sm:text-sm md:text-base text-gray-600 mt-1"
              >
                Monitor table status and seat availability
              </motion.p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-xs sm:text-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2 rounded-lg border bg-green-50 text-green-800 border-green-200 text-center text-xs sm:text-sm"
          >
            {message}
          </motion.div>
        )}

        {/* Mobile Table View (Enhanced for small screens) */}
        <div className="lg:hidden">
          {tables.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No Tables Available</h3>
              <p className="text-gray-600 text-xs">Tables will appear here once added to the system.</p>
            </motion.div>
          ) : (
            <>
              <div className="space-y-2">
                {currentTables.map((table, index) => {
                  const status = getTableStatus(table);
                  const isExpanded = expandedTable === table.table_id;
                  
                  return (
                    <motion.div
                      key={table.table_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Compact Table Row */}
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                T{table.table_number}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                  Table {table.table_number}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  status.color === 'green' ? 'bg-green-100 text-green-800' :
                                  status.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {status.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span>ID: #{table.table_id}</span>
                                <span>•</span>
                                <span>{table.total_seats} seats</span>
                                <span>•</span>
                                <span className={
                                  status.color === 'green' ? 'text-green-600 font-semibold' :
                                  status.color === 'red' ? 'text-red-600 font-semibold' : 'text-orange-600 font-semibold'
                                }>
                                  {status.available} available
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewSeats(table)}
                              className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-medium"
                            >
                              <Eye size={12} />
                              <span className="hidden xs:inline">Seats</span>
                            </motion.button>
                            
                            <button
                              onClick={() => toggleExpandTable(table.table_id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 border-t border-gray-200"
                          >
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="font-semibold text-gray-900">{table.total_seats}</p>
                                <p className="text-gray-600">Total Seats</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="font-semibold text-gray-900">{table.seats_per_row}</p>
                                <p className="text-gray-600">Per Row</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="font-semibold text-green-600">{status.available}</p>
                                <p className="text-gray-600">Available</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 rounded">
                                <p className="font-semibold text-red-600">
                                  {table.total_seats - status.available}
                                </p>
                                <p className="text-gray-600">Occupied</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-3 bg-white rounded-lg shadow-sm p-2 border border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 rounded text-xs disabled:opacity-50"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>
                  
                  <span className="text-xs text-gray-600 font-medium">
                    {currentPage + 1} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 rounded text-xs disabled:opacity-50"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          {tables.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl shadow-lg"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Tables Available
              </h3>
              <p className="text-gray-600 text-lg">
                Tables will appear here once they are added to the system.
              </p>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold">Table</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Capacity</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Available</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Layout</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
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
                          <td className="px-4 py-4 font-bold text-gray-900">Table {table.table_number}</td>
                          <td className="px-4 py-4 text-gray-600">#{table.table_id}</td>
                          <td className="px-4 py-4 text-center font-medium">{table.total_seats} seats</td>
                          <td className="px-4 py-4 text-center font-semibold text-lg">
                            <span className={
                              status.color === 'green' ? 'text-green-600' :
                              status.color === 'red' ? 'text-red-600' : 'text-orange-600'
                            }>
                              {status.available}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">{table.seats_per_row} per row</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'red' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewSeats(table)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                            >
                              <Eye size={16} />
                              Manage
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
        </div>

        {/* Footer Stats */}
        {tables.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 bg-white rounded-lg shadow-sm p-3 border border-gray-200"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-blue-700">{tables.length}</p>
                <p className="text-gray-600 text-xs">Total Tables</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-700">
                  {tables.filter(table => getTableStatus(table).color === 'green').length}
                </p>
                <p className="text-gray-600 text-xs">Available</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-700">
                  {tables.filter(table => getTableStatus(table).color === 'orange').length}
                </p>
                <p className="text-gray-600 text-xs">Partial</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-700">
                  {tables.filter(table => getTableStatus(table).color === 'red').length}
                </p>
                <p className="text-gray-600 text-xs">Full</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Responsive Seat Management Modal */}
        {showSeatsModal && selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg w-full max-w-2xl sm:max-w-4xl max-h-[95vh] overflow-hidden"
            >
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">
                      Table {selectedTable.table_number} - Seat Management
                    </h2>
                    <p className="text-blue-100 mt-1 text-xs sm:text-sm">Click seats to toggle availability</p>
                  </div>
                  <button
                    onClick={() => setShowSeatsModal(false)}
                    className="flex-shrink-0 text-white hover:text-blue-200 transition p-1 rounded hover:bg-blue-700 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-4 overflow-auto max-h-[60vh]">
                <div className="space-y-4">
                  {getSeatArrangement(selectedTable).map((rowSeats, rowIndex) => (
                    <div key={rowIndex} className="space-y-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800 border-b pb-1">
                        Row {rowIndex + 1}
                      </h3>
                      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {rowSeats.map(seat => (
                          <motion.button
                            key={seat.seat_id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleSeatAvailability(seat.seat_id, seat.is_available)}
                            disabled={updatingSeat === seat.seat_id}
                            className={`p-2 rounded-lg border-2 transition-all relative overflow-hidden ${
                              seat.is_available
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 text-green-700 hover:from-green-100 hover:to-emerald-100'
                                : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 text-red-700 hover:from-red-100 hover:to-pink-100'
                            } ${updatingSeat === seat.seat_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {updatingSeat === seat.seat_id && (
                              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                            <div className="text-center">
                              <div className="text-sm font-bold mb-1">{seat.seat_number}</div>
                              <div className={`text-xs font-medium px-1 py-0.5 rounded-full ${
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

                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-bold text-gray-900">{selectedTable.total_seats}</p>
                      <p className="text-gray-600 text-xs">Total Seats</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-green-600">
                        {selectedTable.seats.filter(seat => seat.is_available).length}
                      </p>
                      <p className="text-gray-600 text-xs">Available</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-red-600">
                        {selectedTable.seats.filter(seat => !seat.is_available).length}
                      </p>
                      <p className="text-gray-600 text-xs">Occupied</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSeatsModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </CashierLayout>
  );
};

export default TableManage;
