// src/hooks/useAdminSession.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export default function useAdminSession() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const userRole = localStorage.getItem("userRole");

    // Redirect if not logged in or not admin
    if (!storedUsername || userRole !== "admin") {
      navigate("/login");
    } else {
      setUsername(storedUsername);
    }
  }, [navigate]);

  return { username };
}
