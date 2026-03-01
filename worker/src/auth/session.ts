import { Env, OwnerSession, VisitorIdentity } from "../types";

const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Visitor sessions (per-site, stored in KV) ---

export async function createVisitorSession(
  env: Env,
  siteId: string,
  email: string
): Promise<{ token: string; expires_at: number }> {
  const id = crypto.randomUUID();
  const token = generateToken();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + SESSION_TTL;

  const sessionData = { id, email, site_id: siteId, expires_at };

  await env.KV.put(`session:${token}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL,
  });

  await env.DB.prepare(
    "INSERT INTO sessions (id, token, site_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, token, siteId, email, expires_at, now)
    .run();

  return { token, expires_at };
}

export async function revokeVisitorSession(env: Env, token: string): Promise<void> {
  await env.KV.delete(`session:${token}`);
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export async function revokeVisitorSessionsByEmail(
  env: Env,
  siteId: string,
  email: string
): Promise<void> {
  const result = await env.DB.prepare(
    "SELECT token FROM sessions WHERE site_id = ? AND email = ?"
  )
    .bind(siteId, email)
    .all();

  for (const row of result.results) {
    await env.KV.delete(`session:${(row as any).token}`);
  }

  await env.DB.prepare("DELETE FROM sessions WHERE site_id = ? AND email = ?")
    .bind(siteId, email)
    .run();
}

// --- Owner sessions (KV-backed, revocable) ---

export async function createOwnerToken(env: Env, user: { id: string; email: string; name: string }): Promise<string> {
  const token = generateToken();
  const now = Math.floor(Date.now() / 1000);

  const sessionData: OwnerSession = {
    user_id: user.id,
    email: user.email,
    name: user.name,
    exp: now + SESSION_TTL,
  };

  await env.KV.put(`owner:${token}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL,
  });

  return token;
}

export async function verifyOwnerToken(env: Env, token: string): Promise<OwnerSession | null> {
  try {
    const json = await env.KV.get(`owner:${token}`);
    if (!json) return null;

    const session: OwnerSession = JSON.parse(json);
    if (session.exp < Math.floor(Date.now() / 1000)) return null;

    return session;
  } catch {
    return null;
  }
}

export async function revokeOwnerToken(env: Env, token: string): Promise<void> {
  await env.KV.delete(`owner:${token}`);
}

export function setSessionCookie(token: string, domain: string, maxAge: number = SESSION_TTL): string {
  return `gk_session=${token}; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function setOwnerCookie(token: string, maxAge: number = SESSION_TTL, appUrl?: string): string {
  const domainAttr = appUrl?.includes("workers.dev") ? "" : " Domain=.oauth.page;";
  return `gk_owner=${token}; Path=/;${domainAttr} HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

// --- Visitor identity (for the OAuth request flow, stored in KV) ---

const VISITOR_TTL = 30 * 24 * 60 * 60; // 30 days

export async function createVisitorIdentity(
  env: Env,
  identity: VisitorIdentity
): Promise<string> {
  const token = generateToken();
  await env.KV.put(`visitor:${token}`, JSON.stringify(identity), {
    expirationTtl: VISITOR_TTL,
  });
  return token;
}

export async function getVisitorIdentity(
  env: Env,
  token: string
): Promise<VisitorIdentity | null> {
  const json = await env.KV.get(`visitor:${token}`);
  if (!json) return null;
  return JSON.parse(json) as VisitorIdentity;
}

export function setVisitorCookie(token: string, appUrl?: string): string {
  const domainAttr = appUrl?.includes("workers.dev") ? "" : " Domain=.oauth.page;";
  return `gk_visitor=${token}; Path=/;${domainAttr} HttpOnly; Secure; SameSite=Lax; Max-Age=${VISITOR_TTL}`;
}
