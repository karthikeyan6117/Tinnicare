import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  occupation?: string;
  height?: string;
  weight?: string;
  hearing_aid?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: string, extra?: PatientExtra) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("access_token");
      if (storedToken) {
        setToken(storedToken);
        const response = await api.get(endpoints.auth.me);
        setUser(response.data);
      }
    } catch {
      await AsyncStorage.removeItem("access_token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post(endpoints.auth.login, { email, password });
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem("access_token", access_token);
    setToken(access_token);
    setUser(userData);
  };

  const register = async (email: string, password: string, fullName: string, role: string = "patient", extra?: PatientExtra) => {
    await api.post(endpoints.auth.register, {
      email,
      password,
      full_name: fullName,
      role,
      ...extra,
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
