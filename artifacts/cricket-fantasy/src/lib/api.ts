const BASE = import.meta.env.VITE_API_URL ?? "";

const LS_TOKEN_KEY = "colosseum_auth_token";

export function storeAuthToken(token: string) {
  try { localStorage.setItem(LS_TOKEN_KEY, token); } catch { /* ignore */ }
}

export function clearAuthToken() {
  try { localStorage.removeItem(LS_TOKEN_KEY); } catch { /* ignore */ }
}

function getStoredToken(): string | null {
  try { return localStorage.getItem(LS_TOKEN_KEY); } catch { return null; }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const stored = getStoredToken();
  return fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(stored ? { Authorization: `Bearer ${stored}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
