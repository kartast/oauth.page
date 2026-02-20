const API_BASE = import.meta.env.PROD ? "https://app.oauth.page" : "";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error((error as any).error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  await api(path, { method: "DELETE" });
}

// Auth helpers
export async function getMe() {
  return api<{ user: { id: string; email: string; name: string } | null }>("/api/auth/me");
}

export async function startGithubAuth() {
  const data = await api<{ url: string }>("/api/auth/github", { method: "POST" });
  window.location.href = data.url;
}

export async function startGoogleAuth() {
  const data = await api<{ url: string }>("/api/auth/google", { method: "POST" });
  window.location.href = data.url;
}

export async function logout() {
  await api("/api/auth/logout", { method: "POST" });
}

// Sites
export interface Site {
  id: string;
  slug: string;
  name: string;
  origin_url: string;
  created_at: number;
  user_count?: number;
  pending_count?: number;
}

export interface AccessRequest {
  id: string;
  site_id: string;
  email: string;
  name: string;
  message: string | null;
  avatar_url: string | null;
  provider: "github" | "google" | null;
  status: string;
  decided_at: number | null;
  created_at: number;
}

export async function getSites() {
  return api<{ sites: Site[] }>("/api/sites");
}

export async function getSite(id: string) {
  return api<{
    site: Site;
    approved_users: { email: string }[];
    requests: AccessRequest[];
  }>(`/api/sites/${id}`);
}

export async function createSite(data: { name: string; origin_url: string; slug?: string }) {
  return api<{ site: Site }>("/api/sites", { method: "POST", body: data });
}

export async function deleteSite(id: string) {
  return api(`/api/sites/${id}`, { method: "DELETE" });
}

export async function approveRequest(siteId: string, requestId: string) {
  return api(`/api/sites/${siteId}/requests/${requestId}/approve`, { method: "POST" });
}

export async function denyRequest(siteId: string, requestId: string) {
  return api(`/api/sites/${siteId}/requests/${requestId}/deny`, { method: "POST" });
}

export async function revokeAccess(siteId: string, email: string) {
  return api(`/api/sites/${siteId}/access/${encodeURIComponent(email)}`, { method: "DELETE" });
}
