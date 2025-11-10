import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./fpass.css";


export default function OTPEmail() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("send"); // 'send' → 'verify'
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Step 1: Send OTP to user email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Don’t create new users if email isn’t registered
      },
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setStep("verify");
      setMessage(`✅ OTP has been sent to ${email}. Please check your inbox.`);
    }
  };

  // Step 2: Verify the OTP code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email", // For email-based OTP login
    });

    if (error) {
      setMessage(`❌ Invalid or expired OTP. Please try again.`);
    } else {
      setMessage("✅ OTP verified! Redirecting to reset password...");
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SIDE (form) */}
      <div className="left-div">
        <div className="login-card">
          <div className="brand-section">
            <img
              src="logoname.png"
              alt="Smart Vision Logo"
              className="brand-logo"
            />
            <h1 className="brand-title">Smart Vision</h1>
            <p className="brand-subtitle">Braille Interpretation System</p>
          </div>

          <h2 className="form-heading">
            {step === "send" ? "Forgot Password" : "Verify OTP"}
          </h2>

          <form
            onSubmit={step === "send" ? handleSendOTP : handleVerifyOTP}
            className="login-form"
          >
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                disabled={step === "verify"}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {step === "verify" && (
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-login">
              {step === "send" ? "Send OTP" : "Verify OTP"}
            </button>
            <br />
            <div className="forgot-password-text">
              <Link to="/login" className="link-forgot">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE (background image + overlay) */}
      <div className="right-div">
        <div className="right-overlay">
          <h1>Secure Password Recovery</h1>
          <p>
            Receive a one-time password (OTP) through your registered email to
            verify your identity and reset your password safely.
          </p>
        </div>
      </div>
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
  );
}
