'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginService, logout as logoutService, getMe } from '../services/authService';
import { refreshToken } from '../services/authService';
import { getAccessToken } from '../services/api';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on app load via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshToken();        // uses HttpOnly cookie
        const { data } = await getMe();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (credentials: any) => {
    const result = await loginService(credentials);
    const { data: meData } = await getMe();
    setUser(meData);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
