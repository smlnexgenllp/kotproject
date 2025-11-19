// src/api.js  (or src/api/index.js)

import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  // your headers, interceptors, etc.
});

// ADD THIS LINE — THIS IS WHAT WAS MISSING
API.refundOrder = (orderId, amount, reason) =>
  API.post(`cashier-orders/${orderId}/refund/`, { amount, reason });

// your other custom methods (if any)
export default API;