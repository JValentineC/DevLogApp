import React, { useState } from "react";
import "./Profile.css";

interface ProfileProps {
  user: {
    id: number;
    username: string;
    email?: string;
    name?: string;
    profilePhoto?: string;
    bio?: string;
    role?: "user" | "admin" | "super_admin";
  };
  onProfileUpdate: (updatedUser: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate password change if attempted
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError("Current password required to change password");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const authToken = localStorage.getItem("authToken");

      const updateData: any = {
        username,
        name,
        bio,
        profilePhoto,
      };

      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      if (data.success && data.user) {
        // Update stored user data
        localStorage.setItem("user", JSON.stringify(data.user));
        onProfileUpdate(data.user);
        setSuccess("Profile updated successfully!");

        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profile Settings</h1>

        <form onSubmit={handleSubmit} className="profile-form">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="profile-section">
            <h2>Profile Photo</h2>
            <div className="photo-preview">
              <img
                src={profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
                alt="Profile"
                className="preview-img"
              />
            </div>
            <div className="form-group">
              <label htmlFor="profilePhoto">Photo URL</label>
              <input
                type="text"
                id="profilePhoto"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="Enter image URL or leave blank for default"
              />
              <small>Enter a URL to your profile photo</small>
            </div>
          </div>

          <div className="profile-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Display Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">About Me</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="profile-section">
            <h2>Change Password</h2>
            <p className="section-description">
              Leave blank if you don't want to change your password
            </p>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
