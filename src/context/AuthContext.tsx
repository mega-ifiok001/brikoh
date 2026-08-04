"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as auth from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import * as bizLib from "@/lib/business";
import type { BusinessProfile } from "@/lib/business";

type AuthContextValue = {
  user: StoredUser | null;
  business: BusinessProfile | null;
  signUp: (name: string, email: string, password: string) => Promise<StoredUser>;
  login: (email: string, password: string) => Promise<StoredUser>;
  logout: () => void;
  requestReset: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  saveBusinessProfile: (profile: BusinessProfile) => void;
  updateBusinessProfile: (patch: Partial<BusinessProfile>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  // Restore session + seed the demo account (client-only).
  useEffect(() => {
    auth.ensureDemoUser();
    const u = auth.getSession();
    setUser(u);
    setBusiness(u ? bizLib.getBusiness(u.email) : null);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { user: u } = await auth.apiSignUp(name, email, password);
    setUser(u);
    setBusiness(null);
    return u;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await auth.apiLogin(email, password);
    setUser(u);
    setBusiness(bizLib.getBusiness(u.email));
    return u;
  }, []);

  const logout = useCallback(() => {
    auth.clearSession();
    setUser(null);
    setBusiness(null);
  }, []);

  const requestReset = useCallback(async (email: string) => {
    const { code } = await auth.apiRequestReset(email);
    return code;
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await auth.apiResetPassword(email, code, newPassword);
    },
    []
  );

  const saveBusinessProfile = useCallback((profile: BusinessProfile) => {
    if (!user) return;
    bizLib.saveBusiness(user.email, profile);
    setBusiness(profile);
  }, [user]);

  const updateBusinessProfile = useCallback((patch: Partial<BusinessProfile>) => {
    if (!user) return;
    bizLib.updateBusiness(user.email, patch);
    setBusiness((b) => (b ? { ...b, ...patch } : b));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        signUp,
        login,
        logout,
        requestReset,
        resetPassword,
        saveBusinessProfile,
        updateBusinessProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
