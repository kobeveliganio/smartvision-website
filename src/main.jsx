import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

// Admin Pages
import AdminDashboard from "./pages/admin/adminDashboard.jsx";
import Users from "./pages/admin/accountManagement/Users.jsx";
import Students from "./pages/admin/accountManagement/Students.jsx";
import Classrooms from "./pages/admin/classManagement/Classrooms.jsx";
import AssignStudents from "./pages/admin/classManagement/AssignStudents.jsx";
import AuditTrail from "./pages/admin/auditTrail/AuditTrail.jsx";
import MaterialsManagement from "./pages/admin/materialsManagement/materialsManagement.jsx"; // ✅ New page
import Feedbacks from "./pages/admin/feedbacks/Feedbacks.jsx"; // Optional for future admin feedback view

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import ClassCrud from "./pages/teacher/classManagement/ClassCrud.jsx";
import SubjectFiles from "./pages/teacher/subjectManagement/SubjectFiles.jsx";
import Feedback from "./pages/teacher/feedback/Feedback.jsx";

// Layout
import AdminLayout from "./layouts/AdminLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx"; // optional if you have a teacher layout

// Authentication Pages
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/fpassword.jsx";
import OTPEmail from "./pages/otpemail.jsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
   { path: "/forgot-password", element: <OTPEmail /> }, // updated to OTPEmail
  { path: "/reset-password", element: <ForgotPassword /> }, // new step after OTP

  // Admin Routes
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="adminDashboard" replace /> },
      { path: "adminDashboard", element: <AdminDashboard /> },
      { path: "users", element: <Users /> },
      { path: "students", element: <Students /> },
      { path: "classrooms", element: <Classrooms /> },
      { path: "assign-students", element: <AssignStudents /> },
      { path: "audit-trail", element: <AuditTrail /> },
      { path: "materials-management", element: <MaterialsManagement /> }, // ✅ Added route
      { path: "feedbacks", element: <Feedbacks /> }, // Optional admin feedback page
    ],
  },

  // Teacher Routes
  {
    path: "/teacher",
    element: <TeacherLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <TeacherDashboard /> },
      { path: "class-management", element: <ClassCrud /> },
      { path: "subject-management", element: <SubjectFiles /> },
      { path: "feedback", element: <Feedback /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
