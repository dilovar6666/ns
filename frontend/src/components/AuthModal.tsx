import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Lock, Mail, User, Shield, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<"login" | "register">(authModalMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [callsign, setCallsign] = useState("");
  const [role, setRole] = useState("Flight Surgeon");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess(t.loginSuccess);
      } else {
        await register({ email, password, full_name: fullName, callsign, role });
        setSuccess(t.registerSuccess);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoRole: string) => {
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, "cosmo123");
    } catch (err: any) {
      setError(err.message || "Ошибка быстрого входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        backgroundColor: "rgba(3, 7, 18, 0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "var(--s1, #131b2e)",
          border: "1px solid var(--sep, rgba(255, 255, 255, 0.12))",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(34, 211, 238, 0.15)",
          padding: "28px",
          position: "relative",
          color: "var(--t1, #ffffff)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "transparent",
            border: "none",
            color: "var(--t2, #94a3b8)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "8px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <img
            src="/cosmo-logo.png"
            alt="CosmoHealth"
            style={{ height: "42px", margin: "0 auto 10px", display: "block", objectFit: "contain" }}
          />
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>
            {mode === "login" ? t.signIn : t.signUp}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--t2, #94a3b8)", margin: 0 }}>
            CosmoHealthX Mission Operations Network
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.25)",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "login" ? "var(--pr, #22d3ee)" : "transparent",
              color: mode === "login" ? "#000" : "var(--t2, #94a3b8)",
              transition: "all 0.2s ease",
            }}
          >
            {t.signIn}
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "register" ? "var(--pr, #22d3ee)" : "transparent",
              color: mode === "register" ? "#000" : "var(--t2, #94a3b8)",
              transition: "all 0.2s ease",
            }}
          >
            {t.signUp}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              color: "#4ade80",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                  {t.fullName}
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--t3, #64748b)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Алекс Нова"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="inp"
                    style={{ width: "100%", paddingLeft: "38px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                    {t.callsign}
                  </label>
                  <input
                    type="text"
                    placeholder="CHX-01"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    className="inp"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
                    {t.role}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="inp"
                    style={{ width: "100%" }}
                  >
                    <option value="Flight Surgeon">Flight Surgeon</option>
                    <option value="Mission Commander">Commander</option>
                    <option value="EVA Specialist">EVA Specialist</option>
                    <option value="Biomedical Engineer">Engineer</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
              {t.email}
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--t3, #64748b)" }} />
              <input
                type="text"
                required
                placeholder="doctor@cosmohealth.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="inp"
                style={{ width: "100%", paddingLeft: "38px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>
              {t.password}
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--t3, #64748b)" }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="inp"
                style={{ width: "100%", paddingLeft: "38px" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: "8px",
              height: "44px",
              fontSize: "14px",
              fontWeight: 600,
              width: "100%",
              justifyContent: "center",
            }}
          >
            {loading ? "..." : mode === "login" ? t.signIn : t.signUp}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={{ marginTop: "22px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
          <div
            style={{
              fontSize: "11px",
              color: "var(--t3, #64748b)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={13} style={{ color: "var(--pr, #22d3ee)" }} /> {t.quickDemoLogin}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => quickLogin("maya.chen@cosmohealth.org", "Flight Surgeon")}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "8px 10px",
                textAlign: "left",
                cursor: "pointer",
                color: "var(--t1, #fff)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600 }}>Dr. Maya Chen</div>
              <div style={{ fontSize: "10px", color: "var(--pr, #22d3ee)" }}>Flight Surgeon</div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin("alex.nova@cosmohealth.org", "Mission Commander")}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "8px 10px",
                textAlign: "left",
                cursor: "pointer",
                color: "var(--t1, #fff)",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600 }}>Alex Nova</div>
              <div style={{ fontSize: "10px", color: "var(--pr, #22d3ee)" }}>Commander</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
