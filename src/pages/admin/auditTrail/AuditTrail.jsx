import React, { useState, useEffect } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import "./AuditTrail.css";
import { supabase } from "../../../supabaseClient";
import useAdminSession from "../useAdminSession"; // ✅ Correct import path

export default function AuditTrail() {
  const { username } = useAdminSession();
  const [auditData, setAuditData] = useState([]);
  const [tableLoaded, setTableLoaded] = useState(false); // 👈 new state

  useEffect(() => {
    const fetchData = async () => {
      const { data: auditTrail, error: auditError } = await supabase
        .from("user_activity")
        .select("*");

      if (auditError) {
        console.error("Error fetching audit trail:", auditError);
        return;
      }

      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, username");

      if (userError) {
        console.error("Error fetching users:", userError);
        return;
      }

      const mergedData = auditTrail.map((log) => {
        const user = users.find((u) => u.id === log.user_id);
        return {
          ...log,
          username: user ? user.username : "Unknown User",
        };
      });

      setAuditData(mergedData);
      setTimeout(() => setTableLoaded(true), 50); // trigger slide animation
    };

    fetchData();
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="audit-container">
        <h2>Audit Trail</h2>
        <p>This page shows all user actions within the system.</p>

        <div className={`table-wrapper ${tableLoaded ? "slide-in" : ""}`}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Activity ID</th>
                <th>Created At</th>
                <th>User ID</th>
                <th>Username</th>
                <th>User Action</th>
              </tr>
            </thead>
            <tbody>
              {auditData.length > 0 ? (
                auditData.map((log) => (
                  <tr key={log.activity_id}>
                    <td>{log.activity_id}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.user_id}</td>
                    <td>{log.username}</td>
                    <td>{log.user_action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
