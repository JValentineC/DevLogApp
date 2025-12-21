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
              <img
                src={profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
                alt="Profile"
                className="profile-avatar"
              />
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{name || user.username}</h2>
              <p className="profile-username">@{user.username}</p>
              {user.role && <span className="role-badge">{user.role}</span>}
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
                <h3 className="form-card-title">Profile Photo</h3>
                <p className="form-card-description">
                  Update your profile picture
                </p>
              </div>

              <div className="form-card-body">
                <div className="form-group">
                  <label htmlFor="profilePhoto">Photo URL</label>
                  <input
                    type="text"
                    id="profilePhoto"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                  <small>Enter a URL to your profile photo</small>
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
                          onClick={() => {
                            // TODO: Add backend call to generate 2FA secret
                            setTwoFactorQR(
                              "https://via.placeholder.com/200?text=QR+Code"
                            );
                            setTwoFactorSecret("JBSWY3DPEHPK3PXP");
                            setShowTwoFactorSetup(true);
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
