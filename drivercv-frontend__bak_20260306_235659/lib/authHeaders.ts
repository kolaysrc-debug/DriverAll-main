export function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  if (typeof window === "undefined") return { ...extra };
  const token = window.localStorage.getItem("token");
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
