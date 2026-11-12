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

export default function App() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, openAuthModal } = useAuth();
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
            to="/analytics"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <BarChart3 className="ico" />
            <span className="nl">{t.navAnalytics}</span>
            <span className="ns">{t.navAnalyticsSub}</span>
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
            to="/profile"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <User className="ico" />
            <span className="nl">{t.navProfile}</span>
            <span className="ns">{t.navProfileSub}</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Settings className="ico" />
            <span className="nl">{t.navSettings}</span>
            <span className="ns">{t.navSettingsSub}</span>
          </NavLink>

          <div
            style={{
              height: "1px",
              background: "var(--sep)",
              margin: "8px 0 6px",
            }}
          />

          {/* Extended Mission Tools */}
          <NavLink
            to="/crew"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Users className="ico" />
            <span className="nl">{t.navCrew}</span>
            <span className="ns">{t.navCrewSub}</span>
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
            to="/ai"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Bot className="ico" />
            <span className="nl">{t.navAIAssistant}</span>
            <span className="ns">{t.navAIAssistantSub}</span>
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
            to="/timeline"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Calendar className="ico" />
            <span className="nl">{t.navTimeline}</span>
            <span className="ns">{t.navTimelineSub}</span>
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
            to="/3d"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Box className="ico" />
            <span className="nl">{t.nav3DViewer}</span>
            <span className="ns">{t.nav3DViewerSub}</span>
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
      <main style={{ flex: 1, minWidth: 0, minHeight: "100vh" }}>
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
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mbar" aria-label="Мобильная навигация">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <LayoutDashboard className="ico" />
          <span>Обзор</span>
        </NavLink>

        <NavLink
          to="/monitoring"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <Activity className="ico" />
          <span>Мониторинг</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <BarChart3 className="ico" />
          <span>Аналитика</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <Bell className="ico" />
          <span>Алерты</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `mbar-item ${isActive ? "on" : ""}`}
        >
          <User className="ico" />
          <span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  );
}
