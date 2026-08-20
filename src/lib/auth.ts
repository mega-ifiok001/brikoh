/**
 * Brikoh auth — client-side mock backend.
 * In a real deployment these functions would call your API; here we
 * persist to localStorage so the full auth flow works end-to-end in a demo.
 */

export type StoredUser = {
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

const USERS_KEY = "brikoh_users";
const SESSION_KEY = "brikoh_session";
const RESET_KEY = "brikoh_reset"; // { email, code, expires }

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_RE.test(email.trim());

export const delay = (ms = 900) => new Promise((r) => setTimeout(r, ms));

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Seed a demo account so the login screen is instantly testable. */
export function ensureDemoUser() {
  const users = readUsers();
  if (!users.some((u) => u.email === "demo@brikoh.app")) {
    writeUsers([
      ...users,
      {
        name: "Demo Merchant",
        email: "demo@brikoh.app",
        password: "demo1234",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export function getSession(): StoredUser | null {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    return readUsers().find((u) => u.email === email) ?? null;
  } catch {
    return null;
  }
}

export function saveSession(user: StoredUser) {
  const users = readUsers();
  const existing = users.find((u) => u.email === user.email);
  if (existing) writeUsers(users.map((u) => (u.email === user.email ? { ...u, ...user } : u)));
  else writeUsers([...users, user]);
  localStorage.setItem(SESSION_KEY, user.email);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiSignUp(
  name: string,
  email: string,
  password: string
): Promise<{ user: StoredUser }> {
  await delay(1100);
  const users = readUsers();
  if (users.some((u) => u.email === email.trim().toLowerCase())) {
    throw new Error("An account with this email already exists. Try logging in instead.");
  }
  const user: StoredUser = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, user]);
  localStorage.setItem(SESSION_KEY, user.email);
  return { user };
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: StoredUser }> {
  await delay(1000);
  const users = readUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new Error("No account found with this email. Create one to get started.");
  if (user.password !== password) throw new Error("Incorrect password. Please try again.");
  localStorage.setItem(SESSION_KEY, user.email);
  return { user };
}

export async function apiRequestReset(email: string): Promise<{ code: string }> {
  await delay(1200);
  const users = readUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new Error("No account found with this email.");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem(
    RESET_KEY,
    JSON.stringify({ email: user.email, code, expires: Date.now() + 15 * 60 * 1000 })
  );
  return { code };
}

export async function apiResetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await delay(1100);
  const raw = localStorage.getItem(RESET_KEY);
  if (!raw) throw new Error("No reset request found. Please request a new code.");
  const req = JSON.parse(raw) as { email: string; code: string; expires: number };
  if (req.email !== email.trim().toLowerCase()) {
    throw new Error("This email doesn't match the reset request.");
  }
  if (Date.now() > req.expires) {
    throw new Error("This code has expired. Please request a new one.");
  }
  if (req.code !== code.trim()) {
    throw new Error("Incorrect verification code. Please check and try again.");
  }
  const users = readUsers().map((u) =>
    u.email === req.email ? { ...u, password: newPassword } : u
  );
  writeUsers(users);
  localStorage.removeItem(RESET_KEY);
}

export type PasswordStrength = { score: number; label: string };

export function passwordScore(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}
