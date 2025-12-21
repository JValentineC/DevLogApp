import { useState } from "react";
import "./TwoFactorSetup.css";

interface TwoFactorSetupProps {
  qrCode: string;
  manualKey: string;
  onVerify: (token: string) => Promise<void>;
  onCancel: () => void;
}

function TwoFactorSetup({
  qrCode,
  manualKey,
  onVerify,
  onCancel,
}: TwoFactorSetupProps) {
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"scan" | "verify">("scan");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (token.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await onVerify(token);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Verification failed. Please try again."
      );
      setToken("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(manualKey);
    alert("Secret key copied to clipboard!");
  };

  return (
    <div className="twofa-setup">
      {step === "scan" ? (
        <div className="setup-step">
          <h3 className="text-xl font-bold mb-4">Step 1: Scan QR Code</h3>

          <div className="qr-code-container">
            <img src={qrCode} alt="2FA QR Code" className="qr-code" />
          </div>

          <div className="instructions">
            <p className="mb-4">
              Scan this QR code with your authenticator app:
            </p>
            <ul className="authenticator-apps">
              <li>🔐 Google Authenticator</li>
              <li>🔐 Microsoft Authenticator</li>
              <li>🔐 Authy</li>
              <li>🔐 1Password</li>
            </ul>
          </div>

          <div className="manual-entry">
            <p className="text-sm text-base-content/70 mb-2">
              Can't scan? Enter this key manually:
            </p>
            <div className="manual-key-box">
              <code className="manual-key">{manualKey}</code>
              <button
                type="button"
                onClick={handleCopyKey}
                className="btn btn-sm btn-ghost"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="btn btn-primary"
            >
              Next: Enter Code
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="setup-step">
          <h3 className="text-xl font-bold mb-4">Step 2: Verify Setup</h3>

          <p className="mb-4">
            Enter the 6-digit code from your authenticator app:
          </p>

          <form onSubmit={handleVerify}>
            <div className="form-control">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setToken(val);
                }}
                placeholder="000000"
                className="input input-bordered text-center text-2xl tracking-widest"
                autoFocus
                disabled={isVerifying}
              />
              {error && (
                <label className="label">
                  <span className="label-text-alt text-error">{error}</span>
                </label>
              )}
            </div>

            <div className="step-actions">
              <button
                type="submit"
                disabled={isVerifying || token.length !== 6}
                className="btn btn-primary"
              >
                {isVerifying ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Verifying...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep("scan")}
                className="btn btn-ghost"
                disabled={isVerifying}
              >
                Back
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
              The code refreshes every 30 seconds. If it doesn't work, wait for
              the next code.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorSetup;
