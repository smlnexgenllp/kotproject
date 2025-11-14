import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("login/", {
        identifier: form.identifier.trim(),
        password: form.password,
      });

      // ✅ NEW: Check if user role is admin before proceeding
      if (res.data.user.role === 'admin') {
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setMessage("Admin login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setMessage("Access denied. Admin privileges required.");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/30">

        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 7h.01M12 11h.01M12 15h.01" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-gray-800 mb-2">Admin Login</h2>
        <p className="text-center text-gray-600 text-sm mb-8">Admin access required</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="identifier"
            placeholder="Username or Email"
            value={form.identifier}
            onChange={handleChange}
            required
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 placeholder-gray-400 text-base outline-none transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-800 placeholder-gray-400 text-base outline-none transition-all duration-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-300 transform ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[0.98] active:scale-95"
            }`}
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <div
            className={`mt-5 p-3 rounded-lg text-center text-sm font-medium border animate-fadeIn ${
              message.includes("successful")
                ? "bg-green-50 text-green-800 border-green-200"
                : message.includes("Access denied")
                ? "bg-orange-50 text-orange-800 border-orange-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Bottom Links - UPDATED */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-3">Don't have an account?</p>
          <button
            onClick={() => navigate("/signup")}
            className="w-full py-3 rounded-xl font-medium text-purple-600 border-2 border-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 transform hover:scale-[0.98] active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;