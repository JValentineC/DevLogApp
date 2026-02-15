import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DevLogList from "./DevLogList";
import "./PublicProfile.css";

interface PublicUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  bio?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  theme?: string;
  devLogCount: number;
  createdAt: string;
}

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!userId) return;

      setLoading(true);
      setError("");

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const response = await fetch(`${API_BASE_URL}/users/${userId}/public`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setUser(data.user);

        // Apply user's theme to the page
        if (data.user.theme) {
          document.documentElement.setAttribute("data-theme", data.user.theme);
        }
      } catch (err: any) {
        console.error("Error fetching public profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();

    // Cleanup: reset theme when component unmounts
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="public-profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="public-profile-error">
        <h2>Profile Not Found</h2>
        <p>{error || "This profile is private or does not exist."}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="public-profile">
      <button onClick={() => navigate(-1)} className="btn btn-ghost mb-4">
        ← Back
      </button>

      <div className="public-profile-container">
        {/* Sidebar with user info */}
        <aside className="public-profile-sidebar">
          <div className="profile-section">
            <img
              src={user.profilePhoto || "/DevLogApp/apple-touch-icon (2).png"}
              alt={`${user.firstName} ${user.lastName}`}
              className="profile-img"
            />
            <h1 className="profile-name">
              {user.firstName} {user.lastName}
            </h1>
            <p className="profile-username">@{user.username}</p>

            {user.bio && (
              <div className="profile-bio">
                <h3>About</h3>
                <p>{user.bio}</p>
              </div>
            )}

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{user.devLogCount}</span>
                <span className="stat-label">
                  {user.devLogCount === 1 ? "Log" : "Logs"}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-value">Member</span>
                <span className="stat-label">since {memberSince}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="profile-links">
              {user.linkedInUrl && (
                <a
                  href={user.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}
              {user.portfolioUrl && (
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="Portfolio"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Main content with dev logs */}
        <main className="public-profile-main">
          <h2 className="logs-title">Dev Logs</h2>
          <DevLogList userId={parseInt(userId!)} username={user.username} />
        </main>
      </div>
    </div>
  );
};

export default PublicProfile;
