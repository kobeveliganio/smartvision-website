import React, { useEffect, useState } from "react";
import { FaUserGraduate, FaChalkboard, FaFileAlt, FaCommentDots } from "react-icons/fa";
import useTeacherSession from "./useTeacherSession";
import { supabase } from "../../supabaseClient";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const session = useTeacherSession(); // contains id, username, classes[]
  const teacherClasses = session.classes || [];
  const classIds = teacherClasses.map((cls) => cls.id);

  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    materials: 0,
    feedbacks: 0,
  });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!session.id || classIds.length === 0) return;

    const fetchStatsAndClasses = async () => {
      try {
        const classesWithStats = await Promise.all(
          teacherClasses.map(async (cls) => {
            // Count students in this class
            const { count: studentCount } = await supabase
              .from("student_class")
              .select("*", { count: "exact" })
              .eq("class_id", cls.id);

            // Count materials uploaded by THIS teacher for this class
            const { count: materialsCount } = await supabase
              .from("materials")
              .select("*", { count: "exact" })
              .eq("class_id", cls.id)
              .eq("uploaded_by", session.id);

            // Count feedbacks for this class (filter only for this teacher if needed)
            // Assuming teacher_id is not directly in feedback, we filter by classes owned by teacher
            const { count: feedbackCount } = await supabase
              .from("feedback")
              .select("*", { count: "exact" })
              .eq("class_id", cls.id);

            return {
              ...cls,
              studentCount: studentCount || 0,
              materialsCount: materialsCount || 0,
              feedbackCount: feedbackCount || 0,
            };
          })
        );

        const totalStudents = classesWithStats.reduce((acc, cls) => acc + cls.studentCount, 0);
        const totalMaterials = classesWithStats.reduce((acc, cls) => acc + cls.materialsCount, 0);
        const totalFeedbacks = classesWithStats.reduce((acc, cls) => acc + cls.feedbackCount, 0);

        setStats({
          students: totalStudents,
          classes: teacherClasses.length,
          materials: totalMaterials,
          feedbacks: totalFeedbacks,
        });

        setClasses(classesWithStats);
      } catch (err) {
        console.error("Error fetching teacher stats:", err.message);
      }
    };

    fetchStatsAndClasses();
  }, [session, classIds]);

  return (
    <div className="teacher-dashboard">
      <h1 className="dashboard-title">Welcome, {session.username || "Teacher"} 👋</h1>
      <p className="dashboard-subtitle">Here’s an overview of your activity.</p>

      <div className="stats-grid">
        <div className="stat-card students">
          <FaUserGraduate className="stat-icon" />
          <div>
            <h2>{stats.students}</h2>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card classes">
          <FaChalkboard className="stat-icon" />
          <div>
            <h2>{stats.classes}</h2>
            <p>Total Classes</p>
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
      </div>

      <div className="teacher-classes">
        <h2>Your Classes</h2>
        <div className="classes-grid3">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div key={cls.id} className="class-card" style={{ background: "#D6E6F2" }}>
                <h3>{cls.class_name}</h3>
                <p>Students Enrolled: {cls.studentCount}</p>
                <p>Materials Uploaded: {cls.materialsCount}</p>
                <p>Feedbacks Given: {cls.feedbackCount}</p>
              </div>
            ))
          ) : (
            <p>No classes assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
