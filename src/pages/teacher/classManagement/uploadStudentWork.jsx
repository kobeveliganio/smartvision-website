import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import useTeacherSession from "../useTeacherSession";
import "./classManagement.css";

export default function UploadStudentWork({ student, classId, onClose, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const session = useTeacherSession();

  if (!session) return null;

  const handleUpload = async () => {
    if (!file) return;
    if (!activityTitle.trim()) return alert("Please enter an activity title.");

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${student.student_id}_${Date.now()}.${fileExt}`;

      // 🔹 1. Send to YOLO API
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("https://braille-ml-api.onrender.com/predict", {
        method: "POST",
        headers: {
          Authorization: "Bearer my-secret-key-123",
        },
        body: formData,
      });

      if (!response.ok) throw new Error("ML API failed");
      const result = await response.json();

      // 🔹 2. Convert base64 to blob
      const byteCharacters = atob(result.result_image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const processedFile = new Blob([byteArray], { type: "image/jpeg" });

      // 🔹 3. Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("ml-server")
        .upload(`uploaded_works/${fileName}`, processedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("ml-server")
        .getPublicUrl(`uploaded_works/${fileName}`);

      const fileURL = publicData.publicUrl;

      // 🔹 4. Save record in DB
      const { error: dbError } = await supabase
        .from("student_work")
        .insert([
          {
            student_id: student.student_id,
            class_id: classId,
            activity_output: fileURL,
            activity_title: activityTitle,
          },
        ]);

      if (dbError) throw dbError;

      // 🟢 NEW: Log teacher activity
      try {
        const teacherUsername = localStorage.getItem("username");

        // Get teacher ID from users table
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("id")
          .eq("username", teacherUsername)
          .single();

        if (teacherError || !teacherData)
          throw teacherError || new Error("Teacher not found");

        // Insert into user_activity table
        const { error: activityError } = await supabase.from("user_activity").insert([
          {
            user_id: teacherData.id,
            user_action: `Uploaded new work "${activityTitle}" for student "${student.last_name}, ${student.first_name}"`,
          },
        ]);

        if (activityError) throw activityError;
        console.log("✅ Teacher activity logged successfully");
      } catch (logError) {
        console.error("Failed to log teacher activity:", logError.message);
      }

      alert("✅ File processed and uploaded successfully!");
      setFile(null);
      setActivityTitle("");
      onUploadComplete();
      onClose();
    } catch (err) {
      console.error("Error uploading file:", err.message);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>
          Upload Braille Work for <br /> {`${student.first_name} ${student.last_name}`}
        </h3>

        <label className="label">
          <p>Activity Title:</p>
          <input
            type="text"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            placeholder="Enter activity title"
          />
        </label>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <div className="modal-buttons">
          <button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? "Processing..." : "Upload & Process"}
          </button>
          <button onClick={onClose} disabled={uploading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
