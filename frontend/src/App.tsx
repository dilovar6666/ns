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

  // Theme state: light | dark | navy (default navy)
  const [theme, setTheme] = useState<"light" | "dark" | "navy">(() => {
    return (localStorage.getItem("cosmo_theme") as "light" | "dark" | "navy") || "navy";
  });

  const handleThemeChange = (newTheme: "light" | "dark" | "navy") => {
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
      </div>
    );
  }

  return (
    <div className={`cx app ${theme}`}>
      {/* Sidebar Navigation */}
      <aside className="side" aria-label="Главное меню">
        {/* Brand Logo */}
        <Link className="brand" to="/" title="На главную">
          <div className="brand-mark">
            <Activity size={20} />
          </div>
          <div>
            <strong>COSMO<span>HEALTH</span>X</strong>
            <small>MISSION HEALTH SYSTEM</small>
          </div>
        </Link>

        {/* Primary Navigation Items */}
        <nav className="nav" aria-label="Разделы">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <LayoutDashboard className="ico" />
            <span className="nl">Dashboard</span>
            <span className="ns">Обзор</span>
          </NavLink>

          <NavLink
            to="/monitoring"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Activity className="ico" />
            <span className="nl">Monitoring</span>
            <span className="ns">Телеметрия</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <BarChart3 className="ico" />
            <span className="nl">Analytics</span>
            <span className="ns">Аналитика</span>
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Bell className="ico" />
            <span className="nl">Alerts</span>
            <span className="ns">Уведомления</span>
            {unreadCount > 0 && <span className="badge num">{unreadCount}</span>}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <User className="ico" />
            <span className="nl">Profile</span>
            <span className="ns">Профиль</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Settings className="ico" />
            <span className="nl">Settings</span>
            <span className="ns">Настройки</span>
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
            <span className="nl">Crew</span>
            <span className="ns">Экипаж</span>
          </NavLink>

          <NavLink
            to="/mental"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Brain className="ico" />
            <span className="nl">Mental</span>
            <span className="ns">Психология</span>
          </NavLink>

          <NavLink
            to="/ai"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Bot className="ico" />
            <span className="nl">AI Assistant</span>
            <span className="ns">Клинич. ИИ</span>
          </NavLink>

          <NavLink
            to="/protocols"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <ClipboardList className="ico" />
            <span className="nl">Protocols</span>
            <span className="ns">Протоколы</span>
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Calendar className="ico" />
            <span className="nl">Timeline</span>
            <span className="ns">Хронология</span>
          </NavLink>

          <NavLink
            to="/evidence"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <BookOpen className="ico" />
            <span className="nl">Evidence</span>
            <span className="ns">База NASA</span>
          </NavLink>

          <NavLink
            to="/3d"
            className={({ isActive }) => `ni ${isActive ? "on" : ""}`}
          >
            <Box className="ico" />
            <span className="nl">3D Viewer</span>
            <span className="ns">Скафандр</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer Widget */}
        <div className="sfoot">
          <div className="miss">
            <div className="cap">Демо-миссия CHX-01</div>
            <div className="num" style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
              День 42 <span className="t3" style={{ fontSize: "14px", fontWeight: 600 }}>из 180</span>
            </div>
            <div className="bar" style={{ marginTop: "10px" }}>
              <i style={{ width: "23.3%" }} />
            </div>
          </div>

          <div className="uprof">
            <Link className="me" to="/profile" aria-label="Профиль">
              <span className="av">
                {currentAstronaut?.name?.slice(0, 2).toUpperCase() || "АН"}
              </span>
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentAstronaut?.name || "Алекс Нова"}
                </span>
                <span className="cap" style={{ display: "block" }}>
                  {currentAstronaut?.callsign || "Бортинженер"}
                </span>
              </span>
            </Link>
            <Link className="lo" to="/" title="Выйти на главную" aria-label="Выйти">
              <LogOut className="ico" />
            </Link>
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
