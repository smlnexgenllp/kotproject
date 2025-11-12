import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../api";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("verify-otp/", { email, otp });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP");
    }
  };

  return (
    <div className="form-container">
      <h2>Verify OTP</h2>
      <p>OTP sent to {email}</p>
      <form onSubmit={handleVerify}>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" required />
        <button type="submit">Verify</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default VerifyOTP;
