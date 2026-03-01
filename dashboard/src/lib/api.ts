import * as Sentry from "@sentry/react";

const API_BASE = "";
const { logger } = Sentry;

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  return Sentry.startSpan(
    { op: "http.client", name: `${method} ${path}` },
    async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      logger.info(logger.fmt`API ${method} ${path}`);

      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // 401 = session expired → redirect to login (skip auth check itself)
        if (response.status === 401 && !path.includes('/auth/me')) {
          window.location.href = '/';
          return new Promise(() => {}) as never;
        }
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        const msg = (error as any).error || `HTTP ${response.status}`;
        logger.error(logger.fmt`API error ${method} ${path}: ${msg}`, { status: response.status });
        Sentry.captureException(new Error(msg), { tags: { api_path: path, method } });
        throw new Error(msg);
      }

      return response.json() as Promise<T>;
    },
  );
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
  created_at: number;
  user_count?: number;
  pending_count?: number;
  total_requests?: number;
  total_bytes_out?: number;
  storage_bytes?: number;
  thumbnail_status?: string | null;
  thumbnail_at?: number | null;
}

export interface SiteFile {
  path: string;
  size: number;
  lastModified: string;
}

export interface OneTimeLink {
  id: string;
  path: string;
  expires_at: number;
  status: "active" | "consumed" | "revoked";
  uses_count: number;
  max_uses: number;
  created_at: number;
  consumed_at?: number | null;
  url?: string;
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

export interface GlobalAccessRequest extends AccessRequest {
  site_name: string;
  site_slug: string;
}

export async function getGlobalRequests() {
  return api<{ requests: GlobalAccessRequest[] }>('/api/sites/requests');
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

export async function createSite(data: { name: string; slug?: string }) {
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

// Files
export async function listFiles(siteId: string) {
  return api<{ files: SiteFile[] }>(`/api/sites/${siteId}/files`);
}

export async function uploadFile(siteId: string, path: string, file: File): Promise<{ ok: boolean; path: string; size: number }> {
  const response = await fetch(`/api/sites/${siteId}/files/${path}`, {
    method: "PUT",
    credentials: "include",
    body: file,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error((error as any).error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function deleteFile(siteId: string, path: string) {
  return api(`/api/sites/${siteId}/files/${path}`, { method: "DELETE" });
}


export interface UsageLimits {
  sites: number;
  storageMb: number;
  deploysPerMonth: number;
  viewsPerSite: number;
  emailsPerMonth: number;
  oneTimeLinks: number;
}

export interface UsageSnapshot {
  limits: UsageLimits;
  usage: {
    sites: number;
    storage_bytes: number;
    deploys_this_month: number;
    emails_this_month: number;
    views_this_month: number;
    one_time_links_active: number;
  };
}

export async function getUsage() {
  return api<UsageSnapshot>("/api/sites/usage");
}

// Feature flags
export async function getFlags() {
  return api<{ beta: { one_time_links: boolean }; oauth?: { google_enabled?: boolean } }>("/api/flags");
}

// One-time links (BETA)
export async function createOneTimeLink(siteId: string, data?: { path?: string; ttl_seconds?: number }) {
  return api<{ beta: boolean; link: OneTimeLink & { url: string } }>(`/api/sites/${siteId}/links`, {
    method: "POST",
    body: data || {},
  });
}

export async function listOneTimeLinks(siteId: string) {
  return api<{ beta: boolean; links: OneTimeLink[] }>(`/api/sites/${siteId}/links`);
}

export async function revokeOneTimeLink(siteId: string, linkId: string) {
  return api<{ ok: boolean; beta: boolean }>(`/api/sites/${siteId}/links/${linkId}/revoke`, {
    method: "POST",
  });
}

// Screenshots / Thumbnails
export async function triggerScreenshot(siteId: string) {
  return api<{ ok: boolean; status: string }>(`/api/sites/${siteId}/screenshot`, {
    method: "POST",
  });
}

export function getThumbnailUrl(siteId: string): string {
  return `${API_BASE}/api/sites/${siteId}/thumbnail`;
}
