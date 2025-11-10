import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./fpass.css"; // ✅ Use the same stylesheet as OTPEmail.jsx

export default function ForgotPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // ✅ Email passed from OTPEmail.jsx

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("❌ Email not found. Please go back and verify OTP first.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      // ✅ Update password in your custom `users` table
      const { data, error } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("email", email)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        setMessage("❌ No account found for this email.");
        return;
      }

      setMessage("✅ Password changed successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SIDE (Form section) */}
      <div className="left-div">
        <div className="login-card">
          <div className="brand-section">
            <img
              src="/logoname.png"
              alt="Smart Vision Logo"
              className="brand-logo"
            />
            <h1 className="brand-title">Smart Vision</h1>
            <p className="brand-subtitle">Braille Interpretation System</p>
          </div>

          <h2 className="form-heading">Reset Your Password</h2>

          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-login">
              Reset Password
            </button>
          </form>

          {message && (
            <div
              className={`popup-modal ${
                message.includes("✅") ? "success" : "error"
              }`}
            >
              <p>{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE (Info / Background section) */}
      <div className="right-div">
        <div className="right-overlay">
          <h1>Reset Your Account Password</h1>
          <p>
            Choose a strong and secure password to keep your Smart Vision
            account protected. Once updated, you can use it to log in
            immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
