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

interface VSCodeMenuBarProps {
  user: User | null;
  onNavigate: (
    page: "home" | "logs" | "profile" | "admin" | "engagement"
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
      {/* Logo */}
      <div className="vscode-menubar__logo">
        <img
          src="/DevLogApp/favicon-32x32 (2).png"
          alt="Logo"
          className="vscode-menubar__logo-img"
        />
      </div>

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

        {/* View / Feed */}
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
                onClick={() => handleMenuItemClick(() => onNavigate("logs"))}
              >
                <span>Feed (All Posts)</span>
                <span className="vscode-menubar__shortcut">Ctrl+F</span>
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
