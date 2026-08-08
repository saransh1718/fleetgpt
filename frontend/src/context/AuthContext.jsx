import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem("yfa_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user); setCompany(data.company);
    } catch { localStorage.removeItem("yfa_token"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("yfa_token", data.token);
    setUser(data.user); setCompany(data.company);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("yfa_token", data.token);
    setUser(data.user); setCompany(data.company);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("yfa_token");
    setUser(null); setCompany(null);
    window.location.href = "/login";
  };

  return (
    <AuthCtx.Provider value={{ user, company, loading, login, signup, logout, reload: load }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
