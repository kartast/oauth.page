import { loadConfig } from "./auth.js";

const API_BASE = "https://app.oauth.page";

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const config = loadConfig();
  if (!config.token) {
    throw new Error("Not logged in. Run: oauthpage login");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    throw new Error("Session expired. Run: oauthpage login");
  }

  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try {
      const body = await res.json() as any;
      if (body.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export { API_BASE };
