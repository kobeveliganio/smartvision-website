import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import AdminNavbar from "../../../components/AdminNavbar";
import useAdminSession from "../useAdminSession";
import "./materialsManagement.css";

export default function MaterialsManagement() {
  const session = useAdminSession();
  const adminId = session.id;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedFile, setUpdatedFile] = useState(null);

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    message: "",
    type: "success", // "success" or "error"
  });

  // Show feedback modal
  const showFeedback = (message, type = "success") => {
    setFeedbackModal({
      open: true,
      message,
      type,
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ ...feedbackModal, open: false });
  };

  // Log admin activity
  const logUserActivity = async (actionDescription) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", session.username)
        .single();

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

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);

      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (materialsError) throw materialsError;

      const userIds = [...new Set(materialsData.map((m) => m.uploaded_by))];

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username")
        .in("id", userIds);

      if (usersError) throw usersError;

      const usersMap = {};
      usersData.forEach((u) => {
        usersMap[u.id] = u.username;
      });

      const mappedMaterials = materialsData.map((m) => ({
        ...m,
        uploader_name: usersMap[m.uploaded_by] || "Deleted User",
      }));

      setMaterials(mappedMaterials);
    } catch (err) {
      console.error("Error fetching materials:", err.message);
      showFeedback(`Error fetching materials: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // View material
  const handleView = (material) => {
    if (!material.file_path) return showFeedback("No file available.", "error");

    const fileUrl = material.file_path.toLowerCase();

    if (
      fileUrl.endsWith(".xlsx") ||
      fileUrl.endsWith(".xls") ||
      fileUrl.endsWith(".docx") ||
      fileUrl.endsWith(".doc")
    ) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        material.file_path
      )}&embedded=true`;
      window.open(googleViewerUrl, "_blank");
    } else {
      window.open(material.file_path, "_blank");
    }
  };

  // Open update modal
  const handleUpdateOpen = (material) => {
    setSelectedMaterial(material);
    setUpdatedTitle(material.title);
    setUpdatedFile(null);
    setIsUpdateModalOpen(true);
  };

  // Delete material
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;

      showFeedback("Material deleted successfully!", "success");
      fetchMaterials();

      await logUserActivity(`Deleted material (ID: ${id})`);
    } catch (err) {
      console.error("Delete error:", err.message);
      showFeedback(`Error deleting material: ${err.message}`, "error");
    }
  };

  // Update material
  const handleUpdateSave = async () => {
    try {
      let file_path = selectedMaterial.file_path;

      if (updatedFile) {
        const fileName = `${Date.now()}_${updatedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("ml-server")
          .upload(`materials/${fileName}`, updatedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("ml-server")
          .getPublicUrl(`materials/${fileName}`);

        file_path = publicData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("materials")
        .update({ title: updatedTitle, file_path })
        .eq("id", selectedMaterial.id);

      if (updateError) throw updateError;

      showFeedback("Material updated successfully!", "success");
      setIsUpdateModalOpen(false);
      fetchMaterials();

      await logUserActivity(
        `Updated material "${selectedMaterial.title}" (ID: ${selectedMaterial.id})`
      );
    } catch (err) {
      console.error("Update error:", err.message);
      showFeedback(`Error updating material: ${err.message}`, "error");
    }
  };

  return (
    <div className="materials-management">
      <AdminNavbar />
      <div className="materials-container">
        <h2>📚 Materials Management</h2>

        {loading ? (
          <p>Loading materials...</p>
        ) : materials.length === 0 ? (
          <p>No materials uploaded yet.</p>
        ) : (
          <table className="materials-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Class ID</th>
                <th>Category ID</th>
                <th>Uploaded By</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.title}</td>
                  <td>{material.class_id || "N/A"}</td>
                  <td>{material.category_id || "N/A"}</td>
                  <td>{material.uploader_name}</td>
                  <td>{new Date(material.created_at).toLocaleString()}</td>
                  <td>
                    <button className="view-btn" onClick={() => handleView(material)}>
                      View
                    </button>
                    <button
                      className="update-btn"
                      onClick={() => handleUpdateOpen(material)}
                    >
                      Update
                    </button>
                    <button
                      className="download-btn"
                      onClick={async () => {
                        if (!material.file_path)
                          return showFeedback("No file available.", "error");
                        try {
                          const response = await fetch(material.file_path);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = material.title;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error("Download failed:", err);
                          showFeedback("Failed to download file.", "error");
                        }
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(material.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>

        {/* View Modal */}
        {isViewModalOpen && selectedMaterial && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-header2">
                  <h3>{selectedMaterial.title}</h3>
                  <button
                    className="close-modal-btn"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <p>
                  <strong>File:</strong>{" "}
                  <a
                    href={selectedMaterial.file_path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View File
                  </a>
                </p>
                <p>
                  <strong>Class ID:</strong> {selectedMaterial.class_id || "N/A"}
                </p>
                <p>
                  <strong>Category ID:</strong>{" "}
                  {selectedMaterial.category_id || "N/A"}
                </p>
                <p>
                  <strong>Uploaded By:</strong> {selectedMaterial.uploader_name}
                </p>
                <p>
                  <strong>Uploaded At:</strong>{" "}
                  {new Date(selectedMaterial.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {isUpdateModalOpen && selectedMaterial && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Update Teacher Material</h3>
              </div>
              <div className="modal-body">
                <label>
                  <p>Title:</p>
                  <input
                    type="text"
                    value={updatedTitle}
                    onChange={(e) => setUpdatedTitle(e.target.value)}
                  />
                </label>
                <label>
                  <p>File:</p>
                  <input
                    type="file"
                    onChange={(e) => setUpdatedFile(e.target.files[0])}
                  />
                </label>
                <div className="btn-con">
                  <button className="save-btn" onClick={handleUpdateSave}>
                    Save Changes
                  </button>
                  <button
                    className="close-modal-btn2"
                    onClick={() => setIsUpdateModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
