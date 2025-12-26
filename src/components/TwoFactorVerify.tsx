import { useState } from "react";
import "./TwoFactorVerify.css";

interface TwoFactorVerifyProps {
  username: string;
  userId: number;
  onVerify: (token?: string, backupCode?: string) => Promise<void>;
  onCancel: () => void;
}

function TwoFactorVerify({
  username,
  onVerify,
  onCancel,
}: TwoFactorVerifyProps) {
  const [token, setToken] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (useBackupCode) {
      if (backupCode.length !== 8) {
        setError("Backup code must be 8 characters");
        return;
      }
    } else {
      if (token.length !== 6) {
        setError("Please enter a 6-digit code");
        return;
      }
    }

    setIsVerifying(true);
    setError("");

    try {
      if (useBackupCode) {
        await onVerify(undefined, backupCode.toUpperCase());
      } else {
        await onVerify(token);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Verification failed. Please try again.";
      setError(errorMessage);

      if (useBackupCode) {
        setBackupCode("");
      } else {
        setToken("");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setError("");
    setToken("");
    setBackupCode("");
  };

  return (
    <div className="twofa-verify">
      <div className="verify-header">
        <h2>Two-Factor Authentication</h2>
      </div>

      <div className="verify-content">
        <div className="user-badge">
          <div className="user-avatar">
            <span>{username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-info">
            <span className="username">@{username}</span>
          </div>
        </div>

        <form onSubmit={handleVerify} className="verify-form">
          {error && <div className="login-error">{error}</div>}

          {!useBackupCode ? (
            <div className="form-group">
              <label>Enter 6-digit code from your authenticator app</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setToken(val);
                  setError("");
                }}
                placeholder="000000"
                className="code-input"
                autoFocus
                disabled={isVerifying}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Enter backup code</label>
              <input
                type="text"
                maxLength={8}
                value={backupCode}
                onChange={(e) => {
                  const val = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "");
                  setBackupCode(val);
                  setError("");
                }}
                placeholder="XXXXXXXX"
                className="code-input backup-code"
                autoFocus
                disabled={isVerifying}
              />
              <span className="input-hint">
                Each backup code can only be used once
              </span>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={
                isVerifying ||
                (!useBackupCode && token.length !== 6) ||
                (useBackupCode && backupCode.length !== 8)
              }
              className="btn btn-login"
            >
              {isVerifying ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="btn btn-cancel"
              disabled={isVerifying}
            >
              Cancel
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={handleToggleBackupCode}
          className="toggle-method-btn"
          disabled={isVerifying}
        >
          {useBackupCode
            ? "← Use Authenticator Code"
            : "Use Backup Code Instead →"}
        </button>

        <div className="info-alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="info-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            {useBackupCode
              ? "Lost your backup codes? Contact support for help."
              : "The code refreshes every 30 seconds in your authenticator app."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorVerify;
