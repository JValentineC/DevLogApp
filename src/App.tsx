import { useState, useEffect } from "react";
import EntryLogger from "./components/EntryLogger";
import DevLogList from "./components/DevLogList";
import About from "./components/About";
import Login from "./components/Login";
import Profile from "./components/Profile";
import "./App.css";

interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  profilePhoto?: string;
  bio?: string;
}

function App() {
  const [showLogger, setShowLogger] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<"home" | "logs" | "profile">(
    "home"
  );
  const [user, setUser] = useState<User | null>(null);

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
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
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
            <aside className="sidebar">
              <div className="profile-section">
                <img
                  src={
                    user?.profilePhoto || "/DevLogApp/apple-touch-icon (2).png"
                  }
                  alt={user?.name || user?.username || "Profile"}
                  className="profile-img"
                />
                <h2 className="profile-name">
                  {user?.name || user?.username || "Jonathan Ramirez"}
                </h2>
                <p className="profile-title">Full Stack Developer</p>
              </div>
              <div className="profile-bio">
                <h3>About Me</h3>
                {user?.bio ? (
                  <p>{user.bio}</p>
                ) : user ? (
                  <p>
                    <a
                      href="#profile"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage("profile");
                      }}
                      style={{
                        color: "#dc3545",
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      Add your bio
                    </a>{" "}
                    to tell visitors about yourself.
                  </p>
                ) : (
                  <p>
                    Passionate developer documenting my journey and sharing
                    insights through dev logs. I love building web applications
                    and learning new technologies.
                  </p>
                )}
              </div>
            </aside>

            <main className="main-content">
              <DevLogList key={refreshKey} />
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
        </>
      ) : currentPage === "profile" && user ? (
        <Profile user={user} onProfileUpdate={handleProfileUpdate} />
      ) : (
        <About />
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
