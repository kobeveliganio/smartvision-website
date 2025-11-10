// File: src/pages/teacher/classManagement/ClassCrud.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import UploadStudentWork from "./uploadStudentWork.jsx";
import "./classManagement.css";
import useTeacherSession from "../useTeacherSession";

export default function ClassCrud() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const session = useTeacherSession();

  const [editingClass, setEditingClass] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 🔹 New success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [studentsByClass, setStudentsByClass] = useState({});
  const [studentWorks, setStudentWorks] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedWorkImage, setSelectedWorkImage] = useState(null);
  const [showWorkModal, setShowWorkModal] = useState(false);

  const teacherId = Number(localStorage.getItem("userId"));

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data: classesData, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", teacherId);

      if (error) throw error;

      const classesWithStudents = await Promise.all(
        classesData.map(async (cls) => {
          const { count } = await supabase
            .from("student_class")
            .select("*", { count: "exact" })
            .eq("class_id", cls.id);
          return { ...cls, studentCount: count || 0 };
        })
      );
      setClasses(classesWithStudents);

      const studentsMap = {};
      const allStudents = {};

      for (let cls of classesData) {
        const { data: studentClassData } = await supabase
          .from("student_class")
          .select("student_id")
          .eq("class_id", cls.id);

        const studentIds = studentClassData.map((s) => s.student_id);
        if (studentIds.length === 0) {
          studentsMap[cls.id] = [];
          continue;
        }

        const { data: studentsData } = await supabase
          .from("students")
          .select(
            "student_id, first_name, middle_name, last_name, age, grade_level, address, guardian_name, contact_num"
          )
          .in("student_id", studentIds);

        studentsMap[cls.id] = studentsData;

        studentsData.forEach((s) => {
          allStudents[s.student_id] = `${s.last_name}, ${s.first_name} ${s.middle_name}`;
        });
      }

      setStudentsByClass(studentsMap);

      const { data: worksData } = await supabase
        .from("student_work")
        .select(
          "activity_id, student_id, class_id, activity_output, activity_title, created_at"
        )
        .in(
          "class_id",
          classesData.map((c) => c.id)
        );

      const worksWithNames = (worksData || []).map((work) => ({
        ...work,
        student_name: allStudents[work.student_id] || "Unknown Student",
      }));

      setStudentWorks(worksWithNames);
    } catch (err) {
      console.error("Error fetching data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setNewClassName(cls.class_name);
    setNewClassCode(cls.class_code);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ class_name: newClassName, class_code: newClassCode })
        .eq("id", editingClass.id);

      if (error) throw error;

      // 🔹 Log teacher activity (same as before)
      try {
        const teacherUsername = localStorage.getItem("username");
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("id")
          .eq("username", teacherUsername)
          .single();

        if (teacherError || !teacherData)
          throw teacherError || new Error("Teacher not found");

        const { error: activityError } = await supabase
          .from("user_activity")
          .insert([
            {
              user_id: teacherData.id,
              user_action: `Updated classroom info for "${newClassName}" (Code: ${newClassCode})`,
            },
          ]);

        if (activityError) throw activityError;
      } catch (logError) {
        console.error("Failed to log teacher activity:", logError.message);
      }

      // Update state and close modal
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === editingClass.id
            ? { ...cls, class_name: newClassName, class_code: newClassCode }
            : cls
        )
      );

      setShowModal(false);
      setEditingClass(null);

      // ✅ Show success modal
      setShowSuccessModal(true);

      // Auto-close after 2 seconds
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      console.error("Error updating class:", err.message);
    }
  };

  return (
    <div className="class-crud-container">
      <h2>Your Classroom</h2>
      {loading ? (
        <p>Loading classes...</p>
      ) : classes.length === 0 ? (
        <p>No classes assigned yet.</p>
      ) : (
        <div className="classes-flex-container">
          {/* Left Column: Classes */}
          <div className="classes-grid">
            {classes.map((cls) => (
              <div key={cls.id} className="class-grid">
                <div className="class-info">
                <h3>{cls.class_name}</h3>
                <div className="infor">
                <div className="inside-info">
                <p><strong>Code:</strong> {cls.class_code}</p>
                <p><strong>Students:</strong> {cls.studentCount}</p>
                <p><strong>Created:</strong> {new Date(cls.created_at).toLocaleDateString()}</p>
                </div>
                <button className="edit-btn" onClick={() => handleEdit(cls)}>
                  Edit
                </button>
                </div>
                </div>

                {/* Student Table */}
                {studentsByClass[cls.id]?.length > 0 && (
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Full Name</th>
                        <th>Age</th>
                        <th>Guardian</th>
                        <th>Contact</th>
                        <th>Upload Work</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsByClass[cls.id].map((student) => (
                        <tr key={student.student_id}>
                          <td>{`${student.first_name} ${student.middle_name} ${student.last_name}`}</td>
                          <td>{student.age}</td>
                          <td>{student.guardian_name}</td>
                          <td>{student.contact_num}</td>
                          <td>
                            <button
                              className="upload-btn"
                              onClick={() => setSelectedStudent(student)}
                            >
                              Upload Work
                            </button>


                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>

          {/* Right Column: Student Works */}
          <div className="classes-grid2">
            <h3>All Student Works</h3>
            {studentWorks.length === 0 ? (
              <p>No student works yet.</p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Activity Title</th>
                    <th>Class</th>
                    <th>Student ID</th>
                    <th>Output</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {studentWorks.map((work) => (
                    <tr key={work.activity_id}>
                      <td>{work.activity_title}</td>
                      <td>{work.class_id}</td>
                      <td>{work.student_name}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedWorkImage(work.activity_output);
                            setShowWorkModal(true);
                          }}
                        >
                          View Activity
                        </button>
                      </td>
                      <td>{new Date(work.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Class Information</h3>
            <label>
              Class Name:
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </label>
            <label>
              Class Code:
              <input
                type="text"
                value={newClassCode}
                onChange={(e) => setNewClassCode(e.target.value)}
              />
            </label>
            <div className="modal-buttons">
              <button onClick={handleSave}>Save Changes</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 View Activity Modal */}
      {showWorkModal && selectedWorkImage && (
        <div className="modal-overlay" onClick={() => setShowWorkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Student Activity Output</h3>
            <img
              src={selectedWorkImage}
              alt="Student Work"
              className="preview-image"
            />
            <button onClick={() => setShowWorkModal(false)}>Close</button>
          </div>
        </div>
      )}
      {selectedStudent && (
  <UploadStudentWork
    student={selectedStudent}
    classId={
      classes.find(cls =>
        studentsByClass[cls.id]?.some(s => s.student_id === selectedStudent.student_id)
      )?.id
    }
    onUploadComplete={() => {
      fetchClasses();
      setSelectedStudent(null);
    }}
    onClose={() => setSelectedStudent(null)}
  />
)}

      {/* ✅ Success Modal */}
      {showSuccessModal && (
        <div className="success-modal">
          <div className="success-modal-content">
            <h4>✅ Class information updated successfully!</h4>
          </div>
        </div>
      )}

    </div>
    
  );
  
}

