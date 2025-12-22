import React, { useState, useEffect } from "react";
import "./Register.css";

interface RegisterProps {
  onRegisterSuccess: (user: { id: number; username: string }) => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const FORM_STORAGE_KEY = "devlogs_registration_draft";

const Register: React.FC<RegisterProps> = ({
  onRegisterSuccess,
  onClose,
  onSwitchToLogin,
}) => {
  // Authentication
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState("");

  // Name fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  // Profile
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // Optional contact & links
  const [phone, setPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // i.c.Stars/iCAA info
  const [cycleCode, setCycleCode] = useState("");
  const [isICaaMember, setIsICaaMember] = useState(false);

  // 2FA
  const [enable2FA, setEnable2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorQR, setTwoFactorQR] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [multipleMatches, setMultipleMatches] = useState<any[]>([]);
  const [showCycleSelection, setShowCycleSelection] = useState(false);

  // Load saved form data on mount
  useEffect(() => {
    // Check for incomplete 2FA setup first
    const saved2FASetup = localStorage.getItem('devlogs_2fa_setup');
    if (saved2FASetup) {
      try {
        const setup2FAData = JSON.parse(saved2FASetup);
        setTwoFactorSecret(setup2FAData.twoFactorSecret || "");
        setTwoFactorQR(setup2FAData.qrCode || "");
        setBackupCodes(setup2FAData.backupCodes || []);
        setShow2FASetup(true);
      } catch (e) {
        console.error("Failed to restore 2FA setup:", e);
        localStorage.removeItem('devlogs_2fa_setup');
      }
      return; // Don't load registration form data if 2FA setup is pending
    }
    
    // Load registration form draft
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setEmail(parsed.email || "");
        setFirstName(parsed.firstName || "");
        setMiddleName(parsed.middleName || "");
        setLastName(parsed.lastName || "");
        setUsername(parsed.username || "");
        setPasswordHint(parsed.passwordHint || "");
        setBio(parsed.bio || "");
        setPhone(parsed.phone || "");
        setOrgEmail(parsed.orgEmail || "");
        setLinkedInUrl(parsed.linkedInUrl || "");
        setPortfolioUrl(parsed.portfolioUrl || "");
        setCycleCode(parsed.cycleCode || "");
        setIsICaaMember(parsed.isICaaMember || false);
        setEnable2FA(parsed.enable2FA || false);
        setCurrentStep(parsed.currentStep || 1);
        setEmailVerified(parsed.emailVerified || false);
      } catch (e) {
        console.error("Failed to restore form data:", e);
      }
    }
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    const formData = {
      email,
      firstName,
      middleName,
      lastName,
      username,
      passwordHint,
      bio,
      phone,
      orgEmail,
      linkedInUrl,
      portfolioUrl,
      cycleCode,
      isICaaMember,
      enable2FA,
      currentStep,
      emailVerified,
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [
    email,
    firstName,
    middleName,
    lastName,
    username,
    passwordHint,
    bio,
    phone,
    orgEmail,
    linkedInUrl,
    portfolioUrl,
    cycleCode,
    isICaaMember,
    enable2FA,
    currentStep,
    emailVerified,
  ]);

  const totalSteps = 5;
  const stepLabels = [
    "Basic Info",
    "Account Setup",
    "Profile",
    "Organization",
    "Contact & Links",
  ];

  const validateEmail = (email: string) => {
    // Must be a valid email format AND end with @icstars.org
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isIcStarsEmail = email.toLowerCase().endsWith("@icstars.org");
    return isValidFormat && isIcStarsEmail;
  };

  const checkEmailInDatabase = async (email: string): Promise<boolean> => {
    setCheckingEmail(true);
    try {
      const response = await fetch(
        `https://devlogs-api.nfshost.com/api/auth/verify-alumni`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            cycleCode: cycleCode || undefined,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        if (!data.verified) {
          if (data.alreadyRegistered) {
            setError(
              "An account already exists with this information. Please sign in instead."
            );
          } else {
            setError(
              "You are not in our alumni database. Only i.c.Stars/iCAA alumni can register. Please verify your name and email are correct."
            );
          }
          setEmailVerified(false);
          setMultipleMatches([]);
          setShowCycleSelection(false);
          return false;
        }

        // Verified as alumni!
        if (data.matchCount > 1) {
          // Multiple matches - ask user to select their cycle
          setMultipleMatches(data.matches);
          setShowCycleSelection(true);
          setError("We found multiple alumni with your name. Please select your cycle number to continue.");
          setEmailVerified(false);
          return false;
        }
        
        setEmailVerified(true);
        setError("");
        setMultipleMatches([]);
        setShowCycleSelection(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error checking alumni status:", err);
      setError("Failed to verify alumni status. Please try again.");
      setEmailVerified(false);
      setMultipleMatches([]);
      setShowCycleSelection(false);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleCycleSelection = async (selectedCycle: string) => {
    setCycleCode(selectedCycle);
    setShowCycleSelection(false);
    setError("");
    
    // Re-verify with the selected cycle code
    setCheckingEmail(true);
    try {
      const response = await fetch(
        `https://devlogs-api.nfshost.com/api/auth/verify-alumni`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            cycleCode: selectedCycle,
          }),
        }
      );
      const data = await response.json();

      if (data.success && data.verified) {
        setEmailVerified(true);
        setError("");
        setMultipleMatches([]);
        // Auto-advance to next step
        setCurrentStep(2);
      } else {
        setError("Failed to verify with selected cycle. Please try again.");
        setEmailVerified(false);
      }
    } catch (err) {
      console.error("Error verifying with cycle:", err);
      setError("Failed to verify. Please try again.");
      setEmailVerified(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (username.includes(' ')) {
      setError("Username cannot contain spaces");
      return;
    }

    if (username.length < 4) {
      setError("Username must be at least 4 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please use your i.c.Stars organization email (@icstars.org)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://devlogs-api.nfshost.com/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // User table fields
            firstName,
            middleName: middleName || null,
            lastName,
            email,
            password,
            passwordHint: passwordHint || null,
            username,
            bio: bio || null,

            // Person table fields (optional)
            phone: phone || null,
            orgEmail: orgEmail || null,
            linkedInUrl: linkedInUrl || null,
            portfolioUrl: portfolioUrl || null,
            isICaaMember,

            // Cycle info (optional)
            cycleCode: cycleCode || null,
            
            // 2FA setup
            enable2FA,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      if (data.success && data.user) {
        // Clear the saved form draft on successful registration
        localStorage.removeItem(FORM_STORAGE_KEY);
        
        // If 2FA was enabled, show setup modal
        if (enable2FA && data.twoFactorSecret) {
          const twoFASetupData = {
            twoFactorSecret: data.twoFactorSecret,
            qrCode: data.qrCode,
            backupCodes: data.backupCodes || [],
          };
          
          // Store 2FA setup data temporarily in case of refresh
          localStorage.setItem('devlogs_2fa_setup', JSON.stringify(twoFASetupData));
          
          setTwoFactorSecret(data.twoFactorSecret);
          setTwoFactorQR(data.qrCode);
          setBackupCodes(data.backupCodes || []);
          setShow2FASetup(true);
          // Don't close the modal or call onRegisterSuccess yet
          // Store token but don't redirect
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          // Normal registration without 2FA
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          onRegisterSuccess(data.user);
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!firstName || !lastName || !email) {
        setError("Please fill in all required fields");
        return;
      }
      if (!validateEmail(email)) {
        setError("Please use your i.c.Stars organization email (@icstars.org)");
        return;
      }
      // Check if email exists in alumni database
      const isValid = await checkEmailInDatabase(email);
      if (!isValid) {
        return; // Error message already set in checkEmailInDatabase
      }
    } else if (currentStep === 2) {
      if (!username || !password || !confirmPassword) {
        setError("Please fill in all required fields");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
    }

    setError("");
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="register-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="register-header">
          <h2>Join DevLogs</h2>
          {localStorage.getItem(FORM_STORAGE_KEY) && (
            <small style={{ color: "#10b981", marginLeft: "1rem" }}>
              📝 Draft restored
            </small>
          )}
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Breadcrumbs Progress */}
        <div className="breadcrumbs-container">
          <div className="breadcrumbs text-sm">
            <ul>
              {stepLabels.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                return (
                  <li key={stepNumber} className={isActive ? "active-step" : ""}>
                    {isCompleted ? (
                      <a onClick={() => setCurrentStep(stepNumber)}>
                        <span className="step-check">✓</span> {label}
                      </a>
                    ) : isActive ? (
                      <span className="font-bold">{label}</span>
                    ) : (
                      <span className="opacity-50">{label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="register-error">{error}</div>}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Basic Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="middleName">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="yourname@icstars.org"
                />
                <small>Must use your i.c.Stars organization email (@icstars.org)</small>
              </div>

              {/* Cycle Selection UI for duplicate names */}
              {showCycleSelection && multipleMatches.length > 0 && (
                <div className="form-group cycle-selection">
                  <label>Select Your Cycle</label>
                  <p className="cycle-help-text">
                    We found {multipleMatches.length} alumni with your name. Please select your cycle to continue:
                  </p>
                  <div className="cycle-options">
                    {multipleMatches.map((match, index) => (
                      <button
                        key={index}
                        type="button"
                        className="btn btn-outline cycle-option"
                        onClick={() => handleCycleSelection(match.icaaTier || match.email)}
                        disabled={checkingEmail}
                      >
                        {match.icaaTier ? `Cycle ${match.icaaTier}` : match.email}
                        {match.email && <small className="cycle-email">{match.email}</small>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={checkingEmail || showCycleSelection}
                >
                  {checkingEmail ? "Verifying Alumni Status..." : "Next"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Account Setup */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Account Setup</h3>

              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Prevent spaces in username
                    if (!value.includes(' ')) {
                      setUsername(value);
                    }
                  }}
                  pattern="[^\s]+"
                  title="Username cannot contain spaces"
                  placeholder="e.g., jsmith or john_smith"
                  minLength={4}
                  required
                  autoFocus
                />
                <small style={{ color: "#6b7280" }}>⚠️ Min 4 characters. No spaces. Case-sensitive.</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <small>Minimum 8 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="passwordHint">Password Hint (Optional)</label>
                <input
                  type="text"
                  id="passwordHint"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="e.g., My first pet's name"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enable2FA}
                    onChange={(e) => setEnable2FA(e.target.checked)}
                  />
                  <span>
                    <strong>Enable Two-Factor Authentication (2FA)</strong>
                    <small style={{ display: "block", marginTop: "0.25rem" }}>
                      Recommended: Add an extra layer of security to your account.
                      You'll set it up after registration.
                    </small>
                  </span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Profile & Bio */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Your Profile (Optional)</h3>
              <p className="step-description">
                Help others get to know you better
              </p>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself, your interests, goals, or what you're learning..."
                  autoFocus
                />
                <small>Share your story with the community</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: i.c.Stars/iCAA Information */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Organization Info (Optional)</h3>
              <p className="step-description">
                Connect with your i.c.Stars or iCAA cohort
              </p>

              <div className="form-group">
                <label htmlFor="cycleCode">i.c.Stars Cycle</label>
                <input
                  type="text"
                  id="cycleCode"
                  value={cycleCode}
                  onChange={(e) => setCycleCode(e.target.value)}
                  placeholder="e.g., CHI-50, Cycle 50"
                  autoFocus
                />
                <small>If you're an i.c.Stars participant, enter your cycle</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isICaaMember}
                    onChange={(e) => setIsICaaMember(e.target.checked)}
                  />
                  <span>I am an iCAA member</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Contact & Links */}
          {currentStep === 5 && (
            <div className="form-step">
              <h3>Contact & Professional Links (Optional)</h3>
              <p className="step-description">
                Make it easy for others to connect with you
              </p>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="linkedInUrl">LinkedIn Profile</label>
                <input
                  type="url"
                  id="linkedInUrl"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <small>Connect professionally with the community</small>
              </div>

              <div className="form-group">
                <label htmlFor="portfolioUrl">Portfolio URL</label>
                <input
                  type="url"
                  id="portfolioUrl"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
                <small>Showcase your work and projects</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <div className="register-footer">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onSwitchToLogin}
              >
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="register-overlay">
          <div className="register-modal" style={{ maxWidth: "500px" }}>
            <div className="register-header">
              <h2>🔒 Two-Factor Authentication Setup</h2>
            </div>
            <div className="register-body" style={{ padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <p style={{ marginBottom: "1rem", color: "#4a5568" }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {twoFactorQR && (
                  <div style={{ display: "inline-block", padding: "1rem", background: "white", borderRadius: "8px" }}>
                    <img 
                      src={twoFactorQR} 
                      alt="2FA QR Code" 
                      style={{ width: "200px", height: "200px", display: "block" }}
                    />
                  </div>
                )}
                <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#718096" }}>
                  Secret: <code style={{ background: "#f7fafc", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>{twoFactorSecret}</code>
                </p>
              </div>

              {backupCodes.length > 0 && (
                <div style={{ background: "#fffbeb", border: "2px solid #fbbf24", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem" }}>⚠️ Save Your Backup Codes</h3>
                  <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    Store these codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                  <div style={{ background: "white", padding: "0.75rem", borderRadius: "4px", fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {backupCodes.map((code, index) => (
                      <div key={index}>{code}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShow2FASetup(false);
                    localStorage.removeItem('devlogs_2fa_setup'); // Clear saved 2FA setup
                    onRegisterSuccess(JSON.parse(localStorage.getItem("user") || "{}"));
                  }}
                  style={{ width: "100%" }}
                >
                  I've Saved My Codes - Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
