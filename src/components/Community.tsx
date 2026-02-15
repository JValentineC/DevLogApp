import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";

interface SearchUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  bio?: string;
  theme?: string;
  devLogCount: number;
  cycles?: string;
}

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cycleQuery, setCycleQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim() && !cycleQuery.trim()) {
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (cycleQuery.trim()) params.append("cycle", cycleQuery.trim());

      const response = await fetch(`${API_BASE_URL}/users/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search");
      }

      setSearchResults(data.users || []);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const viewProfile = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <h1>Community Directory</h1>
        <p>Discover and connect with fellow developers</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <h2>Find Alumni</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-inputs">
            <div className="form-group">
              <label htmlFor="searchQuery">Search by Name</label>
              <input
                id="searchQuery"
                type="text"
                placeholder="Enter name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="cycleQuery">Search by Cycle</label>
              <input
                id="cycleQuery"
                type="text"
                placeholder="e.g., 50, CHI-50..."
                value={cycleQuery}
                onChange={(e) => setCycleQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary search-btn"
            disabled={searching || (!searchQuery.trim() && !cycleQuery.trim())}
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Search Results */}
        {searching && (
          <div className="search-loading">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        )}

        {!searching && hasSearched && (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="no-results">
                <p>No profiles found matching your search.</p>
              </div>
            ) : (
              <>
                <h3>
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "Profile" : "Profiles"} Found
                </h3>
                <div className="results-grid">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="user-result-card"
                      onClick={() => viewProfile(user.id)}
                    >
                      <img
                        src={
                          user.profilePhoto ||
                          "/DevLogApp/apple-touch-icon (2).png"
                        }
                        alt={`${user.firstName} ${user.lastName}`}
                        className="user-avatar"
                      />
                      <div className="user-info">
                        <h4>
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="username">@{user.username}</p>
                        {user.cycles && (
                          <p className="cycles">
                            <span className="cycle-badge">{user.cycles}</span>
                          </p>
                        )}
                        <p className="log-count">
                          {user.devLogCount}{" "}
                          {user.devLogCount === 1 ? "log" : "logs"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* News & Updates Section */}
      <div className="news-section">
        <h2>Latest News</h2>
        <div className="news-grid">
          <div className="news-card">
            <div className="news-date">December 2025</div>
            <h3>Welcome to DevLogs Community</h3>
            <p>
              We're excited to launch our new community directory! You can now
              search for fellow developers by name or cycle number, and view
              their public profiles.
            </p>
          </div>
          <div className="news-card">
            <div className="news-date">Coming Soon</div>
            <h3>Newsletter Archive</h3>
            <p>
              Stay tuned for our upcoming newsletter archive where you'll be
              able to read past updates and announcements from the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
