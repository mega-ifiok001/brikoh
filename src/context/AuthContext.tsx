import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearTokens, extractTokens, hasSession, setTokens } from "../lib/api";
import { pick } from "../lib/format";

export interface Me {
  account: any;
  store: any;
  subscription: any;
  staff: any;
}

const EMPTY: Me = { account: {}, store: null, subscription: null, staff: null };

// The /me payload nests differently across backend versions; funnel
// everything through pick() so the UI never crashes on a renamed field.
export function normalizeMe(res: any): Me {
  if (!res || typeof res !== "object") {
    return { ...EMPTY, account: res || {} };
  }

  const rawAccount =
    pick(res, ["account", "user", "profile", "me"]) ??
    (res.email ? res : {});

  const rawStore =
    pick(res, ["store", "business", "tenant"]) ?? null;

  const subscription =
    pick(res, ["subscription", "plan", "subscriptionInfo", "billing"]) ??
    (rawStore ? rawStore.subscription ?? null : null);

  const staff =
    pick(res, ["staffMember", "staff", "membership"]) ?? null;

  // Backend versions may return `verified: true`
  // instead of `emailVerifiedAt`.
  const account = {
    ...(rawAccount || {}),
    emailVerifiedAt:
      rawAccount?.emailVerifiedAt ||
      (rawAccount?.verified ? new Date().toISOString() : undefined),
  };

  // Some backend responses return store information
  // directly inside the user object.
  const store =
    rawStore ||
    (rawAccount?.storeId
      ? {
          id: rawAccount.storeId,
          name: rawAccount.storeName,
          subdomain: rawAccount.subdomain,
        }
      : null);

  return {
    account,
    store,
    subscription: subscription || null,
    staff: staff || null,
  };
}

interface AuthCtxType {
  me: Me;
  loading: boolean;
  isAuthed: boolean;
  isOnboarded: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<Me>;
  register: (p: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<Me>;
  verifyEmail: (token: string) => Promise<Me>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  patchAccount: (patch: Record<string, any>) => void;
  patchStore: (patch: Record<string, any>) => void;
}

const AuthCtx = createContext<AuthCtxType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me>(EMPTY);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (tokens?: { at?: string; rt?: string }): Promise<Me> => {
    if (tokens) setTokens(tokens.at, tokens.rt);
    if (!hasSession()) {
      setMe(EMPTY);
      return EMPTY;
    }
    try {
      const res = await api.get("/api/dashboard/me");
      const n = normalizeMe(res);
      setMe(n);
      return n;
    } catch {
      // If /me fails but we hold a token, keep the session flag so the
      // user can retry; treat as unauthenticated only when no token.
      setMe(EMPTY);
      return EMPTY;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSession()) {
        if (alive) {
          setMe(EMPTY);
          setLoading(false);
        }
        return;
      }
      const n = await loadMe();
      if (alive) {
        setMe(n);
        setLoading(false);
      }
    })();
    const onSignedOut = () => {
      setMe(EMPTY);
      setLoading(false);
    };
    window.addEventListener("brikoh:signed-out", onSignedOut);
    return () => {
      alive = false;
      window.removeEventListener("brikoh:signed-out", onSignedOut);
    };
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.publicPost("/api/public/auth/login", { email, password });
      const t = extractTokens(res);
      if (!t.at) throw new Error("Login did not return a session token.");
      return loadMe(t);
    },
    [loadMe]
  );

  const register = useCallback(
    async (p: {
      email: string;
      password: string;
      confirmPassword: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      const res = await api.publicPost("/api/public/auth/register", {
        email: p.email,
        password: p.password,
        confirmPassword: p.confirmPassword,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone || undefined,
      });
      const t = extractTokens(res);
      if (t.at) setTokens(t.at, t.rt);
      return loadMe(t.at ? t : undefined);
    },
    [loadMe]
  );

 const verifyEmail = useCallback(
  async (token: string) => {
    const res = await api.publicPost("/api/public/auth/verify", { token });

    const t = extractTokens(res);

    if (t.at) {
      setTokens(t.at, t.rt);
    }

    const currentMe = await loadMe(t.at ? t : undefined);

    const verifiedMe: Me = {
      ...currentMe,
      account: {
        ...(currentMe.account || {}),
        emailVerifiedAt:
          currentMe.account?.emailVerifiedAt ||
          new Date().toISOString(),
      },
    };

    setMe(verifiedMe);

    return verifiedMe;
  },
  [loadMe]
);

  const resendVerification = useCallback(async () => {
    try {
      await api.post("/api/dashboard/resend-verification");
    } catch (e: any) {
      // Some builds expose this on the public surface.
      await api.publicPost("/api/public/auth/resend-verification", {});
      if (e && e.status !== 404) throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/public/auth/logout");
    } catch {
      /* best effort */
    }
    clearTokens();
    setMe(EMPTY);
  }, []);

  const refresh = useCallback(async () => {
    if (!hasSession()) return;
    const n = await loadMe();
    setMe(n);
  }, [loadMe]);

  const patchAccount = useCallback((patch: Record<string, any>) => {
    setMe((m) => ({ ...m, account: { ...(m.account || {}), ...patch } }));
  }, []);

  const patchStore = useCallback((patch: Record<string, any>) => {
    setMe((m) => ({ ...m, store: m.store ? { ...m.store, ...patch } : m.store }));
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        me,
        loading,
        isAuthed: hasSession(),
        isOnboarded: !!me.store?.id,
        isVerified: !!me.account?.emailVerifiedAt,
        login,
        register,
        verifyEmail,
        resendVerification,
        logout,
        refresh,
        patchAccount,
        patchStore,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthCtxType {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}