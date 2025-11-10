import React from "react";
import { Link } from "react-router-dom";
import "./navBaradmin.css";
import logo from "../assets/sv-logo.png";

// Import all sidebar icons properly
import usersIcon from "../assets/users.png";
import studentIcon from "../assets/graduating-student.png";
import classroomIcon from "../assets/lecture.png";
import auditIcon from "../assets/spreadsheet.png";
import logoutIcon from "../assets/logout.png";
import dashboard from "../assets/visual-data.png";
import mats from "../assets/box.png";
import feed from "../assets/feedback.png";

const AdminNavbar = () => {
  return (
    <nav className="adminNav">
      {/* Header */}
      <div>
        <div className="imgdiv">
          <img src={logo} alt="SmartVision Logo" />
        </div>
        <h1 className="title">SmartVision</h1>
        <p className="title">Administrative Panel</p>

        {/* Links */}
        <ul>
          <li className="liContainer">
            <img src={dashboard} alt="Dashboard Icon" className="iconsadmin" />
            <Link to="/admin/adminDashboard" className="buttons">
              Dashboard
            </Link>
          </li>

          <li className="liContainer">
            <img src={usersIcon} alt="Users Icon" className="iconsadmin" />
            <Link to="/admin/users" className="buttons">
              Users
            </Link>
          </li>

          <li className="liContainer">
            <img src={studentIcon} alt="Students Icon" className="iconsadmin" />
            <Link to="/admin/students" className="buttons">
              Students
            </Link>
          </li>

          <li className="liContainer">
            <img src={classroomIcon} alt="Classrooms Icon" className="iconsadmin" />
            <Link to="/admin/classrooms" className="buttons">
              Classrooms
            </Link>
          </li>

          <li className="liContainer">
            <img src={mats} alt="Materials Icon" className="iconsadmin" />
            <Link to="/admin/materials-management" className="buttons">
              Materials Management
            </Link>
          </li>

          <li className="liContainer">
            <img src={feed} alt="Materials Icon" className="iconsadmin" />
            <Link to="/admin/Feedbacks" className="buttons">
              Scores / FeedBacks
            </Link>
          </li>

          <li className="liContainer">
            <img src={auditIcon} alt="Audit Trail Icon" className="iconsadmin" />
            <Link to="/admin/audit-trail" className="buttons">
              Audit Trail
            </Link>
          </li>
        </ul>
      </div>

      {/* Logout */}
      <div className="logout">
        <img src={logoutIcon} alt="Logout Icon" className="iconsadmin" />
        <Link to="/" className="logoutbutton">
          Log out
        </Link>
      </div>

      {/* Footer */}
      <div>
        <p>&copy; 2025 SmartVision</p>
      </div>
    </nav>
  );
};

export default AdminNavbar;
