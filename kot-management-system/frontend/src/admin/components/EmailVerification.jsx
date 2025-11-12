import React, { useState } from "react";
import API from "../../api";

const EmailVerification = ({ navigate }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("send-otp/", { email });
      setMessage(res.data.message);
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setMessage(err.response?.data?.error || "Error sending OTP");
    }
  };

  return (
    <div style={{ width: "350px", margin: "80px auto", padding: "30px", border: "1px solid #ccc", borderRadius: "8px", background: "#f9f9f9" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Verify Email</h2>
      <form onSubmit={handleSendOTP}>
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ width: "100%", background: "#2563eb", color: "#fff", padding: "10px", border: "none", borderRadius: "6px" }}>
          Send OTP
        </button>
      </form>
      {message && <p style={{ marginTop: "15px", textAlign: "center" }}>{message}</p>}
    </div>
  );
};

export default EmailVerification;
