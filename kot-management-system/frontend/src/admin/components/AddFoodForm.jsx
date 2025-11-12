// src/components/AddFoodForm.jsx
import React, { useState } from "react";
import API from "../../api";

const AddFoodForm = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    category: "food",
    subcategory: "",
    food_type: "veg",
    food_name: "",
    price: "",
    description: "",
    image: null,
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // CLOUDINARY (Unsigned Upload)
  const CLOUDINARY_CLOUD_NAME = "dkq48nzr3";
  const CLOUDINARY_UPLOAD_PRESET = "kot-menu-preset";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Image upload failed");
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setUploading(true);

    try {
      let imageUrl = "";
      if (form.image) {
        imageUrl = await uploadToCloudinary(form.image);
      }

      const payload = {
        category: form.category,
        subcategory: form.subcategory || null,
        food_type: form.food_type,
        food_name: form.food_name.trim(),
        price: parseFloat(form.price),
        description: form.description?.trim() || null,
        image: imageUrl || null,
      };

      await API.post("food-menu/", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setMessage("Food item added successfully!");
      
      // Reset form
      setForm({
        category: "food",
        subcategory: "",
        food_type: "veg",
        food_name: "",
        price: "",
        description: "",
        image: null,
      });
      document.getElementById("image").value = "";

      // Call success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err) {
      console.error("Add food error:", err);
      setMessage(
        err.response?.data?.error ||
        err.message ||
        "Failed to add food item. Check console."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* All your existing form fields remain the same */}
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
          >
            <option value="food">Food</option>
            <option value="cafe">Cafe</option>
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
          >
            <option value="">-- Select --</option>
            <option value="tiffin">Tiffin</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="breakfast">Breakfast</option>
            <option value="snacks">Snacks</option>
            <option value="beverages">Beverages</option>
            <option value="desserts">Desserts</option>
          </select>
        </div>

        {/* Food Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Food Type</label>
          <select
            name="food_type"
            value={form.food_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
          >
            <option value="veg">Veg</option>
            <option value="nonveg">Non-Veg</option>
            <option value="egg">Egg</option>
          </select>
        </div>

        {/* Food Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
          <input
            type="text"
            name="food_name"
            value={form.food_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
          <input
            id="image"
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-center font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading}
          className={`flex-1 py-3 rounded-xl font-semibold text-white transition transform ${
            uploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl active:scale-95"
          }`}
        >
          {uploading ? "Uploading & Saving..." : "Add Food Item"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-center text-sm font-medium border ${
            message.includes("success")
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
};

export default AddFoodForm;