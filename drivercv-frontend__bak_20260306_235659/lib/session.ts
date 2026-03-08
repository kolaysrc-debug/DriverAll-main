// PATH: drivercv-frontend/lib/session.ts
// ----------------------------------------------------------
// Client-side session helpers (localStorage)
// ----------------------------------------------------------

export type UserRole = "admin" | "driver" | "employer" | "advertiser";

export type SessionUser = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isApproved?: boolean;
  isActive?: boolean;
};

const TOKEN_KEY = "driverall_token";
const USER_KEY = "driverall_user";
const TOKEN_KEY_ALT = "token";
const USER_KEY_ALT = "user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY_ALT) || window.localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY_ALT) || window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
  window.localStorage.setItem(TOKEN_KEY_ALT, token);
  window.localStorage.setItem(USER_KEY_ALT, JSON.stringify(user || {}));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY_ALT);
  window.localStorage.removeItem(USER_KEY_ALT);
}

export function normalizeRole(input: any): UserRole {
  const v = String(input || "").toLowerCase().trim();
  if (v === "admin") return "admin";
  if (v === "employer") return "employer";
  if (v === "advertiser") return "advertiser";
  return "driver";
}
