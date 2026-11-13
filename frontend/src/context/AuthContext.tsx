import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "flight_surgeon" | "commander" | "astronaut";

export interface User {
  id: number;
  email: string;
  full_name: string;
  callsign: string;
  role: string;
  roleType: UserRole;
  astronautId?: number;
  avatar_url?: string | null;
}

export const ROLE_PRESETS: {
  roleType: UserRole;
  title: string;
  shortTitle: string;
  full_name: string;
  callsign: string;
  email: string;
  astronautId: number;
  description: string;
}[] = [
  {
    roleType: "flight_surgeon",
    title: "Врач миссии (Flight Surgeon / CMO)",
    shortTitle: "Врач экипажа (CMO)",
    full_name: "Dr. Maya Chen",
    callsign: "NOVA-01",
    email: "maya.chen@cosmohealth.org",
    astronautId: 1,
    description: "Полный клинический доступ ко всем членам экипажа, выполнение протоколов SOP и управление допуском.",
  },
  {
    roleType: "commander",
    title: "Командир экспедиции (Mission Commander)",
    shortTitle: "Командир миссии",
    full_name: "Alex Nova",
    callsign: "APOLLO-01",
    email: "alex.nova@cosmohealth.org",
    astronautId: 1,
    description: "Оперативный контроль готовности экипажа, расписание миссии, алерты и согласование EVA.",
  },
  {
    roleType: "astronaut",
    title: "Космонавт / Исследователь (Crew Member)",
    shortTitle: "Космонавт (Crew)",
    full_name: "Ibrahim Rahman",
    callsign: "ORBIT-02",
    email: "ibrahim.rahman@cosmohealth.org",
    astronautId: 2,
    description: "Личный терминал здоровья: персональная телеметрия, психологические тесты, скафандр 3D и бортовой журнал.",
  },
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  roleType: UserRole;
  isFlightSurgeon: boolean;
  isCommander: boolean;
  isAstronaut: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; callsign?: string; role?: string; access_code?: string; avatar_url?: string }) => Promise<void>;
  demoLogin: (roleType: UserRole) => Promise<void>;
  updateCurrentUser: (updates: Partial<User>) => void;
  logout: () => void;
  switchRolePreset: (roleType: UserRole) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalMode: "login" | "register";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://127.0.0.1:8000/api";

function inferRoleType(roleStr?: string): UserRole {
  const r = (roleStr || "").toLowerCase();
  if (r.includes("surgeon") || r.includes("doctor") || r.includes("врач") || r.includes("cmo") || r.includes("medical")) {
    return "flight_surgeon";
  }
  if (r.includes("commander") || r.includes("командир")) {
    return "commander";
  }
  return "astronaut";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("cosmo_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          roleType: parsed.roleType || inferRoleType(parsed.role),
        };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cosmo_token") || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const roleType = user?.roleType || "flight_surgeon";
  const isFlightSurgeon = roleType === "flight_surgeon";
  const isCommander = roleType === "commander";
  const isAstronaut = roleType === "astronaut";

  const switchRolePreset = (newRoleType: UserRole) => {
    const preset = ROLE_PRESETS.find((p) => p.roleType === newRoleType) || ROLE_PRESETS[0];
    const updatedUser: User = {
      id: preset.astronautId,
      email: preset.email,
      full_name: preset.full_name,
      callsign: preset.callsign,
      role: preset.title,
      roleType: preset.roleType,
      astronautId: preset.astronautId,
    };
    setUser(updatedUser);
    localStorage.setItem("cosmo_user", JSON.stringify(updatedUser));
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Неверный логин или пароль");
    }

    const data = await res.json();
    const roleT = inferRoleType(data.user.role);
    const u: User = { ...data.user, roleType: roleT };
    setUser(u);
    setToken(data.token);
    localStorage.setItem("cosmo_user", JSON.stringify(u));
    localStorage.setItem("cosmo_token", data.token);
    closeAuthModal();
  };

  const demoLogin = async (roleTypeToLogin: UserRole) => {
    const preset = ROLE_PRESETS.find((p) => p.roleType === roleTypeToLogin) || ROLE_PRESETS[0];
    try {
      await login(preset.email, "cosmo123");
    } catch {
      // Fallback local authentication
      const demoToken = `chx_demo_${preset.roleType}_${Date.now()}`;
      const demoUser: User = {
        id: preset.astronautId,
        email: preset.email,
        full_name: preset.full_name,
        callsign: preset.callsign,
        role: preset.title,
        roleType: preset.roleType,
        astronautId: preset.astronautId,
      };
      setUser(demoUser);
      setToken(demoToken);
      localStorage.setItem("cosmo_user", JSON.stringify(demoUser));
      localStorage.setItem("cosmo_token", demoToken);
      closeAuthModal();
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem("cosmo_user", JSON.stringify(next));
      return next;
    });
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    callsign?: string;
    role?: string;
    access_code?: string;
    avatar_url?: string;
  }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Ошибка регистрации");
    }

    const respData = await res.json();
    const roleT = inferRoleType(respData.user.role);
    const u: User = { ...respData.user, roleType: roleT };
    setUser(u);
    setToken(respData.token);
    localStorage.setItem("cosmo_user", JSON.stringify(u));
    localStorage.setItem("cosmo_token", respData.token);
    closeAuthModal();
  };

  const logout = () => {
    const currentToken = localStorage.getItem("cosmo_token");
    if (currentToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("cosmo_user");
    localStorage.removeItem("cosmo_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        roleType,
        isFlightSurgeon,
        isCommander,
        isAstronaut,
        login,
        register,
        demoLogin,
        updateCurrentUser,
        logout,
        switchRolePreset,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
