import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import "./accountManagement.css";
import AdminNavbar from "../../../components/AdminNavbar";
import { supabase } from "../../../supabaseClient";
import useAdminSession from "../useAdminSession"; // ✅ Correct import path

export default function Students() {
  const { username } = useAdminSession();
  const [students, setStudents] = useState([]);
  const [tableLoaded, setTableLoaded] = useState(false);
  const fileInputRef = useRef(null);

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const [editModal, setEditModal] = useState({
    open: false,
    student: null,
  });

  const [modalAnimation, setModalAnimation] = useState(false);

  // ✅ Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) {
        console.error("Error fetching students:", error);
      } else {
        setStudents(data);
        setTimeout(() => setTableLoaded(true), 50);
      }
    };
    fetchStudents();
  }, []);

  // ✅ Function to log admin activity
  const logUserActivity = async (actionDescription) => {
    try {
      // Get admin user_id
      const { data: userData, error: userError } = await supabase
        .from("users") // your admin table
        .select("id")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        console.error("Error fetching admin ID:", userError?.message);
        return;
      }

      const adminId = userData.id;

      // Insert activity
      const { error: activityError } = await supabase.from("user_activity").insert([
        {
          user_id: adminId,
          user_action: actionDescription,
        },
      ]);

      if (activityError) {
        console.error("Error logging user activity:", activityError.message);
      } else {
        console.log(`✅ Activity logged: ${actionDescription}`);
      }
    } catch (err) {
      console.error("Unexpected error logging activity:", err);
    }
  };

  // ✅ Trigger hidden file input
  const handleImportClick = () => fileInputRef.current.click();

  // ✅ Handle Excel file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet);

      if (excelData.length === 0) {
        setFeedbackModal({
          open: true,
          message: "The Excel file is empty or invalid.",
          type: "error",
        });
        return;
      }

      const processedData = excelData.map((row) => {
        const generatedId = Math.floor(100000 + Math.random() * 900000).toString();
        const generatedPassword = `Sv${generatedId}!@`;

        return {
          student_id: generatedId,
          password: generatedPassword,
          first_name: row.first_name || "",
          middle_name: row.middle_name || "",
          last_name: row.last_name || "",
          age: row.age || null,
          grade_level: row.grade_level || "",
          address: row.address || "",
          guardian_name: row.guardian_name || "",
          contact_num: row.contact_num || "",
        };
      });

      const { error } = await supabase.from("students").insert(processedData);

      if (error) {
        console.error("Supabase insert error:", error);
        setFeedbackModal({
          open: true,
          message: `Failed to import students: ${error.message}`,
          type: "error",
        });
      } else {
        setFeedbackModal({
          open: true,
          message: "Students imported successfully!",
          type: "success",
        });
        setStudents([...students, ...processedData]);
        await logUserActivity(`Imported ${processedData.length} student(s)`); // ✅ Log import activity
      }
    } catch (err) {
      console.error("Error reading Excel file:", err);
      setFeedbackModal({
        open: true,
        message: "Error processing the Excel file.",
        type: "error",
      });
    } finally {
      event.target.value = "";
    }
  };

  // ✅ Open Edit Modal
  const openEditModal = (student) => {
    setEditModal({ open: true, student: { ...student } });
    setTimeout(() => setModalAnimation(true), 50);
  };

  // ✅ Close Edit Modal
  const closeEditModal = () => {
    setModalAnimation(false);
    setTimeout(() => {
      setEditModal({ open: false, student: null });
    }, 300);
  };

  // ✅ Save edited student
  const saveEditedStudent = async () => {
    const s = editModal.student;
    if (!s) return;

    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: s.first_name,
          middle_name: s.middle_name,
          last_name: s.last_name,
          age: s.age,
          grade_level: s.grade_level,
          address: s.address,
          guardian_name: s.guardian_name,
          contact_num: s.contact_num,
        })
        .eq("student_id", s.student_id);

      if (error) {
        setFeedbackModal({
          open: true,
          message: "Failed to update student record.",
          type: "error",
        });
      } else {
        const updatedList = students.map((stu) =>
          stu.student_id === s.student_id ? s : stu
        );
        setStudents(updatedList);
        closeEditModal();
        setFeedbackModal({
          open: true,
          message: "Student updated successfully!",
          type: "success",
        });
        await logUserActivity(`Edited student info: ${s.first_name} ${s.last_name}`); // ✅ Log edit activity
      }
    } catch (err) {
      setFeedbackModal({
        open: true,
        message: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  const closeFeedbackModal = () => setFeedbackModal({ ...feedbackModal, open: false });

  return (
    <>
      <AdminNavbar />
      <div className="contentArea2">
        <h2>Students Management</h2>

        <table className={`students-table1 ${tableLoaded ? "show" : ""}`}>
          <thead>
            <tr>
              <th>ID</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Last Name</th>
              <th>Age</th>
              <th>Grade Level</th>
              <th>Address</th>
              <th>Guardian Name</th>
              <th>Guardian Contact</th>
              <th className="options">Option</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.first_name}</td>
                  <td>{student.middle_name || "-"}</td>
                  <td>{student.last_name || "-"}</td>
                  <td>{student.age}</td>
                  <td>{student.grade_level}</td>
                  <td>{student.address}</td>
                  <td>{student.guardian_name}</td>
                  <td>{student.contact_num}</td>
                  <td className="options">
                    <button
                      className="editButton"
                      onClick={() => openEditModal(student)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center" }}>
                  No student records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <br />
        <button className="import" onClick={handleImportClick}>
          Import Student Record
        </button>

        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>

      {/* Edit Student Modal */}
      {editModal.open && (
        <div className={`student-edit-modal-overlay ${modalAnimation ? "show" : ""}`}>
          <div className="student-edit-modal-content">
            <h3>Edit Student Information</h3>
            <label>
              First Name:
              <input
                type="text"
                value={editModal.student.first_name || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, first_name: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Middle Name:
              <input
                type="text"
                value={editModal.student.middle_name || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, middle_name: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Last Name:
              <input
                type="text"
                value={editModal.student.last_name || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, last_name: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Age:
              <input
                type="number"
                value={editModal.student.age || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, age: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Grade Level:
              <select
                value={editModal.student.grade_level || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, grade_level: e.target.value },
                  })
                }
              >
                <option value="">-- Select Grade Level --</option>
                <option value="New Enroll">New Enroll</option>
                <option value="Intervention Level">Intervention Level</option>
                <option value="Transition Level">Transition Level</option>
              </select>
            </label>
            <label>
              Address:
              <input
                type="text"
                value={editModal.student.address || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, address: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Guardian Name:
              <input
                type="text"
                value={editModal.student.guardian_name || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, guardian_name: e.target.value },
                  })
                }
              />
            </label>
            <label>
              Guardian Contact:
              <input
                type="text"
                value={editModal.student.contact_num || ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    student: { ...editModal.student, contact_num: e.target.value },
                  })
                }
              />
            </label>
            <div className="modal-buttons">
              <button className="save-btn" onClick={saveEditedStudent}>
                Save
              </button>
              <button className="cancel-btn" onClick={closeEditModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
