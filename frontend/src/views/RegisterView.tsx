import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "../context/AuthContext";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Radio,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  Compass,
  Rocket,
} from "lucide-react";

export function RegisterView() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [callsign, setCallsign] = useState("");
  const [role, setRole] = useState<UserRole>("astronaut");
  const [accessCode, setAccessCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score++;

    if (score <= 1) return { level: 1, text: "Basic", color: "#ef4444" };
    if (score <= 3) return { level: 2, text: "Good", color: "#f59e0b" };
    return { level: 3, text: "Strong (NASA STD)", color: "#10b981" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept NASA STD-3001 biomedical security standards");
      return;
    }

    if (role !== "astronaut" && !accessCode.trim()) {
      setError(`Registration with privileged role ${role === "flight_surgeon" ? "Flight Surgeon (CMO)" : "Mission Commander (CDR)"} requires a secret NASA / Flight Operations clearance code.`);
      return;
    }

    const roleNameMap: Record<UserRole, string> = {
      flight_surgeon: "Flight Surgeon / CMO",
      commander: "Mission Commander",
      astronaut: "Astronaut / Flight Engineer",
    };

    try {
      setLoading(true);
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        callsign: callsign.trim().toUpperCase() || "CREW-01",
        role: roleNameMap[role],
        password,
        access_code: accessCode.trim().toUpperCase(),
      });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error during mission console registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      {/* Background Cosmic Overlay */}
      <div className="auth-page-bg" />

      {/* Top Navbar */}
      <header className="auth-header">
        <Link to="/" className="auth-back-link">
          <ArrowLeft size={16} />
          <span>Back to Home Page</span>
        </Link>
        <Link to="/" className="auth-brand">
          <img src="/cosmo-logo.png" alt="CosmoHealth" className="auth-logo-img" />
        </Link>
        <div className="auth-header-right">
          <span className="auth-badge-status">
            <span className="auth-dot-live" />
            <span>CREW ONBOARDING</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="auth-main-container">
        <div className="auth-card auth-card-register">
          {/* Card Top Title */}
          <div className="auth-card-head">
            <div className="auth-icon-wrap" style={{ background: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
              <UserPlus size={28} className="auth-shield-icon" style={{ color: "#38bdf8" }} />
            </div>
            <h1 className="auth-title">Register for CosmoHealthX</h1>
            <p className="auth-subtitle">
              Create expedition crew member or flight surgeon medical dossier for Mission CHX-01
            </p>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="auth-tab-switch">
            <Link to="/login" className="auth-tab-btn">
              Sign In
            </Link>
            <button type="button" className="auth-tab-btn active">
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error-box" role="alert">
              <AlertCircle size={18} className="auth-err-ico" />
              <span>{error}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="reg-fullname" className="auth-label">
                  Full Name
                </label>
                <div className="auth-input-box">
                  <User size={18} className="auth-input-ico" />
                  <input
                    id="reg-fullname"
                    type="text"
                    placeholder="Dr. Maya Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-callsign" className="auth-label">
                  Crew Callsign
                </label>
                <div className="auth-input-box">
                  <Radio size={18} className="auth-input-ico" />
                  <input
                    id="reg-callsign"
                    type="text"
                    placeholder="NOVA-01 / ORBIT-02"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">
                Mission Email Address
              </label>
              <div className="auth-input-box">
                <Mail size={18} className="auth-input-ico" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="astronaut@cosmohealth.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <label className="auth-label" style={{ margin: 0 }}>Assigned Expedition Role</label>
                <span style={{ fontSize: "11px", color: "var(--t3)" }}>RBAC Clearance Level</span>
              </div>
              <div className="auth-role-selector">
                <button
                  type="button"
                  onClick={() => setRole("astronaut")}
                  className={`auth-role-card ${role === "astronaut" ? "active" : ""}`}
                >
                  <Compass size={18} className="auth-role-ico" />
                  <div className="auth-role-info">
                    <div className="auth-role-title">Astronaut (Crew)</div>
                    <div className="auth-role-sub">Personal Biometrics & 3D · Standard Exterior Clearance</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("commander")}
                  className={`auth-role-card ${role === "commander" ? "active" : ""}`}
                >
                  <Rocket size={18} className="auth-role-ico" />
                  <div className="auth-role-info">
                    <div className="auth-role-title">🛸 Mission Commander 🔒</div>
                    <div className="auth-role-sub">Operational Command · Requires Clearance Code</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("flight_surgeon")}
                  className={`auth-role-card ${role === "flight_surgeon" ? "active" : ""}`}
                >
                  <Stethoscope size={18} className="auth-role-ico" />
                  <div className="auth-role-info">
                    <div className="auth-role-title">👨‍⚕️ Flight Surgeon (CMO) 🔒</div>
                    <div className="auth-role-sub">Full Clinical Authority & SOP · Requires Clearance Code</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Access Code Input if privileged role */}
            {role !== "astronaut" && (
              <div
                className="auth-field"
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  borderRadius: "14px",
                  padding: "14px",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <ShieldCheck size={16} style={{ color: "var(--pr)" }} />
                  <label htmlFor="reg-access-code" className="auth-label" style={{ margin: 0, color: "var(--pr)", fontWeight: 700 }}>
                    NASA Clearance Authorization Code ({role === "flight_surgeon" ? "CMO / Doctor" : "Commander"})
                  </label>
                </div>
                <div className="auth-input-box">
                  <Lock size={18} className="auth-input-ico" />
                  <input
                    id="reg-access-code"
                    type="text"
                    placeholder="E.g.: NASA-CMO-2026 or NASA-CMD-2026"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "6px", lineHeight: "1.4" }}>
                  🛡️ Privileged command and medical roles require verified NASA mission authorization. For evaluation, use <code style={{ color: "var(--pr)", fontWeight: 700 }}>{role === "flight_surgeon" ? "NASA-CMO-2026" : "NASA-CMD-2026"}</code>.
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="reg-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-box">
                  <Lock size={18} className="auth-input-ico" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide" : "Show"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirm" className="auth-label">
                  Confirm Password
                </label>
                <div className="auth-input-box">
                  <Lock size={18} className="auth-input-ico" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password strength bar */}
            {password && (
              <div className="auth-strength-meter">
                <div className="auth-strength-bars">
                  <div className={`auth-bar ${strength.level >= 1 ? "filled" : ""}`} style={{ backgroundColor: strength.color }} />
                  <div className={`auth-bar ${strength.level >= 2 ? "filled" : ""}`} style={{ backgroundColor: strength.color }} />
                  <div className={`auth-bar ${strength.level >= 3 ? "filled" : ""}`} style={{ backgroundColor: strength.color }} />
                </div>
                <span className="auth-strength-text" style={{ color: strength.color }}>
                  Strength: {strength.text}
                </span>
              </div>
            )}

            {/* Terms checkbox */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  I accept NASA STD-3001 medical standards and the autonomous telemetry processing agreement
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="auth-spinner-wrap">
                  <span className="auth-spinner" />
                  <span>Creating Account...</span>
                </span>
              ) : (
                <>
                  <span>Register & Launch Console</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer of Card */}
          <div className="auth-card-footer">
            <span>Already have mission clearance?</span>
            <Link to="/login" className="auth-link-highlight">
              Sign In →
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="auth-footer-notice">
          <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>
            Registration provisions a cryptographically secured profile in the CHX-01 mission registry with role-based access control.
          </span>
        </div>
      </main>
    </div>
  );
}
