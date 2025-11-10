import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

const AdminLayout = () => {
  return (
    <div>
      <AdminNavbar />
      <main className="p-6">
        <Outlet /> {/* This displays child pages like Users, Students, etc. */}
      </main>
    </div>
  );
};

export default AdminLayout;
