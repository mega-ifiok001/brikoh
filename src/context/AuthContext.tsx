"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, dashboardService } from "@/api/services";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/api/config";
import { ApiError } from "@/api/types";
import type { AccountUser, OnboardingRequest } from "@/api/types";

type AuthContextValue = {
  user: AccountUser | null;
  booting: boolean;
  register: (p: { firstName: string; lastName: string; phone: string; email: string; password: string; confirmPassword: string }) => Promise<AccountUser>;
  login: (email: string, password: string, totpCode?: string) => Promise<AccountUser>;
  acceptInvite: (token: string, password: string) => Promise<AccountUser>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  completeOnboarding: (p: OnboardingRequest) => Promise<AccountUser>;
  refetchMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getAccessToken()) { setBooting(false); return; }
      try {
        const me = await dashboardService.me();
        setUser(me);
      } catch (e) {
        if (e instanceof ApiError && (e.code === "UNAUTHORIZED" || e.status === 401)) clearTokens();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const applyAuth = useCallback(async (res: { accessToken: string; refreshToken: string; user: AccountUser }) => {
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (p: { firstName: string; lastName: string; phone: string; email: string; password: string; confirmPassword: string }) => {
    const res = await authService.register(p);
    return applyAuth(res);
  }, [applyAuth]);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    const res = await authService.login({ email, password, ...(totpCode ? { totpCode } : {}) });
    return applyAuth(res);
  }, [applyAuth]);

  const acceptInvite = useCallback(async (token: string, password: string) => {
    const res = await authService.acceptInvite({ token, password });
    return applyAuth(res);
  }, [applyAuth]);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) authService.logout(refreshToken).catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    await authService.verify({ token });
    const me = await dashboardService.me();
    setUser(me);
  }, []);

  const resendVerification = useCallback(async () => {
    await dashboardService.resendVerification();
  }, []);

  const completeOnboarding = useCallback(async (p: OnboardingRequest) => {
    const res = await dashboardService.onboarding(p);
    setUser(res.user);
    return res.user;
  }, []);

  const refetchMe = useCallback(async () => {
    const me = await dashboardService.me();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, register, login, acceptInvite, logout, verifyEmail, resendVerification, completeOnboarding, refetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
