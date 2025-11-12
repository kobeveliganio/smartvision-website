// import React, { useState } from "react";
// import { supabase } from "../../../supabaseClient";
// import useTeacherSession from "../useTeacherSession";
// import "./classManagement.css";

// export default function UploadStudentWork({ student, classId, onClose, onUploadComplete }) {
//   const [file, setFile] = useState(null);
//   const [activityTitle, setActivityTitle] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const session = useTeacherSession();

//   if (!session) return null;

//   const handleUpload = async () => {
//     if (!file) return;
//     if (!activityTitle.trim()) return alert("Please enter an activity title.");

//     setUploading(true);
//     try {
//       const fileExt = file.name.split(".").pop();
//       const fileName = `${student.student_id}_${Date.now()}.${fileExt}`;

//       // 1️⃣ Send file to ML API
//       const formData = new FormData();
//       formData.append("file", file);

//       const ML_API_URL = "http://localhost:5000/predict"; // Local ML server
//       const ML_API_KEY = "my-secret-key-123"
//       const response = await fetch(ML_API_URL, {
//         method: "POST",
//           headers: {
//           Authorization: `Bearer ${ML_API_KEY}`
//           },
//           credentials: "include",
//         body: formData,
        
//       });

//       if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`ML API failed: ${response.status} ${text}`);
//       }

//       const result = await response.json();
//       console.log("ML API result:", result);

//       // 2️⃣ Fetch the annotated image saved on server
//       if (!result.annotated_image_path) {
//         throw new Error("ML API did not return annotated image path");
//       }

//       const annotatedResponse = await fetch(`http://localhost:5000/${result.annotated_image_path}`);
//       if (!annotatedResponse.ok) throw new Error("Failed to fetch annotated image from server");

//       const annotatedBlob = await annotatedResponse.blob();

//       // 3️⃣ Upload to Supabase storage
//       const { error: uploadError } = await supabase.storage
//         .from("ml-server")
//         .upload(`uploaded_works/${fileName}`, annotatedBlob, {
//           cacheControl: "3600",
//           upsert: true,
//         });
//       if (uploadError) throw uploadError;

//       // 4️⃣ Get public URL
//       const { data: publicData } = supabase.storage
//         .from("ml-server")
//         .getPublicUrl(`uploaded_works/${fileName}`);
//       const fileURL = publicData.publicUrl;

//       // 5️⃣ Save record in DB
//       const { error: dbError } = await supabase
//         .from("student_work")
//         .insert([
//           {
//             student_id: student.student_id,
//             class_id: classId,
//             activity_output: fileURL,
//             activity_title: activityTitle,
//           },
//         ]);
//       if (dbError) throw dbError;

//       // 6️⃣ Log teacher activity
//       try {
//         const teacherUsername = localStorage.getItem("username");
//         const { data: teacherData, error: teacherError } = await supabase
//           .from("users")
//           .select("id")
//           .eq("username", teacherUsername)
//           .single();

//         if (teacherError || !teacherData) throw teacherError || new Error("Teacher not found");

//         const { error: activityError } = await supabase.from("user_activity").insert([
//           {
//             user_id: teacherData.id,
//             user_action: `Uploaded new work "${activityTitle}" for student "${student.last_name}, ${student.first_name}"`,
//           },
//         ]);
//         if (activityError) throw activityError;
//         console.log("✅ Teacher activity logged successfully");
//       } catch (logError) {
//         console.error("Failed to log teacher activity:", logError.message);
//       }

//       alert("✅ File processed and uploaded successfully!");
//       setFile(null);
//       setActivityTitle("");
//       onUploadComplete();
//       onClose();
//     } catch (err) {
//       console.error("Error uploading file:", err.message);
//       alert(`Upload failed: ${err.message}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="upload-modal-overlay" onClick={onClose}>
//       <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
//         <h3>
//           Upload Braille Work for <br /> {`${student.first_name} ${student.last_name}`}
//         </h3>

//         <label className="label">
//           <p>Activity Title:</p>
//           <input
//             type="text"
//             value={activityTitle}
//             onChange={(e) => setActivityTitle(e.target.value)}
//             placeholder="Enter activity title"
//           />
//         </label>

//         <input type="file" onChange={(e) => setFile(e.target.files[0])} />

//         <div className="modal-buttons">
//           <button onClick={handleUpload} disabled={uploading || !file}>
//             {uploading ? "Processing..." : "Upload & Process"}
//           </button>
//           <button onClick={onClose} disabled={uploading}>
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
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
      console.log("📤 Starting upload for file:", file.name);

      // 1️⃣ Send file to ML API using environment variables
      const formData = new FormData();
      formData.append("file", file);

      const ML_API_URL = "https://braille-ml-api.onrender.com/predict";
      const ML_API_KEY = "my-secret-key-123";

      // ✅ Console log to check API URL
      console.log("🌐 ML API URL:", ML_API_URL);

      if (!ML_API_URL) {
        throw new Error("ML API URL is not defined in .env file!");
      }

      const response = await fetch(ML_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/fort-data",
          Authorization: `Bearer ${ML_API_KEY}`
        },
        body:formData,
      });


      console.log("📡 ML API response status:", response.status);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`ML API failed: ${response.status} ${text}`);
      }

      const result = await response.json();
      console.log("✅ ML API result:", result);

      // 2️⃣ Convert ML API base64 image to Blob
      if (!result.annotated_image_base64) {
        throw new Error("ML API did not return annotated image base64");
      }

      console.log("🔄 Converting base64 image to Blob...");
      const byteCharacters = atob(result.annotated_image_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const annotatedBlob = new Blob([byteArray], { type: "image/jpeg" });
      console.log("🖼️ Annotated Blob created:", annotatedBlob);

      // 3️⃣ Upload annotated image Blob to Supabase storage
      console.log("☁️ Uploading annotated image to Supabase...");
      const { error: uploadError } = await supabase.storage
        .from("ml-server")
        .upload(`uploaded_works/${fileName}`, annotatedBlob, {
          cacheControl: "3600",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      // 4️⃣ Get public URL
      const { data: publicData } = supabase.storage
        .from("ml-server")
        .getPublicUrl(`uploaded_works/${fileName}`);
      const fileURL = publicData.publicUrl;
      console.log("🌐 File uploaded to Supabase, public URL:", fileURL);

      // 5️⃣ Save record in DB
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
      console.log("💾 Student work saved in database.");

      // 6️⃣ Log teacher activity
      try {
        const teacherUsername = localStorage.getItem("username");
        const { data: teacherData, error: teacherError } = await supabase
          .from("users")
          .select("id")
          .eq("username", teacherUsername)
          .single();

        if (teacherError || !teacherData) throw teacherError || new Error("Teacher not found");

        const { error: activityError } = await supabase.from("user_activity").insert([
          {
            user_id: teacherData.id,
            user_action: `Uploaded new work "${activityTitle}" for student "${student.last_name}, ${student.first_name}"`,
          },
        ]);
        if (activityError) throw activityError;

        console.log("📝 Teacher activity logged successfully");
      } catch (logError) {
        console.error("❌ Failed to log teacher activity:", logError.message);
      }

      alert("✅ File processed and uploaded successfully!");
      setFile(null);
      setActivityTitle("");
      onUploadComplete();
      onClose();
    } catch (err) {
      console.error("❌ Error uploading file:", err.message);
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
