import React, { useState, useEffect } from "react";
import AdminNavbar from "../../../components/AdminNavbar";
import "./accountManagement.css";
import { supabase } from "../../../supabaseClient";
import useAdminSession from "../useAdminSession";

export default function Users() {
  const { username } = useAdminSession();
  const [users, setUsers] = useState([]);
  const [tableLoaded, setTableLoaded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalAnimation, setModalAnimation] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", role: "teacher" });

  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    user: null,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .in("role", ["teacher", "admin"]);

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
        setTimeout(() => setTableLoaded(true), 50);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Log admin activity
  const logUserActivity = async (actionDescription) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        console.error("Error fetching admin ID:", userError?.message);
        return;
      }

      const adminId = userData.id;

      const { error: activityError } = await supabase.from("user_activity").insert([
        {
          user_id: adminId,
          user_action: actionDescription,
        },
      ]);

      if (activityError) console.error("Error logging activity:", activityError.message);
      else console.log(`✅ Activity logged: ${actionDescription}`);
    } catch (err) {
      console.error("Unexpected error logging activity:", err);
    }
  };

  // ✅ Open / Close modals
  const openModal = (user) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
    setTimeout(() => setModalAnimation(true), 50);
  };
  const closeModal = () => {
    setModalAnimation(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setEditingUser(null);
    }, 300);
  };
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setTimeout(() => setModalAnimation(true), 50);
  };
  const closeAddModal = () => {
    setModalAnimation(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setNewUser({ username: "", email: "", role: "teacher" });
    }, 300);
  };
  const openDeleteModal = (user) => setDeleteModal({ open: true, user });
  const closeDeleteModal = () => setDeleteModal({ open: false, user: null });
  const closeFeedbackModal = () => setFeedbackModal({ ...feedbackModal, open: false });

  // ✅ Save / Update User
  const saveUser = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role,
        })
        .eq("id", editingUser.id);

      if (error) {
        setFeedbackModal({
          open: true,
          message: "Failed to update user. Please try again.",
          type: "error",
        });
      } else {
        const updatedUsers = users.map((u) =>
          u.id === editingUser.id ? editingUser : u
        );
        setUsers(updatedUsers);
        closeModal();
        setFeedbackModal({
          open: true,
          message: "User updated successfully!",
          type: "success",
        });
        await logUserActivity(`Updated user: ${editingUser.username}`);
      }
    } catch {
      setFeedbackModal({
        open: true,
        message: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  // ✅ Add New User
  const addUser = async () => {
    if (!newUser.username || !newUser.email) {
      setFeedbackModal({
        open: true,
        message: "Please fill in all fields.",
        type: "error",
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          { username: newUser.username, email: newUser.email, role: newUser.role, password: "default123" },
        ])
        .select();

      if (error) {
        setFeedbackModal({
          open: true,
          message: "Failed to add user. Please try again.",
          type: "error",
        });
      } else {
        setUsers([...users, ...data]);
        closeAddModal();
        setFeedbackModal({
          open: true,
          message: "New user added successfully!",
          type: "success",
        });
        await logUserActivity(`Added new user: ${newUser.username}`);
      }
    } catch {
      setFeedbackModal({
        open: true,
        message: "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  // ✅ Delete User
  const confirmDeleteUser = async () => {
    const userToDelete = deleteModal.user;
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);

      if (error) {
        setFeedbackModal({
          open: true,
          message: "Failed to delete user.",
          type: "error",
        });
      } else {
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setFeedbackModal({
          open: true,
          message: "User deleted successfully!",
          type: "success",
        });
        await logUserActivity(`Deleted user: ${userToDelete.username}`);
      }
    } catch {
      setFeedbackModal({
        open: true,
        message: "Unexpected error occurred.",
        type: "error",
      });
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="contentArea">
        <h2>Users Management</h2>

        <table className={`users-table ${tableLoaded ? "show" : ""}`}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th className="options">Option</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td className="options">
                    <button
                      className="editButton"
                      onClick={() => openModal(user)}
                    >
                      Update
                    </button>
                    <button
                      className="deleteButton"
                      onClick={() => openDeleteModal(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <br />
        <button className="import" onClick={openAddModal}>
          Add New User
        </button>
      </div>

      {/* ✅ Add User Modal */}
      {isAddModalOpen && (
        <div className={`edit-modal-overlay ${modalAnimation ? "show" : ""}`}>
          <div className="edit-modal-content">
            <h3>Add New User</h3>
            <label>
              Name:
              <input
                type="text"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </label>
            <label>
              Role:
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="modal-buttons">
              <button className="save-btn" onClick={addUser}>
                Add User
              </button>
              <button className="cancel-btn" onClick={closeAddModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Modal */}
      {isModalOpen && (
        <div className={`edit-modal-overlay ${modalAnimation ? "show" : ""}`}>
          <div className="edit-modal-content">
            <h3>Update User Information</h3>
            <p>Update Users's Name, Role, and Email address</p>
            <label>
              Name:
              <input
                type="text"
                value={editingUser.username || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, username: e.target.value })
                }
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={editingUser.email || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
              />
            </label>
            <label>
              Role:
              <select
                value={editingUser.role || "teacher"}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="modal-buttons">
              <button className="save-btn-users" onClick={saveUser}>
                Save
              </button>
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="edit-modal-overlay show">
          <div className="edit-modal-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteModal.user?.username}</strong>?
            </p>
            <div className="modal-buttons">
              <button className="deleteButton" onClick={confirmDeleteUser}>
                Yes, Delete
              </button>
              <button className="cancel-btn" onClick={closeDeleteModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Feedback Modal */}
      {feedbackModal.open && (
        <div className="feedback-modal-overlay show">
          <div
            className={`feedback-modal-content ${
              feedbackModal.type === "error" ? "error" : "success"
            }`}
          >
            <p>{feedbackModal.message}</p>
            <button onClick={closeFeedbackModal} className="feedback-modal-btn">OK</button>
          </div>
        </div>
      )}
    </>
  );
}
