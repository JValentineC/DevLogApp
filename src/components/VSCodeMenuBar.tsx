import { useState, useRef, useEffect } from "react";
import "./VSCodeMenuBar.css";

interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  profilePhoto?: string;
  bio?: string;
  role?: "user" | "admin" | "super_admin";
}

type Theme = "light" | "dark";

interface VSCodeMenuBarProps {
  user: User | null;
  onNavigate: (
    page: "home" | "logs" | "profile" | "admin" | "engagement" | "developer"
  ) => void;
  onLogout: () => void;
  onLogin: () => void;
}

const VSCodeMenuBar = ({
  user,
  onNavigate,
  onLogout,
  onLogin,
}: VSCodeMenuBarProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Theme management
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme === "dark" ? "dark" : "light") as Theme;
  });

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div className="vscode-menubar" ref={menuRef}>
      {/* Logo - acts as hamburger menu on mobile */}
      <label
        htmlFor="my-drawer"
        className="vscode-menubar__logo lg:pointer-events-none"
      >
        <img
          src="/DevLogApp/favicon-32x32 (2).png"
          alt="Logo"
          className="vscode-menubar__logo-img"
        />
      </label>

      {/* Menu Items */}
      <div className="vscode-menubar__items">
        {/* Home */}
        <div className="vscode-menubar__item">
          <button
            className={`vscode-menubar__button ${
              activeMenu === "home" ? "active" : ""
            }`}
            onClick={() => handleMenuClick("home")}
          >
            Home
          </button>
          {activeMenu === "home" && (
            <div className="vscode-menubar__dropdown">
              <div
                className="vscode-menubar__dropdown-item"
                onClick={() => handleMenuItemClick(() => onNavigate("home"))}
              >
                <span>Go to Home</span>
                <span className="vscode-menubar__shortcut">Ctrl+H</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile (only when signed in) */}
        {user && (
          <div className="vscode-menubar__item">
            <button
              className={`vscode-menubar__button ${
                activeMenu === "profile" ? "active" : ""
              }`}
              onClick={() => handleMenuClick("profile")}
            >
              Profile
            </button>
            {activeMenu === "profile" && (
              <div className="vscode-menubar__dropdown">
                <div
                  className="vscode-menubar__dropdown-item"
                  onClick={() =>
                    handleMenuItemClick(() => onNavigate("profile"))
                  }
                >
                  <span>View Profile</span>
                  <span className="vscode-menubar__shortcut">Ctrl+P</span>
                </div>
                <div className="vscode-menubar__dropdown-divider" />
                <div
                  className="vscode-menubar__dropdown-item"
                  onClick={() => handleMenuItemClick(onLogout)}
                >
                  <span>Sign Out</span>
                  <span className="vscode-menubar__shortcut">Ctrl+Shift+Q</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Logs (only when signed in) */}
        {user && (
          <div className="vscode-menubar__item">
            <button
              className={`vscode-menubar__button ${
                activeMenu === "my-logs" ? "active" : ""
              }`}
              onClick={() => handleMenuClick("my-logs")}
            >
              My Logs
            </button>
            {activeMenu === "my-logs" && (
              <div className="vscode-menubar__dropdown">
                <div
                  className="vscode-menubar__dropdown-item"
                  onClick={() => handleMenuItemClick(() => onNavigate("logs"))}
                >
                  <span>View My Logs</span>
                  <span className="vscode-menubar__shortcut">Ctrl+L</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin (Super Admin only) */}
        {user && user.role === "super_admin" && (
          <div className="vscode-menubar__item">
            <button
              className={`vscode-menubar__button ${
                activeMenu === "admin" ? "active" : ""
              }`}
              onClick={() => handleMenuClick("admin")}
            >
              Admin
            </button>
            {activeMenu === "admin" && (
              <div className="vscode-menubar__dropdown">
                <div
                  className="vscode-menubar__dropdown-item"
                  onClick={() => handleMenuItemClick(() => onNavigate("admin"))}
                >
                  <span>User Management</span>
                  <span className="vscode-menubar__shortcut">Ctrl+A</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Engagement (Admin+ only) */}
        {user && (user.role === "admin" || user.role === "super_admin") && (
          <div className="vscode-menubar__item">
            <button
              className={`vscode-menubar__button ${
                activeMenu === "engagement" ? "active" : ""
              }`}
              onClick={() => handleMenuClick("engagement")}
            >
              Engagement
            </button>
            {activeMenu === "engagement" && (
              <div className="vscode-menubar__dropdown">
                <div
                  className="vscode-menubar__dropdown-item"
                  onClick={() =>
                    handleMenuItemClick(() => onNavigate("engagement"))
                  }
                >
                  <span>Alumni Engagement</span>
                  <span className="vscode-menubar__shortcut">Ctrl+E</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View / Theme Toggle */}
        <div className="vscode-menubar__item">
          <button
            className={`vscode-menubar__button ${
              activeMenu === "view" ? "active" : ""
            }`}
            onClick={() => handleMenuClick("view")}
          >
            View
          </button>
          {activeMenu === "view" && (
            <div className="vscode-menubar__dropdown">
              <div
                className="vscode-menubar__dropdown-item"
                onClick={() => handleMenuItemClick(toggleTheme)}
              >
                <span>
                  {theme === "light"
                    ? "🌙 Switch to Dark Mode"
                    : "☀️ Switch to Light Mode"}
                </span>
                <span className="vscode-menubar__shortcut">Ctrl+T</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - User info or Login */}
      <div className="vscode-menubar__right">
        {user ? (
          <div className="vscode-menubar__user">
            <div className="vscode-menubar__user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="vscode-menubar__user-name">{user.username}</span>
          </div>
        ) : (
          <button className="vscode-menubar__login-btn" onClick={onLogin}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default VSCodeMenuBar;
