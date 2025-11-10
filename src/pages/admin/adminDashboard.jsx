import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaChalkboardTeacher, FaUserGraduate, FaUsers, FaFileAlt, FaCommentDots, FaHistory } from "react-icons/fa";
import useAdminSession from "./useAdminSession";
import "./adminDashboard.css";

export default function AdminDashboard() {
  const { username } = useAdminSession();

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classrooms: 0,
    materials: 0,
    feedbacks: 0,
    userActivity: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Count teachers
        const { count: teacherCount } = await supabase
          .from("users")
          .select("*", { count: "exact" })
          .eq("role", "teacher");

        // Count students
        const { count: studentCount } = await supabase
          .from("students")
          .select("*", { count: "exact" });

        // Count classrooms
        const { count: classroomCount } = await supabase
          .from("classes")
          .select("*", { count: "exact" });

        // Count materials uploaded
        const { count: materialsCount } = await supabase
          .from("materials")
          .select("*", { count: "exact" });

        // Count feedbacks given
        const { count: feedbacksCount } = await supabase
          .from("feedback")
          .select("*", { count: "exact" });

        // Count user activity
        const { count: activityCount } = await supabase
          .from("user_activity")
          .select("*", { count: "exact" });

        setStats({
          teachers: teacherCount || 0,
          students: studentCount || 0,
          classrooms: classroomCount || 0,
          materials: materialsCount || 0,
          feedbacks: feedbacksCount || 0,
          userActivity: activityCount || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err.message);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("user_activity")
          .select(`
            activity_id,
            created_at,
            user_action,
            users (username)
          `)
          .order("created_at", { ascending: false })
          .limit(3); // only 3 recent activities

        if (error) throw error;

        setRecentActivities(data);
      } catch (err) {
        console.error("Error fetching recent activities:", err.message);
      }
    };

    fetchStats();
    fetchRecentActivities();
  }, []);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Welcome, {username || "Admin"} 👋</h1>
      <p className="dashboard-subtitle">Here’s an overview of system activity.</p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card teachers">
          <FaChalkboardTeacher className="stat-icon" />
          <div>
            <h2>{stats.teachers}</h2>
            <p>Total Teachers</p>
          </div>
        </div>

        <div className="stat-card students">
          <FaUserGraduate className="stat-icon" />
          <div>
            <h2>{stats.students}</h2>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card classrooms">
          <FaUsers className="stat-icon" />
          <div>
            <h2>{stats.classrooms}</h2>
            <p>Total Classrooms</p>
          </div>
        </div>

        <div className="stat-card materials">
          <FaFileAlt className="stat-icon" />
          <div>
            <h2>{stats.materials}</h2>
            <p>Materials Uploaded</p>
          </div>
        </div>

        <div className="stat-card feedbacks">
          <FaCommentDots className="stat-icon" />
          <div>
            <h2>{stats.feedbacks}</h2>
            <p>Feedbacks Given</p>
          </div>
        </div>

        <div className="stat-card activity">
          <FaHistory className="stat-icon" />
          <div>
            <h2>{stats.userActivity}</h2>
            <p>User Activity</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-section">
        <div className="recent-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Recent Activity</h3>
          <button
            onClick={() => window.location.href = "/admin/audit-trail"}
            className="audit-link-btn"
          >
            View All
          </button>
        </div>

        <table className="recent-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentActivities.map((activity) => (
              <tr key={activity.activity_id}>
                <td>{activity.users?.username || "Unknown User"}</td>
                <td>{activity.user_action}</td>
                <td>{new Date(activity.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
