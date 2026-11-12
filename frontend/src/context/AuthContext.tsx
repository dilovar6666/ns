import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  email: string;
  full_name: string;
  callsign: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; callsign?: string; role?: string }) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalMode: "login" | "register";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://127.0.0.1:8000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("cosmo_user");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    // Default logged in demo doctor
    return {
      id: 1,
      email: "maya.chen@cosmohealth.org",
      full_name: "Dr. Maya Chen",
      callsign: "NOVA-01",
      role: "Flight Surgeon",
    };
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cosmo_token") || "demo_token");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

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
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("cosmo_user", JSON.stringify(data.user));
    localStorage.setItem("cosmo_token", data.token);
    closeAuthModal();
  };

  const register = async (data: { email: string; password: string; full_name: string; callsign?: string; role?: string }) => {
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
    setUser(respData.user);
    setToken(respData.token);
    localStorage.setItem("cosmo_user", JSON.stringify(respData.user));
    localStorage.setItem("cosmo_token", respData.token);
    closeAuthModal();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cosmo_user");
    localStorage.removeItem("cosmo_token");
    openAuthModal("login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
