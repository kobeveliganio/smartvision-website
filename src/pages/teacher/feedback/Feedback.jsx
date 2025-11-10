// src/pages/Teacher/Feedback.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import useTeacherSession from "../useTeacherSession";
import "./feedback.css";

export default function Feedback() {
  // Add these at the top with your other useState hooks
const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState("");

// Function to show popup
const showAlertPopup = (message) => {
  setPopupMessage(message);
  setShowPopup(true);
  // Auto-close after 3 seconds
  setTimeout(() => setShowPopup(false), 3000);
};

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingInProgress, setRecordingInProgress] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordInterval, setRecordInterval] = useState(null);

  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [currentOutput, setCurrentOutput] = useState(null);

  const session = useTeacherSession();
  const [studentWorks, setStudentWorks] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackAudio, setFeedbackAudio] = useState(null);
  const [score, setScore] = useState("");
  const [overScore, setOverScore] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Fetch student works & feedbacks
  // -----------------------------
  const fetchStudentWorks = async () => {
    try {
      const { data, error } = await supabase
        .from("student_work")
        .select(`
          activity_id,
          activity_title,
          activity_output,
          class_id,
          student_id,
          created_at,
          students ( first_name, middle_name, last_name )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudentWorks(data || []);
    } catch (err) {
      console.error("Error fetching student works:", err.message);
    }
  };

const fetchFeedbacks = async () => {
  try {
    if (!session?.id) return;

    // Get all classes for this teacher
    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", session.id);

    if (classError) throw classError;

    const classIds = classes.map((c) => c.id);
    if (!classIds.length) return setFeedbacks([]);

    // Fetch feedbacks and include student info
    const { data, error } = await supabase
      .from("feedback")
      .select(`
        *,
        students (
          first_name,
          middle_name,
          last_name
        )
      `)
      .in("class_id", classIds)
      .order("given_at", { ascending: false });

    if (error) throw error;

    setFeedbacks(data || []);
  } catch (err) {
    console.error("Error fetching feedbacks:", err.message);
  }
};


  // Fetch on mount
  useEffect(() => {
    if (!session?.id) return;

    fetchStudentWorks();
    fetchFeedbacks();
  }, [session]);

  // -----------------------------
  // Audio recording
  // -----------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];

      setIsRecording(true);
      setRecordingInProgress(true);
      setRecordTime(0);

      const interval = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
      setRecordInterval(interval);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        clearInterval(interval);
        setRecordInterval(null);

        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);

        setAudioURL(url);
        setFeedbackAudio(audioBlob);
        setRecordingInProgress(false);
        setIsRecording(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      showAlertPopup("Microphone access denied or unavailable.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  // -----------------------------
  // Submit feedback
  // -----------------------------
const handleSubmitFeedback = async () => {
  if (!feedbackText && !feedbackAudio) {
    showAlertPopup("Please provide feedback text or an audio file.");
    return;
  }

  setLoading(true);

  try {
    let audioUrl = null;

    // Upload audio if exists
    if (feedbackAudio) {
      const fileName = `${Date.now()}_feedback.${
        feedbackAudio.name ? feedbackAudio.name.split(".").pop() : "webm"
      }`;
      const { error: uploadError } = await supabase.storage
        .from("ml-server")
        .upload(`feedback_audio/${fileName}`, feedbackAudio, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: audioData } = supabase.storage
        .from("ml-server")
        .getPublicUrl(`feedback_audio/${fileName}`);

      audioUrl = audioData.publicUrl;
    }

    // Insert feedback into database
    const { error: insertError } = await supabase.from("feedback").insert([
      {
        student_id_new: selectedWork.student_id,
        feedback_text: feedbackText,
        feedback_audio: audioUrl || feedbackText,
        given_at: new Date().toISOString(),
        class_id: selectedWork.class_id,
        activity: selectedWork.activity_id,
        score: parseInt(score) || 0,
        overscore: parseInt(overScore) || 0,
      },
    ]);

    if (insertError) throw insertError;

    // ✅ Log teacher activity in user_activity
    const studentName = `${selectedWork.students.last_name}, ${selectedWork.students.first_name} ${selectedWork.students.middle_name || ""}`;
    const { error: activityError } = await supabase.from("user_activity").insert([
      {
        user_id: session.id, // teacher's session id
        user_action: `Added feedback to ${studentName} for activity '${selectedWork.activity_title}' (Score: ${score}/${overScore})`,
        created_at: new Date().toISOString(), // optional timestamp
      },
    ]);

    if (activityError) console.error("Failed to log activity:", activityError);

    showAlertPopup("✅ Feedback submitted successfully!");
    setIsModalOpen(false);
    setFeedbackText("");
    setFeedbackAudio(null);
    setScore("");
    setOverScore("");

    // Refresh feedback table immediately
    fetchFeedbacks();
  } catch (err) {
    console.error("Error submitting feedback:", err.message);
    showAlertPopup(`Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};



  // -----------------------------
  // Render feedback audio
  // -----------------------------
  const renderFeedbackAudio = (audio) => {
    if (!audio) return null;
    if (audio.startsWith("https://") || audio.startsWith("http://")) {
      return <audio controls src={audio}></audio>;
    }
    return <p>{audio}</p>;
  };

  // -----------------------------
  // JSX
  // -----------------------------
  return (
    <div className="feedback-container">
      <h2>📝 Feedback for Students's Work</h2>
      <div className="inner-con">
        {/* Student Works Table */}
        <div className="student-work-list">
          <h2>Students</h2>
          {studentWorks.length === 0 ? (
            <p>No student works found.</p>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Activity Title</th>
                  <th>Output</th>
                  <th>Date Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentWorks.map((work) => (
                  <tr key={work.activity_id}>
                    <td>{`${work.students.last_name}, ${work.students.first_name} ${work.students.middle_name || ""}`}</td>
                    <td>{work.activity_title}</td>
                    <td>
                      <button
                        className="view-output-btn"
                        onClick={() => {
                          setCurrentOutput(work.activity_output);
                          setIsOutputModalOpen(true);
                        }}
                      >
                        View Output
                      </button>
                    </td>
                    <td>{new Date(work.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="give-feedback-btn"
                        onClick={() => {
                          setSelectedWork(work);
                          setIsModalOpen(true);
                        }}
                      >
                        Give Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Feedback Table */}
        <div className="feedback-table">
          <h2>All Feedbacks</h2>
          {feedbacks.length === 0 ? (
            <p>No feedback yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Activity</th>
                  <th>Feedback Text</th>
                  <th>Feedback Audio</th>
                  <th>Score</th>
                  <th>Over Score</th>
                  <th>Given At</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f.id}>
                    <td>{`${f.students.last_name}, ${f.students.first_name} ${f.students.middle_name || ""}`}</td>
                    <td>{f.activity}</td>
                    <td>{f.feedback_text}</td>
                    <td>{renderFeedbackAudio(f.feedback_audio)}</td>
                    <td>{f.score}</td>
                    <td>{f.overscore}</td>
                    <td>{new Date(f.given_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {isModalOpen && selectedWork && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
  Give Feedback for {`${selectedWork.students.last_name}, ${selectedWork.students.first_name} ${selectedWork.students.middle_name || ""}`}
</h3>

              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <textarea
              placeholder="Enter feedback text..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            ></textarea>

            <div className="audio-section">
              <label>Record Audio Feedback:</label>
              <div className="audio-controls">
                {!isRecording ? (
                  <button onClick={startRecording} disabled={recordingInProgress} className="btn-record start">
                    🎙️ Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="btn-record stop">⏹️ Stop Recording</button>
                )}
                <span className="record-timer">{recordTime}s</span>
                {audioURL && <audio controls src={audioURL}></audio>}
              </div>
            </div>

            <div className="upload-audio">
              <label>Or upload audio feedback:</label>
              <input type="file" accept="audio/*" onChange={(e) => setFeedbackAudio(e.target.files[0])} />
            </div>

            <div className="score-inputs">
              <input type="number" placeholder="Score" value={score} onChange={(e) => setScore(e.target.value)} />
              <input type="number" placeholder="Over Score" value={overScore} onChange={(e) => setOverScore(e.target.value)} />
            </div>

            <div className="modal-actions">
              <button onClick={handleSubmitFeedback} disabled={loading} className="sub">
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
              <button onClick={() => setIsModalOpen(false)} className="can">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Output Modal */}
      {isOutputModalOpen && currentOutput && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Student Work Output</h3>
              <button onClick={() => setIsOutputModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={currentOutput} alt="Student Work" className="student-output-image" />
            </div>
          </div>
        </div>
      )}

      {showPopup && (
  <div className="popup-modal">
    <p>{popupMessage}</p>
  </div>
)}

    </div>
  );
}
