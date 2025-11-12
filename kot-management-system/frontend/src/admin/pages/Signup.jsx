import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    username: "",
    password: "",
    role: "waiter",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("send-otp/", { email: form.email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setStep(3);
    setMessage("OTP verified successfully. Please complete registration.");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("register/", form);
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border border-white/30">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 text-sm mt-1">Secure registration with OTP</p>
        </div>

        {/* Progress Steps */}
        <div className="relative flex justify-between mb-8">
          <div className={`absolute top-5 left-12 right-12 h-1 transition-colors duration-500 ${step > 1 ? "bg-indigo-600" : "bg-gray-300"}`} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step >= i
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {i}
            </div>
          ))}
        </div>

        {/* Forms */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 text-base outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg transform transition-all duration-200 active:scale-95"
            >
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              name="otp"
              placeholder="Enter 6-digit OTP"
              value={form.otp}
              onChange={handleChange}
              required
              maxLength="6"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 text-center text-xl tracking-widest font-mono outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg transform transition-all duration-200 active:scale-95"
            >
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 text-base outline-none transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 text-base outline-none transition-all duration-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100"
            />
            <div className="relative">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-300 text-gray-800 text-base outline-none appearance-none bg-white transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 pr-10"
              >
                <option value="waiter">Waiter</option>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 8 4 4 4-4" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg transform transition-all duration-200 active:scale-95"
            >
              Complete Registration
            </button>
          </form>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-5 p-3 rounded-lg text-center text-sm font-medium border transition-all duration-300 ${
              message.includes("success") || message.includes("verified")
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Login Link */}
        <div
          onClick={() => navigate("/login")}
          className="mt-6 text-center text-sm text-indigo-600 font-medium cursor-pointer hover:underline transition"
        >
          Already have an account? <strong>Log in</strong>
        </div>
      </div>
    </div>
  );
};

export default Signup;