// src/pages/Teacher/SubjectFiles.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import useTeacherSession from "../useTeacherSession";
import "./subjectManagement.css";

export default function SubjectFiles() {
  const session = useTeacherSession();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    if (session?.id) fetchCategories();
  }, [session, selectedClassId]);

  // 🔹 Function to show popup instead of alert
  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  // Fetch categories for this teacher
  const fetchCategories = async () => {
    if (!session?.id) return;
    let query = supabase
      .from("categories")
      .select("*")
      .eq("teacher_id", session.id)
      .order("created_at", { ascending: false });

    if (selectedClassId) query = query.eq("class_id", selectedClassId);

    const { data, error } = await query;
    if (error) console.error(error);
    else setCategories(data);
  };

  // Fetch materials
  const fetchMaterials = async (categoryId) => {
    setSelectedCategory(categoryId);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setMaterials(data);
  };

  // ✅ Log user activity properly
  const logUserActivity = async (actionDescription) => {
    try {
      const { error } = await supabase.from("user_activity").insert([
        {
          user_id: session.id,
          user_action: actionDescription,
        },
      ]);

      if (error) throw error;
      console.log("✅ User activity logged:", actionDescription);
    } catch (err) {
      console.error("Failed to log user activity:", err);
    }
  };

  // Create new category + record activity
  const handleAddCategory = async () => {
    if (!newCategoryName || !selectedClassId)
      return showPopup("⚠️ Please enter a category name and select a class.");

    const { error } = await supabase.from("categories").insert([
      {
        name: newCategoryName,
        description: newCategoryDesc,
        teacher_id: session.id,
        class_id: selectedClassId,
      },
    ]);

    if (error) {
      console.error(error);
      showPopup(`❌ ${error.message}`);
      return;
    }

    await logUserActivity(`Created category '${newCategoryName}' for class ID ${selectedClassId}`);
    setNewCategoryName("");
    setNewCategoryDesc("");
    setIsModalOpen(false);
    fetchCategories();
    showPopup("✅ Category created successfully!");
  };

  // Upload new material + record activity
  const handleUploadMaterial = async () => {
    if (!file || !selectedCategory)
      return showPopup("⚠️ Select a file and category first.");

    setUploading(true);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ml-server")
        .upload(`materials/${fileName}`, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("ml-server")
        .getPublicUrl(`materials/${fileName}`);

      const fileURL = publicData.publicUrl;

      const { error: insertError } = await supabase.from("materials").insert([
        {
          title: file.name,
          file_path: fileURL,
          uploaded_by: session.id,
          category_id: selectedCategory,
          class_id: selectedClassId,
        },
      ]);

      if (insertError) throw insertError;

      await logUserActivity(`Uploaded material '${file.name}' under category ID ${selectedCategory}`);
      showPopup("✅ Material uploaded successfully!");
      setFile(null);
      fetchMaterials(selectedCategory);
    } catch (err) {
      console.error(err.message);
      showPopup(`❌ Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="subject-container">
      {/* ✅ Popup Modal (fixed top position) */}
      {popupMessage && (
        <div className="popup-message">
          {popupMessage}
        </div>
      )}

      <h2>📚 Subject File Management</h2>
      <div className="inner">
        <div className="class-select">
          <label className="class-name">Classroom: </label>
          <span className="class-name">
            {session.classes?.[0]?.class_name || "No class assigned"}
          </span>

          {useEffect(() => {
            if (session.classes?.[0]?.id && !selectedClassId) {
              setSelectedClassId(session.classes[0].id);
            }
          }, [session, selectedClassId])}

          <button className="open-modal-btn" onClick={() => setIsModalOpen(true)}>
            ➕ Create Category
          </button>
        </div>

        <div className="content-wrapper">
          {/* Category List */}
          <div className="category-list">
            <h3>Your Categories</h3>
            {categories.length === 0 ? (
              <p>No categories yet.</p>
            ) : (
              <ul>
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className={selectedCategory === cat.id ? "active" : ""}
                    onClick={() => fetchMaterials(cat.id)}
                  >
                    <strong>{cat.name}</strong>
                    <p>{cat.description || "No description"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Materials Section */}
          <div className="materials-section">
            {selectedCategory ? (
              <>
                <h3>
                  Materials in{" "}
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h3>

                <div className="upload-material">
                  <label htmlFor="fileInput">
                    {file ? file.name : "Choose File"}
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <button
                    onClick={handleUploadMaterial}
                    disabled={uploading || !file}
                    className="up-btn"
                  >
                    {uploading ? "Uploading..." : "Upload Material"}
                  </button>
                </div>

                {materials.length === 0 ? (
                  <p>No materials yet in this category.</p>
                ) : (
                  <div className="materials-grid">
                    {materials.map((mat) => (
                      <div key={mat.id} className="material-card">
                        <h4>{mat.title}</h4>
                        {mat.file_path.endsWith(".pdf") && (
                          <iframe
                            src={mat.file_path}
                            title={mat.title}
                            width="100%"
                            height="200px"
                          ></iframe>
                        )}
                        <p className="uploaded-date">
                          Uploaded: {new Date(mat.created_at).toLocaleString()}
                        </p>
                        <a
                          href={mat.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View / Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p>Select a category to view materials.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <textarea
              placeholder="Description (optional)"
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
            ></textarea>

            <div className="modal-buttons">
              <button onClick={handleAddCategory}>Save</button>
              <button className="cancel" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
