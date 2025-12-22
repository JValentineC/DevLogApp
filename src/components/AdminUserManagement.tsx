import React, { useState, useEffect } from "react";
import { userApi, type User, ApiError } from "../lib/api";
import "./AdminUserManagement.css";

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user" as "user" | "admin" | "super_admin",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    userId: number;
    username: string;
    tempPassword?: string;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers } = await userApi.getAll();
      setUsers(fetchedUsers);
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load users. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      await userApi.create(formData);
      setFormSuccess("User created successfully!");
      setFormData({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "user",
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create user"
      );
    }
  };

  const handleRoleChange = async (
    userId: number,
    newRole: "user" | "admin" | "super_admin"
  ) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    ) {
      return;
    }

    try {
      await userApi.updateRole(userId, newRole);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Error updating role:", err);
      alert(err instanceof ApiError ? err.message : "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${username}"? This action cannot be undone and will delete all their dev logs.`
      )
    ) {
      return;
    }

    try {
      await userApi.delete(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err instanceof ApiError ? err.message : "Failed to delete user");
    }
  };

  const handleResetPassword = async (userId: number, username: string) => {
    if (
      !confirm(
        `Are you sure you want to reset password for "${username}"? This will:\n- Generate a temporary password\n- Remove 2FA authentication\n\nThe temporary password will be displayed once.`
      )
    ) {
      return;
    }

    try {
      const { tempPassword } = await userApi.resetPassword(userId);
      setResetPasswordModal({ userId, username, tempPassword });
      // Update user state to reflect 2FA removed
      fetchUsers();
    } catch (err) {
      console.error("Error resetting password:", err);
      alert(
        err instanceof ApiError ? err.message : "Failed to reset password"
      );
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "super_admin":
        return "role-badge--super-admin";
      case "admin":
        return "role-badge--admin";
      default:
        return "role-badge--user";
    }
  };

  if (loading) {
    return (
      <div className="admin-user-management">
        <div className="admin-user-management__loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-user-management">
      <div className="admin-user-management__header">
        <h2>User Management</h2>
        <button
          className="btn btn--create-user"
          onClick={() => setShowCreateForm(!showCreateForm)}
          title={showCreateForm ? "Cancel" : "Create New User"}
        >
          {showCreateForm ? "✕" : "+"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {formSuccess && <div className="success-message">{formSuccess}</div>}

      {showCreateForm && (
        <div className="create-user-form">
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "user" | "admin" | "super_admin",
                    })
                  }
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            {formError && <div className="error-message">{formError}</div>}

            <div className="form-actions">
              <button type="submit" className="btn btn--primary">
                Create User
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    className={`role-badge ${getRoleBadgeClass(user.role)}`}
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(
                        user.id,
                        e.target.value as "user" | "admin" | "super_admin"
                      )
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  {currentUser?.role === "super_admin" && (
                    <button
                      className="btn btn--warning btn--small"
                      onClick={() =>
                        handleResetPassword(user.id, user.username)
                      }
                      style={{ marginRight: "0.5rem" }}
                    >
                      Reset Password
                    </button>
                  )}
                  <button
                    className="btn btn--danger btn--small"
                    onClick={() => handleDeleteUser(user.id, user.username)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <div className="no-users">No users found</div>}
      </div>

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="modal-overlay" onClick={() => setResetPasswordModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Password Reset Complete</h3>
            <p>
              Password has been reset for user: <strong>{resetPasswordModal.username}</strong>
            </p>
            <p>2FA authentication has been removed.</p>
            <div style={{
              background: "#fffbeb",
              border: "2px solid #fbbf24",
              borderRadius: "8px",
              padding: "1rem",
              margin: "1rem 0"
            }}>
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>
                ⚠️ Temporary Password (copy now):
              </p>
              <code style={{
                display: "block",
                background: "white",
                padding: "0.75rem",
                borderRadius: "4px",
                fontSize: "1.2rem",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
                textAlign: "center"
              }}>
                {resetPasswordModal.tempPassword}
              </code>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              This password will not be shown again. The user should change it after logging in.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => setResetPasswordModal(null)}
              style={{ width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
