// src/users/components/MenuPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, Pizza, IceCream, Plus, Minus, X, Check, Search,
  ShoppingCart, Loader2, Utensils, Table, User, Image
} from "lucide-react";
import axios from "axios";
import Navbar from "./Navbar";

const API_URL = "http://127.0.0.1:8000/api/food-menu/";
const TABLES_API = "http://127.0.0.1:8000/api/tables/";  // <-- NEW
const CASHIER_API = "http://127.0.0.1:8000/api/orders/create_order/";

export default function MenuPage() {
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showCartModal, setShowCartModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const [itemsRes, catsRes] = await Promise.all([
          axios.get(API_URL),
          axios.get(API_URL + "categories/"),
        ]);
      
        const items = itemsRes.data.map((item) => ({
          id: item.id,
          food_id: item.id,
          name: item.food_name,
          price: item.price,
          category: item.category?.toLowerCase() || "uncategorized",
          image: item.image || null,
          food_type: item.food_type || "veg", 
          original_price: item.original_price || null,
          description: item.description || "",
          preparation_time: item.preparation_time || 15,
          stock_status: item.stock_status || "in_stock",
          is_available_now: item.is_available_now !== false
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

  fetchMenu();
}, []); // RUN ONCE
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
      const existingItem = prev.find((c) => c.id === item.id);
      if (existingItem) {
        return prev.filter((c) =>
          c.id !== item.id 
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

  // Get cart quantity for specific item
  const getCartQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getImageUrl = (item) => {
  if (!item.image) return null;

  const img = item.image.trim();

  // 1) Already correct, full Cloudinary URL
  if (img.startsWith("https://res.cloudinary.com")) {
    return img;
  }

  // 2) Broken format: "image/upload/https://res.cloudinary.com/...”
  if (img.includes("image/upload/https://res.cloudinary.com")) {
    const fixedUrl = img.substring(img.indexOf("https://res.cloudinary.com"));
    return fixedUrl; // return the correct URL only
  }

  // 3) If it's only public_id (starts with kot/)
  if (img.startsWith("kot/")) {
    return `https://res.cloudinary.com/dx0w3e13s/image/upload/w_300,h_200,c_fill/${img}`;
  }

  // 4) A different cloudinary account
  if (img.includes("cloudinary.com")) {
    try {
      const url = new URL(img);
      const pathParts = url.pathname.split('/');
      const publicId = pathParts.slice(pathParts.indexOf('upload') + 1).join('/');
      return `https://res.cloudinary.com/dx0w3e13s/image/upload/w_300,h_200,c_fill/${publicId}`;
    } catch {
      console.warn("Failed to parse Cloudinary URL:", img);
      return null;
    }
  }

  // Unknown format
  return null;
};

  const handleProceed = async () => {
    if (!tableNumber.trim()) {
      setShowTableModal(true);
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const orderData = {
        tableNumber: parseInt(tableNumber),
        total: total,
        cart: cart.map(item => ({
          food_id: item.food_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMode: "cash"
      };

      const response = await axios.post("http://127.0.0.1:8000/api/cashier-orders/create_order/", orderData);
      
      if (response.status === 201) {
        navigate("/payment", { 
          state: { 
            tableNumber, 
            cart, 
            total,
            orderId: response.data.order_id 
          } 
        });
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  console.log("Sending order:", payload);

  try {
    const res = await axios.post(CASHIER_API, payload, {
      headers: { "Content-Type": "application/json" },
    });

    navigate("/cashier", {
      state: {
        order_id: res.data.order_id,
        tableNumber,
        total: res.data.total_amount,
        items: res.data.items,
      },
    });
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    alert("Order failed: " + msg);
  }
};

 

  if (loading) return (
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

  if (error) return (
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
      {/* Navigation Bar with Table Option */}
      <Navbar 
        user={user} 
        cartCount={itemCount}
        onShowCart={() => setShowCartModal(true)}
        tableNumber={tableNumber}
        onShowTable={() => setShowTableModal(true)}
      />

      {/* Hero Section - More Compact */}
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

      {/* Search & Categories - More Compact */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={20} />
              <input
                type="text"
                placeholder="Search food items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-base shadow-lg bg-white"
              />
            </div>
          </div>

          {/* Categories */}
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
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid - Compact Horizontal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-20">
          {filtered.map((item, index) => {
            const cartQuantity = getCartQuantity(item.id);
            const isVeg = item.food_type === "veg";
            const isAvailable = item.is_available_now && item.stock_status === "in_stock";
            
            // FIXED: Use the improved image URL function
            const imageUrl = getImageUrl(item);
            const hasImage = imageUrl !== null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group flex h-28"
              >
                {/* Food Image - 30% width */}
                <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden bg-gray-100">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        console.log('Image failed to load:', imageUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback when no image or image fails to load */}
                  <div 
                    className={`w-full h-full flex items-center justify-center ${hasImage ? 'hidden' : 'flex'}`}
                  >
                    <div className="text-center">
                      <Image className="mx-auto text-gray-400 mb-1" size={20} />
                      <span className="text-xs text-gray-500 font-medium">No Image</span>
                    </div>
                  </div>
                  
                  {/* Government Style Veg/Non-Veg Icon */}
                  <div className="absolute top-1 left-1">
                    <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                      isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isVeg ? 'bg-green-600' : 'bg-red-600'
                      }`} />
                    </div>
                  </div>
                  
                  {/* Stock Status Badge */}
                  {!isAvailable && (
                    <div className="absolute bottom-1 left-1 right-1 bg-red-600 text-white text-xs px-1 py-0.5 rounded text-center font-semibold">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Food Details - 70% width */}
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
                      <span className="text-base font-bold text-gray-900">₹{item.price}</span>
                      {item.original_price && (
                        <span className="text-xs text-gray-500 line-through ml-1">
                          ₹{item.original_price}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button - FIXED: Each card shows only its own quantity */}
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
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all duration-300 shadow-md whitespace-nowrap"
                      >
                        ADD
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* No Items Found */}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 font-bold mb-2">No items found</p>
              <p className="text-gray-500 text-sm">Try different search or category</p>
            </div>
          )}
        </div>
      </div>

      {/* Table Selection Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Table className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Table Number</h3>
                <p className="text-gray-600">Enter your table number to continue</p>
              </div>

              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Enter table number..."
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-4 py-3 text-lg text-center rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none bg-blue-50 font-bold"
                  min="1"
                  autoFocus
                />
                
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setTableNumber(num.toString())}
                      className={`py-2 rounded-lg font-semibold transition-all ${
                        tableNumber === num.toString()
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Table {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (tableNumber.trim()) {
                      setShowTableModal(false);
                    }
                  }}
                  disabled={!tableNumber.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    tableNumber.trim()
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirm Table
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Your Order</h2>
                  <p className="text-blue-100 text-sm">
                    {tableNumber ? `Table ${tableNumber}` : "No table selected"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCartModal(false)}
                  className="p-1 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-lg text-gray-600 font-bold">Your cart is empty</p>
                    <p className="text-gray-500 text-sm mt-1">Add some items to get started!</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-blue-50 rounded-lg p-3 flex justify-between items-center border border-blue-200"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
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

              {/* Footer */}
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
                      tableNumber.trim()
                        ? "bg-green-500 hover:bg-green-600 shadow-lg"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {tableNumber.trim() ? "Proceed to Payment" : "Select Table"}
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