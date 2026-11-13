import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, ROLE_PRESETS, UserRole } from "../context/AuthContext";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Compass,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to target or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Пожалуйста, введите служебный email и пароль");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Ошибка авторизации в ЦУП");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreset = async (roleType: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(roleType);
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Ошибка быстрого входа");
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
          <span>На главную страницу</span>
        </Link>
        <Link to="/" className="auth-brand">
          <img src="/cosmo-logo.png" alt="CosmoHealth" className="auth-logo-img" />
        </Link>
        <div className="auth-header-right">
          <span className="auth-badge-status">
            <span className="auth-dot-live" />
            <span>NASA STD-3001 GATEWAY</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="auth-main-container">
        <div className="auth-card">
          {/* Card Top Title */}
          <div className="auth-card-head">
            <div className="auth-icon-wrap">
              <ShieldCheck size={28} className="auth-shield-icon" />
            </div>
            <h1 className="auth-title">Вход в CosmoHealthX</h1>
            <p className="auth-subtitle">
              Автономная телемедицинская платформа космической экспедиции CHX-01
            </p>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="auth-tab-switch">
            <button type="button" className="auth-tab-btn active">
              Вход
            </button>
            <Link to="/register" className="auth-tab-btn">
              Регистрация
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error-box" role="alert">
              <AlertCircle size={18} className="auth-err-ico" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                Служебный email / позывной
              </label>
              <div className="auth-input-box">
                <Mail size={18} className="auth-input-ico" />
                <input
                  id="login-email"
                  type="text"
                  placeholder="maya.chen@cosmohealth.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">
                  Пароль доступа
                </label>
                <span className="auth-hint">demo: cosmo123</span>
              </div>
              <div className="auth-input-box">
                <Lock size={18} className="auth-input-ico" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Запомнить сессию на этом терминале</span>
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
                  <span>Авторизация в ЦУП...</span>
                </span>
              ) : (
                <>
                  <span>Войти в платформу</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="auth-demo-divider">
            <span className="auth-demo-divider-text">
              <Sparkles size={14} style={{ color: "#38bdf8", marginRight: "6px" }} />
              Быстрый вход для жюри и экспертов NASA Space Apps
            </span>
          </div>

          <div className="auth-demo-grid">
            {ROLE_PRESETS.map((preset) => {
              const isCMO = preset.roleType === "flight_surgeon";
              const isCDR = preset.roleType === "commander";
              return (
                <button
                  key={preset.roleType}
                  type="button"
                  onClick={() => handleDemoPreset(preset.roleType)}
                  disabled={loading}
                  className={`auth-demo-card ${isCMO ? "cmo" : isCDR ? "cdr" : "crew"}`}
                >
                  <div className="auth-demo-head">
                    <span className="auth-demo-badge">
                      {isCMO ? "CMO Врач" : isCDR ? "CDR Командир" : "CREW Бортинженер"}
                    </span>
                    <span className="auth-demo-callsign">{preset.callsign}</span>
                  </div>
                  <div className="auth-demo-name">{preset.full_name}</div>
                  <div className="auth-demo-desc">{preset.shortTitle}</div>
                </button>
              );
            })}
          </div>

          {/* Footer of Card */}
          <div className="auth-card-footer">
            <span>Впервые в системе CosmoHealthX?</span>
            <Link to="/register" className="auth-link-highlight">
              Создать учетную запись →
            </Link>
          </div>
        </div>

        {/* Security & Standard Compliance Notice */}
        <div className="auth-footer-notice">
          <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
          <span>
            Защищенный шлюз телеметрии с проверкой роли оператора по стандартам NASA STD-3001. Все соединения шифруются по протоколу TLS 1.3 / AES-256.
          </span>
        </div>
      </main>
    </div>
  );
}
