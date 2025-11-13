// src/components/FoodList.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import API from "../../api";
import AddFoodForm from "./AddFoodForm";
import EditFoodForm from "./EditFoodForm";
import SubCategoryManager from "./SubCategoryManage";

const FoodList = () => {
  // ────── STATE ──────
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [selectedTab, setSelectedTab] = useState("food");
  const [search, setSearch] = useState("");
  const [showSubCategoryManager, setShowSubCategoryManager] = useState(false);
  const [imageModal, setImageModal] = useState(null); // New state for image modal

  // ────── FETCH WITH ABORT & CLEANUP ──────
  const fetchFoods = useCallback(async (signal) => {
    try {
      setLoading(true);
      const { data } = await API.get("food-menu/", { signal });
      setFoods(data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error("Failed to fetch foods:", err);
        setMessage("Failed to load items");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchFoods(controller.signal);
    return () => controller.abort(); // Cleanup on unmount
  }, [fetchFoods]);

  // ────── IMAGE ──────
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("image/upload/")) return url.replace("image/upload/", "");
    if (url.startsWith("http")) return url;
    return url;
  };

  // ────── FILTER ──────
  const filteredFoods = useMemo(() => {
    const type = (f) => (f.menu_type || f.category || "").toLowerCase();
    return foods.filter((f) => {
      const matchesTab =
        selectedTab === "food"
          ? type(f) === "food" || !type(f).includes("cafe")
          : type(f) === "cafe" || type(f).includes("cafe");
      const matchesSearch =
        !search ||
        f.food_name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [foods, selectedTab, search]);

  // ────── GROUP ──────
  const grouped = useMemo(() => {
    const map = new Map();
    filteredFoods.forEach((food) => {
      const cat = food.category_display || food.category || "Uncategorized";
      const sub = food.subcategory_display || food.subcategory;
      const key = sub ? `${cat}__${sub}` : cat;
      if (!map.has(key))
        map.set(key, { category: cat, subcategory: sub || null, items: [] });
      map.get(key).items.push(food);
    });
    return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredFoods]);

  // ────── CRUD ──────
  const handleDelete = async (id, name) => {
    try {
      await API.delete(`food-menu/${id}/`);
      setMessage(`"${name}" deleted`);
      setDeleteConfirm(null);
      fetchFoods(new AbortController().signal); // Refetch
    } catch {
      setMessage("Failed to delete");
    }
  };

  const handleFoodAdded = () => {
    setShowAddModal(false);
    fetchFoods(new AbortController().signal);
    setMessage("Item added");
  };

  const handleFoodUpdated = () => {
    setShowEditModal(false);
    setEditingFood(null);
    fetchFoods(new AbortController().signal);
    setMessage("Item updated");
  };

  const handleEditClick = (f) => {
    setEditingFood(f);
    setShowEditModal(true);
  };

  const confirmDelete = (id, name) => setDeleteConfirm({ id, name });
  const cancelDelete = () => setDeleteConfirm(null);

  // ────── IMAGE MODAL FUNCTIONS ──────
  const openImageModal = (food) => {
    const img = getImageUrl(food.image);
    if (img) {
      setImageModal({
        imageUrl: img,
        foodName: food.food_name,
        description: food.description,
        price: food.price,
        foodType: food.food_type
      });
    }
  };

  const closeImageModal = () => {
    setImageModal(null);
  };

  // ────── AUTO-HIDE MESSAGE ──────
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ────── LOADING ──────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#4f4fe5] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#4f4fe5] font-medium">Loading menu…</p>
        </div>
      </div>
    );
  }

  // ────── RENDER ──────
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header + Controls */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4f4fe5]">Menu Board</h1>
              <p className="mt-1 text-gray-600 text-sm sm:text-base">Search, filter, and manage items</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSubCategoryManager(true)}
                className="flex items-center justify-center px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Manage Subcategories
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#4f4fe5] text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all sm:static sm:w-auto sm:h-auto sm:px-6 sm:py-3 sm:rounded-lg"
                aria-label="Add new item"
              >
                <svg className="w-6 h-6 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline font-medium">Add Item</span>
              </button>
            </div>
          </div>

          {/* Search + Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4f4fe5] focus:border-[#4f4fe5] transition text-sm sm:text-base"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-200">
              {["food", "cafe"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTab(t)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-medium capitalize transition-all text-sm sm:text-base ${
                    selectedTab === t
                      ? "bg-[#4f4fe5] text-white shadow-sm"
                      : "text-gray-600 hover:text-[#4f4fe5]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border text-sm font-medium ${
              message.includes("deleted") || message.includes("added") || message.includes("updated")
                ? "bg-green-50 text-green-800 border-green-300"
                : "bg-red-50 text-red-800 border-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* Empty State */}
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="mx-auto w-20 h-20 sm:w-28 sm:h-28 bg-[#4f4fe5]/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 sm:w-14 sm:h-14 text-[#4f4fe5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-900">
              No {selectedTab} items found
            </h3>
            <p className="mt-1 sm:mt-2 text-gray-500 text-sm sm:text-base">
              {search ? "Try a different search term." : "Add your first item!"}
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            {grouped.map((group) => (
              <section key={`${group.category}-${group.subcategory || ""}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-[#4f4fe5] to-[#6a6ae6] px-4 sm:px-6 py-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mr-3"></span>
                    {group.category}
                    {group.subcategory && (
                      <span className="ml-2 text-sm sm:text-base font-medium text-white/90">
                        — {group.subcategory}
                      </span>
                    )}
                  </h2>
                </div>

                {/* Table-like Cards */}
                <div className="p-4 sm:p-6">
                  {/* Table Headers - Hidden on mobile, visible on tablet+ */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-lg mb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-1 text-center">Type</div>
                    <div className="col-span-1 text-center">Price</div>
                    <div className="col-span-1 text-center">Actions</div>
                  </div>

                  {/* Food Items */}
                  <div className="space-y-3">
                    {group.items.map((food) => {
                      const img = getImageUrl(food.image);
                      return (
                        <div
                          key={food.food_id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-4 rounded-xl border border-gray-200 hover:border-[#4f4fe5]/30 hover:shadow-md transition-all duration-200 bg-white"
                        >
                          {/* Image + Name - Mobile & Desktop */}
                          <div className="md:col-span-5 flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {img ? (
                                <button
                                  onClick={() => openImageModal(food)}
                                  className="focus:outline-none focus:ring-2 focus:ring-[#4f4fe5] focus:ring-offset-2 rounded-lg transition-transform hover:scale-105"
                                >
                                  <img
                                    src={img}
                                    alt={food.food_name}
                                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover border border-gray-200 cursor-pointer"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextElementSibling.style.display = "flex";
                                    }}
                                  />
                                </button>
                              ) : null}
                              <div
                                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 ${
                                  img ? "hidden" : "flex"
                                }`}
                              >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight break-words">
                                {food.food_name}
                              </h3>
                              {/* Mobile-only description preview */}
                              {food.description && (
                                <p className="md:hidden text-xs text-gray-600 mt-1 line-clamp-2">
                                  {food.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Description - Hidden on mobile, visible on desktop */}
                          {food.description && (
                            <div className="hidden md:block md:col-span-4">
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {food.description}
                              </p>
                            </div>
                          )}

                          {/* Food Type */}
                          <div className="md:col-span-1 flex justify-start md:justify-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                                food.food_type === "veg"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : food.food_type === "nonveg"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {food.food_type_display || food.food_type?.toUpperCase() || "N/A"}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="md:col-span-1 flex justify-start md:justify-center">
                            <span className="font-bold text-[#4f4fe5] text-sm sm:text-base">₹{food.price}</span>
                          </div>

                          {/* Actions */}
                          <div className="md:col-span-1 flex justify-end md:justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(food)}
                              className="p-2 text-[#4f4fe5] hover:bg-[#4f4fe5]/10 rounded-lg transition"
                              title="Edit"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(food.food_id, food.food_name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">Delete Item?</h3>
              <p className="mt-2 text-gray-600">
                Remove <strong className="text-gray-900">{deleteConfirm.name}</strong> permanently?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Add New {selectedTab === "cafe" ? "Cafe" : "Food"} Item
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <AddFoodForm onSuccess={handleFoodAdded} onCancel={() => setShowAddModal(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingFood && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Item</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFood(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <EditFoodForm
                  food={editingFood}
                  onSuccess={handleFoodUpdated}
                  onCancel={() => {
                    setShowEditModal(false);
                    setEditingFood(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SubCategory Manager Modal */}
        {showSubCategoryManager && (
          <SubCategoryManager 
            onClose={() => setShowSubCategoryManager(false)}
            onSuccess={(msg) => setMessage(msg)}
          />
        )}

        {/* Image View Modal */}
        {imageModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{imageModal.foodName}</h2>
                <button 
                  onClick={closeImageModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image Section */}
                  <div className="flex-1">
                    <div className="rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={imageModal.imageUrl}
                        alt={imageModal.foodName}
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Price:</span>
                          <span className="text-lg font-bold text-[#4f4fe5]">₹{imageModal.price}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Food Type:</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            imageModal.foodType === "veg"
                              ? "bg-green-100 text-green-800"
                              : imageModal.foodType === "nonveg"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {imageModal.foodType?.toUpperCase() || "N/A"}
                          </span>
                        </div>
                        
                        {imageModal.description && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 block mb-2">Description:</span>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {imageModal.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={closeImageModal}
                        className="w-full py-3 bg-[#4f4fe5] text-white rounded-lg font-semibold hover:bg-[#3f3fd5] transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodList;