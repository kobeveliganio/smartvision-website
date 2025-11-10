import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./auth.css";
import { TbBoxAlignTopLeft } from "react-icons/tb";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, password, role, username")
        .eq("email", email);

      if (error) throw error;

      if (data && data.length > 0) {
        const user = data[0];

        if (user.password === password) {
          localStorage.setItem("userId", user.id);
          localStorage.setItem("userRole", user.role);
          localStorage.setItem("username", user.username);

          if (user.role === "teacher") {
            navigate("/teacher/dashboard"); // ✅ correct path
          } else if (user.role === "admin") {
            navigate("/admin/adminDashboard");
          } else {
            setError("Access restricted. Unknown role.");
          }
        } else {
          setError("Incorrect password. Please try again.");
        }
      } else {
        setError("Invalid credentials or unauthorized access.");
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setError("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className={`login-container auth-fade ${fadeIn ? "show" : ""}`}>
      <div className="left-div">
        <button
          type="button"
          className="button-19"
          onClick={() => navigate("/")} // ✅ redirects to homepage route in App.jsx
        >
          Back to Homepage
        </button>

        <div className="login-card">
          <div className="brand-section">
            <img
              src="/logoname.png"
              alt="SmartVision Logo"
              className="brand-logo"
            />
            <p className="brand-subtitle">Braille-Text Application</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <h2 className="form-heading">Welcome, Teacher!</h2>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-login">
              Login
            </button>

            <div className="signup-text">
              <p>
                Don’t have an account?{" "}
                <Link to="/signup" className="link-signup">
                  Sign Up
                </Link>
              </p>
            </div>
            <div className="forgot-password-text">
              <Link to="/forgot-password" className="link-forgot">
                Forgot password?
              </Link>
            </div>

          </form>
        </div>
      </div>

      <div className="right-div">
        <div className="right-overlay">
          <h1>Empowering Education Through Accessibility</h1>
          <p>
            SmartVision connects teachers and students using Braille translation technology.
          </p>
        </div>
      </div>
    </div>
  );
}
