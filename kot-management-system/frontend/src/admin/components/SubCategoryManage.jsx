// src/components/SubCategoryManager.jsx
import React, { useState, useEffect } from "react";
import API from "../../api";

const SubCategoryManager = ({ onClose, onSuccess }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    subcategory_name: ""
  });

  // Fetch subcategories
  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("subcategories/");
      setSubcategories(data);
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
      onSuccess("Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new subcategory
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("subcategories/", formData);
      onSuccess("Subcategory created successfully");
      setFormData({ subcategory_name: "" });
      setShowAddForm(false);
      fetchSubCategories();
    } catch (err) {
      console.error("Failed to create subcategory:", err);
      onSuccess("Failed to create subcategory");
    }
  };

  // Update subcategory
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`subcategories/${editingSubCategory.subcategory_id}/`, formData);
      onSuccess("Subcategory updated successfully");
      setEditingSubCategory(null);
      setFormData({ subcategory_name: "" });
      fetchSubCategories();
    } catch (err) {
      console.error("Failed to update subcategory:", err);
      onSuccess("Failed to update subcategory");
    }
  };

  // Delete subcategory
  const handleDelete = async () => {
    try {
      await API.delete(`subcategories/${deleteConfirm.subcategory_id}/`);
      onSuccess("Subcategory deleted successfully");
      setDeleteConfirm(null);
      fetchSubCategories();
    } catch (err) {
      console.error("Failed to delete subcategory:", err);
      if (err.response?.data?.error) {
        onSuccess(err.response.data.error);
      } else {
        onSuccess("Failed to delete subcategory");
      }
      setDeleteConfirm(null);
    }
  };

  // Start editing
  const startEdit = (subcategory) => {
    setEditingSubCategory(subcategory);
    setFormData({
      subcategory_name: subcategory.subcategory_name
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingSubCategory(null);
    setFormData({ subcategory_name: "" });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4f4fe5] border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subcategories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Manage Subcategories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Add/Edit Form */}
          {(showAddForm || editingSubCategory) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingSubCategory ? "Edit Subcategory" : "Add New Subcategory"}
              </h3>
              <form onSubmit={editingSubCategory ? handleUpdate : handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory Name
                  </label>
                  <input
                    type="text"
                    name="subcategory_name"
                    value={formData.subcategory_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f4fe5] focus:border-[#4f4fe5]"
                    placeholder="Enter subcategory name"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4f4fe5] text-white rounded-lg font-medium hover:bg-[#3f3fd5] transition"
                  >
                    {editingSubCategory ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={editingSubCategory ? cancelEdit : () => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Button */}
          {!showAddForm && !editingSubCategory && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mb-6 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Subcategory
            </button>
          )}

          {/* Subcategories List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subcategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No subcategories found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  subcategories.map((subcategory) => (
                    <tr key={subcategory.subcategory_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{subcategory.subcategory_id}</td>
                      <td className="py-3 px-4">{subcategory.subcategory_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(subcategory.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(subcategory)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(subcategory)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Delete Subcategory?</h3>
            <p className="mt-2 text-gray-600">
              Remove <strong className="text-gray-900">{deleteConfirm.subcategory_name}</strong> permanently?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoryManager;