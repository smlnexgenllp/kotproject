// src/components/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    tableNumber: '',
    status: '',
    paymentMode: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [viewMode, setViewMode] = useState('all');
  const [summary, setSummary] = useState({
    totalCollection: 0,
    foodCollection: 0,
    cafeCollection: 0,
    refundAmount: 0,
    netCollection: 0
  });

  // Helpers
  const getDateString = (date) => date.toISOString().split('T')[0];
  const today = getDateString(new Date());
  const yesterday = getDateString(new Date(Date.now() - 86400000));

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await API.get('/orders/');
        const allOrders = response.data.orders || [];
        setOrders(allOrders);
        applyViewAndFilters(allOrders, viewMode);
      } catch (err) {
        console.error('Full error details:', err);
        console.error('Error response:', err.response);
        setError(`Failed to fetch orders: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Re-filter on change
  useEffect(() => {
    applyViewAndFilters(orders, viewMode);
  }, [filters, orders, viewMode]);

  // Calculate Financial Summary
  const calculateSummary = (orderList) => {
    let totalCollection = 0;
    let foodCollection = 0;
    let cafeCollection = 0;
    let refundAmount = 0;

    orderList.forEach(order => {
      if (order.status === 'paid') {
        // Calculate category-wise collections
        order.items.forEach(item => {
          const itemAmount = item.quantity * parseFloat(item.price);
          if (item.category === 'cafe') {
            cafeCollection += itemAmount;
          } else {
            foodCollection += itemAmount;
          }
        });

        // Add to total collection
        totalCollection += parseFloat(order.total_amount);
        
        // Add refund amount if any
        refundAmount += parseFloat(order.refunded_amount || 0);
      }
    });

    const netCollection = totalCollection - refundAmount;

    setSummary({
      totalCollection,
      foodCollection,
      cafeCollection,
      refundAmount,
      netCollection
    });
  };

  // Filter Logic
  const applyViewAndFilters = (data, mode) => {
    let result = [...data];

    if (mode === 'today')
      result = result.filter(o => getDateString(new Date(o.created_at)) === today);
    else if (mode === 'yesterday')
      result = result.filter(o => getDateString(new Date(o.created_at)) === yesterday);

    if (filters.tableNumber)
      result = result.filter(o => o.table_number.toString().includes(filters.tableNumber));
    if (filters.status) result = result.filter(o => o.status === filters.status);
    if (filters.paymentMode) result = result.filter(o => o.payment_mode === filters.paymentMode);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(o => new Date(o.created_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.created_at) <= to);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(o =>
        o.order_id.toString().includes(s) ||
        o.items.some(i => i.name.toLowerCase().includes(s))
      );
    }

    setFilteredOrders(result);
    calculateSummary(result);
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      tableNumber: '',
      status: '',
      paymentMode: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
  };

  const setQuickView = mode => {
    setViewMode(mode);
    setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
  };

  // CSV DOWNLOAD
  const handleDownloadCSV = async () => {
    try {
      const params = {
        table_number: filters.tableNumber || undefined,
        status: filters.status || undefined,
        payment_mode: filters.paymentMode || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        search: filters.search || undefined,
      };

      if (viewMode === 'today') params.today = '1';
      if (viewMode === 'yesterday') params.yesterday = '1';

      const response = await API.get('/orders/download-csv/', {
        params,
        responseType: 'blob',
        timeout: 60000,
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `order_history_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      console.error('CSV Download Failed:', err);
      if (err.response?.status === 404) {
        alert('CSV endpoint not working. Check server logs.');
      } else if (err.response?.status >= 500) {
        alert('Server error while generating CSV. Check backend logs.');
      } else {
        alert('Failed to download CSV. Please try again.');
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-800">Order History</h3>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setQuickView('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'today' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setQuickView('yesterday')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'yesterday' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setQuickView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All History
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
          >
            Clear Filters
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 font-medium">Total Collection</div>
          <div className="text-lg font-bold text-green-600">₹{formatCurrency(summary.totalCollection)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 font-medium">Food Collection</div>
          <div className="text-lg font-bold text-blue-600">₹{formatCurrency(summary.foodCollection)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 font-medium">Cafe Collection</div>
          <div className="text-lg font-bold text-purple-600">₹{formatCurrency(summary.cafeCollection)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 font-medium">Refund Amount</div>
          <div className="text-lg font-bold text-red-600">₹{formatCurrency(summary.refundAmount)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 font-medium">Net Collection</div>
          <div className="text-lg font-bold text-indigo-600">₹{formatCurrency(summary.netCollection)}</div>
        </div>
      </div>

      {/* View Label */}
      {viewMode !== 'all' && (
        <div className="mb-4 text-sm text-indigo-600 font-medium">
          {viewMode === 'today' && `Showing orders for Today (${today})`}
          {viewMode === 'yesterday' && `Showing orders for Yesterday (${yesterday})`}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input 
          type="text" 
          name="search" 
          value={filters.search} 
          onChange={handleFilterChange}
          placeholder="Search by Order ID or Item Name"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
        />
        <input 
          type="number" 
          name="tableNumber" 
          value={filters.tableNumber} 
          onChange={handleFilterChange}
          placeholder="Table Number"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
        />
        <select 
          name="status" 
          value={filters.status} 
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select 
          name="paymentMode" 
          value={filters.paymentMode} 
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">All Payment Modes</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
        </select>
        <input 
          type="date" 
          name="dateFrom" 
          value={filters.dateFrom} 
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
        />
        <input 
          type="date" 
          name="dateTo" 
          value={filters.dateTo} 
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
        />
      </div>

      {/* Orders Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-4 text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Order ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Table</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Seats</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Received</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Balance</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Refund</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Payment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">#{order.order_id}</td>
                  <td className="py-3 px-4 text-sm">{order.table_number}</td>
                  <td className="py-3 px-4 text-sm">
                    {order.selected_seats && order.selected_seats.length > 0 
                      ? order.selected_seats.join(', ') 
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="max-w-xs">
                      {order.items.map((item, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          {item.quantity}x {item.name}
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.category})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">₹{formatCurrency(parseFloat(order.total_amount))}</td>
                  <td className="py-3 px-4 text-sm">₹{formatCurrency(parseFloat(order.received_amount))}</td>
                  <td className="py-3 px-4 text-sm">₹{formatCurrency(parseFloat(order.balance_amount))}</td>
                  <td className="py-3 px-4 text-sm">
                    {order.refunded_amount > 0 ? (
                      <span className="text-red-600 font-medium">
                        ₹{formatCurrency(parseFloat(order.refunded_amount))}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm capitalize">{order.payment_mode}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {order.paid_at ? new Date(order.paid_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;