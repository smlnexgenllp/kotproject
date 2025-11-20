// src/users/components/MenuPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  Pizza,
  IceCream,
  Plus,
  Minus,
  X,
  Check,
  Search,
  ShoppingCart,
  Loader2,
  Utensils,
  Table,
  User,
  Image,
  Users,
  Armchair
} from "lucide-react";
import axios from "axios";
import Navbar from "./Navbar";

const API_URL = "http://127.0.0.1:8000/api/food-menu/";
const TABLES_API = "http://127.0.0.1:8000/api/tables/active-numbers/";
const TABLE_SEATS_API = "http://127.0.0.1:8000/api/tables/table-seats/";
const OCCUPIED_TABLES_API = "http://127.0.0.1:8000/api/tables/occupied-tables/";
const MARK_SEAT_AVAILABLE_API = "http://127.0.0.1:8000/api/tables/mark-seat-available/";

export default function MenuPage() {
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showCartModal, setShowCartModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  // Tables state
  const [activeTables, setActiveTables] = useState([]);
  const [occupiedTables, setOccupiedTables] = useState([]); // NEW: Occupied tables state
  const [tableSeats, setTableSeats] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState("");
  const [seatsLoading, setSeatsLoading] = useState(false);

  // Fetch Menu + Categories
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const [itemsRes, catsRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(API_URL + "categories/"),
        ]);

        const items = itemsRes.data.map((item, index) => ({
          id: item.id ?? index + 1,
          food_id: item.food_id,
          name: item.food_name,
          price: item.price,
          category: item.category?.toLowerCase() || "uncategorized",
          image: item.image || null,
          food_type: item.food_type || "veg",
          original_price: item.original_price || null,
          description: item.description || "",
          preparation_time: item.preparation_time || 15,
          stock_status: item.stock_status || "in_stock",
          is_available_now: item.is_available_now !== false,
        }));

        const cats = catsRes.data.map((c) => c.toLowerCase());
        setMenuItems(items);
        setCategories(["all", ...cats]);
      } catch (err) {
        setError("Failed to load menu");
        console.error("Menu fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Fetch Active Tables
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

  // Fetch seats when table is selected
  const fetchTableSeats = async (tableNum) => {
    try {
      setSeatsLoading(true);
      const res = await axios.get(`${TABLE_SEATS_API}${tableNum}/`);
      setTableSeats(res.data);
    } catch (err) {
      console.error("Error fetching seats:", err);
      setTableSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  };

  // Handle table selection
  const handleTableSelect = async (table) => {
    setTableNumber(table.table_number);
    await fetchTableSeats(table.table_number);
    setShowTableModal(false);
    setShowSeatsModal(true);
  };

  // NEW: Handle occupied table selection
  const handleOccupiedTableSelect = async (table) => {
    setTableNumber(table.table_number);
    await fetchTableSeats(table.table_number);
    setShowSeatsModal(true);
  };

  // NEW: Mark individual seat as available
  const markSeatAvailable = async (seatNumber) => {
    try {
      await axios.post(MARK_SEAT_AVAILABLE_API, {
        seat_number: seatNumber,
        table_number: tableNumber
      });
      
      // Refresh seats data and occupied tables
      await fetchTableSeats(tableNumber);
      await fetchOccupiedTables();
    } catch (err) {
      console.error("Error marking seat available:", err);
      alert("Failed to mark seat as available");
    }
  };

  // UPDATED: Handle seat selection - allow marking occupied seats as available
  const handleSeatSelect = async (seat) => {
    if (!seat.is_available) {
      // If seat is occupied, ask to mark it as available
      if (window.confirm(`Do you want to mark seat ${seat.seat_number} as available? This will free up the seat for new orders.`)) {
        await markSeatAvailable(seat.seat_number);
      }
      return;
    }

    // If seat is available, select it for ordering
    setSelectedSeats(prev => {
      const isAlreadySelected = prev.some(s => s.seat_id === seat.seat_id);
      if (isAlreadySelected) {
        return prev.filter(s => s.seat_id !== seat.seat_id);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Confirm seat selection
  const confirmSeatSelection = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    setShowSeatsModal(false);
  };

  const filtered = useMemo(() => {
    return menuItems.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCat === "all" || i.category === activeCat;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, search, activeCat]);

  // Cart functionality
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQuantity = (itemId) => {
    const cartItem = cart.find((item) => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getImageUrl = (item) => {
    if (!item.image) return null;
    const img = item.image.trim();

    if (img.startsWith("https://res.cloudinary.com")) return img;
    if (img.includes("image/upload/https://res.cloudinary.com")) {
      return img.substring(img.indexOf("https://res.cloudinary.com"));
    }
    if (img.startsWith("kot/")) {
      return `https://res.cloudinary.com/dx0w3e13s/image/upload/w_300,h_200,c_fill/${img}`;
    }
    if (img.includes("cloudinary.com")) {
      try {
        const url = new URL(img);
        const pathParts = url.pathname.split("/");
        const publicId = pathParts
          .slice(pathParts.indexOf("upload") + 1)
          .join("/");
        return `https://res.cloudinary.com/dx0w3e13s/image/upload/w_300,h_200,c_fill/${publicId}`;
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleProceed = async () => {
    if (!tableNumber.trim()) {
      setShowTableModal(true);
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Please select seats first!");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      alert("Waiter not logged in!");
      return;
    }

    // Get table ID for reference
    const table = activeTables.find(t => t.table_number.toString() === tableNumber.toString());

    navigate("/payment", {
      state: {
        tableNumber,
        selectedSeats,
        tableId: table?.table_id,
        cart,
        total,
        waiter_name: user.name || "",
        waiter_id: user.id,
      },
    });
  };

  // Group seats by row for display
  const groupSeatsByRow = (seats) => {
    const grouped = {};
    seats.forEach(seat => {
      if (!grouped[seat.row_number]) {
        grouped[seat.row_number] = [];
      }
      grouped[seat.row_number].push(seat);
    });
    return grouped;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4"
          >
            <Coffee className="text-blue-600" size={64} />
          </motion.div>
          <p className="text-blue-900 font-semibold text-lg">Loading Menu...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-700 text-xl font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar
        user={user}
        cartCount={itemCount}
        onShowCart={() => setShowCartModal(true)}
        tableNumber={tableNumber}
        onShowTable={() => setShowTableModal(true)}
        selectedSeats={selectedSeats}
        occupiedTables={occupiedTables} // NEW: Pass occupied tables
        onOccupiedTableSelect={handleOccupiedTableSelect} // NEW: Pass handler
      />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-2"
          >
            Our Delicious Menu
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-blue-100"
          >
            Fresh ingredients, authentic flavors
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"
                size={20}
              />
              <input
                type="text"
                placeholder="Search food items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-base shadow-lg bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                    activeCat === cat
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "bg-white text-blue-700 border border-blue-300 hover:border-blue-500"
                  }`}
                >
                  {cat === "all"
                    ? "All"
                    : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-20">
          {filtered.map((item, index) => {
            const cartQuantity = getCartQuantity(item.id);
            const isVeg = item.food_type === "veg";
            const isAvailable =
              item.is_available_now && item.stock_status === "in_stock";
            const imageUrl = getImageUrl(item);
            const hasImage = imageUrl !== null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group flex h-28 cursor-pointer"
              >
                <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden bg-gray-100">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      hasImage ? "hidden" : "flex"
                    }`}
                  >
                    <div className="text-center">
                      <Image className="mx-auto text-gray-400 mb-1" size={20} />
                      <span className="text-xs text-gray-500 font-medium">
                        No Image
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-1 left-1">
                    <div
                      className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                        isVeg
                          ? "border-green-600 bg-green-50"
                          : "border-red-600 bg-red-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isVeg ? "bg-green-600" : "bg-red-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-gray-500 text-xs capitalize mb-1">
                      {item.category}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="min-w-0">
                      <span className="text-base font-bold text-gray-900">
                        ₹{item.price}
                      </span>
                      {item.original_price && (
                        <span className="text-xs text-gray-500 line-through ml-1">
                          ₹{item.original_price}
                        </span>
                      )}
                    </div>

                    {!isAvailable ? (
                      <div className="text-xs text-red-600 font-semibold px-2 py-1 bg-red-50 rounded border border-red-200">
                        Unavailable
                      </div>
                    ) : cartQuantity > 0 ? (
                      <div className="flex items-center border border-green-500 rounded-lg overflow-hidden bg-green-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, -1);
                          }}
                          className="w-6 h-6 bg-white text-green-600 hover:bg-green-100 font-bold text-xs transition-colors flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-green-700 text-xs flex items-center justify-center">
                          {cartQuantity}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, 1);
                          }}
                          className="w-6 h-6 bg-green-500 text-white hover:bg-green-600 font-bold text-xs transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        ADD
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 font-bold mb-2">
                No items found
              </p>
              <p className="text-gray-500 text-sm">
                Try different search or category
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== TABLE SELECTION MODAL ==================== */}
      <AnimatePresence>
        {showTableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTableModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Table className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Select Table
                </h3>
                <p className="text-gray-600">Choose a table to continue</p>
              </div>

              <div className="space-y-4">
                {tablesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : tablesError ? (
                  <p className="text-center text-red-600">{tablesError}</p>
                ) : activeTables.length === 0 ? (
                  <p className="text-center text-gray-600">
                    No active tables found
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activeTables.map((table) => (
                      <button
                        key={table.table_id}
                        onClick={() => handleTableSelect(table)}
                        className={`py-2 rounded-lg font-semibold transition-all ${
                          tableNumber === table.table_number
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Table {table.table_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== UPDATED SEAT SELECTION MODAL ==================== */}
      <AnimatePresence>
        {showSeatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSeatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Armchair className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Manage Seats - Table {tableNumber}
                </h3>
                <p className="text-gray-600">
                  • Click <span className="text-green-600 font-semibold">available seats</span> to select for ordering<br/>
                  • Click <span className="text-red-600 font-semibold">occupied seats</span> to mark them as available
                </p>
              </div>

              {/* Seat Status Legend */}
              <div className="flex justify-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
                  <span>Occupied (Click to free)</span>
                </div>
              </div>

              <div className="space-y-6">
                {seatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-green-600" size={32} />
                  </div>
                ) : tableSeats.length === 0 ? (
                  <p className="text-center text-gray-600">No seats found for this table</p>
                ) : (
                  Object.entries(groupSeatsByRow(tableSeats)).map(([rowNumber, seats]) => (
                    <div key={rowNumber} className="space-y-3">
                      <h4 className="font-semibold text-gray-700 border-b pb-2">Row {rowNumber}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {seats.map(seat => (
                          <button
                            key={seat.seat_id}
                            onClick={() => handleSeatSelect(seat)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              selectedSeats.some(s => s.seat_id === seat.seat_id)
                                ? 'bg-green-500 border-green-600 text-white shadow-lg transform scale-105'
                                : seat.is_available
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:scale-105'
                                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:scale-105 cursor-pointer'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-bold text-sm mb-1">Seat {seat.seat_number}</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                selectedSeats.some(s => s.seat_id === seat.seat_id)
                                  ? 'bg-green-600 text-white'
                                  : seat.is_available
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800'
                              }`}>
                                {selectedSeats.some(s => s.seat_id === seat.seat_id)
                                  ? '✓ Selected'
                                  : seat.is_available
                                  ? 'Available'
                                  : 'Occupied'
                                }
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600">Selected Seats for Order:</span>
                  <span className="font-semibold text-green-700">
                    {selectedSeats.length > 0 
                      ? selectedSeats.map(s => s.seat_number).join(', ')
                      : 'None selected'
                    }
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedSeats([]);
                      setShowSeatsModal(false);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-center font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSeatSelection}
                    disabled={selectedSeats.length === 0}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${
                      selectedSeats.length > 0
                        ? "bg-green-500 hover:bg-green-600 shadow-lg"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Confirm {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CART MODAL ==================== */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
            onClick={() => setShowCartModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Your Order</h2>
                  <p className="text-blue-100 text-sm">
                    {tableNumber 
                      ? `Table ${tableNumber} - Seats: ${selectedSeats.map(s => s.seat_number).join(', ') || 'Not selected'}`
                      : "No table selected"
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-1 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart
                      size={48}
                      className="mx-auto text-gray-400 mb-3"
                    />
                    <p className="text-lg text-gray-600 font-bold">
                      Your cart is empty
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Add some items to get started!
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-blue-50 rounded-lg p-3 flex justify-between items-center border border-blue-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {item.name}
                        </p>
                        <p className="text-blue-600 font-medium text-xs">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded bg-white shadow hover:bg-gray-100 transition-colors font-bold text-xs"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-gray-900 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-gray-900 w-16 text-right text-sm">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 bg-green-50 border-t">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span className="text-green-700">₹{total}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceed}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                      tableNumber.trim() && selectedSeats.length > 0
                        ? "bg-green-500 hover:bg-green-600 shadow-lg"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {tableNumber.trim() && selectedSeats.length > 0 
                      ? "Proceed to Payment" 
                      : "Select Table & Seats"
                    }
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}