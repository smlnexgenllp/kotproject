// src/components/SubcategoryTimings.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const SubcategoryTimings = ({ onMessage }) => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const response = await API.get('subcategories/');
      setSubcategories(response.data);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
      onMessage('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcategory) => {
    setEditingId(subcategory.subcategory_id);
    setFormData({
      start_time: subcategory.start_time || '',
      end_time: subcategory.end_time || '',
      is_timing_active: subcategory.is_timing_active || false
    });
  };

  const handleSave = async (subcategoryId) => {
    try {
      await API.post(`subcategories/${subcategoryId}/update_timing/`, formData);
      onMessage('Timing updated successfully!');
      setEditingId(null);
      fetchSubcategories(); // Refresh data
    } catch (error) {
      console.error('Failed to update timing:', error);
      onMessage('Failed to update timing');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleActive = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_timing_active: checked
    }));
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading subcategories...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Subcategory Timings</h2>
        <p className="text-gray-600">Set default availability timings for each subcategory</p>
      </div>

      {subcategories.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subcategories Found</h3>
          <p className="text-gray-600">Create some subcategories first to manage their timings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subcategories.map((subcategory) => (
            <div key={subcategory.subcategory_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{subcategory.subcategory_name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    subcategory.is_available_now 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subcategory.is_available_now ? 'Available Now' : 'Not Available'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    subcategory.is_timing_active 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subcategory.is_timing_active ? 'Timing Active' : 'No Timing'}
                  </span>
                </div>
              </div>

              {editingId === subcategory.subcategory_id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Timing</label>
                    <input
                      type="checkbox"
                      checked={formData.is_timing_active || false}
                      onChange={(e) => handleToggleActive(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  {formData.is_timing_active && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={formData.start_time || ''}
                          onChange={(e) => handleInputChange('start_time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          value={formData.end_time || ''}
                          onChange={(e) => handleInputChange('end_time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(subcategory.subcategory_id)}
                      className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Timing Active:</span>
                    <span className="font-medium">
                      {subcategory.is_timing_active ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {subcategory.is_timing_active && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">
                          {subcategory.start_time && subcategory.end_time 
                            ? `${subcategory.start_time} - ${subcategory.end_time}`
                            : 'Not set'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Status:</span>
                        <span className={`font-medium ${
                          subcategory.is_available_now ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {subcategory.is_available_now ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleEdit(subcategory)}
                    className="w-full mt-3 bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    {subcategory.is_timing_active ? 'Edit Timing' : 'Set Timing'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How Timing Works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• When timing is inactive: Items are always available</li>
          <li>• When timing is active: Items are available only during specified hours</li>
          <li>• Current availability is checked in real-time</li>
        </ul>
      </div>
    </div>
  );
};

export default SubcategoryTimings;