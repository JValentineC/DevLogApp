import { useState } from "react";
import "./BackupCodes.css";

interface BackupCodesProps {
  codes: string[];
  onClose: () => void;
}

function BackupCodes({ codes, onClose }: BackupCodesProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = () => {
    const codesText = codes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const codesText = `DevLog App - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

Keep these codes in a safe place. Each code can only be used once.

${codes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

If you lose access to your authenticator app, you can use these codes to log in.
Once all codes are used, you can generate new ones from your Profile settings.
`;

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devlog-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="backup-codes">
      <div className="backup-codes-header">
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Save These Backup Codes!</h3>
            <div className="text-sm">
              These codes can only be viewed once. Store them securely.
            </div>
          </div>
        </div>
      </div>

      <div className="codes-container" id="printable-codes">
        <h4 className="codes-title">Your Backup Codes</h4>
        <p className="codes-description">
          Each code can be used only once if you lose access to your
          authenticator app.
        </p>

        <div className="codes-grid">
          {codes.map((code, index) => (
            <div key={index} className="code-item">
              <span className="code-number">{index + 1}.</span>
              <code className="code-value">{code}</code>
            </div>
          ))}
        </div>

        <div className="codes-stats">
          <div className="stat">
            <span className="stat-label">Total Codes:</span>
            <span className="stat-value">{codes.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Generated:</span>
            <span className="stat-value">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="backup-codes-actions">
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-secondary"
        >
          {copied ? <>✓ Copied!</> : <>📋 Copy to Clipboard</>}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="btn btn-secondary"
        >
          {downloaded ? <>✓ Downloaded!</> : <>💾 Download as Text File</>}
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-ghost print-hide"
        >
          🖨️ Print Codes
        </button>
      </div>

      <div className="alert alert-info mt-4 print-hide">
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
        <div className="text-sm">
          <strong>Important:</strong> Store these codes in a password manager or
          safe place. You can regenerate new codes from your Profile settings if
          needed.
        </div>
      </div>

      <div className="backup-codes-footer print-hide">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary btn-block"
          disabled={!downloaded && !copied}
        >
          I've Saved My Backup Codes
        </button>

        {!downloaded && !copied && (
          <p className="text-sm text-center text-warning mt-2">
            ⚠️ Please download or copy your codes before closing
          </p>
        )}
      </div>
    </div>
  );
}

export default BackupCodes;
