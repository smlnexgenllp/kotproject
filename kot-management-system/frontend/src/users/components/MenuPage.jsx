// src/users/components/MenuPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, Pizza, IceCream, Plus, Minus, X, Check, Search,
  ShoppingCart, Loader2
} from "lucide-react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/food-menu/";

export default function MenuPage() {
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState("");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showCartModal, setShowCartModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          name: item.food_name,
          price: item.price,
          category: item.category.toLowerCase(),
          image: item.image || null,
          food_type: item.food_type || "veg", 
          original_price: item.original_price || null
        }));

        const cats = catsRes.data.map((c) => c.toLowerCase());
        setMenuItems(items);
        setCategories(["all", ...cats]);
      } catch (err) {
        setError("Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filtered = useMemo(() => {
    return menuItems.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCat === "all" || i.category === activeCat;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, search, activeCat]);

  

const toggleItem = (item) => {
 
  setCart((prev) => {
    const exists = prev.find((c) => c.id === item.id);
    if (exists) {
      return prev.filter((c) => c.id !== item.id);
    }
    return [...prev, { ...item, quantity: 1 }];
  });
};

const updateQty = (id, delta) => {
  setCart((prev) => {
    return prev
      .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
      .filter((c) => c.quantity > 0);
  });
};
  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleProceed = () => {
    if (!tableNumber.trim()) return alert("Enter Table No.");
    if (cart.length === 0) return alert("Cart is empty!");
    navigate("/payment", { state: { tableNumber, cart, total } });
  };

  if (loading) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-700 text-xl font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 pb-32">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Menu</h1>
          <button
            onClick={() => setShowCartModal(true)}
            className="relative p-3 bg-blue-800 rounded-full hover:bg-blue-900"
          >
            <ShoppingCart className="text-white" size={28} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-4 pb-4">
          <input
            type="number"
            placeholder="Table No."
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-6 py-4 text-2xl font-bold text-center rounded-2xl border-4 border-white focus:border-yellow-400 outline-none bg-white/90 backdrop-blur"
          />
        </div>
      </header>

      {/* SEARCH */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={24} />
          <input
            type="text"
            placeholder="Search food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-blue-200 focus:border-blue-500 outline-none text-lg shadow-lg"
          />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-3xl mx-auto px-4 mt-6 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-6 py-3 rounded-full font-bold text-lg whitespace-nowrap transition ${
                activeCat === cat
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-blue-700 border-2 border-blue-300"
              }`}
            >
              {cat === "all" ? "All Menu" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MENU GRID - FIXED */}
      {/* ───── FIXED MENU GRID ───── */}
<div className="max-w-7xl mx-auto px-4 mt-10">
  {/* GRID */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {filtered.map((item, index) => {
      const inCart = cart.find((c) => c.id === item.id);
      const isVeg = item.food_type === "veg";
      const imageUrl = item.image
        ? item.image
        : `https://res.cloudinary.com/dx0w3e13s/image/upload/v1/kot/default/${item.category}.jpg`;

      return (
        <motion.div
          key={`${item.id}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
          {/* LEFT IMAGE */}
          <div className="relative w-28 h-28 flex-shrink-0 bg-gray-100">
            <img
              src={imageUrl}
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src =
                  'https://res.cloudinary.com/dx0w3e13s/image/upload/v1/kot/default/food.jpg';
              }}
            />
            {/* VEG/NON-VEG ICON */}
            <div className="absolute top-2 left-2">
              <div
                className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${
                  isVeg ? 'border-green-600' : 'border-red-600'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isVeg ? 'bg-green-600' : 'bg-red-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex flex-col justify-between flex-1 p-3">
            <div>
              <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 capitalize">{item.category}</p>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div>
                <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                {item.original_price && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    ₹{item.original_price}
                  </span>
                )}
              </div>

              {/* ADD / QTY BUTTON */}
              {inCart ? (
                <div className="flex items-center border-2 border-green-600 rounded-lg overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQty(item.id, -1);
                    }}
                    className="w-8 h-8 bg-white text-green-600 hover:bg-green-50 font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-green-600">
                    {inCart.quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQty(item.id, 1);
                    }}
                    className="w-8 h-8 bg-green-600 text-white hover:bg-green-700 font-bold"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition transform hover:scale-105"
                >
                  ADD
                </button>
              )}
            </div>
          </div>
        </motion.div>
      );
    })}

    {/* NO ITEMS MESSAGE */}
    {filtered.length === 0 && (
      <div className="col-span-full text-center py-20">
        <Search size={64} className="mx-auto text-gray-400 mb-4" />
        <p className="text-2xl text-gray-600 font-medium">No items found</p>
        <p className="text-gray-500 mt-2">Try different search or category</p>
      </div>
    )}
  </div>
</div>




      {/* CART MODAL */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowCartModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-2xl rounded-t-3xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b bg-blue-600 text-white flex justify-between">
                <h2 className="text-2xl font-bold">Cart ({itemCount})</h2>
                <button onClick={() => setShowCartModal(false)}><X size={28} /></button>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm text-blue-600">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-white shadow">−</button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-blue-600 text-white">+</button>
                    </div>
                    <p className="font-bold w-20 text-right">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-blue-50 border-t">
                <div className="flex justify-between text-2xl font-bold mb-4">
                  <span>Total</span>
                  <span className="text-blue-600">₹{total}</span>
                </div>
                <button
                  onClick={handleProceed}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-2xl font-bold text-xl"
                >
                  Proceed to Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}