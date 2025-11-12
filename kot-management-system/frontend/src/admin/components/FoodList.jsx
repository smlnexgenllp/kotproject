// src/components/FoodList.jsx
import React, { useState, useEffect } from "react";
import API from "../../api";
import AddFoodForm from "./AddFoodForm";
import EditFoodForm from "./EditFoodForm";

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  // Fetch all food items
  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await API.get("food-menu/");
      setFoods(response.data);
    } catch (err) {
      console.error("Error fetching foods:", err);
      setMessage("Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // Fix image URLs - remove the duplicate "image/upload/" prefix
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    // If URL starts with "image/upload/", remove that prefix
    if (imageUrl.startsWith('image/upload/')) {
      return imageUrl.replace('image/upload/', '');
    }
    
    // If it's already a proper URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return imageUrl;
  };

  // Delete food item
  const handleDelete = async (foodId, foodName) => {
    try {
      await API.delete(`food-menu/${foodId}/`);
      setMessage(`"${foodName}" deleted successfully`);
      setDeleteConfirm(null);
      fetchFoods(); // Refresh the list
    } catch (err) {
      console.error("Error deleting food:", err);
      setMessage("Failed to delete food item");
    }
  };

  // Handle successful food addition
  const handleFoodAdded = () => {
    setShowAddModal(false);
    fetchFoods(); // Refresh the list
    setMessage("Food item added successfully!");
  };

  // Handle successful food update
  const handleFoodUpdated = () => {
    setShowEditModal(false);
    setEditingFood(null);
    fetchFoods(); // Refresh the list
    setMessage("Food item updated successfully!");
  };

  // Handle edit button click
  const handleEditClick = (food) => {
    setEditingFood(food);
    setShowEditModal(true);
  };

  // Confirm delete dialog
  const confirmDelete = (foodId, foodName) => {
    setDeleteConfirm({ foodId, foodName });
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
          <p className="mt-4 text-gray-600">Loading food items...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Food Menu</h1>
            <p className="mt-2 text-gray-600">Manage your restaurant's food items</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Food
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

        {/* Food Table */}
        {foods.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No food items</h3>
            <p className="mt-2 text-gray-500">Get started by adding your first food item.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Food Item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm">
              <div className="col-span-1">Image</div>
              <div className="col-span-3">Food Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {foods.map((food) => {
                const imageUrl = getImageUrl(food.image);
                
                return (
                  <div
                    key={food.food_id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    {/* Image */}
                    <div className="col-span-1 flex items-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={food.food_name}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center ${
                          imageUrl ? 'hidden' : 'flex'
                        }`}
                      >
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Food Name */}
                    <div className="col-span-3 flex items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{food.food_name}</h3>
                        {food.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {food.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2 flex items-center">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {food.category_display || food.category}
                        </span>
                        {food.subcategory && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {food.subcategory_display || food.subcategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Food Type */}
                    <div className="col-span-2 flex items-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          food.food_type === 'veg'
                            ? 'bg-green-100 text-green-800'
                            : food.food_type === 'nonveg'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {food.food_type_display || food.food_type}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 flex items-center justify-end">
                      <span className="text-lg font-bold text-indigo-600">₹{food.price}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEditClick(food)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(food.food_id, food.food_name)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {foods.length} food item{foods.length !== 1 ? 's' : ''}
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
                Are you sure you want to delete "{deleteConfirm.foodName}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.foodId, deleteConfirm.foodName)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Food Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Add New Food Item</h2>
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
                <AddFoodForm 
                  onSuccess={handleFoodAdded}
                  onCancel={() => setShowAddModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Food Modal */}
        {showEditModal && editingFood && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Edit Food Item</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFood(null);
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
      </div>
    </div>
  );
};

export default FoodList;