import React from "react";
import { Outlet } from "react-router-dom";
import TeacherNavbar from "../components/TeacherNavbar.jsx"; // check path

const TeacherLayout = () => {
  return (
    <div>
      <TeacherNavbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout; // ✅ default export is required
