// src/components/StockManagement.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const StockManagement = ({ onMessage }) => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [applyingBulk, setApplyingBulk] = useState(false);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const response = await API.get('food-menu/');
      
      // Use actual data from API with real stock_status
      const stockData = response.data.map(food => ({
        id: food.food_id,
        food_id: food.food_id,
        food_name: food.food_name,
        subcategory: food.subcategory,
        price: food.price,
        image: food.image,
        stock_status: food.stock_status, // Use actual stock status from database
        auto_manage_stock: food.auto_manage_stock,
        last_updated: food.last_stock_update,
        is_available_now: food.is_available_now,
        availability_status: food.availability_status
      }));
      
      setStockItems(stockData);
    } catch (error) {
      console.error('Failed to fetch food items:', error);
      onMessage('Failed to load food items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStockIn = async (itemId) => {
    try {
      const item = stockItems.find(item => item.id === itemId);
      
      // API call to update stock status in database
      const response = await API.post(`food-menu/${itemId}/update_stock/`, {
        stock_status: 'in_stock',
        stock_notes: 'Manually marked as available'
      });

      // Update local state with response data
      setStockItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              stock_status: 'in_stock', 
              last_updated: new Date().toISOString(),
              is_available_now: response.data.is_available_now,
              availability_status: response.data.availability_status
            }
          : item
      ));
      
      onMessage(`${item.food_name} marked as available!`, 'success');
    } catch (error) {
      console.error('Failed to update stock:', error);
      onMessage('Failed to update item status', 'error');
    }
  };

  const handleStockOut = async (itemId) => {
    try {
      const item = stockItems.find(item => item.id === itemId);
      
      // API call to update stock status in database
      const response = await API.post(`food-menu/${itemId}/update_stock/`, {
        stock_status: 'out_of_stock',
        stock_notes: 'Manually marked as out of stock'
      });

      // Update local state with response data
      setStockItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              stock_status: 'out_of_stock', 
              last_updated: new Date().toISOString(),
              is_available_now: response.data.is_available_now,
              availability_status: response.data.availability_status
            }
          : item
      ));
      
      onMessage(`${item.food_name} marked as out of stock!`, 'success');
    } catch (error) {
      console.error('Failed to update stock:', error);
      onMessage('Failed to update item status', 'error');
    }
  };

  const handleApplyTimings = async (timingType) => {
    try {
      setApplyingBulk(true);
      
      // API call to apply timing-based stock
      const response = await API.post('food-menu/apply_timing_stock/', {
        timing_type: timingType.toLowerCase()
      });

      // Refresh the data to get updated stock status from database
      await fetchStockItems();
      
      onMessage(`${timingType} timings applied successfully! ${response.data.updated_count} items updated`, 'success');
    } catch (error) {
      console.error('Failed to apply timings:', error);
      onMessage('Failed to apply timings', 'error');
    } finally {
      setApplyingBulk(false);
    }
  };

  const handleToggleAll = async (status) => {
    try {
      setApplyingBulk(true);
      
      // Prepare bulk updates
      const updates = stockItems.map(item => ({
        food_id: item.food_id,
        stock_status: status,
        stock_notes: `Bulk updated to ${status}`
      }));

      // API call for bulk update
      const response = await API.post('food-menu/bulk_update_stock/', {
        updates: updates
      });

      // Check results
      const results = response.data.results;
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      // Refresh data
      await fetchStockItems();
      
      if (errorCount > 0) {
        onMessage(`${successCount} items updated, ${errorCount} failed`, 'warning');
      } else {
        onMessage(`All items marked as ${status === 'in_stock' ? 'available' : 'out of stock'}!`, 'success');
      }
    } catch (error) {
      console.error('Failed to bulk update:', error);
      onMessage('Failed to update all items', 'error');
    } finally {
      setApplyingBulk(false);
    }
  };

  const handleAutoModeToggle = async () => {
    try {
      // If turning auto mode on, apply current timing
      if (!autoMode) {
        const currentPeriod = getCurrentPeriodKey();
        await handleApplyTimings(currentPeriod);
      }
      
      setAutoMode(!autoMode);
      onMessage(`Auto mode ${!autoMode ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle auto mode:', error);
      onMessage('Failed to toggle auto mode', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border border-green-200';
      case 'out_of_stock': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock': return 'Available';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return '✅';
      case 'out_of_stock': return '❌';
      default: return '❓';
    }
  };

  const getAvailabilityBadge = (item) => {
    if (item.stock_status === 'out_of_stock') {
      return 'bg-red-100 text-red-800';
    }
    return item.is_available_now ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getAvailabilityText = (item) => {
    if (item.stock_status === 'out_of_stock') return 'Out of Stock';
    return item.is_available_now ? 'Available Now' : 'Available Later';
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
        <h2 className="text-2xl font-bold text-gray-900">Stock Status Manager</h2>
        <p className="text-gray-600">Manually mark items as available or out of stock</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => handleApplyTimings('Morning')}
          disabled={applyingBulk}
          className="bg-blue-500 text-white p-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition text-sm"
        >
          {applyingBulk ? '🔄 Applying...' : '🕗 Morning (Tiffin)'}
        </button>
        <button
          onClick={() => handleApplyTimings('Lunch')}
          disabled={applyingBulk}
          className="bg-orange-500 text-white p-3 rounded-lg font-medium hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition text-sm"
        >
          {applyingBulk ? '🔄 Applying...' : '🕛 Lunch'}
        </button>
        <button
          onClick={() => handleApplyTimings('Dinner')}
          disabled={applyingBulk}
          className="bg-purple-500 text-white p-3 rounded-lg font-medium hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed transition text-sm"
        >
          {applyingBulk ? '🔄 Applying...' : '🕠 Dinner'}
        </button>
        <button
          onClick={() => handleToggleAll('in_stock')}
          disabled={applyingBulk}
          className="bg-green-500 text-white p-3 rounded-lg font-medium hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition text-sm"
        >
          {applyingBulk ? '🔄 Applying...' : '✅ All Available'}
        </button>
        <button
          onClick={() => handleToggleAll('out_of_stock')}
          disabled={applyingBulk}
          className="bg-red-500 text-white p-3 rounded-lg font-medium hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition text-sm"
        >
          {applyingBulk ? '🔄 Applying...' : '❌ All Out of Stock'}
        </button>
      </div>

      {/* Auto Mode Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div>
          <h3 className="font-medium text-yellow-800">Auto Timing Mode</h3>
          <p className="text-sm text-yellow-600">
            {autoMode 
              ? 'Stock status will update automatically based on time' 
              : 'Manual mode - stock status will not change automatically'
            }
          </p>
        </div>
        <button
          onClick={handleAutoModeToggle}
          disabled={applyingBulk}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            autoMode 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {autoMode ? 'Auto: ON' : 'Auto: OFF'}
        </button>
      </div>

      {/* Stock List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockItems.map((item) => (
          <div key={item.id} className={`bg-white rounded-lg p-4 border-2 transition-all ${
            item.stock_status === 'in_stock' 
              ? item.is_available_now 
                ? 'border-green-200 hover:border-green-300' 
                : 'border-yellow-200 hover:border-yellow-300'
              : 'border-red-200 hover:border-red-300'
          }`}>
            <div className="flex items-start space-x-3">
              {/* Food Image */}
              {item.image && (
                <img
                  src={item.image}
                  alt={item.food_name}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {item.food_name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {item.subcategory} • ₹{item.price}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(item.stock_status)}`}>
                      <span>{getStatusIcon(item.stock_status)}</span>
                      <span className="hidden sm:inline">{getStatusText(item.stock_status)}</span>
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getAvailabilityBadge(item)}`}>
                      {getAvailabilityText(item)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleStockIn(item.id)}
                    disabled={applyingBulk}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium transition ${
                      item.stock_status === 'in_stock'
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    ✅ Available
                  </button>
                  <button
                    onClick={() => handleStockOut(item.id)}
                    disabled={applyingBulk}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium transition ${
                      item.stock_status === 'out_of_stock'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    ❌ Out of Stock
                  </button>
                </div>

                {/* Last Updated */}
                {item.last_updated && (
                  <p className="text-xs text-gray-400 mt-2">
                    Updated: {new Date(item.last_updated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stockItems.length}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-700">
            {stockItems.filter(item => item.stock_status === 'in_stock').length}
          </div>
          <div className="text-sm text-green-600">Available</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-700">
            {stockItems.filter(item => item.stock_status === 'out_of_stock').length}
          </div>
          <div className="text-sm text-red-600">Out of Stock</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {stockItems.filter(item => item.is_available_now).length}
          </div>
          <div className="text-sm text-blue-600">Available Now</div>
        </div>
      </div>

      {/* Current Time Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Current Period: {getCurrentPeriod()}</h4>
            <p className="text-sm text-gray-600">
              {autoMode 
                ? 'Auto mode will update stock based on timings' 
                : 'Manual mode - use quick actions above'
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Next change: {getNextChangeTime()}
            </p>
            <p className="text-xs text-gray-500">
              {getCurrentPeriodStatus()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getCurrentPeriodKey = () => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 11.5) return 'Morning';
  if (hour >= 11.5 && hour < 16) return 'Lunch';
  if (hour >= 17 && hour < 23) return 'Dinner';
  return 'All';
};

const getCurrentPeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 11.5) return '🕗 Tiffin Time (8:00 - 11:30)';
  if (hour >= 11.5 && hour < 16) return '🕛 Lunch Time (11:30 - 16:00)';
  if (hour >= 17 && hour < 23) return '🕠 Dinner Time (17:00 - 23:00)';
  return '🏪 Closed';
};

const getNextChangeTime = () => {
  const hour = new Date().getHours();
  if (hour < 8) return '8:00 AM';
  if (hour < 11.5) return '11:30 AM';
  if (hour < 16) return '4:00 PM';
  if (hour < 17) return '5:00 PM';
  return '11:00 PM';
};

const getCurrentPeriodStatus = () => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 11.5) return 'Tiffin items available';
  if (hour >= 11.5 && hour < 16) return 'Lunch items available';
  if (hour >= 17 && hour < 23) return 'Dinner + some tiffin items available';
  return 'Restaurant closed';
};

export default StockManagement;