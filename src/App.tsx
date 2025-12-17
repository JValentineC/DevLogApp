import { useState, useEffect } from "react";
import EntryLogger from "./components/EntryLogger";
import EditLogger from "./components/EditLogger";
import DevLogList from "./components/DevLogList";
import About from "./components/About";
import Login from "./components/Login";
import Profile from "./components/Profile";
import UserList from "./components/UserList";
import AdminUserManagement from "./components/AdminUserManagement";
import { type DevLogEntry } from "./lib/api";
import "./App.css";

interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  profilePhoto?: string;
  bio?: string;
  role?: "user" | "admin" | "super_admin";
}

function App() {
  const [showLogger, setShowLogger] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<
    "home" | "logs" | "profile" | "admin"
  >("home");
  const [user, setUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<DevLogEntry | null>(null);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const authToken = localStorage.getItem("authToken");
    if (storedUser && authToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    }
  }, []);

  const handleEntryCreated = () => {
    // Trigger a refresh of the dev log list
    setRefreshKey((prev) => prev + 1);
    setShowLogger(false);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setShowLogger(false);
    setCurrentPage("home");
    setSelectedUserId(null);
    setSelectedUsername(null);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleUserSelect = (userId: number, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
  };

  const handleBackToUserList = () => {
    setSelectedUserId(null);
    setSelectedUsername(null);
  };

  const handleEdit = (entry: DevLogEntry) => {
    setEditingEntry(entry);
  };

  const handleEditSuccess = () => {
    setEditingEntry(null);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-top">
            <h1 className="site-title">JVC's Dev Log</h1>
            {currentPage === "logs" && (
              <div className="header-actions">
                {user ? (
                  <>
                    <span className="user-greeting">Hi, {user.username}</span>
                    <button
                      onClick={() => setShowLogger(!showLogger)}
                      className="btn-new-entry"
                    >
                      {showLogger ? "✕ Close" : "+ New Entry"}
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowLogin(true)}
                    className="btn-new-entry"
                  >
                    Login
                  </button>
                )}
              </div>
            )}
          </div>
          <nav className="main-nav">
            <ul>
              <li>
                <a
                  href="#home"
                  className={currentPage === "home" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("home");
                  }}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#logs"
                  className={currentPage === "logs" ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("logs");
                  }}
                >
                  Developer Logs
                </a>
              </li>
              {user && (
                <li>
                  <a
                    href="#profile"
                    className={currentPage === "profile" ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage("profile");
                    }}
                  >
                    Profile
                  </a>
                </li>
              )}
              {user && user.role === "super_admin" && (
                <li>
                  <a
                    href="#admin"
                    className={currentPage === "admin" ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage("admin");
                    }}
                  >
                    Admin
                  </a>
                </li>
              )}
              <li>
                <a
                  href="https://www.jvcswebdesigns.xyz/about.html"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Resume →
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {currentPage === "logs" ? (
        <>
          <div className="page-container">
            <main className="main-content-full">
              {user || selectedUserId ? (
                <>
                  {selectedUserId && !user && (
                    <button
                      onClick={handleBackToUserList}
                      className="btn-back"
                      style={{
                        marginBottom: "1rem",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      ← Back to Users
                    </button>
                  )}
                  <DevLogList
                    key={refreshKey}
                    userId={selectedUserId || user?.id}
                    username={selectedUsername || user?.name || user?.username}
                    user={user}
                    onEdit={handleEdit}
                    onRefresh={() => setRefreshKey((prev) => prev + 1)}
                  />
                </>
              ) : (
                <UserList onUserSelect={handleUserSelect} />
              )}
            </main>
          </div>

          {/* EntryLogger Modal/Overlay */}
          {showLogger && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: "800px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflow: "auto",
                }}
              >
                <button
                  onClick={() => setShowLogger(false)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    zIndex: 1001,
                    fontSize: "20px",
                  }}
                >
                  ×
                </button>
                <EntryLogger
                  onSubmit={() => {
                    handleEntryCreated();
                  }}
                />
              </div>
            </div>
          )}

          {/* EditLogger Modal */}
          {editingEntry && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: "800px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflow: "auto",
                }}
              >
                <button
                  onClick={() => setEditingEntry(null)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    zIndex: 1001,
                    fontSize: "20px",
                  }}
                >
                  ×
                </button>
                <EditLogger
                  entry={editingEntry}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setEditingEntry(null)}
                />
              </div>
            </div>
          )}
        </>
      ) : currentPage === "profile" && user ? (
        <Profile user={user} onProfileUpdate={handleProfileUpdate} />
      ) : currentPage === "admin" && user && user.role === "super_admin" ? (
        <AdminUserManagement />
      ) : (
        <About user={user} onNavigateToProfile={() => setCurrentPage("profile")} />
      )}

      {/* Login Modal */}
      {showLogin && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  );
}

export default App;
