import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Bell,
  User,
  Settings,
  Users,
  Brain,
  Bot,
  ClipboardList,
  Calendar,
  BookOpen,
  Box,
  LogOut,
  WifiOff,
  Lock,
  Shield,
  Stethoscope,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { api, latest } from "./api";
import type { Astronaut, Metric, Notification } from "./api";
import { connectionStatus, queueStatus, syncQueue } from "./offline";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { AuthModal } from "./components/AuthModal";

// Views
import { LandingPage } from "./LandingPage";
import { DashboardView } from "./views/DashboardView";
import { MonitoringView } from "./views/MonitoringView";
import { AnalyticsView } from "./views/AnalyticsView";
import { AlertsView } from "./views/AlertsView";
import { ProfileView } from "./views/ProfileView";
import { SettingsView } from "./views/SettingsView";
import { CrewView } from "./views/CrewView";
import { MentalHealthView } from "./views/MentalHealthView";
import { AIAssistantView } from "./views/AIAssistantView";
import { ProtocolsView } from "./views/ProtocolsView";
import { TimelineView } from "./views/TimelineView";
import { EvidenceView } from "./views/EvidenceView";
import { Astronaut3DView } from "./views/Astronaut3DView";
import { FloatingAIChat } from "./components/FloatingAIChat";
import { AppFooter } from "./components/AppFooter";

export default function App() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, openAuthModal, switchRolePreset, isFlightSurgeon, isCommander, isAstronaut, roleType } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Strict 2-theme system: light | dark (default dark)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("cosmo_theme");
    return saved === "light" ? "light" : "dark";
  });

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("cosmo_theme", newTheme);
  };

  // Selected astronaut state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Queries
  const { data: crew = [], refetch: refetchCrew } = useQuery<Astronaut[]>({
    queryKey: ["crew"],
    queryFn: () => api<Astronaut[]>("/astronauts"),
  });

  // Default to first astronaut if not set
  useEffect(() => {
    if (crew.length > 0 && selectedId === null) {
      setSelectedId(crew[0].id);
    }
  }, [crew, selectedId]);

  const currentAstronaut = crew.find((c) => c.id === selectedId) || crew[0];

  const { data: metrics = [] } = useQuery<Metric[]>({
    queryKey: ["metrics", currentAstronaut?.id],
    queryFn: () =>
      currentAstronaut ? api<Metric[]>(`/astronauts/${currentAstronaut.id}/metrics?period=24h`) : [],
    enabled: !!currentAstronaut,
    refetchInterval: 10000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api<Notification[]>("/notifications"),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/notifications/${id}/read`, "medical_officer", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Is Landing Page?
  const isLanding = location.pathname === "/";

  if (isLanding) {
    return (
      <div className={`cx L ${theme}`}>
        <LandingPage />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className={`cx app ${theme}`}>
      <AuthModal />
      {/* Sidebar Navigation */}
      <aside className="side" aria-label="Главное меню">
        {/* Brand Logo */}
        <Link className="brand" to="/" title="На главную" style={{ padding: "6px 8px", display: "flex", alignItems: "center" }}>
          <img src="/cosmo-logo.png" alt="CosmoHealth" className="brand-logo-img" />
        </Link>

        {/* Primary Navigation Items */}
        <nav className="nav" aria-label="Разделы">
          {/* SECTION 1: Личный терминал космонавта */}
          <div style={{ padding: "0 12px", marginTop: "4px", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--t3)" }}>
              {language === "ru" ? "Терминал экипажа" : "Crew Terminal"}
            </span>
          </div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <LayoutDashboard className="ico" />
            <span className="nl">{t.navDashboard}</span>
            <span className="ns">{t.navDashboardSub}</span>
          </NavLink>

          <NavLink
            to="/monitoring"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Activity className="ico" />
            <span className="nl">{t.navMonitoring}</span>
            <span className="ns">{t.navMonitoringSub}</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <User className="ico" />
            <span className="nl">{t.navProfile}</span>
            <span className="ns">{t.navProfileSub}</span>
          </NavLink>

          <NavLink
            to="/mental"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Brain className="ico" />
            <span className="nl">{t.navMental}</span>
            <span className="ns">{t.navMentalSub}</span>
          </NavLink>

          <NavLink
            to="/3d"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Box className="ico" />
            <span className="nl">{t.nav3DViewer}</span>
            <span className="ns">{t.nav3DViewerSub}</span>
          </NavLink>

          <NavLink
            to="/ai"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Bot className="ico" />
            <span className="nl">{t.navAIAssistant}</span>
            <span className="ns">{t.navAIAssistantSub}</span>
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Calendar className="ico" />
            <span className="nl">{t.navTimeline}</span>
            <span className="ns">{t.navTimelineSub}</span>
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Bell className="ico" />
            <span className="nl">{t.navAlerts}</span>
            <span className="ns">{t.navAlertsSub}</span>
            {unreadCount > 0 && <span className="badge num">{unreadCount}</span>}
          </NavLink>

          <NavLink
            to="/evidence"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <BookOpen className="ico" />
            <span className="nl">{t.navEvidence}</span>
            <span className="ns">{t.navEvidenceSub}</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Settings className="ico" />
            <span className="nl">{t.navSettings}</span>
            <span className="ns">{t.navSettingsSub}</span>
          </NavLink>

          {/* SECTION 2: Медицинский контроль ЦУП и Командование */}
          <div style={{ height: "1px", background: "var(--sep)", margin: "10px 0 8px" }} />
          <div style={{ padding: "0 12px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--t3)" }}>
              {language === "ru" ? "Контроль ЦУП & Командование" : "Flight Surgeon & Ops"}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "1px 5px",
                borderRadius: "4px",
                background: isFlightSurgeon ? "rgba(16, 185, 129, 0.2)" : isCommander ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)",
                color: isFlightSurgeon ? "#10b981" : isCommander ? "var(--pr)" : "#f59e0b",
              }}
            >
              {isFlightSurgeon ? "CMO" : isCommander ? "CDR" : "CREW"}
            </span>
          </div>

          <NavLink
            to="/crew"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Users className="ico" />
            <span className="nl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{t.navCrew}</span>
              {isAstronaut && <Lock size={12} style={{ color: "#f59e0b", marginLeft: "4px" }} />}
            </span>
            <span className="ns">{isAstronaut ? (language === "ru" ? "Ограничено (Врач ЦУП)" : "Restricted (Surgeon)") : t.navCrewSub}</span>
          </NavLink>

          <NavLink
            to="/protocols"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <ClipboardList className="ico" />
            <span className="nl">{t.navProtocols}</span>
            <span className="ns">{t.navProtocolsSub}</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <BarChart3 className="ico" />
            <span className="nl">{t.navAnalytics}</span>
            <span className="ns">{t.navAnalyticsSub}</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer Widget */}
        <div className="sfoot">
          {/* Quick Language Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 10px" }}>
            <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600 }}>{language === "ru" ? "Язык:" : "Lang:"}</span>
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.25)", padding: "2px", borderRadius: "8px", border: "1px solid var(--sep)" }}>
              <button
                type="button"
                onClick={() => setLanguage("ru")}
                style={{
                  background: language === "ru" ? "var(--pr)" : "transparent",
                  color: language === "ru" ? "#000" : "var(--t2)",
                  border: "none",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  background: language === "en" ? "var(--pr)" : "transparent",
                  color: language === "en" ? "#000" : "var(--t2)",
                  border: "none",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                EN
              </button>
            </div>
          </div>

          {/* Quick Role Switcher */}
          <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--sep)", borderRadius: "12px", padding: "8px 10px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "var(--t3)", letterSpacing: "0.5px" }}>
                {language === "ru" ? "Роль в системе:" : "System Role:"}
              </span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isFlightSurgeon ? "#10b981" : isCommander ? "var(--pr)" : "#f59e0b" }} />
            </div>
            <select
              value={roleType}
              onChange={(e) => {
                const newR = e.target.value as any;
                switchRolePreset(newR);
                if (newR === "astronaut") {
                  setSelectedId(2);
                } else {
                  setSelectedId(1);
                }
              }}
              style={{
                width: "100%",
                background: "var(--s1)",
                color: "var(--tx)",
                border: "1px solid var(--sep)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                padding: "5px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="flight_surgeon">👨‍⚕️ Врач миссии (CMO)</option>
              <option value="commander">🛸 Командир (Commander)</option>
              <option value="astronaut">🚀 Космонавт (Crew)</option>
            </select>
          </div>

          <div className="miss">
            <div className="cap">CHX-01 · NASA STD-3001</div>
            <div className="num" style={{ marginTop: "4px", fontSize: "16px", fontWeight: 700 }}>
              {t.missionDay} 42 <span className="t3" style={{ fontSize: "13px", fontWeight: 600 }}>{t.ofDay} 180</span>
            </div>
            <div className="bar" style={{ marginTop: "8px" }}>
              <i style={{ width: "23.3%" }} />
            </div>
          </div>

          <div className="uprof" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div
              className="me"
              onClick={() => openAuthModal("login")}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}
              title="Нажмите для входа или смены профиля"
            >
              <span className="av">
                {user ? user.full_name.slice(0, 2).toUpperCase() : currentAstronaut?.name?.slice(0, 2).toUpperCase() || "MC"}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user ? user.full_name : currentAstronaut?.name || "Dr. Maya Chen"}
                </span>
                <span className="cap" style={{ display: "block", fontSize: "10px" }}>
                  {user ? user.role : currentAstronaut?.callsign || "Flight Surgeon"}
                </span>
              </span>
            </div>
            <button
              className="lo"
              onClick={logout}
              title={t.signOut}
              aria-label={t.signOut}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "var(--t2)", borderRadius: "6px" }}
            >
              <LogOut className="ico" size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main" style={{ flex: 1, minWidth: 0, minHeight: "100vh" }}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                notifications={notifications}
                onSelectAstronaut={(id) => setSelectedId(id)}
                onMarkNotificationRead={(id) => markReadMutation.mutate(id)}
              />
            }
          />
          <Route
            path="/monitoring"
            element={
              <MonitoringView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                notifications={notifications}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          {/* Alias /health -> /monitoring */}
          <Route
            path="/health"
            element={
              <MonitoringView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                notifications={notifications}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          <Route
            path="/analytics"
            element={
              <AnalyticsView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                notifications={notifications}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          {/* Alias /reports -> /analytics */}
          <Route
            path="/reports"
            element={
              <AnalyticsView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                notifications={notifications}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          <Route
            path="/alerts"
            element={
              <AlertsView
                astronaut={currentAstronaut}
                notifications={notifications}
                onMarkNotificationRead={(id) => markReadMutation.mutate(id)}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfileView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsView
                theme={theme}
                onThemeChange={handleThemeChange}
              />
            }
          />
          <Route
            path="/crew"
            element={
              <CrewView
                astronaut={currentAstronaut}
                crew={crew}
                onSelectAstronaut={(id) => setSelectedId(id)}
                onRefreshCrew={refetchCrew}
              />
            }
          />
          <Route
            path="/mental"
            element={
              <MentalHealthView
                astronaut={currentAstronaut}
                crew={crew}
                onSelectAstronaut={(id) => setSelectedId(id)}
              />
            }
          />
          <Route
            path="/ai"
            element={
              <AIAssistantView
                astronaut={currentAstronaut}
                crew={crew}
                metrics={metrics}
              />
            }
          />
          <Route
            path="/protocols"
            element={<ProtocolsView astronaut={currentAstronaut} />}
          />
          <Route path="/timeline" element={<TimelineView />} />
          <Route path="/evidence" element={<EvidenceView />} />
          <Route
            path="/3d"
            element={<Astronaut3DView astronaut={currentAstronaut} metrics={metrics} />}
          />
        </Routes>
        <AppFooter />
      </main>

      {/* Mobile Bottom Navigation Bar (G-2) */}
      <nav className="mbar" aria-label="Мобильная навигация">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <LayoutDashboard className="ico" />
          <span>{language === "ru" ? "Обзор" : "Overview"}</span>
        </NavLink>

        <NavLink
          to="/monitoring"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <Activity className="ico" />
          <span>{language === "ru" ? "Монитор" : "Monitor"}</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <BarChart3 className="ico" />
          <span>{language === "ru" ? "Тренды" : "Trends"}</span>
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <Bot className="ico" />
          <span>{language === "ru" ? "ИИ" : "AI"}</span>
        </NavLink>

        <button
          type="button"
          className={`mbar-item btn-more ${mobileMenuOpen ? "on" : ""}`}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Открыть полное меню платформы"
        >
          <Menu className="ico" />
          <span>{language === "ru" ? "Меню" : "Menu"}</span>
        </button>
      </nav>

      {/* Mobile Navigation Drawer (G-2) */}
      <div
        className={`mobile-drawer-overlay ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
      <aside
        className={`mobile-drawer-panel ${mobileMenuOpen ? "open" : ""}`}
        aria-label="Мобильное меню платформы"
      >
        {/* Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/cosmo-logo.png" alt="CosmoHealth" style={{ height: "30px", width: "auto" }} />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: "none", border: "none", color: "var(--t2)", cursor: "pointer", padding: "6px" }}
            aria-label="Закрыть меню"
          >
            <X size={22} />
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--s2)",
            borderBottom: "1px solid var(--sep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            onClick={() => {
              openAuthModal("login");
              setMobileMenuOpen(false);
            }}
            style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", flex: 1, minWidth: 0 }}
          >
            <span className="av" style={{ width: "36px", height: "36px", fontSize: "13px" }}>
              {user ? user.full_name.slice(0, 2).toUpperCase() : currentAstronaut?.name?.slice(0, 2).toUpperCase() || "MC"}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? user.full_name : currentAstronaut?.name || "Dr. Maya Chen"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>
                {user ? user.role : currentAstronaut?.callsign || "Flight Surgeon"}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "6px",
              background: isFlightSurgeon ? "rgba(16, 185, 129, 0.2)" : isCommander ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)",
              color: isFlightSurgeon ? "#10b981" : isCommander ? "var(--pr)" : "#f59e0b",
            }}
          >
            {isFlightSurgeon ? "CMO" : isCommander ? "CDR" : "CREW"}
          </span>
        </div>

        {/* All 12 Routes */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div className="mobile-drawer-section-title">
            {language === "ru" ? "Терминал экипажа" : "Crew Terminal"}
          </div>
          <NavLink to="/dashboard" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <LayoutDashboard className="ico" />
            <span>{t.navDashboard}</span>
          </NavLink>
          <NavLink to="/monitoring" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Activity className="ico" />
            <span>{t.navMonitoring}</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <User className="ico" />
            <span>{t.navProfile}</span>
          </NavLink>
          <NavLink to="/mental" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Brain className="ico" />
            <span>{t.navMental}</span>
          </NavLink>
          <NavLink to="/ai" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Bot className="ico" />
            <span>{t.navAIAssistant}</span>
          </NavLink>
          <NavLink to="/3d" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Box className="ico" />
            <span>{t.nav3DViewer}</span>
          </NavLink>
          <NavLink to="/protocols" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <ClipboardList className="ico" />
            <span>{t.navProtocols}</span>
          </NavLink>
          <NavLink to="/timeline" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Calendar className="ico" />
            <span>{t.navTimeline}</span>
          </NavLink>
          <NavLink to="/evidence" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <BookOpen className="ico" />
            <span>{t.navEvidence}</span>
          </NavLink>

          <div className="mobile-drawer-section-title" style={{ marginTop: "12px" }}>
            {language === "ru" ? "Контроль ЦУП & Командование" : "Flight Surgeon & Ops"}
          </div>
          <NavLink to="/crew" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Users className="ico" />
            <span>{t.navCrew}</span>
            {isAstronaut && <Lock size={12} style={{ color: "#f59e0b", marginLeft: "auto" }} />}
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <BarChart3 className="ico" />
            <span>{t.navAnalytics}</span>
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Bell className="ico" />
            <span>{t.navAlerts}</span>
            {unreadCount > 0 && (
              <span className="mobile-drawer-badge" style={{ background: "var(--cr)", color: "#fff" }}>
                {unreadCount}
              </span>
            )}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `mobile-drawer-link ${isActive ? "on" : ""}`} onClick={() => setMobileMenuOpen(false)}>
            <Settings className="ico" />
            <span>{t.navSettings}</span>
          </NavLink>
        </div>

        {/* Drawer Footer: Language & Theme & Logout */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--sep)", background: "var(--s2)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--t3)", fontWeight: 600 }}>{language === "ru" ? "Язык интерфейса:" : "Language:"}</span>
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.2)", padding: "2px", borderRadius: "8px" }}>
              <button
                type="button"
                onClick={() => setLanguage("ru")}
                style={{
                  background: language === "ru" ? "var(--pr)" : "transparent",
                  color: language === "ru" ? "#fff" : "var(--t2)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                style={{
                  background: language === "en" ? "var(--pr)" : "transparent",
                  color: language === "en" ? "#fff" : "var(--t2)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                EN
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "var(--t2)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                padding: "4px 0",
              }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? (language === "ru" ? "Светлая тема" : "Light Mode") : (language === "ru" ? "Темная тема" : "Dark Mode")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: "var(--cr)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                padding: "4px 0",
              }}
            >
              <LogOut size={16} />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Floating AI Assistant Chat Button and Drawer (Hidden on /ai to prevent duplicate widget) */}
      {location.pathname !== "/ai" && (
        <FloatingAIChat astronaut={currentAstronaut} metrics={metrics} />
      )}
    </div>
  );
}
