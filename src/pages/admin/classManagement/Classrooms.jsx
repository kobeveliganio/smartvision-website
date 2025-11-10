import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import AdminNavbar from "../../../components/AdminNavbar";
import "./classManagement.css";
import AssignStudents from "./AssignStudents";
import EditClassroomModal from "./EditClassroomModal";
import AddNewClass from "./AddNewClass";
import useAdminSession from "../useAdminSession"; // ✅ Correct import path


export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isAddClassOpen, setAddClassOpen] = useState(false);
  const { username } = useAdminSession();


  const handleEditClassroom = (classroom) => {
    setSelectedClassroom(classroom);
    setEditOpen(true);
  };

  const handleAddStudent = (classroom) => {
    setSelectedClassroom(classroom);
    setAssignOpen(true);
  };

  useEffect(() => {
    const fetchClassrooms = async () => {
      // ✅ Changed "new_classroom" to "classes"
// OPTION 1
const { data: classroomData, error: classroomError } = await supabase
  .from("classes")
  .select(`
    id,
    class_name,
    class_code,
    assessment_level,
    teacher_id,
    created_at,
    users:users!classes_teacher_id_fkey(username)
  `);





      if (classroomError) {
        console.error("Error fetching classes:", classroomError);
        return;
      }

      // ✅ Fetch students for each class
const classroomList = await Promise.all(
  classroomData.map(async (room) => {
    const { data: links, error: linksError } = await supabase
      .from("student_class")
      .select("student_id, joined_at")
      .eq("class_id", room.id);

    if (linksError) console.error(`Error fetching students for class ${room.id}:`, linksError);

    let students = [];

    if (links?.length > 0) {
      const studentIds = links.map(l => l.student_id);

      const { data: studentRows, error: studentsError } = await supabase
        .from("students")
        .select("student_id, first_name, middle_name, last_name, age, address")
        .in("student_id", studentIds);

      if (studentsError) console.error(`Error fetching student data for class ${room.id}:`, studentsError);

      students = studentRows?.map(r => ({
        id: r.student_id,
        name: `${r.first_name || ""} ${r.middle_name || ""} ${r.last_name || ""}`.trim(),
        age: r.age,
        address: r.address,
      })) || [];
    }

    return {
      id: room.id,
      name: room.class_name,
      teacher: room.users?.username || "N/A",
      gradeLevel: room.assessment_level,
      time: room.class_code,
      students: students || [], // ✅ always an array
    };
  })
);


      setClassrooms(classroomList);
    };

    fetchClassrooms();
  }, []);

  return (
    <div>
      <AdminNavbar />
      <div className="classroom-page">
      <div className="classroom-header">
        <h2>Classroom Management</h2>
        <button className="add-class-btn" onClick={() => setAddClassOpen(true)}>
          + Add New Classroom
        </button>
      </div>



        <div className="classroom-layout">
          {/* Scrollable cards on the left */}
          <div className="classroom-container">
            {classrooms.map((room) => (
              <div key={room.id} className="classroom-card">
                <h3 className="roomTitle">{room.name}</h3>
                <p>
                  <strong>Teacher:</strong> {room.teacher}
                </p>
                <p>
                  <strong>Grade Level:</strong> {room.gradeLevel}
                </p>
                <p>
                  <strong>Students:</strong> {room.students.length}
                </p>
                <button
                  className="view-btn"
                  onClick={() => setSelectedClassroom(room)}
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>

{/* Fixed details on the right */}
<div className="classroom-details">
  {selectedClassroom ? (
    <>
      <h3>{selectedClassroom.name}</h3>
      <p>
        <strong>Teacher:</strong> {selectedClassroom.teacher || "N/A"}
      </p>
      <p>
        <strong>Grade Level:</strong> {selectedClassroom.gradeLevel || "N/A"}
      </p>
      <p>
        <strong>Class Code:</strong> {selectedClassroom.time || "N/A"}
      </p>

      <button
        onClick={() => handleEditClassroom(selectedClassroom)}
        className="edit-class-btn"
      >
        Edit Classroom
      </button>

      <div className="students-section">
        <div className="students-header">
          <h4>Students List</h4>
          <button
            className="add-student-btn"
            onClick={() => setAssignOpen(true)}
          >
            + Add Student
          </button>
        </div>

        <div className="tables-wrapper">
          {console.log(selectedClassroom.students)}
          {Array.isArray(selectedClassroom.students) &&
          selectedClassroom.students.length > 0 ? (
            <table className="students-tables" >
              <thead>
                <tr>
                  <th>ID Number</th>
                  <th>Student Name</th>
                  <th>Age</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {selectedClassroom.students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.age}</td>
                    <td>{student.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontStyle: "italic", textAlign: "center", color: "black" }}>
              No students enrolled yet.
            </p>
          )}
        </div>
      </div>
    </>
  ) : (
    <p
      style={{
        textAlign: "center",
        color: "black",
        fontStyle: "italic",
        fontWeight: "bold",
      }}
    >
      👋 Select a classroom from the list to view its details.
    </p>
  )}
</div>
        </div>
      </div>
      <AddNewClass
        isOpen={isAddClassOpen}
        onClose={() => setAddClassOpen(false)}
      onClassAdded={(newClass) => {
        setClassrooms((prev) => [
          ...prev,
          {
            ...newClass,
            name: newClass.class_name,
            gradeLevel: newClass.assessment_level,
            teacher: newClass.users?.username || "N/A",
            students: [],
            time: newClass.class_code,
          },
        ]);
      }}
      />

      <EditClassroomModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        classroom={selectedClassroom}
        onUpdateClassroom={(updatedClass) => {
          setClassrooms((prev) =>
            prev.map((c) =>
              c.id === updatedClass.id
                ? { ...updatedClass, students: c.students || [] } // ensure students array
                : c
            )
          );

          setSelectedClassroom({
            ...updatedClass,
            students: selectedClassroom?.students || [], // fallback
          });
        }}
      />
      <AssignStudents
  isOpen={isAssignOpen}
  onClose={() => setAssignOpen(false)}
  classroom={selectedClassroom}
  onUpdateClassroom={(updatedClass, removedFromClasses = []) => {
    const addedStudentIds = updatedClass.students.map((s) => s.id);

    setClassrooms((prev) =>
      prev.map((c) => {
        // Update the class where students were added
        if (c.id === updatedClass.id)
          return { ...updatedClass, students: updatedClass.students || [] };

        // Remove promoted students from old classrooms
        if (removedFromClasses.includes(c.id))
          return {
            ...c,
            students: c.students?.filter((s) => !addedStudentIds.includes(s.id)) || [],
          };

        return c;
      })
    );

    // Update selectedClassroom details
    setSelectedClassroom((prev) => {
      if (!prev) return prev;

      if (prev.id === updatedClass.id) {
        return { ...updatedClass, students: updatedClass.students || [] };
      }

      if (removedFromClasses.includes(prev.id)) {
        return {
          ...prev,
          students: prev.students?.filter((s) => !addedStudentIds.includes(s.id)) || [],
        };
      }

      return prev;
    });
  }}
/>


      

    </div>
  );
}
