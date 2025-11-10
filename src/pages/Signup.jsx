import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./auth2.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username,
            password,
            email,
            role: "teacher",
            assessment_level: 1,
          },
        ])
        .select("*");

      if (error) throw error;

      // ✅ Show success modal
      setShowModal(true);

      // Automatically redirect after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err.message);
      setError("An error occurred during signup. Please try again.");
    }
  };

  return (
    <div className={`login2-container auth-fade ${fadeIn ? "show" : ""}`}>
      <div className="left2-div">
        <div className="right2-overlay">
          <h1>Join SmartVision Today</h1>
          <p>Empowering educators to connect and teach through accessible technology.</p>
        </div>
      </div>

      <div className="right2-div">
        <div className="login2-card">
          <div className="brand2-section">
            <img src="/logoname.png" alt="SmartVision Logo" className="brand2-logo" />
            <p className="brand2-subtitle">Braille-Text Application</p>
          </div>

          <form className="login2-form" onSubmit={handleSignup}>
            <h2 className="form2-heading">Create an Account</h2>

            <div className="form2-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form2-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form2-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form2-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error2-text">{error}</p>}

            <button type="submit" className="btn2-login">
              Sign Up
            </button>

            <div className="signup2-text">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="link2-signup">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🎉 Account Created Successfully!</h3>
            <p>You will be redirected to the login page shortly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
