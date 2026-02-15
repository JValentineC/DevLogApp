import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import TwoFactorVerify from "./TwoFactorVerify";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (user: { id: number; username: string }) => void;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start a 15-minute countdown when rate limited
  const startRateLimitCountdown = () => {
    // Clear any existing timer
    if (countdownRef.current) clearInterval(countdownRef.current);
    const totalSeconds = 15 * 60; // 15 minutes
    setRateLimitCountdown(totalSeconds);
    countdownRef.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setIsRateLimited(false);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handle2FAVerify = async (token?: string, backupCode?: string) => {
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";

      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          token: token || backupCode,
          tempToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "2FA verification failed");
      }

      if (data.success && data.user) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(err instanceof Error ? err.message : "2FA verification failed");
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsRateLimited(false);
    setLoading(true);

    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      // Handle rate limit before trying to parse JSON
      if (response.status === 429) {
        setIsRateLimited(true);
        startRateLimitCountdown();
        throw new Error(
          "You've made too many login attempts. Please wait for the timer below before trying again."
        );
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected server response. Please try again later.");
      }

      if (!response.ok) {
        if (data.error?.toLowerCase().includes("too many")) {
          setIsRateLimited(true);
          startRateLimitCountdown();
          throw new Error(
            "You've made too many login attempts. Please wait for the timer below before trying again."
          );
        }
        throw new Error(data.error || "Login failed");
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setUserId(data.userId);
        setShowTwoFactor(true);
        return;
      }

      if (data.success && data.user) {
        // Store auth token in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (showTwoFactor) {
    return (
      <div className="login-overlay" onClick={onClose}>
        <div className="login-modal" onClick={(e) => e.stopPropagation()}>
          <TwoFactorVerify
            username={username}
            userId={userId!}
            onVerify={handle2FAVerify}
            onCancel={() => {
              setShowTwoFactor(false);
              setTempToken("");
              setUserId(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h2>Login to DevLogs</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div
              className={`login-error ${
                isRateLimited ? "rate-limit-error" : ""
              }`}
            >
              {isRateLimited ? (
                <>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    ⏱️
                  </div>
                  <strong>Too Many Attempts</strong>
                  <div style={{ marginTop: "0.5rem" }}>
                    You've made too many login attempts.
                  </div>
                  {rateLimitCountdown > 0 && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        fontSize: "1.5rem",
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        color: "#f59e0b",
                      }}
                    >
                      Try again in {formatCountdown(rateLimitCountdown)}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#9ca3af",
                    }}
                  >
                    Please wait for the timer to expire before trying again.
                  </div>
                </>
              ) : (
                <>
                  <strong>Error</strong>
                  <div style={{ marginTop: "0.5rem" }}>{error}</div>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              required
              autoComplete="username"
              autoFocus
            />
            <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              ⚠️ Username is case-sensitive
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>

          <div className="login-actions">
            <button type="submit" className="btn btn-login" disabled={loading || isRateLimited}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
