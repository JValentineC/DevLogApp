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
        <div className="user-badge">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-16">
              <span className="text-2xl">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
            <p className="text-sm text-base-content/70">@{username}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleVerify} className="verify-form">
        {!useBackupCode ? (
          <div className="form-control">
            <label className="label">
              <span className="label-text">
                Enter 6-digit code from your authenticator app
              </span>
            </label>
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
              className="input input-bordered input-lg text-center tracking-widest"
              autoFocus
              disabled={isVerifying}
            />
            {error && (
              <label className="label">
                <span className="label-text-alt text-error">{error}</span>
              </label>
            )}
          </div>
        ) : (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Enter backup code</span>
            </label>
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
              className="input input-bordered input-lg text-center tracking-wider uppercase"
              autoFocus
              disabled={isVerifying}
            />
            {error && (
              <label className="label">
                <span className="label-text-alt text-error">{error}</span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt">
                Each backup code can only be used once
              </span>
            </label>
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
            className="btn btn-primary btn-block"
          >
            {isVerifying ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Verifying...
              </>
            ) : (
              "Verify & Login"
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleBackupCode}
            className="btn btn-ghost btn-sm btn-block"
            disabled={isVerifying}
          >
            {useBackupCode
              ? "← Use Authenticator Code"
              : "Use Backup Code Instead →"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm btn-block"
            disabled={isVerifying}
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="alert alert-info mt-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span className="text-sm">
          {useBackupCode
            ? "Lost your backup codes? Contact support for help."
            : "The code refreshes every 30 seconds in your authenticator app."}
        </span>
      </div>
    </div>
  );
}

export default TwoFactorVerify;
