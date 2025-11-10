import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import AdminNavbar from "../../../components/AdminNavbar";
import useAdminSession from "../useAdminSession";
import "./feedback.css";

export default function Feedbacks() {
  const session = useAdminSession(); // get admin username from hook

  // Feedback popup modal state
  const [popup, setPopup] = useState({
    open: false,
    message: "",
    type: "success", // or "error"
  });

  const showPopup = (message, type = "success") => {
    setPopup({ open: true, message, type });
  };

  const closePopup = () => {
    setPopup({ ...popup, open: false });
  };

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [updatedText, setUpdatedText] = useState("");
  const [updatedAudio, setUpdatedAudio] = useState(null);
  const [updatedScore, setUpdatedScore] = useState("");
  const [updatedOverScore, setUpdatedOverScore] = useState("");

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("given_at", { ascending: false });
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const openEditModal = (feedback) => {
    setSelectedFeedback(feedback);
    setUpdatedText(feedback.feedback_text || "");
    setUpdatedScore(feedback.score || "");
    setUpdatedOverScore(feedback.overscore || "");
    setUpdatedAudio(null);
    setIsEditModalOpen(true);
  };

  // Reusable logUserActivity function
  const logUserActivity = async (actionDescription) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", session.username)
        .maybeSingle(); // safer than .single()

      if (userError || !userData) throw userError || new Error("Admin not found");

      const { error: activityError } = await supabase
        .from("user_activity")
        .insert([
          {
            user_id: userData.id,
            user_action: actionDescription,
          },
        ]);

      if (activityError) throw activityError;
      console.log("✅ User activity logged:", actionDescription);
    } catch (err) {
      console.error("Failed to log user activity:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      let audio_path = selectedFeedback.feedback_audio;

      if (updatedAudio) {
        const fileName = `${Date.now()}_${updatedAudio.name}`;
        const { error: uploadError } = await supabase.storage
          .from("feedback-audio")
          .upload(fileName, updatedAudio, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("feedback-audio")
          .getPublicUrl(fileName);

        audio_path = publicData.publicUrl;
      } else if (!audio_path) {
        audio_path = updatedText;
      }

      const { error } = await supabase
        .from("feedback")
        .update({
          feedback_text: updatedText,
          feedback_audio: audio_path,
          score: updatedScore,
          overscore: updatedOverScore,
        })
        .eq("id", selectedFeedback.id);

      if (error) throw error;

      // Log activity after successful update
      await logUserActivity(`Updated feedback (ID: ${selectedFeedback.id})`);

      showPopup("Feedback updated successfully!", "success");
      setIsEditModalOpen(false);
      fetchFeedbacks();
    } catch (err) {
      console.error("Update error:", err.message);
      showPopup(`Error updating feedback: ${err.message}`, "error");
    }
  };

  return (
    <div className="feedbacks-page">
      <AdminNavbar />
      <div className="feedbacks-content">
        <h2>📝 Feedbacks</h2>

        {loading ? (
          <p>Loading feedbacks...</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedbacks available.</p>
        ) : (
          <table className="feedbacks-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student ID</th>
                <th>Class ID</th>
                <th>Activity ID</th>
                <th>Feedback Text</th>
                <th>Feedback Audio</th>
                <th>Score</th>
                <th>Over Score</th>
                <th>Given At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.student_id_new || f.student_id}</td>
                  <td>{f.class_id}</td>
                  <td>{f.activity}</td>
                  <td>{f.feedback_text || "-"}</td>
                  <td>
                    {f.feedback_audio ? (
                      f.feedback_audio.startsWith("http") ? (
                        <audio controls src={f.feedback_audio}></audio>
                      ) : (
                        <span>{f.feedback_audio}</span>
                      )
                    ) : (
                      f.feedback_text || "-"
                    )}
                  </td>
                  <td>{f.score}</td>
                  <td>{f.overscore}</td>
                  <td>{new Date(f.given_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => openEditModal(f)} className="edit-btn1">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isEditModalOpen && selectedFeedback && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Feedback</h3>
              <div className="modal-body">
                <label>
                  <p>Feedback Text:</p>
                  <textarea
                    value={updatedText}
                    onChange={(e) => setUpdatedText(e.target.value)}
                  ></textarea>
                </label>

                <label>
                  <p>Feedback Audio:</p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setUpdatedAudio(e.target.files[0])}
                  />
                  {selectedFeedback.feedback_audio && !updatedAudio && (
                    <p>Current: {selectedFeedback.feedback_audio}</p>
                  )}
                </label>

                <label>
                  <p>Score:</p>
                  <input
                    type="number"
                    value={updatedScore}
                    onChange={(e) => setUpdatedScore(e.target.value)}
                  />
                </label>

                <label>
                  <p>Over Score:</p>
                  <input
                    type="number"
                    value={updatedOverScore}
                    onChange={(e) => setUpdatedOverScore(e.target.value)}
                  />
                </label>

                <div className="modal-buttons">
                  <button className="save-btn" onClick={handleUpdate}>
                    Save
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {popup.open && (
          <div className="popup-overlay">
            <div className={`popup-content ${popup.type}`}>
              <p>{popup.message}</p>
              <button onClick={closePopup}>OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
