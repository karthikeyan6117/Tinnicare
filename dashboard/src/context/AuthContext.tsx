import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";
import { endpoints } from "../constants/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface PatientExtra {
  age?: number;
  gender?: string;
  occupation?: string;
  height?: string;
  weight?: string;
  hearing_aid?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string, extra?: PatientExtra) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hasToken = () => !!localStorage.getItem("access_token");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(hasToken);

  useEffect(() => {
    // Development bypass: if `DEV_USER` is present in localStorage, use it as the authenticated user
    const devUserJson = localStorage.getItem("DEV_USER");
    if (devUserJson) {
      try {
        const parsed = JSON.parse(devUserJson);
        setUser(parsed);
        setIsLoading(false);
        return;
      } catch (e) {
        // fall through to normal flow
      }
    }

    if (!hasToken()) return;
    api
      .get(endpoints.auth.me)
      .then((res) => { setUser(res.data); setIsLoading(false); })
      .catch(() => { localStorage.removeItem("access_token"); setIsLoading(false); });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post(endpoints.auth.login, { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, full_name: string, extra?: PatientExtra) => {
    await api.post(endpoints.auth.register, { email, password, full_name, role: "patient", ...extra });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
