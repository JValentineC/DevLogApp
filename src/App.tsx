import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import VSCodeMenuBar from "./components/VSCodeMenuBar";
import ErrorBoundary from "./components/ErrorBoundary";
import { type DevLogEntry } from "./lib/api";

// Lazy load route components for better code-splitting
const EntryLogger = lazy(() => import("./components/EntryLogger"));
const EditLogger = lazy(() => import("./components/EditLogger"));
const DevLogList = lazy(() => import("./components/DevLogList"));
const About = lazy(() => import("./components/About"));
const Login = lazy(() => import("./components/Login"));
const Landing = lazy(() => import("./components/Landing"));
const Profile = lazy(() => import("./components/Profile"));
const UserList = lazy(() => import("./components/UserList"));
const AdminUserManagement = lazy(
  () => import("./components/AdminUserManagement")
);
const Engagement = lazy(() => import("./components/Engagement"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const DeveloperDashboard = lazy(
  () => import("./components/DeveloperDashboard")
);

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
    "home" | "logs" | "profile" | "admin" | "engagement" | "developer"
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

  // Show landing page if not logged in
  if (!user) {
    return (
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={<Landing onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* VSCode-style menu bar at the top */}
      <VSCodeMenuBar
        user={user}
        onNavigate={(page) => setCurrentPage(page as any)}
        onLogout={handleLogout}
        onLogin={() => setShowLogin(true)}
      />
      <div className="drawer lg:drawer-open">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />

        {/* Main content area (no old navbar) */}
        <div className="drawer-content flex flex-col">
          {/* Page content */}
          <div className="flex-1 p-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              }
            >
              {currentPage === "logs" ? (
                <>
                  {user || selectedUserId ? (
                    <>
                      {selectedUserId && !user && (
                        <button
                          onClick={handleBackToUserList}
                          className="btn btn-secondary mb-4"
                        >
                          ← Back to Users
                        </button>
                      )}
                      <DevLogList
                        key={refreshKey}
                        userId={selectedUserId || user?.id}
                        username={
                          selectedUsername || user?.name || user?.username
                        }
                        user={user}
                        onEdit={handleEdit}
                        onRefresh={() => setRefreshKey((prev) => prev + 1)}
                      />
                    </>
                  ) : (
                    <UserList onUserSelect={handleUserSelect} />
                  )}
                </>
              ) : currentPage === "profile" && user ? (
                <Profile user={user} onProfileUpdate={handleProfileUpdate} />
              ) : currentPage === "developer" &&
                user &&
                user.role === "super_admin" ? (
                <DeveloperDashboard />
              ) : currentPage === "admin" &&
                user &&
                user.role === "super_admin" ? (
                <AdminUserManagement />
              ) : currentPage === "engagement" &&
                user &&
                (user.role === "admin" || user.role === "super_admin") ? (
                <Engagement />
              ) : (
                <About
                  user={user}
                  onNavigateToProfile={() => setCurrentPage("profile")}
                />
              )}
            </Suspense>
          </div>
        </div>

        {/* Sidebar */}
        <div className="drawer-side is-drawer-close:overflow-visible z-10">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
            <ul className="menu w-full grow">
              {/* Home */}
              <li>
                <a
                  onClick={() => setCurrentPage("home")}
                  className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                    currentPage === "home" ? "active" : ""
                  }`}
                  data-tip="Home"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                  <span className="is-drawer-close:hidden">Home</span>
                </a>
              </li>

              {/* Developer Logs */}
              <li>
                <a
                  onClick={() => setCurrentPage("logs")}
                  className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                    currentPage === "logs" ? "active" : ""
                  }`}
                  data-tip="Developer Logs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                  </svg>
                  <span className="is-drawer-close:hidden">Developer Logs</span>
                </a>
              </li>

              {/* Profile */}
              {user && (
                <li>
                  <a
                    onClick={() => setCurrentPage("profile")}
                    className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                      currentPage === "profile" ? "active" : ""
                    }`}
                    data-tip="Profile"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path>
                      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
                    </svg>
                    <span className="is-drawer-close:hidden">Profile</span>
                  </a>
                </li>
              )}

              {/* Admin */}
              {user && user.role === "super_admin" && (
                <li>
                  <a
                    onClick={() => setCurrentPage("admin")}
                    className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                      currentPage === "admin" ? "active" : ""
                    }`}
                    data-tip="Admin"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span className="is-drawer-close:hidden">Admin</span>
                  </a>
                </li>
              )}

              {/* Engagement */}
              {user &&
                (user.role === "admin" || user.role === "super_admin") && (
                  <li>
                    <a
                      onClick={() => setCurrentPage("engagement")}
                      className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                        currentPage === "engagement" ? "active" : ""
                      }`}
                      data-tip="Engagement"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="2"
                        fill="none"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path d="M3 3v18h18"></path>
                        <path d="M20 18v3"></path>
                        <path d="M16 16v5"></path>
                        <path d="M12 13v8"></path>
                        <path d="M8 16v5"></path>
                        <path d="M3 11c6 0 5-10 10-10s4 10 10 10"></path>
                      </svg>
                      <span className="is-drawer-close:hidden">Engagement</span>
                    </a>
                  </li>
                )}

              {/* Developer Dashboard - Super Admin Only */}
              {user && user.role === "super_admin" && (
                <li>
                  <a
                    onClick={() => setCurrentPage("developer")}
                    className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${
                      currentPage === "developer" ? "active" : ""
                    }`}
                    data-tip="Developer Dashboard"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                      className="size-5"
                    >
                      <path d="M16 18l2-2-2-2"></path>
                      <path d="M8 6l-2 2 2 2"></path>
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                    </svg>
                    <span className="is-drawer-close:hidden">Developer</span>
                  </a>
                </li>
              )}

              {/* Divider */}
              <li className="mt-auto"></li>

              {/* Resume (External link) */}
              <li>
                <a
                  href="https://www.jvcswebdesigns.xyz/about.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                  data-tip="Resume"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    fill="none"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path d="M11 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-5"></path>
                    <path d="M10 14L20 4"></path>
                    <path d="M15 4h5v5"></path>
                  </svg>
                  <span className="is-drawer-close:hidden">Resume →</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* EntryLogger Modal */}
      {showLogger && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <form method="dialog">
              <button
                onClick={() => setShowLogger(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-4">New Entry</h3>
            <Suspense
              fallback={
                <span className="loading loading-spinner loading-lg"></span>
              }
            >
              <EntryLogger
                onSubmit={() => {
                  handleEntryCreated();
                }}
              />
            </Suspense>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowLogger(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* EditLogger Modal */}
      {editingEntry && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <form method="dialog">
              <button
                onClick={() => setEditingEntry(null)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                ✕
              </button>
            </form>
            <h3 className="font-bold text-lg mb-4">Edit Entry</h3>
            <Suspense
              fallback={
                <span className="loading loading-spinner loading-lg"></span>
              }
            >
              <EditLogger
                entry={editingEntry}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingEntry(null)}
              />
            </Suspense>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setEditingEntry(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Login Modal */}
      {showLogin && (
        <Suspense
          fallback={
            <span className="loading loading-spinner loading-lg"></span>
          }
        >
          <Login
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setShowLogin(false)}
          />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}

export default App;
