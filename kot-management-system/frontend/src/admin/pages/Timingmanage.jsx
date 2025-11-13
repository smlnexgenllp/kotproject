// src/components/TimingManager.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';
import SubcategoryTimings from '../components/SubcategoryTiming';
import FoodItemTimings from '../components/FoodItemTimings';
import StockManagement from '../components/StockManage';

const TimingManager = () => {
  const [activeTab, setActiveTab] = useState('subcategories');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'subcategories', name: 'Subcategory Timings', icon: '📅' },
    { id: 'fooditems', name: 'Food Item Timings', icon: '🍽️' },
    { id: 'stock', name: 'Stock Management', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Timing & Stock Management</h1>
          <p className="text-gray-600 mt-2">Manage food availability timings and stock levels</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {activeTab === 'subcategories' && <SubcategoryTimings onMessage={setMessage} />}
          {activeTab === 'fooditems' && <FoodItemTimings onMessage={setMessage} />}
          {activeTab === 'stock' && <StockManagement onMessage={setMessage} />}
        </div>
      </div>
    </div>
  );
};

export default TimingManager;