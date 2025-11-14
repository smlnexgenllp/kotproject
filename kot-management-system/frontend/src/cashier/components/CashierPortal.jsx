import React, { useState, useEffect } from "react";
import axios from "axios";
import { Printer, IndianRupee, Clock, CheckCircle } from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api/cashier-orders/";

export default function CashierPortal() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await axios.get(API_URL);
      setPendingOrders(res.data.filter((o) => o.status === "pending"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 5000); // Auto refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const markPaid = async (orderId) => {
    await axios.post(`${API_URL}${orderId}/mark_paid/`);
    fetchPending();
  };

  const printKOT = (order) => {
    const printWindow = window.open("", "", "width=300,height=600");
    printWindow.document.write(`
      <html><head><title>KOT - Table ${
        order.table_number
      }</title></head><body style="font-family:Arial">
        <h2>TABLE ${order.table_number}</h2>
        <p><strong>Order #${order.order_id}</strong></p>
        <hr>
        ${order.items
          .map(
            (item) => `<>
            <h4>${item.name}-${item.food_id}</h4>
          <div style="display:flex;justify-content:space-between">
            <span>${item.quantity}x ${item.name}</span>
            <span>₹${item.price * item.quantity}</span>
          </div></>
        `
          )
          .join("")}
        <hr>
        <h3>TOTAL: ₹${order.total_amount}</h3>
        <p>Cash Payment</p>
        <p>${new Date(order.created_at).toLocaleString()}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8 text-center">
          Cashier Portal
        </h1>

        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <Clock size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">No pending cash orders</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingOrders.map((order) => (
              <div
                key={order.order_id}
                className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-800">
                      Table {order.table_number}
                    </h2>
                    <p className="text-gray-600">Order #{order.order_id}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
                    PENDING
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-700">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed pt-4 mb-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">₹{order.total_amount}</span>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl mb-4 border-2 border-yellow-300">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Cash Received:</span>
                    <span className="text-green-600">
                      ₹{order.received_amount}
                    </span>
                  </div>
                  {order.balance_amount > 0 && (
                    <div className="flex justify-between text-lg font-bold mt-2">
                      <span>Return Change:</span>
                      <span className="text-orange-600">
                        ₹{order.balance_amount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => markPaid(order.order_id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={24} />
                    Mark as Paid
                  </button>
                  <button
                    onClick={() => printKOT(order)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
                  >
                    <Printer size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
