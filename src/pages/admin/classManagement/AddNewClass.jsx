import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import "./classManagement.css";
import useAdminSession from "../useAdminSession";

export default function AddNewClass({ isOpen, onClose, onClassAdded }) {
  const { username } = useAdminSession();
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [assessmentLevel, setAssessmentLevel] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const [isResultOpen, setIsResultOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, username")
          .eq("role", "teacher");

        if (error) throw error;
        setTeachers(data || []);
      } catch (error) {
        console.error("Error fetching teachers:", error.message);
      }
    };

    fetchTeachers();
  }, [isOpen]);

  // ✅ Log admin activity
  const logUserActivity = async (actionDescription) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        console.error("Error fetching admin ID:", userError?.message);
        return;
      }

      const adminId = userData.id;

      const { error: activityError } = await supabase.from("user_activity").insert([
        {
          user_id: adminId,
          user_action: actionDescription,
        },
      ]);

      if (activityError) console.error("Error logging activity:", activityError.message);
      else console.log(`✅ Activity logged: ${actionDescription}`);
    } catch (err) {
      console.error("Unexpected error logging activity:", err);
    }
  };

  const handleAddClass = async () => {
    if (!className || !classCode || !teacherId || !assessmentLevel) {
      setResultMessage("❌ Please fill in all fields.");
      setIsResultOpen(true);
      return;
    }

    try {
      // ✅ Insert new class
      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            class_name: className,
            assessment_level: assessmentLevel,
            class_code: classCode,
            teacher_id: teacherId,
          },
        ])
        .select("id, class_name, assessment_level, class_code, teacher_id")
        .single();

      if (error) throw error;

      const teacherUsername =
        teachers.find((t) => t.id === Number(teacherId))?.username || "Unknown";

      const createdClass = {
        ...data,
        users: { username: teacherUsername },
      };

      if (typeof onClassAdded === "function") {
        onClassAdded(createdClass);
      }

      setResultMessage("✅ Classroom created successfully!");
      setIsResultOpen(true);

      // ✅ Log activity
      await logUserActivity(`Created new class: ${className} (Teacher: ${teacherUsername})`);

      // Clear form
      setClassName("");
      setClassCode("");
      setTeacherId("");
      setAssessmentLevel("New Enroll");
    } catch (error) {
      console.error("Error creating class:", error.message);
      setResultMessage(`❌ Failed to create class: ${error.message}`);
      setIsResultOpen(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="assign-students-overlay">
      <div className="assign-students-modal">
        <h3>Create New Classroom</h3>

        <label>Class Name:</label>
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
        />

        <label>Class Code:</label>
        <input
          type="text"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
        />

        <label>Teacher:</label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.username}
            </option>
          ))}
        </select>

        <label>Assessment Level:</label>
        <select
          value={assessmentLevel}
          onChange={(e) => setAssessmentLevel(e.target.value)}
        >
          <option value="New Enroll">New Enroll</option>
          <option value="Intervention Level">Intervention Level</option>
          <option value="Transition Level">Transition Level</option>
        </select>

        <div className="assign-students-buttons">
          <button className="assign-students-save-btn" onClick={handleAddClass}>
            Create Classroom
          </button>
          <br />
          <button className="assign-students-cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {isResultOpen && (
          <div className="assign-students-overlay">
            <div className="assign-students-modal">
              <p>{resultMessage}</p>
              <button
                onClick={() => {
                  setIsResultOpen(false);
                  if (resultMessage.includes("successfully")) onClose();
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
