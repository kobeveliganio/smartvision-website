import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./classManagement.css";
import useAdminSession from "../useAdminSession"; // ✅ Correct import path


export default function EditClassroomModal({ isOpen, onClose, classroom, onUpdateClassroom }) {
  const { username } = useAdminSession();
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classCode, setClassCode] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    message: "",
    type: "success", // or "error"
  });

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username")
        .eq("role", "teacher");

      if (error) console.error("Error fetching teachers:", error);
      else setTeachers(data);
    };
    fetchTeachers();
  }, []);

  // Fetch classroom data
  useEffect(() => {
    if (!isOpen || !classroom?.id) return;

    const fetchClassroomData = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, class_name, teacher_id, class_code, assessment_level")
        .eq("id", classroom.id)
        .single();

      if (error) {
        console.error("Error fetching classroom:", error);
        return;
      }

      setName(data.class_name || "");
      setGradeLevel(data.assessment_level || "");
      setTeacherId(data.teacher_id || "");
      setClassCode(data.class_code || "");
    };

    fetchClassroomData();
  }, [isOpen, classroom]);

  // Save changes to Supabase
  const handleSave = async () => {
  try {
    // Update class
    const { error } = await supabase
      .from("classes")
      .update({
        class_name: name,
        teacher_id: teacherId,
        class_code: classCode,
        assessment_level: gradeLevel,
      })
      .eq("id", classroom.id);

    if (error) throw error;

    // ✅ Log user activity
        try {
      // Fetch current admin ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (userError || !userData) throw userError || new Error("User not found");

      const adminId = userData.id;

      // Insert user activity
      const { error: activityError } = await supabase
        .from("user_activity")
        .insert([
          {
            user_id: adminId, // get this from users table
            user_action: `Updated classroom "${name}" (Code: ${classCode})`,
          },
        ]);


      if (activityError) throw activityError;

      console.log("✅ User activity logged successfully");
    } catch (activityErr) {
      console.error("Failed to log user activity:", activityErr);
    }



    // Fetch updated class
    const { data: updatedClassData, error: fetchError } = await supabase
      .from("classes")
      .select(`
        id,
        class_name,
        class_code,
        assessment_level,
        teacher_id,
        users:classes_teacher_id_fkey (id, username, role)
      `)
      .eq("id", classroom.id)
      .single();

    if (fetchError) throw fetchError;

    const updatedClass = {
      id: updatedClassData.id,
      name: updatedClassData.class_name,
      teacher: updatedClassData.users?.username || "N/A",
      gradeLevel: updatedClassData.assessment_level,
      time: updatedClassData.class_code,
    };

    onUpdateClassroom(updatedClass);

    setFeedbackModal({
      open: true,
      message: "✅ Classroom updated successfully!",
      type: "success",
    });
  } catch (err) {
    console.error(err);
    setFeedbackModal({
      open: true,
      message: "❌ Failed to update classroom.",
      type: "error",
    });
  }
};

  const closeFeedbackModal = () => {
    setFeedbackModal({ ...feedbackModal, open: false, message: "", type: "success" });
    onClose(); // Close edit modal after feedback modal
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Classroom</h3>
        <form className="edit-classroom-form">
          <label>
            Classroom Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter classroom name"
            />
          </label>

          <label>
            Assessment Level:
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="">Select Assessment Level</option>
              <option value="New Enroll">New Enroll</option>
              <option value="Intervention Level">Intervention Level</option>
              <option value="Transition Level">Transition Level</option>
            </select>
          </label>

          <label>
            Class Code:
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter class code"
            />
          </label>

          <label>
            Assigned Teacher:
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
          </label>

          <div className="modal-buttons">
            <button type="button" className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Modal */}
      {feedbackModal.open && (
        <div className="feedback-modal-overlay show">
          <div
            className={`feedback-modal-content ${
              feedbackModal.type === "error" ? "error" : "success"
            }`}
          >
            <p>{feedbackModal.message}</p>
            <button onClick={closeFeedbackModal}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
