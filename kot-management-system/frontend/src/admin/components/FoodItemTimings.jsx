// src/components/FoodItemTimings.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const FoodItemTimings = ({ onMessage }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [customTimings, setCustomTimings] = useState([]);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const response = await API.get('food-menu/');
      setFoodItems(response.data);
      
      // Extract custom timings from food items
      const timings = response.data
        .filter(item => item.is_timing_active && item.start_time && item.end_time)
        .map(item => ({
          id: item.food_id,
          food_id: item.food_id,
          food_name: item.food_name,
          subcategory: item.subcategory,
          custom_timing: [{
            period: getPeriodFromSubcategory(item.subcategory),
            time: `${item.start_time}-${item.end_time}`
          }]
        }));
      
      setCustomTimings(timings);
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
      // API call to update timing
      await API.post(`food-menu/${timingData.food_id}/update_timing/`, {
        start_time: timingData.start_time,
        end_time: timingData.end_time,
        is_timing_active: timingData.is_timing_active
      });
      
      onMessage('Custom timing saved successfully!', 'success');
      setSelectedFood(null);
      fetchFoodItems(); // Refresh the list
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
      fetchFoodItems(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete timing:', error);
      onMessage('Failed to delete timing', 'error');
    }
  };

  // Helper function to get period name from subcategory
  const getPeriodFromSubcategory = (subcategory) => {
    const periodMap = {
      'tiffin': 'Tiffin',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'beverages': 'Beverages',
      'snacks': 'Snacks',
      'desserts': 'Desserts'
    };
    return periodMap[subcategory] || 'Custom';
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading food items...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Food Item Timings</h2>
        <p className="text-gray-600">Set custom availability timings for individual food items</p>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Food Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subcategory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Timing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Custom Timing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {foodItems.slice(0, 10).map((food) => {
              const hasCustomTiming = food.is_timing_active && food.start_time && food.end_time;
              
              return (
                <tr key={food.food_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {food.image && (
                        <img
                          src={food.image}
                          alt={food.food_name}
                          className="h-8 w-8 rounded-full object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{food.food_name}</div>
                        <div className="text-sm text-gray-500">₹{food.price}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {food.subcategory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getDefaultTiming(food.subcategory)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hasCustomTiming ? (
                      <div className="space-y-1">
                        <div className="bg-blue-50 px-2 py-1 rounded text-xs">
                          <span className="font-medium">
                            {getPeriodFromSubcategory(food.subcategory)}:
                          </span> {food.start_time} - {food.end_time}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No custom timing</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      food.is_available_now ? 
                      'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {food.is_available_now ? 'Available' : 'Not Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleAddCustomTiming(food)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {hasCustomTiming ? 'Edit' : 'Add'} Timing
                    </button>
                    {hasCustomTiming && (
                      <button
                        onClick={() => handleDeleteTiming(food.food_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    'tiffin': '08:00 - 11:30',
    'lunch': '11:30 - 16:00',
    'dinner': '17:00 - 23:00',
    'beverages': '00:00 - 23:59',
    'snacks': '07:00 - 23:00',
    'desserts': '10:00 - 23:00'
  };
  return defaults[subcategory] || 'Follows Subcategory';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Timing for {food.food_name}</h3>
        
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={timing.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          {timing.start_time && timing.end_time && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600">
                Food will be available from <strong>{timing.start_time}</strong> to <strong>{timing.end_time}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Save Timing
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItemTimings;