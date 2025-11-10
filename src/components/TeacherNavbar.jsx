// src/components/TeacherNavbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useTeacherSession from "../pages/teacher/useTeacherSession.jsx"; // make sure this path is correct
import "./teacherNavbar.css"; // optional, create a CSS file for styling
import navlogo from "../assets/logoname.png";

const TeacherNavbar = () => {
  const { username } = useTeacherSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage on logout
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <nav className="teacher-navbar">
      <div className="navbar-left">
        <img src={navlogo} alt="SmartVision Logo" className="navbarlogo" />
      </div>

      <div className="navbar-right">
        <NavLink
          to="/teacher/dashboard"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/teacher/class-management"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Class Management
        </NavLink>

        <NavLink
          to="/teacher/subject-management"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Subject Management
        </NavLink>

        <NavLink
          to="/teacher/feedback"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Feedback
        </NavLink>

        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default TeacherNavbar;
