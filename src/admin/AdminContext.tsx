import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ADMIN_SIGNED_OUT_EVENT,
  adminApi,
  adminLogin,
  adminLogout,
  clearAdminTokens,
  hasAdminSession,
} from "./lib/adminApi";

export interface AdminMe {
  id: string;
  email: string;
  roleName: string;
  permissions: string[];
}

interface Ctx {
  me: AdminMe | null;
  loading: boolean;
  isSuper: boolean;
  /** SUPER_ADMIN has every key; others are checked against /me permissions. */
  can: (key: string) => boolean;
  signIn: (email: string, password: string, totp: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Build an in-app path that works both on manage.brikoh.com ("") and the /admin preview. */
  p: (path: string) => string;
}

const AdminCtx = createContext<Ctx | null>(null);

export function AdminProvider({ base, children }: { base: string; children: ReactNode }) {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(hasAdminSession());

  const loadMe = useCallback(async () => {
    const m = await adminApi.get<AdminMe>("/api/admin/me");
    setMe({ ...m, permissions: m.permissions ?? [] });
  }, []);

  useEffect(() => {
    let alive = true;
    if (!hasAdminSession()) return;
    loadMe()
      .catch(() => {
        clearAdminTokens();
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [loadMe]);

  useEffect(() => {
    const off = () => setMe(null);
    window.addEventListener(ADMIN_SIGNED_OUT_EVENT, off);
    return () => window.removeEventListener(ADMIN_SIGNED_OUT_EVENT, off);
  }, []);

  const value = useMemo<Ctx>(() => {
    const isSuper = me?.roleName === "SUPER_ADMIN";
    return {
      me,
      loading,
      isSuper,
      can: (key) => !!me && (isSuper || me.permissions.includes(key)),
      signIn: async (email, password, totp) => {
        await adminLogin(email, password, totp);
        try {
          await loadMe();
        } catch (e) {
          clearAdminTokens();
          throw e;
        }
      },
      signOut: async () => {
        await adminLogout();
        setMe(null);
      },
      p: (path) => (path === "/" || path === "" ? base || "/" : base + path),
    };
  }, [me, loading, base, loadMe]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin(): Ctx {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin must be used inside <AdminProvider>");
  return c;
}