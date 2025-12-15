import { useState } from "react";
import EntryLogger from "./components/EntryLogger";
import DevLogList from "./components/DevLogList";
import About from "./components/About";
import "./App.css";

function App() {
  const [showLogger, setShowLogger] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState<"home" | "logs">("home");

  const handleEntryCreated = () => {
    // Trigger a refresh of the dev log list
    setRefreshKey((prev) => prev + 1);
    setShowLogger(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-top">
            <h1 className="site-title">JVC's Dev Log</h1>
            {currentPage === "logs" && (
              <div className="header-actions">
                <button
                  onClick={() => setShowLogger(!showLogger)}
                  className="btn-new-entry"
                >
                  {showLogger ? "✕ Close" : "+ New Entry"}
                </button>
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
                  src="/tmp_b9d037e2-6fac-4d39-8e83-61581f62b4a5.png"
                  alt="Jonathan Ramirez"
                  className="profile-img"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23343a40' width='200' height='200'/%3E%3Ctext fill='%23fff' font-family='Arial' font-size='60' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EJR%3C/text%3E%3C/svg%3E";
                  }}
                />
                <h2 className="profile-name">Jonathan Ramirez</h2>
                <p className="profile-title">Full Stack Developer</p>
              </div>
              <div className="profile-bio">
                <h3>About Me</h3>
                <p>
                  Passionate developer documenting my journey and sharing
                  insights through dev logs. I love building web applications
                  and learning new technologies.
                </p>
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
      ) : (
        <About />
      )}
    </>
  );
}

export default App;
