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

  // Store in KV with TTL for auto-expiry
  await env.KV.put(`session:${token}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL,
  });

  // Also store in D1 for querying
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
  // Get all sessions for this email+site from D1
  const result = await env.DB.prepare(
    "SELECT token FROM sessions WHERE site_id = ? AND email = ?"
  )
    .bind(siteId, email)
    .all();

  // Delete from KV
  for (const row of result.results) {
    await env.KV.delete(`session:${(row as any).token}`);
  }

  // Delete from D1
  await env.DB.prepare("DELETE FROM sessions WHERE site_id = ? AND email = ?")
    .bind(siteId, email)
    .run();
}

// --- Owner sessions (JWT-based for dashboard auth) ---

export async function createOwnerToken(env: Env, user: { id: string; email: string; name: string }): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${header}.${payload}.${signature}`;
}

export async function verifyOwnerToken(env: Env, token: string): Promise<OwnerSession | null> {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;

    const data = new TextEncoder().encode(`${header}.${payload}`);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = Uint8Array.from(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!valid) return null;

    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      user_id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string, domain: string, maxAge: number = SESSION_TTL): string {
  return `gk_session=${token}; Path=/; Domain=${domain}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function setOwnerCookie(token: string, maxAge: number = SESSION_TTL): string {
  return `gk_owner=${token}; Path=/; Domain=.oauth.page; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
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

export function setVisitorCookie(token: string): string {
  return `gk_visitor=${token}; Path=/; Domain=.oauth.page; HttpOnly; Secure; SameSite=Lax; Max-Age=${VISITOR_TTL}`;
}
