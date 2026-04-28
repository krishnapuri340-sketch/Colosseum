const BASE = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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
