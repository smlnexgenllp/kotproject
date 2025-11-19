// src/components/TableList.jsx
import React, { useState, useEffect } from "react";
import API from "../../api";

const TableList = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState({
    table_number: "",
    total_seats: 4,
    seats_per_row: 2
  });

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

  // Delete table
  const handleDelete = async (tableId, tableNumber) => {
    try {
      await API.delete(`tables/${tableId}/`);
      setMessage(`Table ${tableNumber} deleted successfully`);
      setDeleteConfirm(null);
      fetchTables(); // Refresh the list
    } catch (err) {
      console.error("Error deleting table:", err);
      setMessage("Failed to delete table");
    }
  };

  // Handle successful table addition
  const handleTableAdded = () => {
    setShowAddModal(false);
    setForm({ table_number: "", total_seats: 4, seats_per_row: 2 });
    fetchTables();
    setMessage("Table added successfully!");
  };

  // Handle successful table update
  const handleTableUpdated = () => {
    setShowEditModal(false);
    setEditingTable(null);
    setForm({ table_number: "", total_seats: 4, seats_per_row: 2 });
    fetchTables();
    setMessage("Table updated successfully!");
  };

  // Handle edit button click
  const handleEditClick = (table) => {
    setEditingTable(table);
    setForm({ 
      table_number: table.table_number,
      total_seats: table.total_seats,
      seats_per_row: table.seats_per_row
    });
    setShowEditModal(true);
  };

  // Handle view seats click
  const handleViewSeats = (table) => {
    setSelectedTable(table);
    setShowSeatsModal(true);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ 
      ...form, 
      [name]: name === 'total_seats' || name === 'seats_per_row' ? parseInt(value) : value 
    });
  };

  // Handle add table submit
  const handleAddSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  console.log("Form data being sent:", form);

  try {
    const response = await API.post("tables/", {
      table_number: form.table_number,
      total_seats: parseInt(form.total_seats),
      seats_per_row: parseInt(form.seats_per_row)
    });
    
    console.log("Success! Response:", response.data);
    handleTableAdded();
    
  } catch (err) {
    console.error("❌ ADD TABLE ERROR ❌");
    console.error("Error object:", err);
    console.error("Response status:", err.response?.status);
    console.error("Response data:", err.response?.data);
    console.error("Response headers:", err.response?.headers);
    
    // Display the actual error from server
    if (err.response?.data) {
      const errorData = err.response.data;
      
      if (typeof errorData === 'object') {
        // Handle field-specific errors
        const fieldErrors = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
          .join(', ');
        
        setMessage(`Validation Error: ${fieldErrors}`);
      } else {
        setMessage(`Error: ${errorData}`);
      }
    } else {
      setMessage("Network error: Could not connect to server");
    }
  }
};

  // Handle edit table submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await API.put(`tables/${editingTable.table_id}/`, form);
      handleTableUpdated();
    } catch (err) {
      console.error("Edit table error:", err);
      setMessage(
        err.response?.data?.table_number?.[0] ||
        err.response?.data?.total_seats?.[0] ||
        err.response?.data?.seats_per_row?.[0] ||
        err.response?.data?.error ||
        "Failed to update table"
      );
    }
  };

  // Toggle seat availability
  const toggleSeatAvailability = async (seatId, currentStatus) => {
    try {
      await API.post(`seats/${seatId}/toggle-availability/`);
      // Refresh the table data to get updated seat status
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
      
      // Also update selected table if modal is open
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
    } catch (err) {
      console.error("Error toggling seat availability:", err);
      setMessage("Failed to update seat availability");
    }
  };

  // Generate seat preview
  const generateSeatPreview = () => {
    if (!form.table_number) return [];
    
    const rows = Math.ceil(form.total_seats / form.seats_per_row);
    const seatLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const arrangement = [];
    let seatCount = 0;

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let seatIdx = 0; seatIdx < form.seats_per_row; seatIdx++) {
        if (seatCount < form.total_seats) {
          rowSeats.push(`${form.table_number}${row}${seatLabels[seatIdx]}`);
          seatCount++;
        }
      }
      arrangement.push(rowSeats);
    }
    return arrangement;
  };

  // Get seat arrangement for display
  const getSeatArrangement = (table) => {
    if (!table.seats || table.seats.length === 0) return [];
    
    const rows = Math.ceil(table.total_seats / table.seats_per_row);
    const arrangement = [];
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats = table.seats.filter(seat => seat.row_number === row);
      arrangement.push(rowSeats);
    }
    return arrangement;
  };

  // Confirm delete dialog
  const confirmDelete = (tableId, tableNumber) => {
    setDeleteConfirm({ tableId, tableNumber });
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="mt-2 text-gray-600">Manage restaurant tables and seating arrangement</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Table
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.includes("success") || message.includes("deleted")
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Tables List */}
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tables</h3>
            <p className="mt-2 text-gray-500">Get started by adding your first table.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Table
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm">
              <div className="col-span-1">Table ID</div>
              <div className="col-span-2">Table Number</div>
              <div className="col-span-2">Total Seats</div>
              <div className="col-span-2">Available</div>
              <div className="col-span-2">Configuration</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {tables.map((table) => {
                const availableSeats = table.seats ? table.seats.filter(seat => seat.is_available).length : 0;
                return (
                  <div
                    key={table.table_id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {/* Table ID */}
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        #{table.table_id}
                      </span>
                    </div>

                    {/* Table Number */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-lg font-semibold text-gray-900">
                        Table {table.table_number}
                      </span>
                    </div>

                    {/* Total Seats */}
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {table.total_seats} seats
                        </span>
                      </div>
                    </div>

                    {/* Available Seats */}
                    <div className="col-span-2 flex items-center">
                      <span className={`text-sm font-medium ${
                        availableSeats === 0 ? 'text-red-600' : 
                        availableSeats === table.total_seats ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {availableSeats} available
                      </span>
                    </div>

                    {/* Configuration */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-gray-600">
                        {table.seats_per_row} per row
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewSeats(table)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Seats
                      </button>
                      <button
                        onClick={() => handleEditClick(table)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(table.table_id, table.table_number)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {tables.length} table{tables.length !== 1 ? 's' : ''} • 
                Total capacity: {tables.reduce((sum, table) => sum + table.total_seats, 0)} seats
              </p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete Table {deleteConfirm.tableNumber}? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.tableId, deleteConfirm.tableNumber)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Table Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Add New Table</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      name="table_number"
                      value={form.table_number}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      placeholder="Enter table number (e.g., 1, 2, 3)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Seats *
                      </label>
                      <select
                        name="total_seats"
                        value={form.total_seats}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      >
                        <option value={2}>2 Seats</option>
                        <option value={4}>4 Seats</option>
                        <option value={6}>6 Seats</option>
                        <option value={8}>8 Seats</option>
                        <option value={10}>10 Seats</option>
                        <option value={12}>12 Seats</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seats Per Row *
                      </label>
                      <select
                        name="seats_per_row"
                        value={form.seats_per_row}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      >
                        <option value={2}>2 Seats/row</option>
                        <option value={3}>3 Seats/row</option>
                        <option value={4}>4 Seats/row</option>
                      </select>
                    </div>
                  </div>

                  {/* Seat Preview */}
                  {form.table_number && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Seat Arrangement Preview:
                      </h4>
                      <div className="space-y-2">
                        {generateSeatPreview().map((row, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 w-8">Row {index + 1}:</span>
                            <div className="flex space-x-1">
                              {row.map(seat => (
                                <span
                                  key={seat}
                                  className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium"
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Total: {form.total_seats} seats across {Math.ceil(form.total_seats / form.seats_per_row)} rows
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-center font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                      Add Table
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Table Modal */}
        {showEditModal && editingTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Edit Table</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTable(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      name="table_number"
                      value={form.table_number}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      placeholder="Enter table number"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Seats *
                      </label>
                      <select
                        name="total_seats"
                        value={form.total_seats}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      >
                        <option value={2}>2 Seats</option>
                        <option value={4}>4 Seats</option>
                        <option value={6}>6 Seats</option>
                        <option value={8}>8 Seats</option>
                        <option value={10}>10 Seats</option>
                        <option value={12}>12 Seats</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seats Per Row *
                      </label>
                      <select
                        name="seats_per_row"
                        value={form.seats_per_row}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                      >
                        <option value={2}>2 Seats/row</option>
                        <option value={3}>3 Seats/row</option>
                        <option value={4}>4 Seats/row</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingTable(null);
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-center font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                      Update Table
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Seats Modal */}
        {showSeatsModal && selectedTable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Seat Arrangement - Table {selectedTable.table_number}
                  </h2>
                  <button
                    onClick={() => setShowSeatsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {getSeatArrangement(selectedTable).map((rowSeats, rowIndex) => (
                    <div key={rowIndex} className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700">Row {rowIndex + 1}</h3>
                      <div className="flex space-x-2">
                        {rowSeats.map(seat => (
                          <button
                            key={seat.seat_id}
                            onClick={() => toggleSeatAvailability(seat.seat_id, seat.is_available)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              seat.is_available
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-semibold">{seat.seat_number}</div>
                              <div className="text-xs mt-1">
                                {seat.is_available ? 'Available' : 'Occupied'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Seats: {selectedTable.total_seats}</span>
                    <span className="text-green-600">
                      Available: {selectedTable.seats.filter(seat => seat.is_available).length}
                    </span>
                    <span className="text-red-600">
                      Occupied: {selectedTable.seats.filter(seat => !seat.is_available).length}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={() => setShowSeatsModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-center font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableList;