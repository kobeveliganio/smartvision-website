// src/hooks/useTeacherSession.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function useTeacherSession() {
  const [session, setSession] = useState({
    id: null,
    username: "",
    access_token: "",
    classes: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("accessToken");

    // redirect if not teacher
    if (!storedRole || storedRole !== "teacher") {
      navigate("/login");
      return;
    }

    async function fetchTeacherDetails() {
      try {
        // 🔹 Get teacher record
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("id, username")
          .eq("username", storedUsername)
          .single();

        if (teacherError) throw teacherError;

        // 🔹 Get classes created by this teacher
        const { data: classData, error: classError } = await supabase
          .from("classes")
          .select("id, class_name")
          .eq("teacher_id", teacherData.id);

        if (classError) throw classError;

        // store data in state + localStorage (optional)
        setSession({
          id: teacherData.id,
          username: teacherData.username,
          access_token: storedToken,
          classes: classData || [],
        });

        localStorage.setItem("userId", teacherData.id);
        if (classData?.length > 0) {
          localStorage.setItem("selectedClassId", classData[0].id); // default first class
        }
      } catch (err) {
        console.error("Session fetch error:", err.message);
      }
    }

    fetchTeacherDetails();
  }, [navigate]);

  return session;
}
