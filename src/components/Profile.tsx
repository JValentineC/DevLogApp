import React, { useState, useEffect } from "react";
import { devLogApi } from "../lib/api";
import TwoFactorSetup from "./TwoFactorSetup";
import BackupCodes from "./BackupCodes";
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
  // Edit/view toggle
  const [isEditing, setIsEditing] = useState(false);
  // Editable fields
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || "");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Dashboard stats
  const [postCount, setPostCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [lastPostDate, setLastPostDate] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorQR, setTwoFactorQR] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Fetch user stats (post count, streak)
  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const { entries } = await devLogApi.getAll({ userId: user.id });
        if (!isMounted) return;
        setPostCount(entries.length);
        // Calculate streak (consecutive days with posts)
        const dates = Array.from(
          new Set(entries.map((e) => e.createdAt?.slice(0, 10)))
        )
          .filter(Boolean)
          .sort()
          .reverse();
        let streakCount = 0;
        let current = new Date();
        for (const date of dates) {
          const d = new Date(date!);
          if (d.toDateString() === current.toDateString()) {
            streakCount++;
            current.setDate(current.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(streakCount);
        setLastPostDate(dates[0] || null);
      } catch {
        setPostCount(0);
        setStreak(0);
        setLastPostDate(null);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [user.id]);

  // Fetch social links from Person table
  useEffect(() => {
    async function fetchSocialLinks() {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const authToken = localStorage.getItem("authToken");

        const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setLinkedInUrl(data.user.linkedInUrl || "");
            setPortfolioUrl(data.user.portfolioUrl || "");
            setGithubUrl(data.user.githubUrl || "");
          }
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    }
    fetchSocialLinks();
  }, [user.id]);

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
        linkedInUrl,
        portfolioUrl,
        githubUrl,
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

  // Handle photo upload to Cloudinary
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setIsUploadingPhoto(true);
    setError("");

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const authToken = localStorage.getItem("authToken");

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(
        `${API_BASE_URL}/users/${user.id}/profile-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      if (data.success && data.photoUrl) {
        setProfilePhoto(data.photoUrl);
        setSuccess("Profile photo updated successfully!");

        // Update stored user data
        const updatedUser = { ...user, profilePhoto: data.photoUrl };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        onProfileUpdate(updatedUser);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile summary card */}
        <div className="profile-summary-card">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              {isEditing ? (
                <div className="avatar-upload-container">
                  <img
                    src={profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
                    alt="Profile"
                    className="profile-avatar"
                  />
                  <input
                    type="file"
                    id="photoFileInput"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                    disabled={isUploadingPhoto}
                  />
                  <button
                    type="button"
                    className="avatar-edit-button"
                    onClick={() =>
                      document.getElementById("photoFileInput")?.click()
                    }
                    disabled={isUploadingPhoto}
                    title="Change profile photo"
                  >
                    {isUploadingPhoto ? (
                      <span className="spinner-small">⟳</span>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <img
                  src={profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
                  alt="Profile"
                  className="profile-avatar"
                />
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{name || user.username}</h2>
              <p className="profile-username">@{user.username}</p>
              {user.role && <span className="role-badge">{user.role}</span>}

              {/* Social Links */}
              {(linkedInUrl || portfolioUrl || githubUrl) && (
                <div className="social-links">
                  {linkedInUrl && (
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="LinkedIn"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {portfolioUrl && (
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="Portfolio"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title="GitHub"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {bio && (
            <div className="profile-bio-section">
              <p className="profile-bio">{bio}</p>
            </div>
          )}

          <div className="profile-actions">
            <button
              className={`btn ${isEditing ? "btn-secondary" : "btn-primary"}`}
              onClick={() => setIsEditing((v) => !v)}
            >
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Dashboard stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">
                {statsLoading ? "..." : postCount}
              </div>
              <div className="stat-label">Total Posts</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{statsLoading ? "..." : streak}</div>
              <div className="stat-label">Day Streak</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value stat-value-date">
                {statsLoading
                  ? "..."
                  : lastPostDate
                  ? new Date(lastPostDate).toLocaleDateString()
                  : "—"}
              </div>
              <div className="stat-label">Last Activity</div>
            </div>
          </div>
        </div>

        {/* Edit form (only when editing) */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="profile-form">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-card">
              <div className="form-card-header">
                <h3 className="form-card-title">Basic Information</h3>
                <p className="form-card-description">
                  Update your personal details
                </p>
              </div>

              <div className="form-card-body">
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
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-header">
                <h3 className="form-card-title">Professional Links</h3>
                <p className="form-card-description">
                  Add your professional profiles
                </p>
              </div>

              <div className="form-card-body">
                <div className="form-group">
                  <label htmlFor="linkedInUrl">LinkedIn Profile</label>
                  <input
                    type="url"
                    id="linkedInUrl"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="portfolioUrl">Portfolio Website</label>
                  <input
                    type="url"
                    id="portfolioUrl"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="githubUrl">GitHub Profile</label>
                  <input
                    type="url"
                    id="githubUrl"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="form-card-header">
                <h3 className="form-card-title">Security</h3>
                <p className="form-card-description">
                  Manage password and two-factor authentication
                </p>
              </div>

              <div className="form-card-body">
                <div className="form-group">
                  <label>Two-Factor Authentication</label>
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {twoFactorEnabled ? (
                      <>
                        <span
                          style={{
                            color: "#2f855a",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span style={{ fontSize: "1.25rem" }}>✓</span> Enabled
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowBackupCodes(true)}
                        >
                          View Backup Codes
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            if (
                              confirm("Are you sure you want to disable 2FA?")
                            ) {
                              // TODO: Add disable 2FA backend call
                              setTwoFactorEnabled(false);
                            }
                          }}
                        >
                          Disable 2FA
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#718096" }}>Not enabled</span>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={async () => {
                            try {
                              setError("");
                              const token = localStorage.getItem("authToken");

                              if (!token) {
                                setError("Please log in to enable 2FA");
                                return;
                              }

                              const response = await fetch(
                                `${
                                  import.meta.env.VITE_API_URL ||
                                  "http://localhost:3001/api"
                                }/auth/setup-2fa`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              const data = await response.json();

                              if (data.success) {
                                setTwoFactorQR(data.qrCode);
                                setTwoFactorSecret(data.secret);
                                setShowTwoFactorSetup(true);
                              } else {
                                setError(data.error || "Failed to setup 2FA");
                              }
                            } catch (err) {
                              console.error("2FA setup error:", err);
                              setError(
                                "Failed to setup 2FA. Please try again."
                              );
                            }
                          }}
                        >
                          Enable 2FA
                        </button>
                      </>
                    )}
                  </div>
                  <small>Add an extra layer of security to your account</small>
                </div>

                <div
                  style={{ borderTop: "1px solid #e2e8f0", margin: "1.5rem 0" }}
                ></div>

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter current password"
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
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* 2FA Setup Modal */}
        {showTwoFactorSetup && (
          <div
            className="modal-overlay"
            onClick={() => setShowTwoFactorSetup(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <TwoFactorSetup
                qrCode={twoFactorQR}
                manualKey={twoFactorSecret}
                onVerify={async (token) => {
                  // TODO: Add backend verification
                  console.log("Verifying token:", token);
                  // Mock success
                  setTwoFactorEnabled(true);
                  setBackupCodes([
                    "ABCD-1234-EFGH-5678",
                    "IJKL-9012-MNOP-3456",
                    "QRST-7890-UVWX-1234",
                    "YZAB-5678-CDEF-9012",
                    "GHIJ-3456-KLMN-7890",
                  ]);
                  setShowTwoFactorSetup(false);
                  setShowBackupCodes(true);
                  setSuccess("Two-factor authentication enabled successfully!");
                }}
                onCancel={() => setShowTwoFactorSetup(false)}
              />
            </div>
          </div>
        )}

        {/* Backup Codes Modal */}
        {showBackupCodes && (
          <div
            className="modal-overlay"
            onClick={() => setShowBackupCodes(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <BackupCodes
                codes={backupCodes}
                onClose={() => setShowBackupCodes(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
