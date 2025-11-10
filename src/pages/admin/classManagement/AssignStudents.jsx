import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./classManagement.css";
import useAdminSession from "../useAdminSession"; // ✅ Correct import path

export default function AssignStudents({ isOpen, onClose, classroom, onUpdateClassroom }) {
  const { username } = useAdminSession();
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [resultMessage, setResultMessage] = useState("");
  const [isResultOpen, setIsResultOpen] = useState(false);

  // Add this function inside the component
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


  

  useEffect(() => {
    if (!isOpen || !classroom) return;

    const fetchStudents = async () => {
      try {
        // Get all students from the table
        const { data: students, error } = await supabase
          .from("students")
          .select(
            "student_id, last_name, middle_name, first_name, age, grade_level, address, guardian_name, contact_num"
          );

        if (error) throw error;

        // Get student IDs already enrolled in the classroom
        const enrolledIds = classroom.students?.map((s) => s.id) || [];

        let filtered = [];

        if (classroom.gradeLevel === "Intervention Level") {
          // Only show New Enrolled students
          filtered = students.filter(
            (s) => s.grade_level === "New Enroll" && !enrolledIds.includes(s.student_id)
          );
        } else if (classroom.gradeLevel === "Transition Level") {
          // Only show Intervention Level students
          filtered = students.filter(
            (s) => s.grade_level === "Intervention Level" && !enrolledIds.includes(s.student_id)
          );
        } else {
          // For New Enrolled classes or others, show all students not enrolled
          filtered = students.filter((s) => !enrolledIds.includes(s.student_id));
        }

        setAvailableStudents(filtered);
      } catch (error) {
        console.error("Error fetching students:", error.message);
      }
    };

    fetchStudents();
  }, [isOpen, classroom]);

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

const handleSaveStudents = async () => {
  if (selectedStudents.length === 0) {
    setResultMessage("❌ Please select at least one student to assign.");
    setIsResultOpen(true);
    return;
  }

  try {
    // Insert students into student_class
    const insertData = selectedStudents.map((studentId) => ({
      student_id: studentId,
      class_id: classroom.id,
      joined_at: new Date(),
    }));

    const { error: insertError } = await supabase
      .from("student_class")
      .insert(insertData);
    if (insertError) throw insertError;

    // Update students grade_level
    let newGradeLevel = "";
    if (classroom.gradeLevel === "Intervention Level") newGradeLevel = "Intervention Level";
    else if (classroom.gradeLevel === "Transition Level") newGradeLevel = "Transition Level";

    if (newGradeLevel) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ grade_level: newGradeLevel })
        .in("student_id", selectedStudents);
      if (updateError) throw updateError;
    }

    // Fetch the newly added student details FIRST
    const { data: newStudents } = await supabase
      .from("students")
      .select("student_id, first_name, middle_name, last_name, age, address")
      .in("student_id", selectedStudents);

    const mappedStudents = newStudents.map((s) => ({
      id: s.student_id,
      name: `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.trim(),
      age: s.age,
      address: s.address,
    }));

    // REMOVE STUDENTS FROM INTERVENTION LEVEL CLASSES IF THEY ARE MOVED TO TRANSITION LEVEL
    let removedFromClasses = [];
    if (classroom.gradeLevel === "Transition Level") {
      const { data: interventionClasses, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("assessment_level", "Intervention Level");
      if (classError) throw classError;

      if (interventionClasses?.length > 0) {
        const interventionClassIds = interventionClasses.map((c) => c.id);

        const { error: deleteError } = await supabase
          .from("student_class")
          .delete()
          .in("student_id", selectedStudents)
          .in("class_id", interventionClassIds);
        if (deleteError) throw deleteError;

        removedFromClasses = interventionClassIds;
      }
    }

    // Update classroom in parent
    if (typeof onUpdateClassroom === "function") {
      onUpdateClassroom(
        {
          ...classroom,
          students: [...(classroom.students || []), ...mappedStudents],
        },
        removedFromClasses
      );
    }

    setResultMessage("✅ Students successfully assigned!");
    setIsResultOpen(true);
    
        // ✅ Log activity after success
    const assignedNames = mappedStudents.map((s) => s.name).join(", ");
    await logUserActivity(
      `Assigned students to ${classroom.name}: ${assignedNames}`
    );



    // Remove newly added students from available list
    setAvailableStudents((prev) =>
      prev.filter((s) => !selectedStudents.includes(s.student_id))
    );
    setSelectedStudents([]);
  } catch (error) {
    console.error("Error assigning students:", error.message);
    setResultMessage(`❌ Failed to assign students: ${error.message}`);
    setIsResultOpen(true);
  }
};

  if (!isOpen) return null;

  return (
    <div className="assign-students-overlay">
      <div className="assign-students-modal">
        <h3 className="assign-students-title">Assign Students to {classroom?.name}</h3>
        <p className="assign-students-subtitle">
          Select eligible students to add to this classroom.
        </p>

        {availableStudents.length > 0 ? (
          <table className="assign-students-table">
            <thead className="assign-students-thead">
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Full Name</th>
                <th>Grade Level</th>
                <th>Age</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {availableStudents.map((student) => (
                <tr key={student.student_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      onChange={() => toggleStudent(student.student_id)}
                    />
                  </td>
                  <td>{student.student_id}</td>
                  <td>{`${student.first_name} ${student.middle_name || ""} ${student.last_name}`.trim()}</td>
                  <td>{student.grade_level}</td>
                  <td>{student.age}</td>
                  <td>{student.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="assign-students-empty">No eligible students available for this classroom.</p>
        )}

        <div className="assign-students-buttons">
          <button className="assign-students-save-btn" onClick={handleSaveStudents}>
            Add Selected Students
          </button>
          <button className="assign-students-cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
{isResultOpen && (
  <div className="assign-students-overlay">
    <div className="assign-students-modal">
      <p>{resultMessage}</p>
      <button
        onClick={() => {
          setIsResultOpen(false);
          if (resultMessage.includes("successfully")) onClose(); // close AssignStudents modal
        }}
      >
        OK
      </button>
    </div>
  </div>
)}

    </div>
    
  );
}
