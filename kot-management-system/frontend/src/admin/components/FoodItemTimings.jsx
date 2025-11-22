// src/components/FoodItemTimings.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';
import { Clock, Edit, Trash2, Plus, X } from 'lucide-react';

const FoodItemTimings = ({ onMessage }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const response = await API.get('food-menu/');
      setFoodItems(response.data);
    } catch (error) {
      console.error('Failed to fetch food items:', error);
      onMessage('Failed to load food items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomTiming = (foodItem) => {
    setSelectedFood(foodItem);
  };

  const handleSaveCustomTiming = async (timingData) => {
    try {
      await API.post(`food-menu/${timingData.food_id}/update_timing/`, {
        start_time: timingData.start_time,
        end_time: timingData.end_time,
        is_timing_active: timingData.is_timing_active
      });
      
      onMessage('Custom timing saved successfully!', 'success');
      setSelectedFood(null);
      fetchFoodItems();
    } catch (error) {
      console.error('Failed to save custom timing:', error);
      onMessage('Failed to save custom timing', 'error');
    }
  };

  const handleDeleteTiming = async (foodId) => {
    try {
      await API.post(`food-menu/${foodId}/update_timing/`, {
        start_time: null,
        end_time: null,
        is_timing_active: false
      });
      
      onMessage('Timing removed successfully!', 'success');
      fetchFoodItems();
    } catch (error) {
      console.error('Failed to delete timing:', error);
      onMessage('Failed to delete timing', 'error');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.includes('res.cloudinary.com')) {
      if (imagePath.includes('/https://')) {
        const urlParts = imagePath.split('/https://');
        return `https://${urlParts[urlParts.length - 1]}`;
      }
      else if (!imagePath.startsWith('http')) {
        return `https://res.cloudinary.com/${imagePath}`;
      }
    }
    
    return imagePath;
  };

  const canHaveTiming = (foodItem) => {
    return foodItem.is_active;
  };

  const hasCustomTiming = (foodItem) => {
    return foodItem.is_timing_active && foodItem.start_time && foodItem.end_time;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading food items...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Food Item Timings</h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">Set custom availability timings for individual food items</p>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {foodItems.slice(0, 10).map((food) => {
          const customTiming = hasCustomTiming(food);
          const canSetTiming = canHaveTiming(food);
          const imageUrl = getImageUrl(food.image || food.image_url);
          
          return (
            <div key={food.food_id} className="bg-white rounded-lg shadow border border-gray-200 p-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={food.food_name}
                      className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{food.food_name}</h3>
                    <p className="text-gray-600 text-xs">₹{food.price}</p>
                    <p className="text-gray-500 text-xs capitalize mt-1">{food.subcategory || 'No category'}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  food.is_available_now ? 
                  'bg-green-100 text-green-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {food.is_available_now ? 'Available' : 'Not Available'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Default:</span>
                  <span className="text-gray-900">{getDefaultTiming(food.subcategory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Custom:</span>
                  <span className={customTiming ? "text-blue-600 font-medium" : "text-gray-400"}>
                    {customTiming ? `${food.start_time} - ${food.end_time}` : 'Not set'}
                  </span>
                </div>
              </div>

              {canSetTiming && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleAddCustomTiming(food)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors flex-1 justify-center"
                  >
                    {customTiming ? <Edit size={12} /> : <Plus size={12} />}
                    {customTiming ? 'Edit' : 'Add Timing'}
                  </button>
                  {customTiming && (
                    <button
                      onClick={() => handleDeleteTiming(food.food_id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex-1 justify-center"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tablet & Desktop Table View - Compact with Horizontal Scroll */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Food Item
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Default
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Custom
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {foodItems.slice(0, 10).map((food) => {
                  const customTiming = hasCustomTiming(food);
                  const canSetTiming = canHaveTiming(food);
                  const imageUrl = getImageUrl(food.image || food.image_url);
                  
                  return (
                    <tr key={food.food_id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={food.food_name}
                              className="h-8 w-8 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                              {food.food_name}
                            </div>
                            <div className="text-xs text-gray-500">₹{food.price}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900 capitalize max-w-[80px] truncate">
                        {food.subcategory || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                        {getDefaultTiming(food.subcategory)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs">
                        {customTiming ? (
                          <div className="bg-blue-50 px-2 py-1 rounded text-xs max-w-[120px] truncate">
                            {food.start_time} - {food.end_time}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          food.is_available_now ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {food.is_available_now ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 min-w-[100px]">
                          {canSetTiming && (
                            <>
                              <button
                                onClick={() => handleAddCustomTiming(food)}
                                className="flex items-center justify-center gap-1 text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded border border-indigo-600 hover:bg-indigo-50 text-xs font-medium transition-colors whitespace-nowrap w-full"
                              >
                                {customTiming ? <Edit size={10} /> : <Plus size={10} />}
                                {customTiming ? 'Edit' : 'Add'}
                              </button>
                              {customTiming && (
                                <button
                                  onClick={() => handleDeleteTiming(food.food_id)}
                                  className="flex items-center justify-center gap-1 text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-600 hover:bg-red-50 text-xs font-medium transition-colors whitespace-nowrap w-full"
                                >
                                  <Trash2 size={10} />
                                  Remove
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Scroll Hint for Tablet Users */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock size={12} />
            Scroll horizontally to view all columns
          </p>
        </div>
      </div>

      {/* Custom Timing Modal */}
      {selectedFood && (
        <CustomTimingModal
          food={selectedFood}
          onSave={handleSaveCustomTiming}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
};

// Helper function to get default timing based on subcategory
const getDefaultTiming = (subcategory) => {
  const defaults = {
    'tiffin': '08:00-11:30',
    'lunch': '11:30-16:00',
    'dinner': '17:00-23:00',
    'beverages': 'All Day',
    'snacks': '07:00-23:00',
    'desserts': '10:00-23:00',
    'breakfast': '07:00-11:00'
  };
  return defaults[subcategory] || '—';
};

// Custom Timing Modal Component
const CustomTimingModal = ({ food, onSave, onClose }) => {
  const [timing, setTiming] = useState({
    start_time: food.start_time || '08:00',
    end_time: food.end_time || '23:00',
    is_timing_active: food.is_timing_active || true
  });

  const handleTimeChange = (field, value) => {
    setTiming(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const timingData = {
      food_id: food.food_id,
      start_time: timing.start_time,
      end_time: timing.end_time,
      is_timing_active: timing.is_timing_active
    };
    
    onSave(timingData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Timing for {food.food_name}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Enable Custom Timing</label>
            <input
              type="checkbox"
              checked={timing.is_timing_active}
              onChange={(e) => handleTimeChange('is_timing_active', e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={timing.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={timing.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          
          {timing.start_time && timing.end_time && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                Available: <strong>{timing.start_time}</strong> to <strong>{timing.end_time}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            Save Timing
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemTimings;